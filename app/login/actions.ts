"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { identifiantToInternalEmail } from "@/lib/athlete-login";
import { resolvePostLoginPath } from "@/lib/auth-destination";

// One form, one mechanism for everyone (coach included): every identifiant
// maps to the same synthetic internal email scheme, so this never needs to
// know or care who it's signing in.
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

  const email = identifiantToInternalEmail(identifiant.trim().toLowerCase());

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/login?error=Identifiant+ou+mot+de+passe+incorrect");
  }

  redirect(await resolvePostLoginPath(data.user.id));
}
