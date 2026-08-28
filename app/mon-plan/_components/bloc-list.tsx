import type { BlocDisplayItem } from "@/lib/mappers";
import { BLOC_ROLE_LABELS } from "@/lib/labels";
import {
  ZONE_SHORT_LABELS,
  formatDurationHMS,
  formatPaceSecondsPerKm,
  getAthletePaceZone,
  type PerformanceReference,
} from "@/lib/paces";
import { ZONE_COLORS } from "@/lib/zone-colors";

function formatEffort(bloc: BlocDisplayItem): string {
  if (bloc.modeDuree === "distance" && bloc.distanceMetres) {
    return bloc.distanceMetres >= 1000 && bloc.distanceMetres % 1000 === 0
      ? `${bloc.distanceMetres / 1000} km`
      : `${bloc.distanceMetres} m`;
  }
  if ((bloc.modeDuree === "temps" || bloc.modeDuree === "libre") && bloc.dureeSecondes) {
    return formatDurationHMS(bloc.dureeSecondes);
  }
  return "Libre";
}

function formatCible(bloc: BlocDisplayItem, performances: PerformanceReference[]): string {
  if (bloc.cibleType === "libre") return "";
  if (bloc.cibleType === "rpe") return bloc.cibleRpe ? `RPE ${bloc.cibleRpe}` : "";
  if (bloc.cibleType === "allure_absolue") {
    return bloc.cibleAllureSecondesParKm
      ? formatPaceSecondsPerKm(bloc.cibleAllureSecondesParKm)
      : "";
  }
  if (!bloc.cibleZone) return "";
  const result = getAthletePaceZone(bloc.cibleZone, performances);
  if (!result.available) return "pas de référence";
  const { minSecondsPerKm, maxSecondsPerKm } = result.range;
  return minSecondsPerKm === null
    ? `< ${formatPaceSecondsPerKm(maxSecondsPerKm)}`
    : `${formatPaceSecondsPerKm(minSecondsPerKm)} – ${formatPaceSecondsPerKm(maxSecondsPerKm)}`;
}

function BlocRowView({
  bloc,
  performances,
}: {
  bloc: BlocDisplayItem;
  performances: PerformanceReference[];
}) {
  const bg = bloc.cibleZone ? ZONE_COLORS[bloc.cibleZone] : "var(--muted)";
  const label = `${BLOC_ROLE_LABELS[bloc.role]}${
    bloc.role === "corps" ? "" : ` ${formatEffort(bloc)}`
  }`;

  return (
    <div
      className="flex min-h-14 items-center gap-2.5 rounded-[3px] px-3 py-3"
      style={{ backgroundColor: bg }}
    >
      {bloc.cibleZone && (
        <span className="rounded-[2px] bg-white/60 px-[7px] py-1 text-[10px] font-bold tracking-[0.09em] uppercase">
          {ZONE_SHORT_LABELS[bloc.cibleZone]}
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
  blocs: BlocDisplayItem[];
  performances: PerformanceReference[];
}) {
  const topLevel = blocs.filter((b) => b.parentBlocId === null);
  const childrenOf = (id: string) => blocs.filter((b) => b.parentBlocId === id);

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
