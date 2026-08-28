"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { identifiantToInternalEmail } from "@/lib/athlete-login";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || email.trim().length === 0) {
    redirect("/login?error=Adresse+email+requise");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/apres-connexion`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?sent=1");
}

export async function signInWithIdentifiant(formData: FormData) {
  const identifiant = formData.get("identifiant");
  const code = formData.get("code");

  if (typeof identifiant !== "string" || typeof code !== "string" || !identifiant || !code) {
    redirect("/login?error=Identifiant+et+code+requis");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: identifiantToInternalEmail(identifiant.trim().toLowerCase()),
    password: code,
  });

  if (error) {
    redirect("/login?error=Identifiant+ou+code+incorrect");
  }

  redirect("/apres-connexion");
}
