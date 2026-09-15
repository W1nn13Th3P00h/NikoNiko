"use server";

import { addDays, differenceInCalendarDays, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { copyBlocTree } from "@/app/admin/_lib/copy-blocs";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Copies a séance (library template or another athlete's occurrence) plus
// its whole bloc tree onto a target athlete/date. A library séance applied
// to an athlete must be a copy, never a reference — editing it afterwards
// for that athlete must not touch the library entry (see CLAUDE.md).
async function copySeanceWithBlocs(
  supabase: SupabaseServerClient,
  sourceSeanceId: string,
  targetAthleteId: string,
  targetDate: string
) {
  const { data: source, error: sourceError } = await supabase
    .from("seance")
    .select("titre, type, objectif, consignes, ordre_dans_journee")
    .eq("id", sourceSeanceId)
    .single();
  if (sourceError || !source) throw new Error(sourceError?.message ?? "Séance source introuvable");

  const { data: newSeance, error: insertError } = await supabase
    .from("seance")
    .insert({
      titre: source.titre,
      type: source.type,
      objectif: source.objectif,
      consignes: source.consignes,
      ordre_dans_journee: source.ordre_dans_journee,
      est_modele: false,
      athlete_id: targetAthleteId,
      date_prevue: targetDate,
    })
    .select("id")
    .single();
  if (insertError || !newSeance) throw new Error(insertError?.message ?? "Échec de la création de la séance");

  await copyBlocTree(supabase, sourceSeanceId, newSeance.id);
}

// Creates a placeholder séance with no blocs yet; the coach immediately
// lands in the block-by-block editor to define it (see
// app/admin/athletes/[identifiant]/seances/[seanceId]).
export async function createBlankSeance(athleteId: string, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seance")
    .insert({
      titre: "Nouvelle séance",
      type: "endurance",
      est_modele: false,
      athlete_id: athleteId,
      date_prevue: date,
    })
    .select("id")
    .single();

  revalidatePath("/admin", "layout");
  return data?.id ?? null;
}

export async function applyLibrarySeance(
  athleteId: string,
  date: string,
  librarySeanceId: string
) {
  const supabase = await createClient();
  await copySeanceWithBlocs(supabase, librarySeanceId, athleteId, date);
  revalidatePath("/admin", "layout");
}

export async function moveSeanceDate(seanceId: string, newDate: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("seance").update({ date_prevue: newDate }).eq("id", seanceId);
  revalidatePath("/admin", "layout");
  return { error: error ? error.message : null };
}

export async function deleteSeance(seanceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("seance").delete().eq("id", seanceId);
  revalidatePath("/admin", "layout");
  return { error: error ? error.message : null };
}

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
  revalidatePath("/admin", "layout");
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
  revalidatePath("/admin", "layout");
  return {};
}

export async function deleteNote(noteId: string, athleteId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("note_calendrier").delete().eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

export async function duplicateWeek(
  sourceAthleteId: string,
  sourceWeekStart: string,
  targetAthleteId: string,
  targetWeekStart: string
) {
  const supabase = await createClient();
  const sourceWeekEnd = format(addDays(new Date(sourceWeekStart), 6), "yyyy-MM-dd");

  const { data: seances } = await supabase
    .from("seance")
    .select("id, date_prevue")
    .eq("athlete_id", sourceAthleteId)
    .eq("est_modele", false)
    .gte("date_prevue", sourceWeekStart)
    .lte("date_prevue", sourceWeekEnd);

  for (const s of seances ?? []) {
    if (!s.date_prevue) continue;
    const offset = differenceInCalendarDays(new Date(s.date_prevue), new Date(sourceWeekStart));
    const targetDate = format(addDays(new Date(targetWeekStart), offset), "yyyy-MM-dd");
    await copySeanceWithBlocs(supabase, s.id, targetAthleteId, targetDate);
  }

  revalidatePath("/admin", "layout");
}
