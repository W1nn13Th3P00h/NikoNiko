import { formatDurationHMS } from "@/lib/paces";
import { seanceTypeColor } from "@/lib/zone-colors";
import type { Database } from "@/lib/database.types";

type SeanceType = Database["public"]["Enums"]["seance_type"];

interface RetourInfo {
  rpe: number | null;
  statut: Database["public"]["Enums"]["retour_statut"];
  distance_reelle_metres: number | null;
}

interface VolumeInfo {
  distanceKm: number;
  dureeMinutes: number;
}

interface CompetitionInfo {
  nom: string;
  distance: string;
  objectif_temps_secondes: number | null;
}

/** Formats a training duration as "1 h 05" / "45 min" — mirrors the admin calendar. */
export function formatDurationHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export function SeanceTypeBar({ type }: { type: SeanceType }) {
  return <span className="h-1 rounded-full" style={{ backgroundColor: seanceTypeColor(type) }} />;
}

export function SeanceRpeBadge({ rpe }: { rpe: number | null | undefined }) {
  if (!rpe) return null;
  return (
    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-card text-[10px] font-bold">
      {rpe}
    </span>
  );
}

export function SeanceVolumeLine({
  retour,
  volumeSeance,
}: {
  retour: RetourInfo | undefined;
  volumeSeance: VolumeInfo;
}) {
  const distanceText =
    retour?.statut === "non_fait"
      ? "non fait"
      : retour?.distance_reelle_metres
        ? `${(retour.distance_reelle_metres / 1000).toFixed(1)} / ${volumeSeance.distanceKm} km`
        : `${volumeSeance.distanceKm} km`;

  return (
    <span className="text-muted-foreground font-mono text-xs">
      {distanceText} · {formatDurationHM(volumeSeance.dureeMinutes)}
    </span>
  );
}

export function CompetitionCardBody({ competition }: { competition: CompetitionInfo }) {
  return (
    <>
      <span className="text-[11px] font-bold tracking-[0.09em] uppercase">Compétition</span>
      <span className="text-[13px] font-semibold">{competition.nom}</span>
      <span className="font-mono text-xs opacity-70">{competition.distance}</span>
      {competition.objectif_temps_secondes && (
        <span className="font-mono text-xs opacity-70">
          objectif {formatDurationHMS(competition.objectif_temps_secondes)}
        </span>
      )}
    </>
  );
}
