// Generates a .fit "workout" file (file_id + workout + workout_step
// messages) from a séance's blocs, using the official Garmin FIT SDK. See
// specs/002-export-seance-fit/data-model.md for the full bloc -> step
// mapping this implements.

import { Encoder, Profile } from "@garmin/fitsdk";
import type { FileIdMesg, WorkoutMesg, WorkoutStepMesg } from "@garmin/fitsdk";
import { format } from "date-fns";
import {
  getAthleteHeartRateZone,
  getAthletePaceZone,
  type PerformanceReference,
  type ZoneManualOverrides,
} from "./paces";
import type { BlocDisplayItem } from "./mappers";
import type { Database } from "./database.types";
import { nowInParis } from "./date";

type BlocRole = Database["public"]["Enums"]["bloc_role"];
type SeanceType = Database["public"]["Enums"]["seance_type"];

export interface SeanceExportInput {
  titre: string;
  datePrevue: string | null;
  type: SeanceType;
  blocs: BlocDisplayItem[];
  performances: PerformanceReference[];
  zoneOverrides: ZoneManualOverrides;
  fcMax: number | null;
}

// The SDK's generated .d.ts types every FIT enum field (file type, sport,
// step duration/target/intensity...) as a plain `number`, even though the
// Encoder also accepts the string names looked up below at runtime (it
// resolves them the same way, via Profile.types). Doing that lookup
// ourselves keeps this file free of hardcoded magic numbers and of
// `any`/type assertions.
function fitEnumValue(typeName: string, name: string): number {
  const values = Profile.types[typeName];
  const entry = Object.entries(values).find(([, value]) => value === name);
  if (!entry) throw new Error(`Unknown "${name}" for FIT type "${typeName}"`);
  return Number(entry[0]);
}

const ROLE_INTENSITY: Record<BlocRole, string> = {
  echauffement: "warmup",
  corps: "active",
  recuperation: "rest",
  retour_au_calme: "cooldown",
  gammes: "active",
};

const ROLE_LABELS: Record<BlocRole, string> = {
  echauffement: "Échauffement",
  corps: "Corps",
  recuperation: "Récupération",
  retour_au_calme: "Retour au calme",
  gammes: "Gammes",
};

// The FIT profile documents per-purpose field names (durationTime,
// durationDistance, durationStep, customTargetSpeedLow/High, repeatSteps...)
// as "subfields" of the two physical fields below, each with its own scale.
// But @garmin/fitsdk's Encoder (mesg-definition.js) resolves a message's keys
// against top-level profile field names ONLY — it has no subfield handling
// at all, so writing those subfield names is silently a no-op (confirmed by
// round-tripping through the SDK's own Decoder). The physical fields must be
// written directly, with the subfield's scale applied by hand.
const DURATION_TIME_SCALE = 1000; // seconds -> raw durationValue
const DURATION_DISTANCE_SCALE = 100; // meters -> raw durationValue
const TARGET_SPEED_SCALE = 1000; // m/s -> raw customTargetValueLow/High

function paceSecondsPerKmToMetersPerSecond(secondsPerKm: number): number {
  return 1000 / secondsPerKm;
}

function resolveDuration(bloc: BlocDisplayItem): Pick<WorkoutStepMesg, "durationType" | "durationValue"> {
  if (bloc.modeDuree === "distance" && bloc.distanceMetres !== null) {
    return {
      durationType: fitEnumValue("wktStepDuration", "distance"),
      durationValue: Math.round(bloc.distanceMetres * DURATION_DISTANCE_SCALE),
    };
  }
  if (bloc.dureeSecondes !== null) {
    // Covers modeDuree "temps", and "libre" blocs that still recorded a
    // duration for volume purposes (lib/volume.ts) — the watch should still
    // count it down rather than leave the step fully open.
    return {
      durationType: fitEnumValue("wktStepDuration", "time"),
      durationValue: Math.round(bloc.dureeSecondes * DURATION_TIME_SCALE),
    };
  }
  return { durationType: fitEnumValue("wktStepDuration", "open") };
}

function resolveTarget(
  bloc: BlocDisplayItem,
  performances: PerformanceReference[],
  overrides: ZoneManualOverrides,
  fcMax: number | null
): Pick<WorkoutStepMesg, "targetType" | "customTargetValueLow" | "customTargetValueHigh"> {
  const open = { targetType: fitEnumValue("wktStepTarget", "open") };

  if (bloc.cibleType === "allure_absolue" && bloc.cibleAllureSecondesParKm !== null) {
    const raw = Math.round(paceSecondsPerKmToMetersPerSecond(bloc.cibleAllureSecondesParKm) * TARGET_SPEED_SCALE);
    return { targetType: fitEnumValue("wktStepTarget", "speed"), customTargetValueLow: raw, customTargetValueHigh: raw };
  }

  if (bloc.cibleType === "zone_allure" && bloc.cibleZone) {
    const result = getAthletePaceZone(bloc.cibleZone, performances, overrides);
    if (!result.available) return open;
    const { minSecondsPerKm, maxSecondsPerKm } = result.range;
    // A slower pace (higher seconds/km) is a lower speed — the FIT "low"
    // bound of a speed target is the slow edge of the zone.
    return {
      targetType: fitEnumValue("wktStepTarget", "speed"),
      customTargetValueLow: Math.round(paceSecondsPerKmToMetersPerSecond(maxSecondsPerKm) * TARGET_SPEED_SCALE),
      customTargetValueHigh: Math.round(paceSecondsPerKmToMetersPerSecond(minSecondsPerKm ?? maxSecondsPerKm) * TARGET_SPEED_SCALE),
    };
  }

  if (bloc.cibleType === "zone_fc" && bloc.cibleZone) {
    const result = getAthleteHeartRateZone(bloc.cibleZone, fcMax, overrides);
    if (!result.available) return open;
    return {
      targetType: fitEnumValue("wktStepTarget", "heartRate"),
      // FIT encodes an absolute bpm target as 100 + bpm (values <= 100 mean
      // a %HRmax target instead) — see the "workoutHr" type in the profile.
      // No extra scale here: the workoutHr convention's own scale is 1.
      customTargetValueLow: 100 + result.range.minBpm,
      customTargetValueHigh: 100 + result.range.maxBpm,
    };
  }

  return open; // rpe, libre
}

function buildStepName(bloc: BlocDisplayItem): string {
  const parts: string[] = [ROLE_LABELS[bloc.role]];
  if (bloc.cibleType === "rpe" && bloc.cibleRpe !== null) parts.push(`RPE ${bloc.cibleRpe}`);
  if (bloc.commentaire) parts.push(bloc.commentaire);
  const name = parts.join(" — ");
  return name.length > 60 ? `${name.slice(0, 59)}…` : name;
}

function hasOwnContent(bloc: BlocDisplayItem): boolean {
  return bloc.distanceMetres !== null || bloc.dureeSecondes !== null;
}

/**
 * Pure mapping from a séance's blocs to the flat, ordered list of FIT
 * workout_step messages a device should read. See data-model.md for the
 * rationale behind each rule below.
 */
export function buildWorkoutSteps(
  blocs: BlocDisplayItem[],
  performances: PerformanceReference[],
  overrides: ZoneManualOverrides,
  fcMax: number | null
): WorkoutStepMesg[] {
  const childrenByParent = new Map<string, BlocDisplayItem[]>();
  for (const bloc of blocs) {
    if (bloc.parentBlocId === null) continue;
    const siblings = childrenByParent.get(bloc.parentBlocId) ?? [];
    siblings.push(bloc);
    childrenByParent.set(bloc.parentBlocId, siblings);
  }

  const steps: WorkoutStepMesg[] = [];

  function pushOwnStep(bloc: BlocDisplayItem): void {
    steps.push({
      wktStepName: buildStepName(bloc),
      intensity: fitEnumValue("intensity", ROLE_INTENSITY[bloc.role]),
      ...resolveDuration(bloc),
      ...resolveTarget(bloc, performances, overrides, fcMax),
    });
  }

  function pushRepeatStep(firstStepIndex: number, repetitions: number): void {
    // custom_name and intensity are undefined for a repeat step by FIT
    // convention (it isn't real effort, just a loop instruction). Both
    // values below share durationValue/targetValue with the "own step"
    // case above (scale 1 for this pair of subfields, so no conversion).
    steps.push({
      durationType: fitEnumValue("wktStepDuration", "repeatUntilStepsCmplt"),
      durationValue: firstStepIndex,
      targetValue: repetitions,
    });
  }

  function emit(bloc: BlocDisplayItem): void {
    const children = childrenByParent.get(bloc.id) ?? [];

    if (children.length === 0) {
      const ownIndex = steps.length;
      pushOwnStep(bloc);
      if (bloc.repetitions > 1) pushRepeatStep(ownIndex, bloc.repetitions);
      return;
    }

    const firstIndex = steps.length;
    // A bloc with sub-blocs is a grouping container (e.g. "6 x (400m Z5 +
    // 1min récup)") — it only gets a step of its own when it actually
    // carries content, so a pure container doesn't insert an empty step
    // before each repeat of its children.
    if (hasOwnContent(bloc)) pushOwnStep(bloc);
    for (const child of children) emit(child);
    if (bloc.repetitions > 1) pushRepeatStep(firstIndex, bloc.repetitions);
  }

  for (const bloc of blocs.filter((b) => b.parentBlocId === null)) emit(bloc);

  return steps;
}

export function seanceIsExportable(blocs: unknown[]): boolean {
  return blocs.length > 0;
}

export function seanceExportFilename(seance: { titre: string; datePrevue: string | null }): string {
  const datePart = seance.datePrevue ?? format(nowInParis(), "yyyy-MM-dd");
  const slug =
    seance.titre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "seance";
  return `${datePart}-${slug}.fit`;
}

/** Encodes a full .fit workout file for the given séance. */
export function buildFitWorkout(input: SeanceExportInput): Uint8Array {
  const steps = buildWorkoutSteps(input.blocs, input.performances, input.zoneOverrides, input.fcMax);
  const encoder = new Encoder();

  const fileId: FileIdMesg = {
    type: fitEnumValue("file", "workout"),
    manufacturer: fitEnumValue("manufacturer", "development"),
    product: 1,
    timeCreated: new Date(),
  };
  encoder.onMesg(Profile.MesgNum.FILE_ID, fileId);

  const workout: WorkoutMesg = {
    wktName: input.titre,
    sport: fitEnumValue("sport", input.type === "cross_training" ? "training" : "running"),
    numValidSteps: steps.length,
  };
  encoder.onMesg(Profile.MesgNum.WORKOUT, workout);

  steps.forEach((step, index) => {
    const stepMesg: WorkoutStepMesg = { messageIndex: index, ...step };
    encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, stepMesg);
  });

  return encoder.close();
}
