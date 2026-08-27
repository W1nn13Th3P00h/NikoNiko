// Client-side draft shape for the block-by-block editor. Mirrors
// bloc_seance but with a client-generated `clientId` standing in for the
// DB id until the whole séance is saved as one document (see actions.ts:
// saving deletes and re-inserts every bloc rather than diffing).

import type { Database } from "@/lib/database.types";
import type { ZoneAllure } from "@/lib/paces";
import type { BlocSeanceInput } from "@/lib/volume";

export type BlocRole = Database["public"]["Enums"]["bloc_role"];
export type ModeDuree = Database["public"]["Enums"]["mode_duree"];
export type CibleType = Database["public"]["Enums"]["cible_type"];

export interface DraftBloc {
  clientId: string;
  parentClientId: string | null;
  role: BlocRole;
  repetitions: number;
  modeDuree: ModeDuree;
  distanceMetres: number | null;
  dureeSecondes: number | null;
  cibleType: CibleType;
  cibleZone: ZoneAllure | null;
  cibleAllureSecondesParKm: number | null;
  cibleRpe: number | null;
  commentaire: string | null;
}

export function blankBloc(parentClientId: string | null): DraftBloc {
  return {
    clientId: crypto.randomUUID(),
    parentClientId,
    role: "corps",
    repetitions: 1,
    modeDuree: "temps",
    distanceMetres: null,
    dureeSecondes: 600,
    cibleType: "zone_allure",
    cibleZone: "z2_endurance",
    cibleAllureSecondesParKm: null,
    cibleRpe: null,
    commentaire: null,
  };
}

/** Resets the fields the DB CHECK constraints require for each mode_duree. */
export function applyModeDureeDefaults(bloc: DraftBloc, modeDuree: ModeDuree): DraftBloc {
  if (modeDuree === "distance") {
    return { ...bloc, modeDuree, distanceMetres: bloc.distanceMetres ?? 1000, dureeSecondes: null };
  }
  if (modeDuree === "temps") {
    return { ...bloc, modeDuree, dureeSecondes: bloc.dureeSecondes ?? 600, distanceMetres: null };
  }
  return { ...bloc, modeDuree, distanceMetres: null };
}

/** Resets the fields the DB CHECK constraints require for each cible_type. */
export function applyCibleTypeDefaults(bloc: DraftBloc, cibleType: CibleType): DraftBloc {
  if (cibleType === "zone_allure" || cibleType === "zone_fc") {
    return {
      ...bloc,
      cibleType,
      cibleZone: bloc.cibleZone ?? "z2_endurance",
      cibleAllureSecondesParKm: null,
      cibleRpe: null,
    };
  }
  if (cibleType === "allure_absolue") {
    return {
      ...bloc,
      cibleType,
      cibleAllureSecondesParKm: bloc.cibleAllureSecondesParKm ?? 300,
      cibleZone: null,
      cibleRpe: null,
    };
  }
  if (cibleType === "rpe") {
    return { ...bloc, cibleType, cibleRpe: bloc.cibleRpe ?? 5, cibleZone: null, cibleAllureSecondesParKm: null };
  }
  return { ...bloc, cibleType, cibleZone: null, cibleAllureSecondesParKm: null, cibleRpe: null };
}

export function draftToBlocSeanceInput(b: DraftBloc): BlocSeanceInput {
  return {
    id: b.clientId,
    parentBlocId: b.parentClientId,
    repetitions: b.repetitions,
    modeDuree: b.modeDuree,
    distanceMetres: b.distanceMetres,
    dureeSecondes: b.dureeSecondes,
    cibleType: b.cibleType,
    cibleZone: b.cibleZone,
    cibleAllureSecondesParKm: b.cibleAllureSecondesParKm,
  };
}

export function blocRowToDraft(row: Database["public"]["Tables"]["bloc_seance"]["Row"]): DraftBloc {
  return {
    clientId: row.id,
    parentClientId: row.parent_bloc_id,
    role: row.role,
    repetitions: row.repetitions,
    modeDuree: row.mode_duree,
    distanceMetres: row.distance_metres,
    dureeSecondes: row.duree_secondes,
    cibleType: row.cible_type,
    cibleZone: row.cible_zone,
    cibleAllureSecondesParKm: row.cible_allure_secondes_par_km,
    cibleRpe: row.cible_rpe,
    commentaire: row.commentaire,
  };
}
