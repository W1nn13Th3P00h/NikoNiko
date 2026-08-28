"use client";

import { useState, useTransition } from "react";
import { createCompetition, updateCompetition } from "../actions";
import { DISTANCE_LABELS, formatDurationHMS, parseDurationHMS, type DistanceRef } from "@/lib/paces";
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

const DISTANCE_OPTIONS: (DistanceRef | "autre")[] = ["5k", "10k", "semi", "marathon", "autre"];
const PRIORITE_OPTIONS: PrioriteCompetition[] = ["A", "B", "C"];

export function CompetitionDialog({
  athleteId,
  trigger,
  existing,
}: {
  athleteId: string;
  trigger: React.ReactElement;
  // Omitted = create a new competition; provided = edit this one.
  existing?: {
    id: string;
    nom: string;
    date: string;
    lieu: string | null;
    distance: DistanceRef | null;
    distanceMetresCustom: number | null;
    objectifTempsSecondes: number | null;
    objectifTexte: string | null;
    priorite: PrioriteCompetition;
  };
}) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState(existing?.nom ?? "");
  const [date, setDate] = useState(existing?.date ?? "");
  const [lieu, setLieu] = useState(existing?.lieu ?? "");
  const [distanceMode, setDistanceMode] = useState<DistanceRef | "autre">(existing?.distance ?? "10k");
  const [distanceMetresCustom, setDistanceMetresCustom] = useState(
    existing?.distanceMetresCustom?.toString() ?? ""
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
    if (distanceMode === "autre" && !distanceMetresCustom) {
      setError("Distance (en mètres) requise.");
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
      distance: distanceMode === "autre" ? null : distanceMode,
      distanceMetresCustom: distanceMode === "autre" ? Number(distanceMetresCustom) : null,
      objectifTempsSecondes,
      objectifTexte: objectifTexte.trim() || null,
      priorite,
    };

    startTransition(async () => {
      const result = existing
        ? await updateCompetition(existing.id, athleteId, payload)
        : await createCompetition(athleteId, payload);
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
              <Label>Distance</Label>
              <Select
                value={distanceMode}
                onValueChange={(v) => v && setDistanceMode(v as DistanceRef | "autre")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === "autre" ? "Autre (trail, distance libre…)" : DISTANCE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {distanceMode === "autre" && (
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="distance_metres">Distance (mètres)</Label>
                <Input
                  id="distance_metres"
                  type="number"
                  value={distanceMetresCustom}
                  onChange={(e) => setDistanceMetresCustom(e.target.value)}
                />
              </div>
            )}
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
          <Button onClick={handleSubmit} disabled={isPending} className="self-start">
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
