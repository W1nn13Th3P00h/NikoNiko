import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
import type { Database } from "@/lib/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LibraryFilters } from "./_components/library-filters";
import { NewSeanceButton } from "./_components/new-seance-button";

type SeanceType = Database["public"]["Enums"]["seance_type"];

function isSeanceType(value: string): value is SeanceType {
  return value in SEANCE_TYPE_LABELS;
}

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { type, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("seance")
    .select("id, titre, type, objectif")
    .eq("est_modele", true)
    .order("titre");

  if (type && isSeanceType(type)) query = query.eq("type", type);
  if (q) query = query.ilike("titre", `%${q}%`);

  const { data: seances } = await query;
  const seanceIds = (seances ?? []).map((s) => s.id);

  const { data: blocCounts } =
    seanceIds.length > 0
      ? await supabase.from("bloc_seance").select("seance_id").in("seance_id", seanceIds)
      : { data: [] };

  const countBySeance = new Map<string, number>();
  for (const b of blocCounts ?? []) {
    countBySeance.set(b.seance_id, (countBySeance.get(b.seance_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bibliothèque de séances</h1>
          <p className="text-muted-foreground text-sm">
            Se remplit aussi depuis l&apos;éditeur de séance (case &quot;enregistrer aussi dans la
            bibliothèque&quot;). Clique un titre pour éditer une séance existante.
          </p>
        </div>
        <NewSeanceButton />
      </div>

      <LibraryFilters initialType={type ?? ""} initialQuery={q ?? ""} />

      <div className="flex flex-col gap-2">
        {(seances ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune séance ne correspond.</p>
        ) : (
          (seances ?? []).map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/bibliotheque/${s.id}`} className="font-medium hover:underline">
                      {s.titre}
                    </Link>
                    <Badge variant="secondary">{SEANCE_TYPE_LABELS[s.type]}</Badge>
                  </div>
                  {s.objectif && <p className="text-muted-foreground text-sm">{s.objectif}</p>}
                </div>
                <span className="text-muted-foreground text-sm">
                  {countBySeance.get(s.id) ?? 0} bloc(s)
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
