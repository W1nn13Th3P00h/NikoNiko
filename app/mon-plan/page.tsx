import Link from "next/link";
import { differenceInCalendarDays, endOfWeek, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "./_lib/current-athlete";
import { nowInParis } from "@/lib/date";
import { toBlocSeanceInput, toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function MonPlanHomePage() {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/login");

  const supabase = await createClient();
  const today = nowInParis();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [
    { data: todaySeances },
    { data: nextSeanceRows },
    { data: competitionA },
    { data: weekSeances },
    { data: performanceRows },
    { data: zoneManuelleRows },
  ] = await Promise.all([
    supabase
      .from("seance")
      .select("*")
      .eq("athlete_id", athlete.id)
      .eq("est_modele", false)
      .eq("date_prevue", todayStr),
    supabase
      .from("seance")
      .select("*")
      .eq("athlete_id", athlete.id)
      .eq("est_modele", false)
      .gt("date_prevue", todayStr)
      .order("date_prevue")
      .limit(1),
    supabase
      .from("competition")
      .select("*")
      .eq("athlete_id", athlete.id)
      .eq("priorite", "A")
      .gte("date", todayStr)
      .order("date")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("seance")
      .select("id, date_prevue")
      .eq("athlete_id", athlete.id)
      .eq("est_modele", false)
      .gte("date_prevue", weekStart)
      .lte("date_prevue", weekEnd),
    supabase
      .from("performance_reference")
      .select("distance, temps_secondes, date_perf, type")
      .eq("athlete_id", athlete.id),
    supabase
      .from("zone_manuelle")
      .select("zone, allure_min_secondes_par_km, allure_max_secondes_par_km, fc_min_bpm, fc_max_bpm")
      .eq("athlete_id", athlete.id),
  ]);

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const zoneOverrides = toZoneManualOverrides(zoneManuelleRows ?? []);
  const isToday = (todaySeances ?? []).length > 0;
  const featuredSeance = isToday ? todaySeances![0] : (nextSeanceRows ?? [])[0] ?? null;

  let featuredVolume = null;
  if (featuredSeance) {
    const { data: blocs } = await supabase
      .from("bloc_seance")
      .select("*")
      .eq("seance_id", featuredSeance.id);
    featuredVolume = computeSeanceVolume((blocs ?? []).map(toBlocSeanceInput), performances, zoneOverrides);
  }

  const weekSeanceIds = (weekSeances ?? []).map((s) => s.id);
  const { data: weekBlocs } =
    weekSeanceIds.length > 0
      ? await supabase.from("bloc_seance").select("*").in("seance_id", weekSeanceIds)
      : { data: [] };
  const weekVolume = computeSeanceVolume((weekBlocs ?? []).map(toBlocSeanceInput), performances, zoneOverrides);

  const daysToCompetition = competitionA
    ? differenceInCalendarDays(new Date(competitionA.date), today)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">Salut {athlete.prenom} 👋</p>

      {competitionA && daysToCompetition !== null && (
        <Card>
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm">{competitionA.nom}</p>
            <p className="text-4xl font-bold">
              {daysToCompetition === 0 ? "Aujourd'hui !" : `J-${daysToCompetition}`}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">
          {isToday ? "Séance du jour" : "Prochaine séance"}
        </h2>
        {featuredSeance ? (
          <Link href={`/mon-plan/seances/${featuredSeance.id}`}>
            <Card>
              <CardContent className="flex flex-col gap-1 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{SEANCE_TYPE_LABELS[featuredSeance.type]}</Badge>
                  {!isToday && featuredSeance.date_prevue && (
                    <span className="text-muted-foreground text-sm capitalize">
                      {format(new Date(featuredSeance.date_prevue), "EEEE dd MMMM", { locale: fr })}
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold">{featuredSeance.titre}</p>
                {featuredSeance.objectif && <p>{featuredSeance.objectif}</p>}
                {featuredVolume && (
                  <p className="text-muted-foreground">
                    {featuredVolume.distanceKm} km · {featuredVolume.dureeMinutes} min
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ) : (
          <p className="text-muted-foreground text-sm">Repos — rien de prévu.</p>
        )}
      </div>

      <div>
        <h2 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">
          Cette semaine
        </h2>
        <p className="text-2xl font-bold">
          {weekVolume.distanceKm} km · {weekVolume.dureeMinutes} min
        </p>
      </div>
    </div>
  );
}
