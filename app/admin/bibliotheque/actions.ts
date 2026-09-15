"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { copyBlocTree } from "@/app/admin/_lib/copy-blocs";

// Placeholder library entry with no blocs yet — the coach lands straight
// in the editor to define it (same pattern as the calendar's "séance
// custom" flow, see app/admin/athletes/[identifiant]/calendrier/actions.ts).
export async function createBlankLibrarySeance() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seance")
    .insert({ titre: "Nouvelle séance", type: "endurance", est_modele: true })
    .select("id")
    .single();

  return data?.id ?? null;
}

// Lets the coach start a new library séance from an existing one instead of
// from scratch. Always a copy (same rule as applying a library séance to an
// athlete, see CLAUDE.md) — editing the duplicate never touches the source.
export async function duplicateLibrarySeance(seanceId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("seance")
    .select("titre, type, objectif, consignes")
    .eq("id", seanceId)
    .single();
  if (sourceError || !source) throw new Error(sourceError?.message ?? "Séance source introuvable");

  const { data: copy, error: insertError } = await supabase
    .from("seance")
    .insert({
      titre: `Copie de ${source.titre}`,
      type: source.type,
      objectif: source.objectif,
      consignes: source.consignes,
      est_modele: true,
    })
    .select("id")
    .single();
  if (insertError || !copy) throw new Error(insertError?.message ?? "Échec de la duplication");

  await copyBlocTree(supabase, seanceId, copy.id);

  revalidatePath("/admin/bibliotheque", "layout");
  return copy.id;
}
