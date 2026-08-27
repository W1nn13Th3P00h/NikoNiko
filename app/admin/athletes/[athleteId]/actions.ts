"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function saveAthleteNote(athleteId: string, formData: FormData) {
  const contenu = formData.get("contenu");
  const supabase = await createClient();

  await supabase
    .from("athlete_note")
    .upsert({ athlete_id: athleteId, contenu: typeof contenu === "string" ? contenu : "" });

  revalidatePath(`/admin/athletes/${athleteId}`);
}
