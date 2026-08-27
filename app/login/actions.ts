"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
