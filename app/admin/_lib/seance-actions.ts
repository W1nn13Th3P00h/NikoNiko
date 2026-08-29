"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/lib/database.types";
import type { DraftBloc } from "./draft";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type SeanceType = Database["public"]["Enums"]["seance_type"];

// The editor edits a séance as one whole document rather than diffing
// individual bloc changes: simplest correct approach for a single coach
// editing alone, and it sidesteps tracking which blocs were added, moved,
// or removed since the last save.
async function replaceBlocs(supabase: SupabaseServerClient, seanceId: string, blocs: DraftBloc[]) {
  await supabase.from("bloc_seance").delete().eq("seance_id", seanceId);
  if (blocs.length === 0) return;

  const topLevel = blocs.filter((b) => b.parentClientId === null);
  const children = blocs.filter((b) => b.parentClientId !== null);

  const idMap = new Map<string, string>();
  let ordre = 0;
  for (const b of topLevel) {
    ordre += 1;
    const { data } = await supabase
      .from("bloc_seance")
      .insert({
        seance_id: seanceId,
        parent_bloc_id: null,
        ordre,
        role: b.role,
        repetitions: b.repetitions,
        mode_duree: b.modeDuree,
        distance_metres: b.distanceMetres,
        duree_secondes: b.dureeSecondes,
        cible_type: b.cibleType,
        cible_zone: b.cibleZone,
        cible_allure_secondes_par_km: b.cibleAllureSecondesParKm,
        cible_rpe: b.cibleRpe,
        commentaire: b.commentaire,
      })
      .select("id")
      .single();
    if (data) idMap.set(b.clientId, data.id);
  }

  let childOrdre = 0;
  for (const b of children) {
    childOrdre += 1;
    const parentId = b.parentClientId ? idMap.get(b.parentClientId) : null;
    if (!parentId) continue;
    await supabase.from("bloc_seance").insert({
      seance_id: seanceId,
      parent_bloc_id: parentId,
      ordre: childOrdre,
      role: b.role,
      repetitions: b.repetitions,
      mode_duree: b.modeDuree,
      distance_metres: b.distanceMetres,
      duree_secondes: b.dureeSecondes,
      cible_type: b.cibleType,
      cible_zone: b.cibleZone,
      cible_allure_secondes_par_km: b.cibleAllureSecondesParKm,
      cible_rpe: b.cibleRpe,
      commentaire: b.commentaire,
    });
  }
}

// Works for both an athlete's occurrence and a library template — both are
// rows in the same `seance` table, editing them is identical. Only an
// occurrence editor offers `saveAsLibraryCopy` (copying it into the
// library); editing a template directly just saves it in place.
export async function saveSeance(
  seanceId: string,
  fields: {
    titre: string;
    type: SeanceType;
    objectif: string | null;
    consignes: string | null;
  },
  blocs: DraftBloc[],
  options?: { saveAsLibraryCopy?: boolean }
) {
  const supabase = await createClient();

  await supabase
    .from("seance")
    .update({
      titre: fields.titre,
      type: fields.type,
      objectif: fields.objectif,
      consignes: fields.consignes,
    })
    .eq("id", seanceId);

  await replaceBlocs(supabase, seanceId, blocs);

  if (options?.saveAsLibraryCopy) {
    const { data: librarySeance } = await supabase
      .from("seance")
      .insert({
        titre: fields.titre,
        type: fields.type,
        objectif: fields.objectif,
        consignes: fields.consignes,
        est_modele: true,
      })
      .select("id")
      .single();

    if (librarySeance) {
      await replaceBlocs(supabase, librarySeance.id, blocs);
    }
  }

  revalidatePath("/admin", "layout");
}

// Works for any séance row — an athlete's occurrence or a library
// template — since deleting cascades to its blocs (and, for an occurrence,
// its retour) at the database level.
export async function deleteSeance(seanceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("seance").delete().eq("id", seanceId);
  revalidatePath("/admin", "layout");
  return { error: error ? error.message : null };
}
