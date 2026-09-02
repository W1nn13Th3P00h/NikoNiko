import Link from "next/link";
import { differenceInCalendarDays, endOfWeek, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "../_lib/current-athlete";
import { nowInParis } from "@/lib/date";
import { toBlocSeanceInput, toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { SEANCE_TYPE_LABELS, RPE_LABELS } from "@/lib/labels";
import { resolvePaceZones, ZONE_SHORT_LABELS, formatPaceSecondsPerKm, type ZoneAllure } from "@/lib/paces";
import { ZONE_COLORS } from "@/lib/zone-colors";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ZONE_ORDER: ZoneAllure[] = [
  "z1_recup",
  "z2_endurance",
  "z3_marathon",
  "z4_seuil",
  "z5_vma",
  "z6_anaerobie",
];

export default async function DashboardPage() {
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
    { data: competitions },
    { data: weekSeances },
    { data: performanceRows },
    { data: zoneManuelleRows },
    { data: lastRetourRows },
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
      .gte("date", todayStr)
      .order("date"),
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
    supabase
      .from("retour_seance")
      .select("rpe, commentaire, statut, seance:seance_id(id, titre, type, date_prevue)")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const zoneOverrides = toZoneManualOverrides(zoneManuelleRows ?? []);
  const isToday = (todaySeances ?? []).length > 0;
  const featuredSeance = isToday ? todaySeances![0] : (nextSeanceRows ?? [])[0] ?? null;
  const lastRetour = (lastRetourRows ?? [])[0] ?? null;

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

  const paceZones = resolvePaceZones(performances, zoneOverrides);
  const hasAnyZone = ZONE_ORDER.some((zone) => paceZones[zone].range !== null);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">Salut {athlete.prenom} 👋</p>

      {competitions && competitions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {competitions.map((competition) => {
            const daysToCompetition = differenceInCalendarDays(new Date(competition.date), today);
            return (
              <Card key={competition.id} className="shrink-0">
                <CardContent className="py-4">
                  <p className="text-muted-foreground text-sm">{competition.nom}</p>
                  <p className="text-4xl font-bold">
                    {daysToCompetition === 0 ? "Aujourd'hui !" : `J-${daysToCompetition}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
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

      {lastRetour && (
        <div>
          <h2 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">
            Dernière séance
          </h2>
          <Card>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="text-xl font-bold">{lastRetour.seance?.titre}</p>
              {lastRetour.seance?.type && (
                <Badge variant="secondary" className="w-fit">
                  {SEANCE_TYPE_LABELS[lastRetour.seance.type]}
                </Badge>
              )}
              {lastRetour.rpe && (
                <p className="text-muted-foreground">
                  RPE {lastRetour.rpe} · {RPE_LABELS[lastRetour.rpe]}
                </p>
              )}
              {lastRetour.commentaire && <p>{lastRetour.commentaire}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">Mes zones</h2>
        {!hasAnyZone ? (
          <p className="text-muted-foreground text-sm">Aucune performance de référence.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ZONE_ORDER.map((zone) => {
              const pace = paceZones[zone];
              if (!pace.range) return null;
              return (
                <div key={zone} className="flex items-center gap-2">
                  <span className="size-3 rounded-[2px]" style={{ backgroundColor: ZONE_COLORS[zone] }} />
                  <span className="font-mono text-sm">
                    {ZONE_SHORT_LABELS[zone]}{" "}
                    {pace.range.minSecondsPerKm === null
                      ? `< ${formatPaceSecondsPerKm(pace.range.maxSecondsPerKm)}`
                      : `${formatPaceSecondsPerKm(pace.range.minSecondsPerKm)}–${formatPaceSecondsPerKm(pace.range.maxSecondsPerKm)}`}
                    {pace.isManual && " (manuel)"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
