"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  INTERNAL_EMAIL_DOMAIN,
  identifiantToInternalEmail,
  isValidIdentifiant,
} from "@/lib/athlete-login";

export async function saveAthleteNote(athleteId: string, formData: FormData) {
  const contenu = formData.get("contenu");
  const supabase = await createClient();

  await supabase
    .from("athlete_note")
    .upsert({ athlete_id: athleteId, contenu: typeof contenu === "string" ? contenu : "" });

  revalidatePath(`/admin/athletes/${athleteId}`);
}

// Sets up (or changes) the athlete's identifiant + code login. Never
// touches an existing magic-link identity: if athlete_id is currently
// linked to a real email's auth user, this creates a brand new auth user
// for the internal email and repoints the link, rather than overwriting
// the real account in place.
export async function setAthleteCredentials(
  athleteId: string,
  identifiant: string,
  code: string
): Promise<{ error?: string }> {
  const normalizedIdentifiant = identifiant.trim().toLowerCase();

  if (!isValidIdentifiant(normalizedIdentifiant)) {
    return {
      error: "Identifiant invalide : 3 à 20 caractères, minuscules/chiffres/-/_ uniquement.",
    };
  }
  if (code.length < 6) {
    return { error: "Le code doit faire au moins 6 caractères." };
  }

  const supabase = await createClient();

  const { data: conflict } = await supabase
    .from("athlete")
    .select("id")
    .eq("identifiant", normalizedIdentifiant)
    .neq("id", athleteId)
    .maybeSingle();
  if (conflict) {
    return { error: "Cet identifiant est déjà utilisé par un autre athlète." };
  }

  const { data: athlete } = await supabase
    .from("athlete")
    .select("auth_user_id")
    .eq("id", athleteId)
    .single();
  if (!athlete) return { error: "Athlète introuvable." };

  const admin = createAdminClient();
  const internalEmail = identifiantToInternalEmail(normalizedIdentifiant);

  let reuseExistingUserId: string | null = null;
  if (athlete.auth_user_id) {
    const { data: existingUser } = await admin.auth.admin.getUserById(athlete.auth_user_id);
    if (existingUser?.user?.email?.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`)) {
      reuseExistingUserId = athlete.auth_user_id;
    }
  }

  if (reuseExistingUserId) {
    const { error } = await admin.auth.admin.updateUserById(reuseExistingUserId, {
      email: internalEmail,
      password: code,
      email_confirm: true,
    });
    if (error) return { error: error.message };
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: internalEmail,
      password: code,
      email_confirm: true,
    });
    if (error || !created.user) {
      return { error: error?.message ?? "Création du compte impossible." };
    }
    await supabase.from("athlete").update({ auth_user_id: created.user.id }).eq("id", athleteId);
  }

  await supabase.from("athlete").update({ identifiant: normalizedIdentifiant }).eq("id", athleteId);

  revalidatePath(`/admin/athletes/${athleteId}`);
  return {};
}
