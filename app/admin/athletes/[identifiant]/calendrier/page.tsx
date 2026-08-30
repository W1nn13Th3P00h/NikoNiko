import { format } from "date-fns";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { nowInParis } from "@/lib/date";
import { toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { getMonthGridWeeks, getWeekGridDays } from "@/lib/calendar-grid";
import { CalendarView } from "./_components/calendar-view";

export default async function AthleteCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ identifiant: string }>;
  searchParams: Promise<{ vue?: string; densite?: string; date?: string }>;
}) {
  const { identifiant } = await params;
  const { vue, densite, date } = await searchParams;

  const view = vue === "semaine" ? "semaine" : "mois";
  const density = densite === "compact" ? "compact" : "detaille";
  const referenceDate = date ? new Date(date) : nowInParis();
  const today = format(nowInParis(), "yyyy-MM-dd");

  const weeks = view === "mois" ? getMonthGridWeeks(referenceDate) : [getWeekGridDays(referenceDate)];
  const gridStart = weeks[0][0];
  const gridEnd = weeks[weeks.length - 1][6];
  const gridStartStr = format(gridStart, "yyyy-MM-dd");
  const gridEndStr = format(gridEnd, "yyyy-MM-dd");

  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athlete")
    .select("id, prenom, nom, identifiant")
    .eq("identifiant", identifiant)
    .single();

  if (!athlete) notFound();

  const [
    { data: allAthletes },
    { data: librarySeances },
    { data: gridSeances },
    { data: performanceRows },
    { data: zoneManuelleRows },
    { data: gridCompetitions },
    { data: nextCompetition },
    { data: gridNotes },
  ] = await Promise.all([
    supabase.from("athlete").select("id, prenom, nom, identifiant").eq("actif", true).order("nom"),
    supabase.from("seance").select("id, titre, type").eq("est_modele", true).order("titre"),
    supabase
      .from("seance")
      .select("id, titre, type, date_prevue, ordre_dans_journee")
      .eq("athlete_id", athlete.id)
      .eq("est_modele", false)
      .gte("date_prevue", gridStartStr)
      .lte("date_prevue", gridEndStr)
      .order("ordre_dans_journee"),
    supabase
      .from("performance_reference")
      .select("distance, temps_secondes, date_perf, type")
      .eq("athlete_id", athlete.id),
    supabase
      .from("zone_manuelle")
      .select("zone, allure_min_secondes_par_km, allure_max_secondes_par_km, fc_min_bpm, fc_max_bpm")
      .eq("athlete_id", athlete.id),
    supabase
      .from("competition")
      .select("id, nom, date, distance, objectif_temps_secondes, resultat_temps_secondes, priorite")
      .eq("athlete_id", athlete.id)
      .gte("date", gridStartStr)
      .lte("date", gridEndStr),
    supabase
      .from("competition")
      .select("nom, date, priorite")
      .eq("athlete_id", athlete.id)
      .gte("date", today)
      .order("date")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("note_calendrier")
      .select("id, titre, couleur, contenu, date_debut, date_fin")
      .eq("athlete_id", athlete.id)
      .lte("date_debut", gridEndStr)
      .gte("date_fin", gridStartStr),
  ]);

  const seanceIds = (gridSeances ?? []).map((s) => s.id);
  const [{ data: blocs }, { data: retours }] = await Promise.all([
    seanceIds.length > 0
      ? supabase.from("bloc_seance").select("*").in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
    seanceIds.length > 0
      ? supabase
          .from("retour_seance")
          .select("seance_id, rpe, statut, distance_reelle_metres, duree_reelle_secondes")
          .in("seance_id", seanceIds)
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
      competitions={gridCompetitions ?? []}
      nextCompetition={nextCompetition ?? null}
      notes={gridNotes ?? []}
      performances={(performanceRows ?? []).map(toPerformanceReference)}
      zoneOverrides={toZoneManualOverrides(zoneManuelleRows ?? [])}
      view={view}
      density={density}
      referenceDate={format(referenceDate, "yyyy-MM-dd")}
      today={today}
    />
  );
}
