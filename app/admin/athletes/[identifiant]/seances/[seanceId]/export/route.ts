import { createClient } from "@/utils/supabase/server";
import { buildFitWorkout, seanceExportFilename, seanceIsExportable } from "@/lib/fit-export";
import { toBlocDisplayItem, toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifiant: string; seanceId: string }> }
) {
  const { identifiant, seanceId } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athlete")
    .select("id, fc_max")
    .eq("identifiant", identifiant)
    .single();
  if (!athlete) return new Response(null, { status: 404 });

  const [{ data: seance }, { data: blocRows }, { data: performanceRows }, { data: zoneManuelleRows }] = await Promise.all([
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
  ]);

  if (!seance) return new Response(null, { status: 404 });

  const blocs = (blocRows ?? []).map(toBlocDisplayItem);
  if (!seanceIsExportable(blocs)) return new Response(null, { status: 404 });

  const fitFile = buildFitWorkout({
    titre: seance.titre,
    datePrevue: seance.date_prevue,
    type: seance.type,
    blocs,
    performances: (performanceRows ?? []).map(toPerformanceReference),
    zoneOverrides: toZoneManualOverrides(zoneManuelleRows ?? []),
    fcMax: athlete.fc_max,
  });

  return new Response(Buffer.from(fitFile), {
    headers: {
      "Content-Type": "application/vnd.ant.fit",
      "Content-Disposition": `attachment; filename="${seanceExportFilename({ titre: seance.titre, datePrevue: seance.date_prevue })}"`,
    },
  });
}
