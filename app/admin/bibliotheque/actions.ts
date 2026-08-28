"use server";

import { createClient } from "@/utils/supabase/server";

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
