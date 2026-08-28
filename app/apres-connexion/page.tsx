import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/utils/supabase/server";
import { resolvePostLoginPath } from "@/lib/auth-destination";

// Fallback only: an authenticated user landing on /login or /auth/* gets
// bounced here by proxy.ts. The two real login flows (magic link,
// identifiant+code) redirect straight to /admin or /mon-plan themselves and
// never route through this page — see lib/auth-destination.ts for why.
export default async function PostLoginPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  redirect(await resolvePostLoginPath(userId));
}
