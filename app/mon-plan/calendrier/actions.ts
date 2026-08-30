"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// RLS (note_calendrier_all_self) is the real guard here — these simply fail
// if the athlete's session doesn't map to the given athleteId.
export async function createNote(
  athleteId: string,
  data: { titre: string; couleur: string; contenu: string | null; dateDebut: string; dateFin: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("note_calendrier").insert({
    athlete_id: athleteId,
    titre: data.titre,
    couleur: data.couleur,
    contenu: data.contenu,
    date_debut: data.dateDebut,
    date_fin: data.dateFin,
  });

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/calendrier");
  return {};
}

export async function updateNote(
  noteId: string,
  athleteId: string,
  data: { titre: string; couleur: string; contenu: string | null; dateDebut: string; dateFin: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("note_calendrier")
    .update({
      titre: data.titre,
      couleur: data.couleur,
      contenu: data.contenu,
      date_debut: data.dateDebut,
      date_fin: data.dateFin,
    })
    .eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/calendrier");
  return {};
}

export async function deleteNote(noteId: string, athleteId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("note_calendrier").delete().eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/calendrier");
  return {};
}
