"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { identifiantToInternalEmail } from "@/lib/athlete-login";
import { resolvePostLoginPath } from "@/lib/auth-destination";

// One form for everyone. An athlete's identifiant never contains "@" (see
// IDENTIFIANT_PATTERN in athlete-login.ts), so that's the only signal we
// need to tell an athlete's identifiant apart from the coach's real email
// — no extra lookup, no separate admin identifiant to maintain.
export async function signIn(formData: FormData) {
  const identifiant = formData.get("identifiant");
  const password = formData.get("password");

  if (
    typeof identifiant !== "string" ||
    typeof password !== "string" ||
    !identifiant.trim() ||
    !password
  ) {
    redirect("/login?error=Identifiant+et+mot+de+passe+requis");
  }

  const trimmed = identifiant.trim();
  const email = trimmed.includes("@") ? trimmed : identifiantToInternalEmail(trimmed.toLowerCase());

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/login?error=Identifiant+ou+mot+de+passe+incorrect");
  }

  redirect(await resolvePostLoginPath(data.user.id));
}
