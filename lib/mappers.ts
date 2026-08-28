// Maps Supabase row shapes (snake_case, generated types) to the camelCase
// input types lib/paces.ts and lib/volume.ts expect. Kept here so both the
// admin and athlete routes share one conversion instead of re-deriving it.

import type { Database } from "./database.types";
import type { PerformanceReference } from "./paces";
import type { BlocSeanceInput } from "./volume";

type PerformanceRow = Pick<
  Database["public"]["Tables"]["performance_reference"]["Row"],
  "distance" | "temps_secondes" | "date_perf" | "type"
>;
type BlocRow = Database["public"]["Tables"]["bloc_seance"]["Row"];
type BlocRole = Database["public"]["Enums"]["bloc_role"];

// BlocSeanceInput plus the fields BlocList needs to render a bloc but that
// don't affect volume/pace math (role, commentaire, cible_rpe) — lets
// BlocList render both real DB rows (mon-plan) and unsaved editor drafts
// (admin) through the same shape.
export interface BlocDisplayItem extends BlocSeanceInput {
  role: BlocRole;
  cibleRpe: number | null;
  commentaire: string | null;
}

export function toBlocDisplayItem(row: BlocRow): BlocDisplayItem {
  return {
    ...toBlocSeanceInput(row),
    role: row.role,
    cibleRpe: row.cible_rpe,
    commentaire: row.commentaire,
  };
}

export function toPerformanceReference(row: PerformanceRow): PerformanceReference {
  return {
    distance: row.distance,
    tempsSecondes: row.temps_secondes,
    datePerf: row.date_perf,
    type: row.type,
  };
}

export function toBlocSeanceInput(row: BlocRow): BlocSeanceInput {
  return {
    id: row.id,
    parentBlocId: row.parent_bloc_id,
    repetitions: row.repetitions,
    modeDuree: row.mode_duree,
    distanceMetres: row.distance_metres,
    dureeSecondes: row.duree_secondes,
    cibleType: row.cible_type,
    cibleZone: row.cible_zone,
    cibleAllureSecondesParKm: row.cible_allure_secondes_par_km,
  };
}
