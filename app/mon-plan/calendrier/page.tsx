import Link from "next/link";
import { addDays, addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "@/app/mon-plan/_lib/current-athlete";
import { getMonthGridWeeks, getWeekGridDays } from "@/lib/calendar-grid";
import { nowInParis } from "@/lib/date";
import { toBlocSeanceInput, toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";

export default async function AthleteCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/login");

  const { date } = await searchParams;
  const supabase = await createClient();
  const referenceDate = date ? new Date(date) : nowInParis();
  const today = format(nowInParis(), "yyyy-MM-dd");

  const monthWeeks = getMonthGridWeeks(referenceDate);
  const weekDays = getWeekGridDays(referenceDate);
  const gridStart = format(monthWeeks[0][0], "yyyy-MM-dd");
  const gridEnd = format(monthWeeks[monthWeeks.length - 1][6], "yyyy-MM-dd");

  const [{ data: seances }, { data: performanceRows }, { data: zoneManuelleRows }] = await Promise.all([
    supabase
      .from("seance")
      .select("id, titre, type, date_prevue")
      .eq("athlete_id", athlete.id)
      .eq("est_modele", false)
      .gte("date_prevue", gridStart)
      .lte("date_prevue", gridEnd)
      .order("ordre_dans_journee"),
    supabase
      .from("performance_reference")
      .select("distance, temps_secondes, date_perf, type")
      .eq("athlete_id", athlete.id),
    supabase
      .from("zone_manuelle")
      .select("zone, allure_min_secondes_par_km, allure_max_secondes_par_km, fc_min_bpm, fc_max_bpm")
      .eq("athlete_id", athlete.id),
  ]);

  const seanceIds = (seances ?? []).map((s) => s.id);
  const [{ data: blocs }, { data: retours }] = await Promise.all([
    seanceIds.length > 0
      ? supabase.from("bloc_seance").select("*").in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
    seanceIds.length > 0
      ? supabase.from("retour_seance").select("seance_id, statut").in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const zoneOverrides = toZoneManualOverrides(zoneManuelleRows ?? []);
  const retourBySeanceId = new Map((retours ?? []).map((r) => [r.seance_id, r.statut]));
  const blocsBySeanceId = new Map<string, typeof blocs>();
  for (const b of blocs ?? []) {
    const list = blocsBySeanceId.get(b.seance_id) ?? [];
    list.push(b);
    blocsBySeanceId.set(b.seance_id, list);
  }
  const seancesByDay = new Map<string, NonNullable<typeof seances>>();
  for (const s of seances ?? []) {
    if (!s.date_prevue) continue;
    const list = seancesByDay.get(s.date_prevue) ?? [];
    list.push(s);
    seancesByDay.set(s.date_prevue, list);
  }

  const prevWeekHref = `?date=${format(addDays(referenceDate, -7), "yyyy-MM-dd")}`;
  const nextWeekHref = `?date=${format(addDays(referenceDate, 7), "yyyy-MM-dd")}`;
  const prevMonthHref = `?date=${format(addMonths(referenceDate, -1), "yyyy-MM-dd")}`;
  const nextMonthHref = `?date=${format(addMonths(referenceDate, 1), "yyyy-MM-dd")}`;

  function daySummary(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    const daySeances = seancesByDay.get(dayStr) ?? [];
    return { dayStr, daySeances };
  }

  const STATUT_GLYPH: Record<string, string> = { fait: "✓", partiel: "◐", non_fait: "✗" };
  const STATUT_LABEL: Record<string, string> = { fait: "faite", partiel: "en partie", non_fait: "non faite" };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Calendrier</h1>

      {/* Mobile: single week, vertical list */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between">
          <Link href={prevWeekHref} className="text-sm underline">
            ← Semaine préc.
          </Link>
          <Link href={`?date=${today}`} className="text-sm underline">
            Aujourd&apos;hui
          </Link>
          <Link href={nextWeekHref} className="text-sm underline">
            Semaine suiv. →
          </Link>
        </div>

        {weekDays.map((day) => {
          const { dayStr, daySeances } = daySummary(day);
          return (
            <div
              key={dayStr}
              className={`rounded-lg border p-3 ${dayStr === today ? "border-primary" : ""}`}
            >
              <p className="text-muted-foreground text-xs font-medium capitalize">
                {format(day, "EEEE dd MMMM", { locale: fr })}
              </p>
              {daySeances.length === 0 ? (
                <p className="text-muted-foreground text-sm">Repos</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-2">
                  {daySeances.map((s) => {
                    const seanceBlocs = (blocsBySeanceId.get(s.id) ?? []).map(toBlocSeanceInput);
                    const volume = computeSeanceVolume(seanceBlocs, performances, zoneOverrides);
                    const statut = retourBySeanceId.get(s.id);
                    return (
                      <li key={s.id}>
                        <Link href={`/mon-plan/seances/${s.id}`} className="flex flex-col">
                          <span className="font-semibold">{s.titre}</span>
                          <span className="text-muted-foreground text-sm">
                            {SEANCE_TYPE_LABELS[s.type]} · {volume.distanceKm} km
                            {statut && (
                              <>
                                {" · "}
                                <span aria-hidden="true">{STATUT_GLYPH[statut]}</span>
                                <span className="sr-only">{STATUT_LABEL[statut]}</span>
                              </>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: full month grid */}
      <div className="hidden md:flex md:flex-col md:gap-2">
        <div className="flex items-center justify-between">
          <Link href={prevMonthHref} className="text-sm underline">
            ← Mois préc.
          </Link>
          <p className="font-medium capitalize">{format(referenceDate, "MMMM yyyy", { locale: fr })}</p>
          <Link href={nextMonthHref} className="text-sm underline">
            Mois suiv. →
          </Link>
        </div>

        {monthWeeks.map((week) => (
          <div key={format(week[0], "yyyy-MM-dd")} className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const { dayStr, daySeances } = daySummary(day);
              const inCurrentMonth = format(day, "yyyy-MM") === format(referenceDate, "yyyy-MM");
              return (
                <div
                  key={dayStr}
                  className={`flex min-h-24 flex-col gap-1 rounded-md border p-2 ${
                    dayStr === today ? "border-primary" : ""
                  } ${inCurrentMonth ? "" : "opacity-50"}`}
                >
                  <p className="text-muted-foreground text-xs">{format(day, "dd/MM")}</p>
                  {daySeances.map((s) => {
                    const statut = retourBySeanceId.get(s.id);
                    return (
                      <Link
                        key={s.id}
                        href={`/mon-plan/seances/${s.id}`}
                        className="flex items-center gap-1 rounded bg-muted/50 px-1 py-0.5 text-xs"
                      >
                        <span className="truncate font-medium">{s.titre}</span>
                        {statut && (
                          <>
                            <span aria-hidden="true" className="shrink-0">
                              {STATUT_GLYPH[statut]}
                            </span>
                            <span className="sr-only">{STATUT_LABEL[statut]}</span>
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
