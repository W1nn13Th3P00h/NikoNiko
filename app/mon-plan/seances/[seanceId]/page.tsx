import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "@/app/mon-plan/_lib/current-athlete";
import { BlocList } from "@/app/mon-plan/_components/bloc-list";
import { ProfileBar } from "@/components/profile-bar";
import { toBlocDisplayItem, toBlocSeanceInput, toPerformanceReference } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { computeProfileSegments } from "@/lib/profile-bar";
import { computeCharge } from "@/lib/charge";
import { nowInParis } from "@/lib/date";
import { Button } from "@/components/ui/button";

export default async function SeanceDetailPage({
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

  if (!seance) notFound();

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const blocInputs = (blocRows ?? []).map(toBlocSeanceInput);
  const volume = computeSeanceVolume(blocInputs, performances);
  const segments = computeProfileSegments(blocInputs, performances);
  const charge = retour?.rpe ? computeCharge(volume.dureeMinutes, retour.rpe) : null;

  const todayStr = format(nowInParis(), "yyyy-MM-dd");
  const isPast = seance.date_prevue !== null && seance.date_prevue <= todayStr;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1 -mt-1 -ml-2">
        <Link href="/mon-plan/calendrier" aria-label="Retour" className="flex size-11 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        {seance.date_prevue && (
          <span className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
            {format(new Date(seance.date_prevue), "EEEE dd MMMM", { locale: fr })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-[34px] leading-[1.05] font-bold tracking-tight">{seance.titre}</h1>
        <p className="font-mono text-sm font-medium text-[#3D4B50]">
          {volume.distanceKm} km · {volume.dureeMinutes} min
          {charge !== null ? ` · charge estimée ${charge}` : ""}
        </p>
      </div>

      <ProfileBar segments={segments} />

      <BlocList blocs={(blocRows ?? []).map(toBlocDisplayItem)} performances={performances} />

      {!volume.estimationComplete && (
        <p className="text-muted-foreground text-xs">
          Estimation partielle — ajoute un temps de référence pour affiner.
        </p>
      )}

      {seance.objectif && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-1 text-xs font-bold tracking-[0.09em] text-muted-foreground uppercase">
            Objectif
          </h2>
          <p className="font-serif text-base text-[#3D4B50]">{seance.objectif}</p>
        </div>
      )}

      {seance.consignes && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-1 text-xs font-bold tracking-[0.09em] text-muted-foreground uppercase">
            Consignes du coach
          </h2>
          <p className="font-serif text-base text-[#3D4B50]">{seance.consignes}</p>
        </div>
      )}

      {isPast && (
        <Link href={`/mon-plan/seances/${seance.id}/retour`}>
          <Button className="w-full" size="lg" variant={retour ? "outline" : "default"}>
            {retour ? "Voir mon retour" : "Laisser un retour"}
          </Button>
        </Link>
      )}
    </div>
  );
}
