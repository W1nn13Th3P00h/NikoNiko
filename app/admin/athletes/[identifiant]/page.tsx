import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { nowInParis } from "@/lib/date";
import {
  DISTANCE_LABELS,
  PERFORMANCE_TYPE_LABELS,
  ZONE_LABELS,
  formatDurationHMS,
  formatPaceSecondsPerKm,
  resolveHeartRateZones,
  resolvePaceZones,
  selectBasePerformance,
  type ZoneAllure,
} from "@/lib/paces";
import {
  Card,
  CardAction,
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
import {
  saveAthleteNote,
  createPerformance,
  updatePerformance,
  deletePerformance,
  createCompetition,
  updateCompetition,
  deleteCompetition,
} from "./actions";
import { CredentialsForm } from "./_components/credentials-form";
import { AthleteInfoForm } from "./_components/athlete-info-form";
import { PerformanceDialog } from "@/components/performance-dialog";
import { CompetitionDialog } from "@/components/competition-dialog";
import { ZoneManuelleDialog } from "./_components/zone-manuelle-dialog";
import { DeleteRowButton } from "./_components/delete-row-button";

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
  params: Promise<{ identifiant: string }>;
}) {
  const { identifiant } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athlete")
    .select("*")
    .eq("identifiant", identifiant)
    .single();

  if (!athlete) notFound();

  const [{ data: performanceRows }, { data: zoneManuelleRows }, { data: competitions }, { data: note }] =
    await Promise.all([
      supabase
        .from("performance_reference")
        .select("*")
        .eq("athlete_id", athlete.id)
        .order("date_perf", { ascending: false }),
      supabase.from("zone_manuelle").select("*").eq("athlete_id", athlete.id),
      supabase
        .from("competition")
        .select("*")
        .eq("athlete_id", athlete.id)
        .gte("date", format(nowInParis(), "yyyy-MM-dd"))
        .order("date"),
      supabase.from("athlete_note").select("contenu").eq("athlete_id", athlete.id).maybeSingle(),
    ]);

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const basePerformance = selectBasePerformance(performances);
  const zoneOverrides = toZoneManualOverrides(zoneManuelleRows ?? []);
  const paceZones = resolvePaceZones(performances, zoneOverrides);
  const heartRateZones = resolveHeartRateZones(athlete.fc_max, zoneOverrides);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {athlete.prenom} {athlete.nom}
          </h1>
          <p className="text-muted-foreground text-sm">{athlete.email ?? "Pas d'email renseigné"}</p>
        </div>
        <Link
          href={`/admin/athletes/${athlete.identifiant}/calendrier`}
          className="text-sm underline"
        >
          Voir le calendrier
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Infos</CardTitle>
        </CardHeader>
        <CardContent>
          <AthleteInfoForm
            athleteId={athlete.id}
            initial={{
              prenom: athlete.prenom,
              nom: athlete.nom,
              email: athlete.email,
              dateNaissance: athlete.date_naissance,
              fcMax: athlete.fc_max,
              fcRepos: athlete.fc_repos,
              actif: athlete.actif,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performances de référence</CardTitle>
          <CardAction>
            <PerformanceDialog
              athleteId={athlete.id}
              trigger={<Button size="sm">+ Ajouter</Button>}
              onCreate={createPerformance}
              onUpdate={updatePerformance}
              onDelete={deletePerformance}
            />
          </CardAction>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PerformanceDialog
                            athleteId={athlete.id}
                            existing={{
                              id: row.id,
                              distance: row.distance,
                              tempsSecondes: row.temps_secondes,
                              datePerf: row.date_perf,
                              type: row.type,
                            }}
                            onCreate={createPerformance}
                            onUpdate={updatePerformance}
                            onDelete={deletePerformance}
                            trigger={
                              <Button variant="ghost" size="sm">
                                Éditer
                              </Button>
                            }
                          />
                          <DeleteRowButton
                            kind="performance"
                            athleteId={athlete.id}
                            id={row.id}
                            confirmMessage="Supprimer cette performance ?"
                          />
                        </div>
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
          <CardTitle>Zones d&apos;allure et de FC</CardTitle>
        </CardHeader>
        <CardContent>
          {!basePerformance && !athlete.fc_max && (
            <p className="text-muted-foreground mb-3 text-sm">
              Pas de performance de référence ni de FC max : les zones ne peuvent être que
              saisies à la main, zone par zone.
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Allure</TableHead>
                <TableHead>FC</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ZONE_ORDER.map((zone) => {
                const pace = paceZones[zone];
                const hr = heartRateZones[zone];
                const manuelleRow = (zoneManuelleRows ?? []).find((r) => r.zone === zone);
                return (
                  <TableRow key={zone}>
                    <TableCell>
                      {ZONE_LABELS[zone]}
                      {(pace.isManual || hr.isManual) && (
                        <Badge variant="secondary" className="ml-2">
                          Manuel
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!pace.range
                        ? "—"
                        : pace.range.minSecondsPerKm === null
                          ? `< ${formatPaceSecondsPerKm(pace.range.maxSecondsPerKm)}`
                          : `${formatPaceSecondsPerKm(pace.range.minSecondsPerKm)} – ${formatPaceSecondsPerKm(pace.range.maxSecondsPerKm)}`}
                    </TableCell>
                    <TableCell>{hr.range ? `${hr.range.minBpm} – ${hr.range.maxBpm} bpm` : "—"}</TableCell>
                    <TableCell>
                      <ZoneManuelleDialog
                        athleteId={athlete.id}
                        zone={zone}
                        existing={
                          manuelleRow
                            ? {
                                paceMinSecondesParKm: manuelleRow.allure_min_secondes_par_km,
                                paceMaxSecondesParKm: manuelleRow.allure_max_secondes_par_km,
                                fcMinBpm: manuelleRow.fc_min_bpm,
                                fcMaxBpm: manuelleRow.fc_max_bpm,
                              }
                            : undefined
                        }
                        trigger={
                          <Button variant="ghost" size="sm">
                            {manuelleRow ? "Éditer" : "Saisir à la main"}
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compétitions à venir</CardTitle>
          <CardAction>
            <CompetitionDialog
              athleteId={athlete.id}
              trigger={<Button size="sm">+ Ajouter</Button>}
              onCreate={createCompetition}
              onUpdate={updateCompetition}
              onDelete={deleteCompetition}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          {(competitions ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune compétition à venir.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {(competitions ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <span>
                    {c.nom} — {c.distance}
                    {c.denivele_metres_dplus ? ` (D+${c.denivele_metres_dplus}m)` : ""}
                    {c.lieu ? ` — ${c.lieu}` : ""}
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {format(new Date(c.date), "dd/MM/yyyy")} ({c.priorite})
                    <CompetitionDialog
                      athleteId={athlete.id}
                      existing={{
                        id: c.id,
                        nom: c.nom,
                        date: c.date,
                        lieu: c.lieu,
                        distance: c.distance,
                        deniveleMetresDplus: c.denivele_metres_dplus,
                        objectifTempsSecondes: c.objectif_temps_secondes,
                        objectifTexte: c.objectif_texte,
                        priorite: c.priorite,
                      }}
                      onCreate={createCompetition}
                      onUpdate={updateCompetition}
                      onDelete={deleteCompetition}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Éditer
                        </Button>
                      }
                    />
                    <DeleteRowButton
                      kind="competition"
                      athleteId={athlete.id}
                      id={c.id}
                      confirmMessage={`Supprimer la compétition « ${c.nom} » ?`}
                    />
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
          <form action={saveAthleteNote.bind(null, athlete.id)} className="flex flex-col gap-3">
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
