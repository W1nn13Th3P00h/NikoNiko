// Display-only colors, no business meaning: a zone's real definition is the
// pace/HR math in lib/paces.ts. Used to color-code the admin calendar and
// library by zone/type at a glance (design system tokens in globals.css).

import type { ZoneAllure } from "./paces";
import type { Database } from "./database.types";

type SeanceType = Database["public"]["Enums"]["seance_type"];

export const ZONE_COLORS: Record<ZoneAllure, string> = {
  z1_recup: "var(--color-zone-1)",
  z2_endurance: "var(--color-zone-2)",
  z3_marathon: "var(--color-zone-3)",
  z4_seuil: "var(--color-zone-4)",
  z5_vma: "var(--color-zone-5)",
  z6_anaerobie: "var(--color-zone-6)",
};

/**
 * A séance type's characteristic zone, purely for the calendar's at-a-glance
 * color bar — a séance's actual blocs can target any mix of zones. Types
 * with no natural zone (repos, competition...) get a neutral fallback.
 */
export const SEANCE_TYPE_ZONE: Record<SeanceType, ZoneAllure | null> = {
  endurance: "z2_endurance",
  recuperation: "z1_recup",
  sortie_longue: "z3_marathon",
  allure_specifique: "z3_marathon",
  seuil: "z4_seuil",
  vma: "z5_vma",
  fractionne_court: "z5_vma",
  fractionne_long: "z5_vma",
  cote: "z6_anaerobie",
  renforcement: null,
  cross_training: null,
  repos: null,
  competition: null,
  test: null,
};

export function seanceTypeColor(type: SeanceType): string {
  const zone = SEANCE_TYPE_ZONE[type];
  return zone ? ZONE_COLORS[zone] : "var(--muted-foreground)";
}
