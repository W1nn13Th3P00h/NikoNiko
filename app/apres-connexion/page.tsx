import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/utils/supabase/server";
import { resolvePostLoginPath } from "@/lib/auth-destination";

// Fallback only: an authenticated user landing on /login gets bounced here
// by proxy.ts. The real login flow (app/login/actions.ts) redirects
// straight to /admin or /mon-plan itself and never routes through this
// page — see lib/auth-destination.ts for why.
export default async function PostLoginPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  redirect(await resolvePostLoginPath(userId));
}
