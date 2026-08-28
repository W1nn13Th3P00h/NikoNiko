import Link from "next/link";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { createClient } from "@/utils/supabase/server";
import { computeSeanceVolume } from "@/lib/volume";
import { toBlocSeanceInput, toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import type { PerformanceReference, ZoneManualOverrides } from "@/lib/paces";
import { nowInParis } from "@/lib/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RpeBadge } from "./_components/rpe-badge";
import { NewAthleteDialog } from "./_components/new-athlete-dialog";

export default async function AdminAthleteListPage() {
  const supabase = await createClient();

  const now = nowInParis();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const today = format(now, "yyyy-MM-dd");

  const [
    { data: athletes },
    { data: performances },
    { data: zoneManuelles },
    { data: competitions },
    { data: weekSeances },
    { data: retours },
  ] = await Promise.all([
    supabase.from("athlete").select("id, prenom, nom, identifiant").eq("actif", true).order("nom"),
    supabase
      .from("performance_reference")
      .select("athlete_id, distance, temps_secondes, date_perf, type"),
    supabase
      .from("zone_manuelle")
      .select("athlete_id, zone, allure_min_secondes_par_km, allure_max_secondes_par_km, fc_min_bpm, fc_max_bpm"),
    supabase
      .from("competition")
      .select("athlete_id, nom, date, priorite")
      .gte("date", today)
      .order("date"),
    supabase
      .from("seance")
      .select("id, athlete_id")
      .eq("est_modele", false)
      .gte("date_prevue", weekStart)
      .lte("date_prevue", weekEnd),
    supabase
      .from("retour_seance")
      .select("athlete_id, rpe, statut, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const weekSeanceIds = (weekSeances ?? []).map((s) => s.id);
  const { data: weekBlocs } =
    weekSeanceIds.length > 0
      ? await supabase.from("bloc_seance").select("*").in("seance_id", weekSeanceIds)
      : { data: [] };

  const performancesByAthlete = new Map<string, PerformanceReference[]>();
  for (const row of performances ?? []) {
    const list = performancesByAthlete.get(row.athlete_id) ?? [];
    list.push(toPerformanceReference(row));
    performancesByAthlete.set(row.athlete_id, list);
  }

  type ZoneManuelleWithAthlete = NonNullable<typeof zoneManuelles>[number];
  const zoneManuellesByAthlete = new Map<string, ZoneManuelleWithAthlete[]>();
  for (const row of zoneManuelles ?? []) {
    const list = zoneManuellesByAthlete.get(row.athlete_id) ?? [];
    list.push(row);
    zoneManuellesByAthlete.set(row.athlete_id, list);
  }
  const zoneOverridesByAthlete = new Map<string, ZoneManualOverrides>();
  for (const [athleteId, rows] of zoneManuellesByAthlete) {
    zoneOverridesByAthlete.set(athleteId, toZoneManualOverrides(rows));
  }

  const nextCompetitionByAthlete = new Map<
    string,
    { nom: string; date: string; priorite: string }
  >();
  for (const row of competitions ?? []) {
    if (!nextCompetitionByAthlete.has(row.athlete_id)) {
      nextCompetitionByAthlete.set(row.athlete_id, row);
    }
  }

  const lastRetourByAthlete = new Map<
    string,
    { rpe: number | null; statut: string; created_at: string }
  >();
  for (const row of retours ?? []) {
    if (!lastRetourByAthlete.has(row.athlete_id)) {
      lastRetourByAthlete.set(row.athlete_id, row);
    }
  }

  const weekSeanceIdsByAthlete = new Map<string, Set<string>>();
  for (const s of weekSeances ?? []) {
    if (!s.athlete_id) continue;
    const set = weekSeanceIdsByAthlete.get(s.athlete_id) ?? new Set<string>();
    set.add(s.id);
    weekSeanceIdsByAthlete.set(s.athlete_id, set);
  }

  function weeklyVolume(athleteId: string) {
    const overrides = zoneOverridesByAthlete.get(athleteId) ?? {};
    const ids = weekSeanceIdsByAthlete.get(athleteId);
    if (!ids) return computeSeanceVolume([], [], overrides);
    const blocs = (weekBlocs ?? []).filter((b) => ids.has(b.seance_id)).map(toBlocSeanceInput);
    return computeSeanceVolume(blocs, performancesByAthlete.get(athleteId) ?? [], overrides);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Athlètes</h1>
        <NewAthleteDialog />
      </div>

      {(athletes ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun athlète pour l&apos;instant.</p>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prochaine compétition</TableHead>
            <TableHead>Volume semaine en cours</TableHead>
            <TableHead>Dernier retour</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(athletes ?? []).map((athlete) => {
            const nextCompetition = nextCompetitionByAthlete.get(athlete.id);
            const lastRetour = lastRetourByAthlete.get(athlete.id);
            const volume = weeklyVolume(athlete.id);

            return (
              <TableRow key={athlete.id}>
                <TableCell>
                  <Link
                    href={`/admin/athletes/${athlete.identifiant}`}
                    className="font-medium hover:underline"
                  >
                    {athlete.prenom} {athlete.nom}
                  </Link>
                </TableCell>
                <TableCell>
                  {nextCompetition ? (
                    <span>
                      {nextCompetition.nom} — {format(new Date(nextCompetition.date), "dd/MM/yyyy")}{" "}
                      <span className="text-muted-foreground">({nextCompetition.priorite})</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Aucune</span>
                  )}
                </TableCell>
                <TableCell>
                  {volume.distanceKm} km · {volume.dureeMinutes} min
                  {!volume.estimationComplete && (
                    <span className="text-muted-foreground"> (estimation partielle)</span>
                  )}
                </TableCell>
                <TableCell>
                  <RpeBadge rpe={lastRetour?.rpe ?? null} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/athletes/${athlete.identifiant}/calendrier`}
                    className="text-sm hover:underline"
                  >
                    Calendrier
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}
    </div>
  );
}
