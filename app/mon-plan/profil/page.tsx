import { format } from "date-fns";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "../_lib/current-athlete";
import { DISTANCE_LABELS, PERFORMANCE_TYPE_LABELS, formatDurationHMS } from "@/lib/paces";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompetitionDialog } from "@/components/competition-dialog";
import { PerformanceDialog } from "@/components/performance-dialog";
import { signOut } from "@/app/actions/auth";
import { ProfileForm, PasswordForm } from "./_components/profile-form";
import { MessagePanel } from "./_components/message-panel";
import {
  createOwnCompetition,
  updateOwnCompetition,
  deleteOwnCompetition,
  createOwnPerformance,
  updateOwnPerformance,
  deleteOwnPerformance,
} from "./actions";

export default async function ProfilPage() {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/login");

  const supabase = await createClient();
  const [{ data: competitions }, { data: performances }, { data: messages }] = await Promise.all([
    supabase.from("competition").select("*").eq("athlete_id", athlete.id).order("date"),
    supabase
      .from("performance_reference")
      .select("*")
      .eq("athlete_id", athlete.id)
      .order("date_perf", { ascending: false }),
    supabase
      .from("message_athlete")
      .select("id, expediteur, contenu, created_at")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Profil</h1>

      <ProfileForm
        initial={{ prenom: athlete.prenom, nom: athlete.nom, dateNaissance: athlete.date_naissance }}
      />

      <PasswordForm />

      <Card>
        <CardHeader>
          <CardTitle>Mes compétitions</CardTitle>
          <CardAction>
            <CompetitionDialog
              athleteId={athlete.id}
              trigger={<Button size="sm">+ Ajouter</Button>}
              onCreate={createOwnCompetition}
              onUpdate={updateOwnCompetition}
              onDelete={deleteOwnCompetition}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          {(competitions ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune compétition renseignée.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {(competitions ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <span>
                    {c.nom} — {c.distance}
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
                      onCreate={createOwnCompetition}
                      onUpdate={updateOwnCompetition}
                      onDelete={deleteOwnCompetition}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Éditer
                        </Button>
                      }
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
          <CardTitle>Mes performances de référence</CardTitle>
          <CardAction>
            <PerformanceDialog
              athleteId={athlete.id}
              trigger={<Button size="sm">+ Ajouter</Button>}
              onCreate={createOwnPerformance}
              onUpdate={updateOwnPerformance}
              onDelete={deleteOwnPerformance}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          {(performances ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune performance renseignée — vos zones d&apos;allure ne peuvent pas être calculées.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {(performances ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span>
                    {DISTANCE_LABELS[p.distance]} — {formatDurationHMS(p.temps_secondes)} —{" "}
                    {PERFORMANCE_TYPE_LABELS[p.type]}
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {format(new Date(p.date_perf), "dd/MM/yyyy")}
                    <PerformanceDialog
                      athleteId={athlete.id}
                      existing={{
                        id: p.id,
                        distance: p.distance,
                        tempsSecondes: p.temps_secondes,
                        datePerf: p.date_perf,
                        type: p.type,
                      }}
                      onCreate={createOwnPerformance}
                      onUpdate={updateOwnPerformance}
                      onDelete={deleteOwnPerformance}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Éditer
                        </Button>
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <MessagePanel messages={messages ?? []} />

      <form action={signOut}>
        <Button type="submit" variant="outline" className="self-start">
          Déconnexion
        </Button>
      </form>
    </div>
  );
}
