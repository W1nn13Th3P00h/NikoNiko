import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { toPerformanceReference } from "@/lib/mappers";
import { blocRowToDraft } from "./_lib/draft";
import { SeanceEditor } from "./_components/seance-editor";

export default async function SeanceEditorPage({
  params,
}: {
  params: Promise<{ athleteId: string; seanceId: string }>;
}) {
  const { athleteId, seanceId } = await params;
  const supabase = await createClient();

  const [{ data: athlete }, { data: seance }, { data: blocRows }, { data: performanceRows }] =
    await Promise.all([
      supabase.from("athlete").select("id, prenom, nom").eq("id", athleteId).single(),
      supabase
        .from("seance")
        .select("*")
        .eq("id", seanceId)
        .eq("athlete_id", athleteId)
        .eq("est_modele", false)
        .single(),
      supabase.from("bloc_seance").select("*").eq("seance_id", seanceId).order("ordre"),
      supabase
        .from("performance_reference")
        .select("distance, temps_secondes, date_perf, type")
        .eq("athlete_id", athleteId),
    ]);

  if (!athlete || !seance) notFound();

  return (
    <SeanceEditor
      athlete={athlete}
      seance={seance}
      initialBlocs={(blocRows ?? []).map(blocRowToDraft)}
      performances={(performanceRows ?? []).map(toPerformanceReference)}
    />
  );
}
