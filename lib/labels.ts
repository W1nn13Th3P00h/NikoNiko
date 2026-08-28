// French display labels for raw Postgres enums that don't already have a
// natural home in a domain-specific lib file (see ZONE_LABELS/DISTANCE_LABELS
// in lib/paces.ts for the ones that do).

import type { Database } from "./database.types";

type SeanceType = Database["public"]["Enums"]["seance_type"];
type BlocRole = Database["public"]["Enums"]["bloc_role"];
type ModeDuree = Database["public"]["Enums"]["mode_duree"];
type CibleType = Database["public"]["Enums"]["cible_type"];
type RetourStatut = Database["public"]["Enums"]["retour_statut"];

export const BLOC_ROLE_LABELS: Record<BlocRole, string> = {
  echauffement: "Échauffement",
  corps: "Corps",
  recuperation: "Récupération",
  retour_au_calme: "Retour au calme",
  gammes: "Gammes",
};

export const MODE_DUREE_LABELS: Record<ModeDuree, string> = {
  distance: "Distance",
  temps: "Temps",
  libre: "Libre",
};

export const CIBLE_TYPE_LABELS: Record<CibleType, string> = {
  zone_allure: "Zone d'allure",
  allure_absolue: "Allure imposée",
  zone_fc: "Zone de FC",
  rpe: "RPE",
  libre: "Libre",
};

export const RPE_LABELS: Record<number, string> = {
  1: "très facile",
  2: "facile",
  3: "modéré",
  4: "un peu dur",
  5: "assez dur",
  6: "dur",
  7: "très dur",
  8: "très très dur",
  9: "extrême",
  10: "maximal",
};

export const RETOUR_STATUT_LABELS: Record<RetourStatut, string> = {
  fait: "Fait",
  partiel: "Partiel",
  non_fait: "Non fait",
};

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
