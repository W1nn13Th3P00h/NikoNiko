import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/utils/supabase/server";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
import { Card, CardContent } from "@/components/ui/card";
import { RpeBadge } from "../_components/rpe-badge";

const STATUT_LABELS = {
  fait: "Fait",
  partiel: "Partiel",
  non_fait: "Non fait",
} as const;

export default async function RetoursPage() {
  const supabase = await createClient();

  const { data: retours } = await supabase
    .from("retour_seance")
    .select(
      "id, statut, rpe, commentaire, duree_reelle_secondes, distance_reelle_metres, created_at, athlete:athlete_id(prenom, nom), seance:seance_id(titre, type, date_prevue)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Retours</h1>

      <div className="flex flex-col gap-2">
        {(retours ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun retour pour l&apos;instant.</p>
        ) : (
          (retours ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-1 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {r.athlete?.prenom} {r.athlete?.nom} — {r.seance?.titre}
                  </span>
                  <RpeBadge rpe={r.rpe} />
                </div>
                <p className="text-muted-foreground text-sm">
                  {r.seance?.type ? SEANCE_TYPE_LABELS[r.seance.type] : ""}
                  {r.seance?.date_prevue
                    ? ` · ${format(new Date(r.seance.date_prevue), "dd MMMM yyyy", { locale: fr })}`
                    : ""}
                  {" · "}
                  {STATUT_LABELS[r.statut]}
                  {r.duree_reelle_secondes ? ` · ${Math.round(r.duree_reelle_secondes / 60)} min` : ""}
                  {r.distance_reelle_metres
                    ? ` · ${(r.distance_reelle_metres / 1000).toFixed(1)} km`
                    : ""}
                </p>
                {r.commentaire && <p className="text-sm">{r.commentaire}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
