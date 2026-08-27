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
