import { Decoder, Profile, Stream } from "@garmin/fitsdk";
import { describe, expect, it } from "vitest";
import { buildFitWorkout, buildWorkoutSteps, seanceExportFilename, seanceIsExportable } from "./fit-export";
import type { BlocDisplayItem } from "./mappers";
import { computeHeartRateZones, computePaceZones, computeThresholdPaceSecondsPerKm, type PerformanceReference } from "./paces";

// Independent lookup of the FIT profile constants under test, so this file
// doesn't just restate the numbers fit-export.ts already hardcodes.
function fitValue(typeName: string, name: string): number {
  const entry = Object.entries(Profile.types[typeName]).find(([, v]) => v === name);
  if (!entry) throw new Error(`missing ${typeName}.${name}`);
  return Number(entry[0]);
}

const perfs10k: PerformanceReference[] = [
  { distance: "10k", tempsSecondes: 2550, datePerf: "2026-01-01", type: "reel" }, // 4:15/km
];

function bloc(overrides: Partial<BlocDisplayItem>): BlocDisplayItem {
  return {
    id: "b",
    parentBlocId: null,
    repetitions: 1,
    modeDuree: "libre",
    distanceMetres: null,
    dureeSecondes: null,
    cibleType: "libre",
    cibleZone: null,
    cibleAllureSecondesParKm: null,
    role: "corps",
    cibleRpe: null,
    commentaire: null,
    ...overrides,
  };
}

describe("buildWorkoutSteps — duration mapping", () => {
  it("maps a distance bloc to a distance-bound step", () => {
    const [step] = buildWorkoutSteps([bloc({ modeDuree: "distance", distanceMetres: 400 })], [], {}, null);
    expect(step.durationType).toBe(fitValue("wktStepDuration", "distance"));
    expect(step.durationValue).toBe(400 * 100); // durationDistance subfield scale
  });

  it("maps a temps bloc to a time-bound step", () => {
    const [step] = buildWorkoutSteps([bloc({ modeDuree: "temps", dureeSecondes: 300 })], [], {}, null);
    expect(step.durationType).toBe(fitValue("wktStepDuration", "time"));
    expect(step.durationValue).toBe(300 * 1000); // durationTime subfield scale
  });

  it("still counts down a libre bloc that recorded a duration for volume purposes", () => {
    const [step] = buildWorkoutSteps([bloc({ modeDuree: "libre", dureeSecondes: 600 })], [], {}, null);
    expect(step.durationType).toBe(fitValue("wktStepDuration", "time"));
    expect(step.durationValue).toBe(600 * 1000);
  });

  it("leaves a genuinely libre bloc open", () => {
    const [step] = buildWorkoutSteps([bloc({ modeDuree: "libre" })], [], {}, null);
    expect(step.durationType).toBe(fitValue("wktStepDuration", "open"));
  });
});

describe("buildWorkoutSteps — target mapping", () => {
  it("maps allure_absolue to a fixed speed target", () => {
    const [step] = buildWorkoutSteps(
      [bloc({ cibleType: "allure_absolue", cibleAllureSecondesParKm: 300 })], // 5:00/km
      [],
      {},
      null
    );
    expect(step.targetType).toBe(fitValue("wktStepTarget", "speed"));
    expect(step.customTargetValueLow).toBe(Math.round((1000 / 300) * 1000));
    expect(step.customTargetValueHigh).toBe(Math.round((1000 / 300) * 1000));
  });

  it("resolves a zone_allure target from the athlete's reference performance", () => {
    const threshold = computeThresholdPaceSecondsPerKm(perfs10k[0]);
    const zone = computePaceZones(threshold).z4_seuil;

    const [step] = buildWorkoutSteps(
      [bloc({ cibleType: "zone_allure", cibleZone: "z4_seuil" })],
      perfs10k,
      {},
      null
    );

    expect(step.targetType).toBe(fitValue("wktStepTarget", "speed"));
    expect(step.customTargetValueLow).toBe(Math.round((1000 / zone.maxSecondsPerKm) * 1000));
    expect(step.customTargetValueHigh).toBe(Math.round((1000 / zone.minSecondsPerKm!) * 1000));
  });

  it("resolves a zone_fc target from fcMax, offset by 100 per the FIT workoutHr convention", () => {
    const zone = computeHeartRateZones(190).z2_endurance;

    const [step] = buildWorkoutSteps([bloc({ cibleType: "zone_fc", cibleZone: "z2_endurance" })], [], {}, 190);

    expect(step.targetType).toBe(fitValue("wktStepTarget", "heartRate"));
    expect(step.customTargetValueLow).toBe(100 + zone.minBpm);
    expect(step.customTargetValueHigh).toBe(100 + zone.maxBpm);
  });

  it("falls back to an open target when no reference performance is available", () => {
    const [step] = buildWorkoutSteps([bloc({ cibleType: "zone_allure", cibleZone: "z4_seuil" })], [], {}, null);
    expect(step.targetType).toBe(fitValue("wktStepTarget", "open"));
  });

  it("leaves rpe and libre targets open, and reports RPE in the step name", () => {
    const [step] = buildWorkoutSteps([bloc({ cibleType: "rpe", cibleRpe: 7 })], [], {}, null);
    expect(step.targetType).toBe(fitValue("wktStepTarget", "open"));
    expect(step.wktStepName).toContain("RPE 7");
  });
});

describe("buildWorkoutSteps — repetitions", () => {
  it("wraps a single repeated bloc in a repeat step", () => {
    const steps = buildWorkoutSteps([bloc({ id: "effort", repetitions: 6, modeDuree: "distance", distanceMetres: 400 })], [], {}, null);

    expect(steps).toHaveLength(2);
    expect(steps[1].durationType).toBe(fitValue("wktStepDuration", "repeatUntilStepsCmplt"));
    expect(steps[1].durationValue).toBe(0); // loop back to step index 0
    expect(steps[1].targetValue).toBe(6); // repeat count
  });

  it("repeats a group of sub-blocs without an extra step for the pure-container parent", () => {
    const blocs: BlocDisplayItem[] = [
      bloc({ id: "parent", repetitions: 6 }), // pure container: no own distance/duree
      bloc({ id: "effort", parentBlocId: "parent", modeDuree: "distance", distanceMetres: 400, cibleType: "zone_allure", cibleZone: "z5_vma" }),
      bloc({ id: "recup", parentBlocId: "parent", modeDuree: "temps", dureeSecondes: 60 }),
    ];

    const steps = buildWorkoutSteps(blocs, [], {}, null);

    expect(steps).toHaveLength(3);
    expect(steps[0].durationValue).toBe(400 * 100);
    expect(steps[1].durationValue).toBe(60 * 1000);
    expect(steps[2].durationType).toBe(fitValue("wktStepDuration", "repeatUntilStepsCmplt"));
    expect(steps[2].durationValue).toBe(0);
    expect(steps[2].targetValue).toBe(6);
  });

  it("keeps a parent's own step when it carries real content alongside its sub-blocs", () => {
    const blocs: BlocDisplayItem[] = [
      bloc({ id: "parent", repetitions: 2, modeDuree: "distance", distanceMetres: 100 }),
      bloc({ id: "child", parentBlocId: "parent", modeDuree: "temps", dureeSecondes: 30 }),
    ];

    const steps = buildWorkoutSteps(blocs, [], {}, null);

    expect(steps).toHaveLength(3);
    expect(steps[0].durationValue).toBe(100 * 100);
    expect(steps[1].durationValue).toBe(30 * 1000);
    expect(steps[2].durationValue).toBe(0);
  });
});

describe("seanceIsExportable", () => {
  it("is false for a séance with no blocs", () => {
    expect(seanceIsExportable([])).toBe(false);
  });

  it("is true as soon as a séance has at least one bloc", () => {
    expect(seanceIsExportable([{}])).toBe(true);
  });
});

describe("seanceExportFilename", () => {
  it("slugifies the title and keeps the séance date", () => {
    expect(seanceExportFilename({ titre: "Fractionné VMA", datePrevue: "2026-09-18" })).toBe("2026-09-18-fractionne-vma.fit");
  });

  it("falls back to today's date when the séance has none", () => {
    expect(seanceExportFilename({ titre: "Sortie longue", datePrevue: null })).toMatch(/^\d{4}-\d{2}-\d{2}-sortie-longue\.fit$/);
  });
});

describe("buildFitWorkout — encode/decode round trip", () => {
  // Regression test for a real bug: @garmin/fitsdk's Encoder only resolves
  // a message's keys against TOP-LEVEL profile field names (durationValue,
  // targetValue, customTargetValueLow/High) — it silently drops per-purpose
  // subfield aliases (durationTime, customTargetSpeedLow, repeatSteps...).
  // buildWorkoutSteps's plain object output can't catch that class of bug —
  // only decoding the actually-encoded bytes can, so this test does that.
  it("produces a valid, integer-decodable .fit file with the expected values", () => {
    const performances: PerformanceReference[] = [
      { distance: "10k", tempsSecondes: 2400, datePerf: "2026-06-01", type: "reel" }, // 4:00/km
    ];
    const blocs: BlocDisplayItem[] = [
      bloc({ id: "wu", role: "echauffement", modeDuree: "temps", dureeSecondes: 600, cibleType: "zone_allure", cibleZone: "z2_endurance" }),
      bloc({ id: "grp", repetitions: 6 }),
      bloc({ id: "effort", parentBlocId: "grp", modeDuree: "distance", distanceMetres: 400, cibleType: "zone_allure", cibleZone: "z5_vma", commentaire: "Genoux hauts" }),
      bloc({ id: "recup", parentBlocId: "grp", role: "recuperation", modeDuree: "temps", dureeSecondes: 90 }),
      bloc({ id: "fc", modeDuree: "temps", dureeSecondes: 300, cibleType: "zone_fc", cibleZone: "z3_marathon" }),
      bloc({ id: "rpe", cibleType: "rpe", cibleRpe: 8 }),
      bloc({ id: "cd", role: "retour_au_calme", modeDuree: "temps", dureeSecondes: 300 }),
    ];

    const bytes = buildFitWorkout({
      titre: "Fractionné VMA 6x400",
      datePrevue: "2026-09-18",
      type: "fractionne_court",
      blocs,
      performances,
      zoneOverrides: {},
      fcMax: 190,
    });

    const decoder = new Decoder(Stream.fromByteArray(Array.from(bytes)));
    expect(decoder.isFIT()).toBe(true);
    expect(decoder.checkIntegrity()).toBe(true);

    const { messages, errors } = decoder.read();
    expect(errors).toEqual([]);
    expect(messages.workoutMesgs?.[0]).toMatchObject({ wktName: "Fractionné VMA 6x400", sport: "running" });

    const steps = messages.workoutStepMesgs ?? [];
    expect(steps).toHaveLength(7);

    expect(steps[0]).toMatchObject({ durationType: "time", durationTime: 600, targetType: "speed" });
    expect(steps[1]).toMatchObject({ durationType: "distance", durationDistance: 400, targetType: "speed" });
    expect(steps[2]).toMatchObject({ durationType: "time", durationTime: 90, targetType: "open" });
    expect(steps[3]).toMatchObject({ durationType: "repeatUntilStepsCmplt", durationStep: 1, repeatSteps: 6 });
    expect(steps[4]).toMatchObject({ durationType: "time", durationTime: 300, targetType: "heartRate", customTargetHeartRateLow: 252, customTargetHeartRateHigh: 265 });
    expect(steps[5]).toMatchObject({ durationType: "open", targetType: "open" });
    expect(steps[5].wktStepName).toContain("RPE 8");
    expect(steps[6]).toMatchObject({ durationType: "time", durationTime: 300, targetType: "open" });
  });
});
