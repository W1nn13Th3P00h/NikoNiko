import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { differenceInCalendarDays } from "date-fns";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "@/app/mon-plan/_lib/current-athlete";
import { BlocList } from "@/app/mon-plan/_components/bloc-list";
import { toBlocSeanceInput, toPerformanceReference } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { nowInParis } from "@/lib/date";
import { RETOUR_STATUT_LABELS, SEANCE_TYPE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { RetourForm } from "./_components/retour-form";

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ seanceId: string }>;
}) {
  const athlete = await getCurrentAthlete();
  if (!athlete) notFound();

  const { seanceId } = await params;
  const supabase = await createClient();

  const [{ data: seance }, { data: blocRows }, { data: performanceRows }, { data: retour }] =
    await Promise.all([
      supabase
        .from("seance")
        .select("*")
        .eq("id", seanceId)
        .eq("athlete_id", athlete.id)
        .eq("est_modele", false)
        .single(),
      supabase.from("bloc_seance").select("*").eq("seance_id", seanceId).order("ordre"),
      supabase
        .from("performance_reference")
        .select("distance, temps_secondes, date_perf, type")
        .eq("athlete_id", athlete.id),
      supabase.from("retour_seance").select("*").eq("seance_id", seanceId).maybeSingle(),
    ]);

  if (!seance) notFound();

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const volume = computeSeanceVolume((blocRows ?? []).map(toBlocSeanceInput), performances);

  const today = nowInParis();
  const todayStr = format(today, "yyyy-MM-dd");
  const isPast = seance.date_prevue !== null && seance.date_prevue <= todayStr;
  const daysSince = seance.date_prevue
    ? differenceInCalendarDays(today, new Date(seance.date_prevue))
    : 0;
  const editable = daysSince <= 7;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{SEANCE_TYPE_LABELS[seance.type]}</Badge>
          {seance.date_prevue && (
            <span className="text-muted-foreground text-sm capitalize">
              {format(new Date(seance.date_prevue), "EEEE dd MMMM", { locale: fr })}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold">{seance.titre}</h1>
        {seance.objectif && <p className="text-lg">{seance.objectif}</p>}
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-3xl font-bold">{volume.distanceKm} km</p>
        <p className="text-muted-foreground">{volume.dureeMinutes} min</p>
        {!volume.estimationComplete && (
          <p className="text-muted-foreground mt-1 text-xs">
            Estimation partielle — ajoute un temps de référence pour affiner.
          </p>
        )}
      </div>

      <BlocList blocs={blocRows ?? []} performances={performances} />

      {seance.consignes && (
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold uppercase">Consignes</h2>
          <p>{seance.consignes}</p>
        </div>
      )}

      {isPast &&
        (editable ? (
          <RetourForm
            seanceId={seance.id}
            athleteId={athlete.id}
            initialStatut={retour?.statut ?? null}
            initialRpe={retour?.rpe ?? null}
            initialCommentaire={retour?.commentaire ?? null}
          />
        ) : retour ? (
          <div className="rounded-lg border p-4">
            <p className="font-medium">Ton retour</p>
            <p>
              {RETOUR_STATUT_LABELS[retour.statut]}
              {retour.rpe ? ` · RPE ${retour.rpe}` : ""}
            </p>
            {retour.commentaire && <p className="text-sm">{retour.commentaire}</p>}
            <p className="text-muted-foreground mt-1 text-xs">
              Non modifiable après 7 jours.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Trop tard pour laisser un retour sur cette séance (plus de 7 jours).
          </p>
        ))}
    </div>
  );
}
