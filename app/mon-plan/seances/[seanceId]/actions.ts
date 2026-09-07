"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/lib/database.types";

type RetourStatut = Database["public"]["Enums"]["retour_statut"];

// RLS (retour_insert_self / retour_update_self_within_7_days) is the real
// guard here — this upsert simply fails if the athlete tries to touch a
// retour on a séance that isn't theirs, or one older than 7 days.
export async function submitRetour(
  seanceId: string,
  athleteId: string,
  statut: RetourStatut,
  rpe: number | null,
  commentaire: string | null
) {
  const supabase = await createClient();

  await supabase.from("retour_seance").upsert(
    {
      seance_id: seanceId,
      athlete_id: athleteId,
      statut,
      rpe,
      commentaire,
    },
    { onConflict: "seance_id" }
  );

  revalidatePath(`/mon-plan/seances/${seanceId}`);
  revalidatePath("/mon-plan");
  revalidatePath("/mon-plan/calendrier");
}

// RLS (seance_update_self) is the real guard: only the athlete's own
// occurrences (est_modele = false) can be updated this way. No date-range
// limit — the athlete is free to reschedule as they see fit.
export async function updateSeanceDate(seanceId: string, nouvelleDate: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("seance")
    .update({ date_prevue: nouvelleDate, date_modifiee_par_athlete: true })
    .eq("id", seanceId);

  if (error) return { error: "Impossible de modifier la date." };

  revalidatePath(`/mon-plan/seances/${seanceId}`);
  revalidatePath("/mon-plan");
  revalidatePath("/mon-plan/calendrier");
  return {};
}
