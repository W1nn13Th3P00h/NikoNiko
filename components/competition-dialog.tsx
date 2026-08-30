"use client";

import { useState, useTransition } from "react";
import { formatDurationHMS, parseDurationHMS } from "@/lib/paces";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PrioriteCompetition = Database["public"]["Enums"]["priorite_competition"];

const PRIORITE_OPTIONS: PrioriteCompetition[] = ["A", "B", "C"];

interface CompetitionPayload {
  nom: string;
  date: string;
  lieu: string | null;
  distance: string;
  deniveleMetresDplus: number | null;
  objectifTempsSecondes: number | null;
  objectifTexte: string | null;
  priorite: PrioriteCompetition;
}

// Shared by the admin fiche and the athlete profil page — the caller
// provides its own Server Actions (admin's operate on any athleteId,
// the athlete's own resolve the session's athlete server-side and ignore
// the athleteId argument), the dialog itself is agnostic to which.
export function CompetitionDialog({
  athleteId,
  trigger,
  existing,
  onCreate,
  onUpdate,
  onDelete,
}: {
  athleteId: string;
  trigger: React.ReactElement;
  // Omitted = create a new competition; provided = edit this one.
  existing?: {
    id: string;
    nom: string;
    date: string;
    lieu: string | null;
    distance: string;
    deniveleMetresDplus: number | null;
    objectifTempsSecondes: number | null;
    objectifTexte: string | null;
    priorite: PrioriteCompetition;
  };
  onCreate: (athleteId: string, data: CompetitionPayload) => Promise<{ error?: string }>;
  onUpdate: (
    competitionId: string,
    athleteId: string,
    data: CompetitionPayload
  ) => Promise<{ error?: string }>;
  onDelete: (competitionId: string, athleteId: string) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState(existing?.nom ?? "");
  const [date, setDate] = useState(existing?.date ?? "");
  const [lieu, setLieu] = useState(existing?.lieu ?? "");
  const [distance, setDistance] = useState(existing?.distance ?? "");
  const [deniveleMetresDplus, setDeniveleMetresDplus] = useState(
    existing?.deniveleMetresDplus?.toString() ?? ""
  );
  const [objectifTemps, setObjectifTemps] = useState(
    existing?.objectifTempsSecondes ? formatDurationHMS(existing.objectifTempsSecondes) : ""
  );
  const [objectifTexte, setObjectifTexte] = useState(existing?.objectifTexte ?? "");
  const [priorite, setPriorite] = useState<PrioriteCompetition>(existing?.priorite ?? "B");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!nom.trim()) {
      setError("Nom requis.");
      return;
    }
    if (!date) {
      setError("Date requise.");
      return;
    }
    if (!distance.trim()) {
      setError("Distance requise.");
      return;
    }
    let objectifTempsSecondes: number | null = null;
    if (objectifTemps.trim()) {
      objectifTempsSecondes = parseDurationHMS(objectifTemps);
      if (!objectifTempsSecondes) {
        setError("Objectif de temps invalide — format attendu : m:ss ou h:mm:ss.");
        return;
      }
    }

    const payload = {
      nom,
      date,
      lieu: lieu.trim() || null,
      distance,
      deniveleMetresDplus: deniveleMetresDplus.trim() ? Number(deniveleMetresDplus) : null,
      objectifTempsSecondes,
      objectifTexte: objectifTexte.trim() || null,
      priorite,
    };

    startTransition(async () => {
      const result = existing
        ? await onUpdate(existing.id, athleteId, payload)
        : await onCreate(athleteId, payload);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleDelete() {
    if (!existing) return;
    if (!window.confirm(`Supprimer la compétition « ${existing.nom} » ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete(existing.id, athleteId);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Modifier la compétition" : "Nouvelle compétition"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lieu">Lieu (optionnel)</Label>
            <Input id="lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="distance">Distance</Label>
              <Input
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="ex: 10 km, Semi-marathon, Trail 28 km…"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="denivele">D+ (mètres, optionnel)</Label>
              <Input
                id="denivele"
                type="number"
                value={deniveleMetresDplus}
                onChange={(e) => setDeniveleMetresDplus(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Priorité</Label>
              <Select value={priorite} onValueChange={(v) => v && setPriorite(v as PrioriteCompetition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="objectif_temps">Objectif de temps (optionnel)</Label>
              <Input
                id="objectif_temps"
                value={objectifTemps}
                onChange={(e) => setObjectifTemps(e.target.value)}
                placeholder="ex: 1:35:00"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="objectif_texte">Objectif (texte, optionnel)</Label>
              <Input id="objectif_texte" value={objectifTexte} onChange={(e) => setObjectifTexte(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {existing && (
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
