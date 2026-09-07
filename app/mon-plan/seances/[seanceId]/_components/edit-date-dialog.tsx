"use client";

import { useState, useTransition } from "react";
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

export function EditDateDialog({
  seanceId,
  datePrevue,
  onUpdate,
}: {
  seanceId: string;
  datePrevue: string;
  onUpdate: (seanceId: string, nouvelleDate: string) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(datePrevue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!date) {
      setError("Date requise.");
      return;
    }
    startTransition(async () => {
      const result = await onUpdate(seanceId, date);
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
        if (next) {
          setDate(datePrevue);
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="Modifier la date"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la date</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seance-date">Nouvelle date</Label>
            <Input id="seance-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
