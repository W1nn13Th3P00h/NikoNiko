// Display-only colors, no business meaning: a zone's real definition is the
// pace/HR math in lib/paces.ts. Used to color-code the admin calendar and
// library by zone/type at a glance (design system tokens in globals.css).

import type { ZoneAllure } from "./paces";
import type { Database } from "./database.types";
import type { BlocSeanceInput } from "./volume";

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

// RPE 1-10 -> color, same palette as the zones (tokens in globals.css).
// Each var name must appear literally: Tailwind v4 only emits the @theme
// variables it finds in source files, so a template like
// `var(--color-rpe-${n})` leaves every one of them out of the CSS.
const RPE_COLORS = [
  "var(--color-rpe-1)",
  "var(--color-rpe-2)",
  "var(--color-rpe-3)",
  "var(--color-rpe-4)",
  "var(--color-rpe-5)",
  "var(--color-rpe-6)",
  "var(--color-rpe-7)",
  "var(--color-rpe-8)",
  "var(--color-rpe-9)",
  "var(--color-rpe-10)",
] as const;

export function rpeColor(rpe: number): string {
  const level = Math.min(10, Math.max(1, Math.round(rpe)));
  return RPE_COLORS[level - 1];
}

/** Dark text stays readable up to RPE 7; the red/bordeaux end needs white. */
export function rpeTextColor(rpe: number): string {
  return rpe >= 8 ? "#ffffff" : "var(--foreground)";
}

export type ColorableBloc = Pick<BlocSeanceInput, "cibleType" | "cibleZone"> & {
  cibleRpe: number | null;
};

export function blocColor(bloc: ColorableBloc): string {
  if (bloc.cibleZone) return ZONE_COLORS[bloc.cibleZone];
  if (bloc.cibleType === "rpe" && bloc.cibleRpe !== null) return rpeColor(bloc.cibleRpe);
  return "var(--muted)";
}
