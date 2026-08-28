import { createClient } from "@/utils/supabase/server";

// Where to send a freshly authenticated user, based on their role. Shared by
// every login entry point (magic link via /auth/confirm, identifiant+code)
// so each one redirects there directly in a single hop, instead of routing
// through a separate page that immediately redirects again — that chained
// redirect (Server Action redirect -> page render -> its own redirect) was
// triggering a client-side navigation loop in this Next.js version.
export async function resolvePostLoginPath(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profile")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return profile?.is_admin ? "/admin" : "/mon-plan";
}
