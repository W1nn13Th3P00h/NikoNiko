import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { toPerformanceReference } from "@/lib/mappers";
import { nowInParis } from "@/lib/date";
import {
  DISTANCE_LABELS,
  PERFORMANCE_TYPE_LABELS,
  ZONE_LABELS,
  computeHeartRateZones,
  computePaceZones,
  computeThresholdPaceSecondsPerKm,
  formatDurationHMS,
  formatPaceSecondsPerKm,
  selectBasePerformance,
  type ZoneAllure,
} from "@/lib/paces";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveAthleteNote } from "./actions";
import { CredentialsForm } from "./_components/credentials-form";

const ZONE_ORDER: ZoneAllure[] = [
  "z1_recup",
  "z2_endurance",
  "z3_marathon",
  "z4_seuil",
  "z5_vma",
  "z6_anaerobie",
];

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const supabase = await createClient();

  const [
    { data: athlete },
    { data: performanceRows },
    { data: competitions },
    { data: note },
  ] = await Promise.all([
    supabase.from("athlete").select("*").eq("id", athleteId).single(),
    supabase
      .from("performance_reference")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("date_perf", { ascending: false }),
    supabase
      .from("competition")
      .select("*")
      .eq("athlete_id", athleteId)
      .gte("date", format(nowInParis(), "yyyy-MM-dd"))
      .order("date"),
    supabase.from("athlete_note").select("contenu").eq("athlete_id", athleteId).maybeSingle(),
  ]);

  if (!athlete) notFound();

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const basePerformance = selectBasePerformance(performances);
  const paceZones = basePerformance
    ? computePaceZones(computeThresholdPaceSecondsPerKm(basePerformance))
    : null;
  const heartRateZones = athlete.fc_max ? computeHeartRateZones(athlete.fc_max) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {athlete.prenom} {athlete.nom}
          </h1>
          <p className="text-muted-foreground text-sm">{athlete.email}</p>
        </div>
        <Link
          href={`/admin/athletes/${athlete.id}/calendrier`}
          className="text-sm underline"
        >
          Voir le calendrier
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Infos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Date de naissance</p>
            <p>{athlete.date_naissance ? format(new Date(athlete.date_naissance), "dd/MM/yyyy") : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">FC max</p>
            <p>{athlete.fc_max ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">FC repos</p>
            <p>{athlete.fc_repos ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Statut</p>
            <p>{athlete.actif ? "Actif" : "Inactif"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performances de référence</CardTitle>
        </CardHeader>
        <CardContent>
          {performances.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune performance renseignée — les zones d&apos;allure ne peuvent pas être calculées.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distance</TableHead>
                  <TableHead>Temps</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(performanceRows ?? []).map((row) => {
                  const isBase =
                    basePerformance?.datePerf === row.date_perf &&
                    basePerformance?.distance === row.distance &&
                    basePerformance?.tempsSecondes === row.temps_secondes;
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{DISTANCE_LABELS[row.distance]}</TableCell>
                      <TableCell>{formatDurationHMS(row.temps_secondes)}</TableCell>
                      <TableCell>{format(new Date(row.date_perf), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{PERFORMANCE_TYPE_LABELS[row.type]}</TableCell>
                      <TableCell>
                        {isBase && <Badge variant="secondary">Référence retenue</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones d&apos;allure et de FC calculées</CardTitle>
        </CardHeader>
        <CardContent>
          {!paceZones ? (
            <p className="text-muted-foreground text-sm">
              Pas de performance de référence : impossible de calculer les zones.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Allure</TableHead>
                  <TableHead>FC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ZONE_ORDER.map((zone) => {
                  const pace = paceZones[zone];
                  const hr = heartRateZones?.[zone];
                  return (
                    <TableRow key={zone}>
                      <TableCell>{ZONE_LABELS[zone]}</TableCell>
                      <TableCell>
                        {pace.minSecondsPerKm === null
                          ? `< ${formatPaceSecondsPerKm(pace.maxSecondsPerKm)}`
                          : `${formatPaceSecondsPerKm(pace.minSecondsPerKm)} – ${formatPaceSecondsPerKm(pace.maxSecondsPerKm)}`}
                      </TableCell>
                      <TableCell>{hr ? `${hr.minBpm} – ${hr.maxBpm} bpm` : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compétitions à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {(competitions ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune compétition à venir.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {(competitions ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span>
                    {c.nom} {c.lieu ? `— ${c.lieu}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(c.date), "dd/MM/yyyy")} ({c.priorite})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connexion par identifiant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Alternative au lien magique par email : utile si l&apos;athlète ne veut pas
            gérer d&apos;email, ou tant que le domaine d&apos;envoi n&apos;est pas vérifié.
          </p>
          <CredentialsForm athleteId={athlete.id} currentIdentifiant={athlete.identifiant} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes (coach uniquement)</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveAthleteNote.bind(null, athleteId)} className="flex flex-col gap-3">
            <Textarea name="contenu" defaultValue={note?.contenu ?? ""} rows={4} />
            <Button type="submit" className="self-start">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
