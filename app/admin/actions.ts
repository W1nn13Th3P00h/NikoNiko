"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isValidIdentifiant } from "@/lib/athlete-login";

export async function createAthlete(formData: FormData): Promise<{ error?: string }> {
  const prenom = formData.get("prenom");
  const nom = formData.get("nom");
  const email = formData.get("email");
  const identifiant = formData.get("identifiant");
  const dateNaissance = formData.get("date_naissance");
  const fcMax = formData.get("fc_max");
  const fcRepos = formData.get("fc_repos");

  if (typeof prenom !== "string" || !prenom.trim()) return { error: "Prénom requis." };
  if (typeof nom !== "string" || !nom.trim()) return { error: "Nom requis." };
  if (typeof email !== "string" || !email.trim()) return { error: "Email requis." };

  const normalizedIdentifiant = typeof identifiant === "string" ? identifiant.trim().toLowerCase() : "";
  if (!isValidIdentifiant(normalizedIdentifiant)) {
    return { error: "Identifiant invalide : 3 à 20 caractères, minuscules/chiffres/-/_ uniquement." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete")
    .insert({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email.trim(),
      identifiant: normalizedIdentifiant,
      date_naissance: typeof dateNaissance === "string" && dateNaissance ? dateNaissance : null,
      fc_max: typeof fcMax === "string" && fcMax ? Number(fcMax) : null,
      fc_repos: typeof fcRepos === "string" && fcRepos ? Number(fcRepos) : null,
    })
    .select("identifiant")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Cet email ou cet identifiant est déjà utilisé par un autre athlète." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  redirect(`/admin/athletes/${data.identifiant}`);
}
