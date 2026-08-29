import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { blocRowToDraft } from "@/app/admin/_lib/draft";
import { SeanceEditor } from "@/app/admin/_components/seance-editor";

export default async function SeanceEditorPage({
  params,
}: {
  params: Promise<{ identifiant: string; seanceId: string }>;
}) {
  const { identifiant, seanceId } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athlete")
    .select("id, prenom, nom")
    .eq("identifiant", identifiant)
    .single();

  if (!athlete) notFound();

  const [{ data: seance }, { data: blocRows }, { data: performanceRows }, { data: zoneManuelleRows }, { data: retour }] =
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
      supabase
        .from("zone_manuelle")
        .select("zone, allure_min_secondes_par_km, allure_max_secondes_par_km, fc_min_bpm, fc_max_bpm")
        .eq("athlete_id", athlete.id),
      supabase.from("retour_seance").select("*").eq("seance_id", seanceId).maybeSingle(),
    ]);

  if (!seance) notFound();

  return (
    <SeanceEditor
      athlete={athlete}
      seance={seance}
      initialBlocs={(blocRows ?? []).map(blocRowToDraft)}
      performances={(performanceRows ?? []).map(toPerformanceReference)}
      zoneOverrides={toZoneManualOverrides(zoneManuelleRows ?? [])}
      redirectPath={`/admin/athletes/${identifiant}/calendrier`}
      allowSaveAsLibraryCopy
      retour={retour ?? null}
    />
  );
}
