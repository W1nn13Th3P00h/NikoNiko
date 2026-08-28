"use client";

import { useState, useTransition } from "react";
import { RPE_LABELS } from "@/lib/labels";
import { computeCharge } from "@/lib/charge";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { submitRetour } from "../actions";

type RetourStatut = Database["public"]["Enums"]["retour_statut"];

const STATUT_OPTIONS: { value: RetourStatut; label: string }[] = [
  { value: "fait", label: "Faite" },
  { value: "partiel", label: "En partie" },
  { value: "non_fait", label: "Pas faite" },
];
const RPE_SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

// Statut (1 tap) + RPE (1 tap, skipped for "non_fait") + Envoyer (1 tap):
// the "trois interactions maximum" the spec asks for. The comment field is
// optional and doesn't count against that budget.
export function RetourForm({
  seanceId,
  athleteId,
  dureeMinutesPrevue,
  initialStatut,
  initialRpe,
  initialCommentaire,
}: {
  seanceId: string;
  athleteId: string;
  dureeMinutesPrevue: number;
  initialStatut: RetourStatut | null;
  initialRpe: number | null;
  initialCommentaire: string | null;
}) {
  const [statut, setStatut] = useState<RetourStatut | null>(initialStatut);
  const [rpe, setRpe] = useState<number | null>(initialRpe);
  const [commentaire, setCommentaire] = useState(initialCommentaire ?? "");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const needsRpe = statut === "fait" || statut === "partiel";
  const canSubmit = statut !== null && (!needsRpe || rpe !== null);

  function handleSubmit() {
    if (!statut) return;
    setError(false);
    startTransition(async () => {
      try {
        await submitRetour(
          seanceId,
          athleteId,
          statut,
          needsRpe ? rpe : null,
          commentaire.trim() || null
        );
        setSent(true);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold tracking-[0.09em] text-muted-foreground uppercase">
          Tu l&apos;as faite ?
        </p>
        <div className="flex gap-2">
          {STATUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setStatut(opt.value);
                setSent(false);
              }}
              className={`h-[58px] flex-1 rounded-[4px] text-[15px] font-semibold ${
                statut === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {needsRpe && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-bold tracking-[0.09em] text-muted-foreground uppercase">
            Comment c&apos;était ?
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {RPE_SCALE.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setRpe(n);
                  setSent(false);
                }}
                className={`flex h-[82px] flex-col items-center justify-center gap-1 rounded-[4px] p-1 ${
                  rpe === n ? "bg-primary text-primary-foreground" : "border"
                }`}
              >
                <span className="font-mono text-xl leading-none font-semibold">{n}</span>
                <span className="text-center text-[10px] leading-tight opacity-80">
                  {RPE_LABELS[n]}
                </span>
              </button>
            ))}
          </div>
          {rpe !== null && (
            <p className="font-mono text-xs text-muted-foreground">
              {dureeMinutesPrevue} min × RPE {rpe} = charge {computeCharge(dureeMinutesPrevue, rpe)}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold tracking-[0.09em] uppercase">Un mot ?</span>{" "}
          <span className="text-[13px]">facultatif</span>
        </p>
        <textarea
          value={commentaire}
          onChange={(e) => {
            setCommentaire(e.target.value);
            setSent(false);
          }}
          rows={4}
          className="min-h-24 rounded-[4px] border bg-card p-3.5 font-serif text-base leading-[1.5]"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm">Échec de l&apos;envoi, réessaie.</p>
      )}
      <Button onClick={handleSubmit} disabled={!canSubmit || isPending} size="lg" className="h-14">
        {isPending ? "Envoi…" : sent ? "Retour envoyé ✓" : "Envoyer à Jérémie"}
      </Button>
    </div>
  );
}
