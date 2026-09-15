import type { createClient } from "@/utils/supabase/server";
import type { Database } from "@/lib/database.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type BlocRow = Database["public"]["Tables"]["bloc_seance"]["Row"];

function blocInsertFields(row: BlocRow) {
  return {
    ordre: row.ordre,
    role: row.role,
    repetitions: row.repetitions,
    mode_duree: row.mode_duree,
    distance_metres: row.distance_metres,
    duree_secondes: row.duree_secondes,
    cible_type: row.cible_type,
    cible_zone: row.cible_zone,
    cible_allure_secondes_par_km: row.cible_allure_secondes_par_km,
    cible_rpe: row.cible_rpe,
    commentaire: row.commentaire,
  };
}

// Copies every bloc_seance row from one séance to another, preserving the
// parent/child tree (used for library→athlete application, week
// duplication, and library duplication). Throws on the first failed
// insert rather than swallowing it: a swallowed error here previously let
// whole "corps" blocs (and their repeated children) silently vanish, with
// the coach seeing no error at all.
export async function copyBlocTree(
  supabase: SupabaseServerClient,
  sourceSeanceId: string,
  targetSeanceId: string
) {
  const { data: blocs, error: fetchError } = await supabase
    .from("bloc_seance")
    .select("*")
    .eq("seance_id", sourceSeanceId)
    .order("ordre");
  if (fetchError) throw new Error(fetchError.message);
  if (!blocs || blocs.length === 0) return;

  const topLevel = blocs.filter((b) => b.parent_bloc_id === null);
  const children = blocs.filter((b) => b.parent_bloc_id !== null);

  // Sequential inserts (not a single bulk insert): we need each top-level
  // bloc's generated id before inserting its children, and row order isn't
  // guaranteed to match input order on a multi-row INSERT ... RETURNING.
  const idMap = new Map<string, string>();
  for (const bloc of topLevel) {
    const { data: inserted, error } = await supabase
      .from("bloc_seance")
      .insert({ ...blocInsertFields(bloc), seance_id: targetSeanceId, parent_bloc_id: null })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Échec de la copie d'un bloc");
    idMap.set(bloc.id, inserted.id);
  }

  for (const bloc of children) {
    const newParentId = bloc.parent_bloc_id ? idMap.get(bloc.parent_bloc_id) : null;
    const { error } = await supabase.from("bloc_seance").insert({
      ...blocInsertFields(bloc),
      seance_id: targetSeanceId,
      parent_bloc_id: newParentId ?? null,
    });
    if (error) throw new Error(error.message);
  }
}
