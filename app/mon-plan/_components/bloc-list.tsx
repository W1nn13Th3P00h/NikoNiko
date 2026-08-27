import type { Database } from "@/lib/database.types";
import { BLOC_ROLE_LABELS } from "@/lib/labels";
import {
  ZONE_LABELS,
  formatDurationHMS,
  formatPaceSecondsPerKm,
  getAthletePaceZone,
  type PerformanceReference,
} from "@/lib/paces";

type BlocRow = Database["public"]["Tables"]["bloc_seance"]["Row"];

function formatEffort(bloc: BlocRow): string {
  if (bloc.mode_duree === "distance" && bloc.distance_metres) {
    return bloc.distance_metres >= 1000 && bloc.distance_metres % 1000 === 0
      ? `${bloc.distance_metres / 1000} km`
      : `${bloc.distance_metres} m`;
  }
  if ((bloc.mode_duree === "temps" || bloc.mode_duree === "libre") && bloc.duree_secondes) {
    return formatDurationHMS(bloc.duree_secondes);
  }
  return "Libre";
}

function formatCible(bloc: BlocRow, performances: PerformanceReference[]): string {
  if (bloc.cible_type === "libre") return "";
  if (bloc.cible_type === "rpe") return bloc.cible_rpe ? `RPE ${bloc.cible_rpe}` : "";
  if (bloc.cible_type === "allure_absolue") {
    return bloc.cible_allure_secondes_par_km
      ? formatPaceSecondsPerKm(bloc.cible_allure_secondes_par_km)
      : "";
  }
  if (!bloc.cible_zone) return "";
  const result = getAthletePaceZone(bloc.cible_zone, performances);
  if (!result.available) {
    return `${ZONE_LABELS[bloc.cible_zone]} (ajoute un temps de référence pour voir ton allure)`;
  }
  const { minSecondsPerKm, maxSecondsPerKm } = result.range;
  const paceLabel =
    minSecondsPerKm === null
      ? `< ${formatPaceSecondsPerKm(maxSecondsPerKm)}`
      : `${formatPaceSecondsPerKm(minSecondsPerKm)} – ${formatPaceSecondsPerKm(maxSecondsPerKm)}`;
  return `${ZONE_LABELS[bloc.cible_zone]} · ${paceLabel}`;
}

export function BlocList({
  blocs,
  performances,
}: {
  blocs: BlocRow[];
  performances: PerformanceReference[];
}) {
  const topLevel = [...blocs]
    .filter((b) => b.parent_bloc_id === null)
    .sort((a, b) => a.ordre - b.ordre);
  const childrenOf = (id: string) =>
    [...blocs].filter((b) => b.parent_bloc_id === id).sort((a, b) => a.ordre - b.ordre);

  return (
    <ol className="flex flex-col gap-3">
      {topLevel.map((bloc) => {
        const children = childrenOf(bloc.id);
        return (
          <li key={bloc.id} className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {BLOC_ROLE_LABELS[bloc.role]}
              {bloc.repetitions > 1 ? ` · ${bloc.repetitions}×` : ""}
            </p>
            {children.length > 0 ? (
              <ol className="mt-1.5 flex flex-col gap-2">
                {children.map((child) => (
                  <li key={child.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-bold">{formatEffort(child)}</span>
                    <span className="text-right text-sm">{formatCible(child, performances)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold">{formatEffort(bloc)}</span>
                <span className="text-right text-sm">{formatCible(bloc, performances)}</span>
              </div>
            )}
            {bloc.commentaire && <p className="mt-1 text-sm">{bloc.commentaire}</p>}
          </li>
        );
      })}
    </ol>
  );
}
