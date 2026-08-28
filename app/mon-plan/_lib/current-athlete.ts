import { createClient, getCurrentUserId } from "@/utils/supabase/server";

// The athlete/proxy.ts route protection already guarantees a logged-in
// user reaching /mon-plan; this resolves which athlete row that session
// maps to (set by the on_auth_user_created trigger, see CLAUDE.md).
export async function getCurrentAthlete() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data: athlete } = await supabase
    .from("athlete")
    .select("*")
    .eq("auth_user_id", userId)
    .single();

  return athlete;
}
