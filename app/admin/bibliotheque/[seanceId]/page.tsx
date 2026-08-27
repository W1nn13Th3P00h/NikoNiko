import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { blocRowToDraft } from "@/app/admin/_lib/draft";
import { SeanceEditor } from "@/app/admin/_components/seance-editor";

export default async function LibrarySeanceEditorPage({
  params,
}: {
  params: Promise<{ seanceId: string }>;
}) {
  const { seanceId } = await params;
  const supabase = await createClient();

  const [{ data: seance }, { data: blocRows }] = await Promise.all([
    supabase.from("seance").select("*").eq("id", seanceId).eq("est_modele", true).single(),
    supabase.from("bloc_seance").select("*").eq("seance_id", seanceId).order("ordre"),
  ]);

  if (!seance) notFound();

  return (
    <SeanceEditor
      athlete={null}
      seance={seance}
      initialBlocs={(blocRows ?? []).map(blocRowToDraft)}
      performances={[]}
      redirectPath="/admin/bibliotheque"
      allowSaveAsLibraryCopy={false}
    />
  );
}
