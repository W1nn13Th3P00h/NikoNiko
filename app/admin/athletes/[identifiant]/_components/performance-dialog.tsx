"use client";

import { useState, useTransition } from "react";
import { createPerformance, updatePerformance, deletePerformance } from "../actions";
import {
  DISTANCE_LABELS,
  PERFORMANCE_TYPE_LABELS,
  formatDurationHMS,
  parseDurationHMS,
  type DistanceRef,
  type PerformanceType,
} from "@/lib/paces";
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

const DISTANCE_OPTIONS: DistanceRef[] = ["5k", "10k", "semi", "marathon"];
const TYPE_OPTIONS: PerformanceType[] = ["reel", "estime", "objectif"];

export function PerformanceDialog({
  athleteId,
  trigger,
  existing,
}: {
  athleteId: string;
  trigger: React.ReactElement;
  // Omitted = create a new performance; provided = edit this one.
  existing?: {
    id: string;
    distance: DistanceRef;
    tempsSecondes: number;
    datePerf: string;
    type: PerformanceType;
  };
}) {
  const [open, setOpen] = useState(false);
  const [distance, setDistance] = useState<DistanceRef>(existing?.distance ?? "10k");
  const [temps, setTemps] = useState(existing ? formatDurationHMS(existing.tempsSecondes) : "");
  const [datePerf, setDatePerf] = useState(existing?.datePerf ?? "");
  const [type, setType] = useState<PerformanceType>(existing?.type ?? "reel");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    const tempsSecondes = parseDurationHMS(temps);
    if (!tempsSecondes) {
      setError("Temps invalide — format attendu : m:ss ou h:mm:ss.");
      return;
    }
    if (!datePerf) {
      setError("Date requise.");
      return;
    }

    startTransition(async () => {
      const result = existing
        ? await updatePerformance(existing.id, athleteId, { distance, tempsSecondes, datePerf, type })
        : await createPerformance(athleteId, { distance, tempsSecondes, datePerf, type });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleDelete() {
    if (!existing) return;
    if (!window.confirm("Supprimer cette performance ?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePerformance(existing.id, athleteId);
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
          <DialogTitle>{existing ? "Modifier la performance" : "Nouvelle performance"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Distance</Label>
              <Select value={distance} onValueChange={(v) => v && setDistance(v as DistanceRef)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DISTANCE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="temps">Temps (m:ss ou h:mm:ss)</Label>
              <Input id="temps" value={temps} onChange={(e) => setTemps(e.target.value)} placeholder="ex: 42:30" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="date_perf">Date</Label>
              <Input
                id="date_perf"
                type="date"
                value={datePerf}
                onChange={(e) => setDatePerf(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as PerformanceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PERFORMANCE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
