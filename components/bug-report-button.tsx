"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reportBug } from "@/app/actions/bug-report";

export function BugReportButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!titre.trim()) {
      setError("Titre requis.");
      return;
    }

    startTransition(async () => {
      const result = await reportBug({ titre, description, path: pathname });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTitre("");
        setDescription("");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setSuccess(false);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" title="Signaler un bug" aria-label="Signaler un bug">
            <Bug />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un bug</DialogTitle>
        </DialogHeader>
        {success ? (
          <p className="text-sm text-muted-foreground">
            Merci, le signalement a bien été envoyé.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bug-titre">Titre</Label>
              <Input id="bug-titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bug-description">Description (optionnel)</Label>
              <Textarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ce qui s'est passé, ce que vous attendiez…"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
