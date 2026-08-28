import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "@/app/mon-plan/_lib/current-athlete";
import { toBlocSeanceInput, toPerformanceReference } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { nowInParis } from "@/lib/date";
import { RetourForm } from "../_components/retour-form";

export default async function RetourSeancePage({
  params,
}: {
  params: Promise<{ seanceId: string }>;
}) {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/login");

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

  if (!seance || !seance.date_prevue) notFound();

  const todayStr = format(nowInParis(), "yyyy-MM-dd");
  if (seance.date_prevue > todayStr) {
    redirect(`/mon-plan/seances/${seanceId}`);
  }

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const volume = computeSeanceVolume((blocRows ?? []).map(toBlocSeanceInput), performances);
  const daysSince = differenceInCalendarDays(parseISO(todayStr), parseISO(seance.date_prevue));
  const editable = daysSince <= 7;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-center gap-1 -mt-1 -ml-2">
        <Link
          href={`/mon-plan/seances/${seanceId}`}
          aria-label="Retour"
          className="flex size-11 items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="text-lg font-bold tracking-tight">Mon retour</span>
      </div>

      <div className="flex items-center gap-3 rounded-[3px] border border-l-4 border-l-primary bg-card px-3.5 py-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">{seance.titre}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {format(parseISO(seance.date_prevue), "EEEE dd MMMM", { locale: fr })} · {volume.distanceKm} km
          </span>
        </div>
      </div>

      {editable || !retour ? (
        <RetourForm
          seanceId={seance.id}
          athleteId={athlete.id}
          dureeMinutesPrevue={volume.dureeMinutes}
          initialStatut={retour?.statut ?? null}
          initialRpe={retour?.rpe ?? null}
          initialCommentaire={retour?.commentaire ?? null}
        />
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <p className="font-semibold">
            {retour.statut === "fait" ? "Faite" : retour.statut === "partiel" ? "En partie" : "Pas faite"}
            {retour.rpe ? ` · RPE ${retour.rpe}` : ""}
          </p>
          {retour.commentaire && <p className="font-serif text-base">{retour.commentaire}</p>}
          <p className="text-xs text-muted-foreground">Non modifiable après 7 jours.</p>
        </div>
      )}
    </div>
  );
}
