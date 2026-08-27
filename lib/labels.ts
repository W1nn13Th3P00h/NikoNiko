// French display labels for raw Postgres enums that don't already have a
// natural home in a domain-specific lib file (see ZONE_LABELS/DISTANCE_LABELS
// in lib/paces.ts for the ones that do).

import type { Database } from "./database.types";

type SeanceType = Database["public"]["Enums"]["seance_type"];

export const SEANCE_TYPE_LABELS: Record<SeanceType, string> = {
  endurance: "Endurance",
  seuil: "Seuil",
  vma: "VMA",
  fractionne_court: "Fractionné court",
  fractionne_long: "Fractionné long",
  cote: "Côte",
  sortie_longue: "Sortie longue",
  allure_specifique: "Allure spécifique",
  recuperation: "Récupération",
  renforcement: "Renforcement",
  repos: "Repos",
  competition: "Compétition",
  test: "Test",
  cross_training: "Cross-training",
};
