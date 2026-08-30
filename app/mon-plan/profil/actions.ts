"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "../_lib/current-athlete";
import type { Database } from "@/lib/database.types";

type DistanceRef = Database["public"]["Enums"]["distance_ref"];
type PerformanceType = Database["public"]["Enums"]["performance_type"];
type PrioriteCompetition = Database["public"]["Enums"]["priorite_competition"];

// Every action below resolves the athlete from the session itself — never
// from a client-supplied id — so an athlete can only ever read or write
// their own rows, regardless of what a caller passes in. The dialogs these
// feed are shared with the admin fiche (components/competition-dialog.tsx,
// components/performance-dialog.tsx) and always pass an athleteId
// positionally; it's accepted here for signature compatibility and ignored.

export async function updateOwnProfile(data: {
  prenom: string;
  nom: string;
  dateNaissance: string | null;
}): Promise<{ error?: string }> {
  if (!data.prenom.trim()) return { error: "Prénom requis." };
  if (!data.nom.trim()) return { error: "Nom requis." };

  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete")
    .update({
      prenom: data.prenom.trim(),
      nom: data.nom.trim(),
      date_naissance: data.dateNaissance,
    })
    .eq("id", athlete.id);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function changeOwnPassword(newPassword: string): Promise<{ error?: string }> {
  if (newPassword.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: error.message };
  return {};
}

export async function createOwnPerformance(
  _athleteId: string,
  data: { distance: DistanceRef; tempsSecondes: number; datePerf: string; type: PerformanceType }
): Promise<{ error?: string }> {
  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase.from("performance_reference").insert({
    athlete_id: athlete.id,
    distance: data.distance,
    temps_secondes: data.tempsSecondes,
    date_perf: data.datePerf,
    type: data.type,
  });

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function updateOwnPerformance(
  performanceId: string,
  _athleteId: string,
  data: { distance: DistanceRef; tempsSecondes: number; datePerf: string; type: PerformanceType }
): Promise<{ error?: string }> {
  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("performance_reference")
    .update({
      distance: data.distance,
      temps_secondes: data.tempsSecondes,
      date_perf: data.datePerf,
      type: data.type,
    })
    .eq("id", performanceId)
    .eq("athlete_id", athlete.id);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function deleteOwnPerformance(
  performanceId: string,
  _athleteId: string
): Promise<{ error?: string }> {
  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("performance_reference")
    .delete()
    .eq("id", performanceId)
    .eq("athlete_id", athlete.id);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function createOwnCompetition(
  _athleteId: string,
  data: {
    nom: string;
    date: string;
    lieu: string | null;
    distance: string;
    deniveleMetresDplus: number | null;
    objectifTempsSecondes: number | null;
    objectifTexte: string | null;
    priorite: PrioriteCompetition;
  }
): Promise<{ error?: string }> {
  if (!data.nom.trim()) return { error: "Nom requis." };
  if (!data.distance.trim()) return { error: "Distance requise." };

  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase.from("competition").insert({
    athlete_id: athlete.id,
    nom: data.nom.trim(),
    date: data.date,
    lieu: data.lieu,
    distance: data.distance.trim(),
    denivele_metres_dplus: data.deniveleMetresDplus,
    objectif_temps_secondes: data.objectifTempsSecondes,
    objectif_texte: data.objectifTexte,
    priorite: data.priorite,
  });

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function updateOwnCompetition(
  competitionId: string,
  _athleteId: string,
  data: {
    nom: string;
    date: string;
    lieu: string | null;
    distance: string;
    deniveleMetresDplus: number | null;
    objectifTempsSecondes: number | null;
    objectifTexte: string | null;
    priorite: PrioriteCompetition;
  }
): Promise<{ error?: string }> {
  if (!data.nom.trim()) return { error: "Nom requis." };
  if (!data.distance.trim()) return { error: "Distance requise." };

  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("competition")
    .update({
      nom: data.nom.trim(),
      date: data.date,
      lieu: data.lieu,
      distance: data.distance.trim(),
      denivele_metres_dplus: data.deniveleMetresDplus,
      objectif_temps_secondes: data.objectifTempsSecondes,
      objectif_texte: data.objectifTexte,
      priorite: data.priorite,
    })
    .eq("id", competitionId)
    .eq("athlete_id", athlete.id);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function deleteOwnCompetition(
  competitionId: string,
  _athleteId: string
): Promise<{ error?: string }> {
  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("competition")
    .delete()
    .eq("id", competitionId)
    .eq("athlete_id", athlete.id);

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}

export async function sendMessageToAdmin(contenu: string): Promise<{ error?: string }> {
  if (!contenu.trim()) return { error: "Message vide." };

  const athlete = await getCurrentAthlete();
  if (!athlete) return { error: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase.from("message_athlete").insert({
    athlete_id: athlete.id,
    expediteur: "athlete",
    contenu: contenu.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath("/mon-plan/profil");
  return {};
}
