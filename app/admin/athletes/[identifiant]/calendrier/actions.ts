"use server";

import { addDays, differenceInCalendarDays, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
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
  const { data: source } = await supabase
    .from("seance")
    .select("titre, type, objectif, consignes, ordre_dans_journee")
    .eq("id", sourceSeanceId)
    .single();
  if (!source) return;

  const { data: newSeance } = await supabase
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
  if (!newSeance) return;

  const { data: blocs } = await supabase
    .from("bloc_seance")
    .select("*")
    .eq("seance_id", sourceSeanceId)
    .order("ordre");
  if (!blocs || blocs.length === 0) return;

  const topLevel = blocs.filter((b) => b.parent_bloc_id === null);
  const children = blocs.filter((b) => b.parent_bloc_id !== null);

  // Sequential inserts (not a single bulk insert): we need each top-level
  // bloc's generated id before inserting its children, and row order isn't
  // guaranteed to match input order on a multi-row INSERT ... RETURNING.
  const idMap = new Map<string, string>();
  for (const bloc of topLevel) {
    const { data: inserted } = await supabase
      .from("bloc_seance")
      .insert({ ...blocInsertFields(bloc), seance_id: newSeance.id, parent_bloc_id: null })
      .select("id")
      .single();
    if (inserted) idMap.set(bloc.id, inserted.id);
  }

  for (const bloc of children) {
    const newParentId = bloc.parent_bloc_id ? idMap.get(bloc.parent_bloc_id) : null;
    await supabase.from("bloc_seance").insert({
      ...blocInsertFields(bloc),
      seance_id: newSeance.id,
      parent_bloc_id: newParentId ?? null,
    });
  }
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
  await supabase.from("seance").update({ date_prevue: newDate }).eq("id", seanceId);
  revalidatePath("/admin", "layout");
}

export async function deleteSeance(seanceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("seance").delete().eq("id", seanceId);
  revalidatePath("/admin", "layout");
  return { error: error ? error.message : null };
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
