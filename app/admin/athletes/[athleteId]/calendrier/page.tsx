import { format } from "date-fns";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { nowInParis } from "@/lib/date";
import { toPerformanceReference } from "@/lib/mappers";
import { getMonthGridWeeks, getWeekGridDays } from "@/lib/calendar-grid";
import { CalendarView } from "./_components/calendar-view";

export default async function AthleteCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ vue?: string; date?: string }>;
}) {
  const { athleteId } = await params;
  const { vue, date } = await searchParams;

  const view = vue === "semaine" ? "semaine" : "mois";
  const referenceDate = date ? new Date(date) : nowInParis();

  const weeks = view === "mois" ? getMonthGridWeeks(referenceDate) : [getWeekGridDays(referenceDate)];
  const gridStart = weeks[0][0];
  const gridEnd = weeks[weeks.length - 1][6];
  const gridStartStr = format(gridStart, "yyyy-MM-dd");
  const gridEndStr = format(gridEnd, "yyyy-MM-dd");

  const supabase = await createClient();

  const [
    { data: athlete },
    { data: allAthletes },
    { data: librarySeances },
    { data: gridSeances },
    { data: performanceRows },
  ] = await Promise.all([
    supabase.from("athlete").select("id, prenom, nom").eq("id", athleteId).single(),
    supabase.from("athlete").select("id, prenom, nom").eq("actif", true).order("nom"),
    supabase.from("seance").select("id, titre, type").eq("est_modele", true).order("titre"),
    supabase
      .from("seance")
      .select("id, titre, type, date_prevue, ordre_dans_journee")
      .eq("athlete_id", athleteId)
      .eq("est_modele", false)
      .gte("date_prevue", gridStartStr)
      .lte("date_prevue", gridEndStr)
      .order("ordre_dans_journee"),
    supabase.from("performance_reference").select("distance, temps_secondes, date_perf, type").eq("athlete_id", athleteId),
  ]);

  if (!athlete) notFound();

  const seanceIds = (gridSeances ?? []).map((s) => s.id);
  const [{ data: blocs }, { data: retours }] = await Promise.all([
    seanceIds.length > 0
      ? supabase.from("bloc_seance").select("*").in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
    seanceIds.length > 0
      ? supabase.from("retour_seance").select("seance_id, rpe, statut").in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <CalendarView
      athlete={athlete}
      allAthletes={allAthletes ?? []}
      librarySeances={librarySeances ?? []}
      weeks={weeks.map((week) => week.map((d) => format(d, "yyyy-MM-dd")))}
      seances={gridSeances ?? []}
      blocs={blocs ?? []}
      retours={retours ?? []}
      performances={(performanceRows ?? []).map(toPerformanceReference)}
      view={view}
      referenceDate={format(referenceDate, "yyyy-MM-dd")}
      today={format(nowInParis(), "yyyy-MM-dd")}
    />
  );
}
