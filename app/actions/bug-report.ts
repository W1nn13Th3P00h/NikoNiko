"use server";

import { createClient, getCurrentUserId } from "@/utils/supabase/server";

const GITHUB_REPO = "W1nn13Th3P00h/NikoNiko";
const GITHUB_LABEL = "bug-report-app";

async function resolveReporter(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) return "Inconnu";

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profile")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (profile?.is_admin) return "Coach";

  const { data: athlete } = await supabase
    .from("athlete")
    .select("prenom, nom")
    .eq("auth_user_id", userId)
    .single();

  return athlete ? `${athlete.prenom} ${athlete.nom} (athlète)` : "Athlète";
}

export async function reportBug(input: {
  titre: string;
  description: string;
  path: string;
}): Promise<{ error?: string }> {
  const titre = input.titre.trim();
  const description = input.description.trim();
  if (!titre) return { error: "Titre requis." };

  const reporter = await resolveReporter();
  const body = [
    description,
    "",
    "---",
    `Signalé par : ${reporter}`,
    `Page : ${input.path}`,
  ].join("\n");

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_ISSUES_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: titre, body, labels: [GITHUB_LABEL] }),
  });

  if (!response.ok) {
    return { error: "Impossible de créer le signalement. Réessayez plus tard." };
  }

  return {};
}
