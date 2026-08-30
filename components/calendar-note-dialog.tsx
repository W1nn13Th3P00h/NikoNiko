"use client";

import { useState, useTransition } from "react";
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

const DEFAULT_COULEUR = "#f59e0b";

export interface NoteCalendrierInput {
  titre: string;
  couleur: string;
  contenu: string | null;
  dateDebut: string;
  dateFin: string;
}

interface NoteDialogProps {
  athleteId: string;
  trigger: React.ReactElement;
  // Omitted = create a new note (prefilled to initialDate on both ends);
  // provided = edit this one.
  initialDate?: string;
  existing?: {
    id: string;
    titre: string;
    couleur: string;
    contenu: string | null;
    dateDebut: string;
    dateFin: string;
  };
  onCreate: (athleteId: string, data: NoteCalendrierInput) => Promise<{ error?: string }>;
  onUpdate: (
    noteId: string,
    athleteId: string,
    data: NoteCalendrierInput
  ) => Promise<{ error?: string }>;
  onDelete: (noteId: string, athleteId: string) => Promise<{ error?: string }>;
}

export function NoteDialog({
  athleteId,
  trigger,
  initialDate,
  existing,
  onCreate,
  onUpdate,
  onDelete,
}: NoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState(existing?.titre ?? "");
  const [couleur, setCouleur] = useState(existing?.couleur ?? DEFAULT_COULEUR);
  const [contenu, setContenu] = useState(existing?.contenu ?? "");
  const [dateDebut, setDateDebut] = useState(existing?.dateDebut ?? initialDate ?? "");
  const [dateFin, setDateFin] = useState(existing?.dateFin ?? initialDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!titre.trim()) {
      setError("Titre requis.");
      return;
    }
    if (!dateDebut || !dateFin) {
      setError("Dates requises.");
      return;
    }
    if (dateFin < dateDebut) {
      setError("La date de fin doit être après la date de début.");
      return;
    }

    const payload: NoteCalendrierInput = {
      titre: titre.trim(),
      couleur,
      contenu: contenu.trim() || null,
      dateDebut,
      dateFin,
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
    if (!window.confirm(`Supprimer la note « ${existing.titre} » ?`)) return;
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
          <DialogTitle>{existing ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="note-titre">Titre</Label>
              <Input id="note-titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-couleur">Couleur</Label>
              <input
                id="note-couleur"
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="note-date-debut">Du</Label>
              <Input
                id="note-date-debut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="note-date-fin">Au</Label>
              <Input
                id="note-date-fin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note-contenu">Infos (optionnel)</Label>
            <Textarea
              id="note-contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={3}
            />
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

export function NoteChip({
  note,
  athleteId,
  onCreate,
  onUpdate,
  onDelete,
  // "inverted" is for the competition cell's dark background — a subtle
  // bg-tint would be invisible there, so just a colored dot + light text.
  variant = "default",
}: {
  note: { id: string; titre: string; couleur: string; contenu: string | null; dateDebut: string; dateFin: string };
  athleteId: string;
  onCreate: NoteDialogProps["onCreate"];
  onUpdate: NoteDialogProps["onUpdate"];
  onDelete: NoteDialogProps["onDelete"];
  variant?: "default" | "inverted";
}) {
  return (
    <NoteDialog
      athleteId={athleteId}
      existing={note}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      trigger={
        variant === "inverted" ? (
          <button
            type="button"
            title={note.titre}
            className="flex w-full items-center gap-1.5 truncate text-left text-[11px] font-medium opacity-90"
          >
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: note.couleur }} />
            <span className="truncate">{note.titre}</span>
          </button>
        ) : (
          <button
            type="button"
            title={note.titre}
            className="flex w-full items-center gap-1 truncate rounded-[3px] border-l-[3px] bg-black/[0.03] px-1.5 py-0.5 text-left text-[11px] font-medium dark:bg-white/[0.06]"
            style={{ borderLeftColor: note.couleur }}
          >
            <span className="truncate">{note.titre}</span>
          </button>
        )
      }
    />
  );
}

export function AddNoteButton({
  day,
  athleteId,
  onCreate,
  onUpdate,
  onDelete,
  label = "+ Note",
  className,
}: {
  day: string;
  athleteId: string;
  onCreate: NoteDialogProps["onCreate"];
  onUpdate: NoteDialogProps["onUpdate"];
  onDelete: NoteDialogProps["onDelete"];
  label?: string;
  className?: string;
}) {
  return (
    <NoteDialog
      athleteId={athleteId}
      initialDate={day}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      trigger={
        <button type="button" className={className ?? "text-left text-[11px] text-muted-foreground hover:underline"}>
          {label}
        </button>
      }
    />
  );
}
