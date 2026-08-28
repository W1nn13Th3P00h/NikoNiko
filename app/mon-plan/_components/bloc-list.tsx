import type { Database } from "@/lib/database.types";
import { BLOC_ROLE_LABELS } from "@/lib/labels";
import {
  ZONE_SHORT_LABELS,
  formatDurationHMS,
  formatPaceSecondsPerKm,
  getAthletePaceZone,
  type PerformanceReference,
} from "@/lib/paces";
import { ZONE_COLORS } from "@/lib/zone-colors";

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
  if (!result.available) return "pas de référence";
  const { minSecondsPerKm, maxSecondsPerKm } = result.range;
  return minSecondsPerKm === null
    ? `< ${formatPaceSecondsPerKm(maxSecondsPerKm)}`
    : `${formatPaceSecondsPerKm(minSecondsPerKm)} – ${formatPaceSecondsPerKm(maxSecondsPerKm)}`;
}

function BlocRowView({ bloc, performances }: { bloc: BlocRow; performances: PerformanceReference[] }) {
  const bg = bloc.cible_zone ? ZONE_COLORS[bloc.cible_zone] : "var(--muted)";
  const label = `${BLOC_ROLE_LABELS[bloc.role]}${
    bloc.role === "corps" ? "" : ` ${formatEffort(bloc)}`
  }`;

  return (
    <div
      className="flex min-h-14 items-center gap-2.5 rounded-[3px] px-3 py-3"
      style={{ backgroundColor: bg }}
    >
      {bloc.cible_zone && (
        <span className="rounded-[2px] bg-white/60 px-[7px] py-1 text-[10px] font-bold tracking-[0.09em] uppercase">
          {ZONE_SHORT_LABELS[bloc.cible_zone]}
        </span>
      )}
      <span className="flex-1 text-base font-semibold">
        {bloc.role === "corps" ? formatEffort(bloc) : label}
      </span>
      <span className="font-mono text-sm font-medium tabular-nums">
        {formatCible(bloc, performances)}
      </span>
    </div>
  );
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
    <div className="flex flex-col gap-1.5">
      {topLevel.map((bloc) => {
        const children = childrenOf(bloc.id);
        if (children.length === 0) {
          return (
            <div key={bloc.id}>
              <BlocRowView bloc={bloc} performances={performances} />
              {bloc.commentaire && <p className="mt-1 text-sm">{bloc.commentaire}</p>}
            </div>
          );
        }
        return (
          <div key={bloc.id} className="mt-1.5 flex flex-col gap-1.5 border-l-[3px] pl-2.5">
            <p className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
              {bloc.repetitions} × répétitions
            </p>
            {children.map((child) => (
              <div key={child.id}>
                <BlocRowView bloc={child} performances={performances} />
                {child.commentaire && <p className="mt-1 text-sm">{child.commentaire}</p>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
