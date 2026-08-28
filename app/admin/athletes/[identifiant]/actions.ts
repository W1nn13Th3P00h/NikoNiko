"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  INTERNAL_EMAIL_DOMAIN,
  identifiantToInternalEmail,
  isValidIdentifiant,
} from "@/lib/athlete-login";
import type { Database } from "@/lib/database.types";

type DistanceRef = Database["public"]["Enums"]["distance_ref"];
type PerformanceType = Database["public"]["Enums"]["performance_type"];
type PrioriteCompetition = Database["public"]["Enums"]["priorite_competition"];

export async function updateAthleteInfos(
  athleteId: string,
  data: {
    prenom: string;
    nom: string;
    email: string;
    dateNaissance: string | null;
    fcMax: number | null;
    fcRepos: number | null;
    actif: boolean;
  }
): Promise<{ error?: string }> {
  if (!data.prenom.trim()) return { error: "Prénom requis." };
  if (!data.nom.trim()) return { error: "Nom requis." };
  if (!data.email.trim()) return { error: "Email requis." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete")
    .update({
      prenom: data.prenom.trim(),
      nom: data.nom.trim(),
      email: data.email.trim(),
      date_naissance: data.dateNaissance,
      fc_max: data.fcMax,
      fc_repos: data.fcRepos,
      actif: data.actif,
    })
    .eq("id", athleteId);

  if (error) {
    if (error.code === "23505") return { error: "Cet email est déjà utilisé par un autre athlète." };
    return { error: error.message };
  }

  revalidatePath(`/admin/athletes/${athleteId}`);
  return {};
}

export async function createPerformance(
  athleteId: string,
  data: { distance: DistanceRef; tempsSecondes: number; datePerf: string; type: PerformanceType }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("performance_reference").insert({
    athlete_id: athleteId,
    distance: data.distance,
    temps_secondes: data.tempsSecondes,
    date_perf: data.datePerf,
    type: data.type,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/athletes/${athleteId}`);
  return {};
}

export async function updatePerformance(
  performanceId: string,
  athleteId: string,
  data: { distance: DistanceRef; tempsSecondes: number; datePerf: string; type: PerformanceType }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("performance_reference")
    .update({
      distance: data.distance,
      temps_secondes: data.tempsSecondes,
      date_perf: data.datePerf,
      type: data.type,
    })
    .eq("id", performanceId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/athletes/${athleteId}`);
  return {};
}

export async function createCompetition(
  athleteId: string,
  data: {
    nom: string;
    date: string;
    lieu: string | null;
    distance: DistanceRef | null;
    distanceMetresCustom: number | null;
    objectifTempsSecondes: number | null;
    objectifTexte: string | null;
    priorite: PrioriteCompetition;
  }
): Promise<{ error?: string }> {
  if (!data.nom.trim()) return { error: "Nom requis." };
  if (!data.distance && !data.distanceMetresCustom) {
    return { error: "Distance requise (standard ou personnalisée)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("competition").insert({
    athlete_id: athleteId,
    nom: data.nom.trim(),
    date: data.date,
    lieu: data.lieu,
    distance: data.distance,
    distance_metres_custom: data.distanceMetresCustom,
    objectif_temps_secondes: data.objectifTempsSecondes,
    objectif_texte: data.objectifTexte,
    priorite: data.priorite,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/athletes/${athleteId}`);
  return {};
}

export async function updateCompetition(
  competitionId: string,
  athleteId: string,
  data: {
    nom: string;
    date: string;
    lieu: string | null;
    distance: DistanceRef | null;
    distanceMetresCustom: number | null;
    objectifTempsSecondes: number | null;
    objectifTexte: string | null;
    priorite: PrioriteCompetition;
  }
): Promise<{ error?: string }> {
  if (!data.nom.trim()) return { error: "Nom requis." };
  if (!data.distance && !data.distanceMetresCustom) {
    return { error: "Distance requise (standard ou personnalisée)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("competition")
    .update({
      nom: data.nom.trim(),
      date: data.date,
      lieu: data.lieu,
      distance: data.distance,
      distance_metres_custom: data.distanceMetresCustom,
      objectif_temps_secondes: data.objectifTempsSecondes,
      objectif_texte: data.objectifTexte,
      priorite: data.priorite,
    })
    .eq("id", competitionId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/athletes/${athleteId}`);
  return {};
}

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
