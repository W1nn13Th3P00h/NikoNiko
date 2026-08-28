"use client";

import { useState, useTransition } from "react";
import { upsertZoneManuelle, deleteZoneManuelle } from "../actions";
import {
  ZONE_LABELS,
  formatDurationHMS,
  parseDurationHMS,
  type ZoneAllure,
} from "@/lib/paces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ZoneManuelleDialog({
  athleteId,
  zone,
  trigger,
  existing,
}: {
  athleteId: string;
  zone: ZoneAllure;
  trigger: React.ReactElement;
  existing?: {
    paceMinSecondesParKm: number | null;
    paceMaxSecondesParKm: number | null;
    fcMinBpm: number | null;
    fcMaxBpm: number | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [paceMin, setPaceMin] = useState(
    existing?.paceMinSecondesParKm != null ? formatDurationHMS(existing.paceMinSecondesParKm) : ""
  );
  const [paceMax, setPaceMax] = useState(
    existing?.paceMaxSecondesParKm != null ? formatDurationHMS(existing.paceMaxSecondesParKm) : ""
  );
  const [fcMin, setFcMin] = useState(existing?.fcMinBpm?.toString() ?? "");
  const [fcMax, setFcMax] = useState(existing?.fcMaxBpm?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);

    let paceMinSecondesParKm: number | null = null;
    let paceMaxSecondesParKm: number | null = null;
    if (paceMin.trim() || paceMax.trim()) {
      paceMinSecondesParKm = parseDurationHMS(paceMin);
      paceMaxSecondesParKm = parseDurationHMS(paceMax);
      if (!paceMinSecondesParKm || !paceMaxSecondesParKm) {
        setError("Allure invalide — format attendu : m:ss (par km), les deux bornes.");
        return;
      }
    }

    const fcMinBpm = fcMin.trim() ? Number(fcMin) : null;
    const fcMaxBpm = fcMax.trim() ? Number(fcMax) : null;
    if ((fcMin.trim() || fcMax.trim()) && (!fcMinBpm || !fcMaxBpm)) {
      setError("FC invalide — les deux bornes sont requises.");
      return;
    }

    if (!paceMinSecondesParKm && !fcMinBpm) {
      setError("Renseignez une allure ou une FC.");
      return;
    }

    startTransition(async () => {
      const result = await upsertZoneManuelle(athleteId, {
        zone,
        paceMinSecondesParKm,
        paceMaxSecondesParKm,
        fcMinBpm,
        fcMaxBpm,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteZoneManuelle(athleteId, zone);
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
          <DialogTitle>Zone manuelle — {ZONE_LABELS[zone]}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Remplace la valeur calculée pour cette zone. Laissez une paire vide pour garder le
            calcul automatique sur cet axe (allure ou FC).
          </p>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="pace_min">Allure min (m:ss/km)</Label>
              <Input id="pace_min" value={paceMin} onChange={(e) => setPaceMin(e.target.value)} placeholder="ex: 5:30" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="pace_max">Allure max (m:ss/km)</Label>
              <Input id="pace_max" value={paceMax} onChange={(e) => setPaceMax(e.target.value)} placeholder="ex: 6:00" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="fc_min">FC min (bpm)</Label>
              <Input id="fc_min" type="number" value={fcMin} onChange={(e) => setFcMin(e.target.value)} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="fc_max">FC max (bpm)</Label>
              <Input id="fc_max" type="number" value={fcMax} onChange={(e) => setFcMax(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex items-center justify-between">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {existing && (
              <Button variant="ghost" onClick={handleDelete} disabled={isPending}>
                Revenir au calcul automatique
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
