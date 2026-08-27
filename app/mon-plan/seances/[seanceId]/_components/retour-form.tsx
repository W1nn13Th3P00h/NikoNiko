"use client";

import { useState, useTransition } from "react";
import { RPE_LABELS, RETOUR_STATUT_LABELS } from "@/lib/labels";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitRetour } from "../actions";

type RetourStatut = Database["public"]["Enums"]["retour_statut"];

const STATUT_OPTIONS: RetourStatut[] = ["fait", "partiel", "non_fait"];
const RPE_SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

// Statut (1 tap) + RPE (1 tap, skipped for "non_fait") + Envoyer (1 tap):
// the "trois interactions maximum" the spec asks for. The comment field is
// optional and doesn't count against that budget.
export function RetourForm({
  seanceId,
  athleteId,
  initialStatut,
  initialRpe,
  initialCommentaire,
}: {
  seanceId: string;
  athleteId: string;
  initialStatut: RetourStatut | null;
  initialRpe: number | null;
  initialCommentaire: string | null;
}) {
  const [statut, setStatut] = useState<RetourStatut | null>(initialStatut);
  const [rpe, setRpe] = useState<number | null>(initialRpe);
  const [commentaire, setCommentaire] = useState(initialCommentaire ?? "");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const needsRpe = statut === "fait" || statut === "partiel";
  const canSubmit = statut !== null && (!needsRpe || rpe !== null);

  function handleSubmit() {
    if (!statut) return;
    startTransition(async () => {
      await submitRetour(
        seanceId,
        athleteId,
        statut,
        needsRpe ? rpe : null,
        commentaire.trim() || null
      );
      setSent(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {STATUT_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              setStatut(opt);
              setSent(false);
            }}
            className={`flex-1 rounded-lg border py-3 text-sm font-medium ${
              statut === opt ? "border-primary bg-primary text-primary-foreground" : ""
            }`}
          >
            {RETOUR_STATUT_LABELS[opt]}
          </button>
        ))}
      </div>

      {needsRpe && (
        <div>
          <div className="grid grid-cols-5 gap-2">
            {RPE_SCALE.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setRpe(n);
                  setSent(false);
                }}
                className={`rounded-lg border py-2 text-lg font-bold ${
                  rpe === n ? "border-primary bg-primary text-primary-foreground" : ""
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {rpe !== null && (
            <p className="text-muted-foreground mt-1 text-center text-sm">{RPE_LABELS[rpe]}</p>
          )}
        </div>
      )}

      <Textarea
        placeholder="Commentaire (optionnel)"
        value={commentaire}
        onChange={(e) => {
          setCommentaire(e.target.value);
          setSent(false);
        }}
        rows={2}
      />

      <Button onClick={handleSubmit} disabled={!canSubmit || isPending} size="lg">
        {isPending ? "Envoi…" : sent ? "Retour envoyé ✓" : "Envoyer"}
      </Button>
    </div>
  );
}
