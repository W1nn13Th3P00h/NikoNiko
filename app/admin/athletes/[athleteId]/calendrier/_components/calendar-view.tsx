"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { computeSeanceVolume } from "@/lib/volume";
import { toBlocSeanceInput } from "@/lib/mappers";
import type { PerformanceReference } from "@/lib/paces";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RpeBadge } from "@/app/admin/_components/rpe-badge";
import {
  applyLibrarySeance,
  createBlankSeance,
  deleteSeance,
  duplicateWeek,
  moveSeanceDate,
} from "../actions";

type SeanceType = Database["public"]["Enums"]["seance_type"];

interface GridSeance {
  id: string;
  titre: string;
  type: SeanceType;
  date_prevue: string | null;
  ordre_dans_journee: number;
}

type BlocRow = Database["public"]["Tables"]["bloc_seance"]["Row"];

interface RetourRow {
  seance_id: string;
  rpe: number | null;
  statut: Database["public"]["Enums"]["retour_statut"];
}

interface AthleteRef {
  id: string;
  prenom: string;
  nom: string;
}

interface LibrarySeanceRef {
  id: string;
  titre: string;
  type: SeanceType;
}

export function CalendarView({
  athlete,
  allAthletes,
  librarySeances,
  weeks,
  seances,
  blocs,
  retours,
  performances,
  view,
  referenceDate,
  today,
}: {
  athlete: AthleteRef;
  allAthletes: AthleteRef[];
  librarySeances: LibrarySeanceRef[];
  weeks: string[][];
  seances: GridSeance[];
  blocs: BlocRow[];
  retours: RetourRow[];
  performances: PerformanceReference[];
  view: "mois" | "semaine";
  referenceDate: string;
  today: string;
}) {
  const router = useRouter();
  const [addDialogDate, setAddDialogDate] = useState<string | null>(null);
  const [duplicateAnchor, setDuplicateAnchor] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<"bibliotheque" | "custom">("bibliotheque");

  const seancesByDay = new Map<string, GridSeance[]>();
  for (const s of seances) {
    if (!s.date_prevue) continue;
    const list = seancesByDay.get(s.date_prevue) ?? [];
    list.push(s);
    seancesByDay.set(s.date_prevue, list);
  }

  const retourBySeanceId = new Map(retours.map((r) => [r.seance_id, r]));
  const blocsBySeanceId = new Map<string, BlocRow[]>();
  for (const b of blocs) {
    const list = blocsBySeanceId.get(b.seance_id) ?? [];
    list.push(b);
    blocsBySeanceId.set(b.seance_id, list);
  }

  function weekVolume(week: string[]) {
    const daySet = new Set(week);
    const weekSeanceIds = new Set(
      seances.filter((s) => s.date_prevue && daySet.has(s.date_prevue)).map((s) => s.id)
    );
    const weekBlocs = blocs.filter((b) => weekSeanceIds.has(b.seance_id)).map(toBlocSeanceInput);
    return computeSeanceVolume(weekBlocs, performances);
  }

  function navigate(nextView: "mois" | "semaine", nextDate: string) {
    router.push(`?vue=${nextView}&date=${nextDate}`);
  }

  function shiftReference(days: number) {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + days);
    navigate(view, format(next, "yyyy-MM-dd"));
  }

  async function handleDrop(seanceId: string, newDate: string) {
    await moveSeanceDate(seanceId, athlete.id, newDate);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Calendrier — {athlete.prenom} {athlete.nom}
          </h1>
          <p className="text-muted-foreground text-sm capitalize">
            {format(parseISO(referenceDate), view === "mois" ? "MMMM yyyy" : "'Semaine du' dd MMMM yyyy", {
              locale: fr,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(view, today)}>
            Aujourd&apos;hui
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftReference(view === "mois" ? -30 : -7)}>
            ← Précédent
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftReference(view === "mois" ? 30 : 7)}>
            Suivant →
          </Button>
          <div className="ml-2 flex rounded-md border">
            <Button
              variant={view === "mois" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("mois", referenceDate)}
            >
              Mois
            </Button>
            <Button
              variant={view === "semaine" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("semaine", referenceDate)}
            >
              Semaine
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {weeks.map((week) => {
          const volume = weekVolume(week);
          return (
            <div key={week[0]} className="flex gap-2">
              <div className="grid flex-1 grid-cols-7 gap-2">
                {week.map((day) => {
                  const dayLabel = format(parseISO(day), "EEE dd/MM", { locale: fr });
                  const daySeances = seancesByDay.get(day) ?? [];
                  const isToday = day === today;
                  const inCurrentMonth =
                    view === "semaine" ||
                    format(parseISO(day), "yyyy-MM") === format(parseISO(referenceDate), "yyyy-MM");

                  return (
                    <div
                      key={day}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const seanceId = e.dataTransfer.getData("text/plain");
                        if (seanceId) void handleDrop(seanceId, day);
                      }}
                      className={`flex min-h-28 flex-col gap-1 rounded-md border p-2 ${
                        isToday ? "border-primary" : ""
                      } ${inCurrentMonth ? "" : "opacity-50"}`}
                    >
                      <p className="text-muted-foreground text-xs capitalize">{dayLabel}</p>
                      <div className="flex flex-1 flex-col gap-1">
                        {daySeances.map((s) => {
                          const seanceBlocs = (blocsBySeanceId.get(s.id) ?? []).map(
                            toBlocSeanceInput
                          );
                          const volumeSeance = computeSeanceVolume(seanceBlocs, performances);
                          const retour = retourBySeanceId.get(s.id);
                          return (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                              className="group flex flex-col gap-0.5 rounded border bg-muted/50 px-1.5 py-1 text-xs"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <Link
                                  href={`/admin/athletes/${athlete.id}/seances/${s.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {s.titre}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => void deleteSeance(s.id, athlete.id)}
                                  className="text-muted-foreground opacity-0 group-hover:opacity-100"
                                  aria-label="Supprimer"
                                >
                                  ×
                                </button>
                              </div>
                              <span className="text-muted-foreground">
                                {SEANCE_TYPE_LABELS[s.type]} · {volumeSeance.distanceKm} km
                              </span>
                              {retour && <RpeBadge rpe={retour.rpe} />}
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddDialogDate(day)}
                        className="text-muted-foreground text-left text-xs hover:underline"
                      >
                        + Ajouter
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex w-32 flex-col items-end justify-center gap-1 text-sm">
                <span className="font-medium">
                  {volume.distanceKm} km · {volume.dureeMinutes} min
                </span>
                <Button variant="ghost" size="sm" onClick={() => setDuplicateAnchor(week[0])}>
                  Dupliquer →
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AddSeanceDialog
        date={addDialogDate}
        onOpenChange={(open) => !open && setAddDialogDate(null)}
        athleteId={athlete.id}
        librarySeances={librarySeances}
        mode={addMode}
        onModeChange={setAddMode}
      />

      <DuplicateWeekDialog
        weekStart={duplicateAnchor}
        onOpenChange={(open) => !open && setDuplicateAnchor(null)}
        sourceAthleteId={athlete.id}
        allAthletes={allAthletes}
      />
    </div>
  );
}

function AddSeanceDialog({
  date,
  onOpenChange,
  athleteId,
  librarySeances,
  mode,
  onModeChange,
}: {
  date: string | null;
  onOpenChange: (open: boolean) => void;
  athleteId: string;
  librarySeances: LibrarySeanceRef[];
  mode: "bibliotheque" | "custom";
  onModeChange: (mode: "bibliotheque" | "custom") => void;
}) {
  const router = useRouter();
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");

  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Ajouter une séance {date ? `— ${format(parseISO(date), "dd/MM/yyyy")}` : ""}
          </DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={mode}
          onValueChange={(v) => onModeChange(v as "bibliotheque" | "custom")}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="bibliotheque" id="mode-bibliotheque" />
            <Label htmlFor="mode-bibliotheque">Depuis la bibliothèque</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="custom" id="mode-custom" />
            <Label htmlFor="mode-custom">Séance custom</Label>
          </div>
        </RadioGroup>

        {mode === "bibliotheque" ? (
          <form
            action={async () => {
              if (!date || !selectedLibraryId) return;
              await applyLibrarySeance(athleteId, date, selectedLibraryId);
              onOpenChange(false);
            }}
            className="flex flex-col gap-3"
          >
            <Select
              value={selectedLibraryId}
              onValueChange={(v) => setSelectedLibraryId(v ?? "")}
              items={Object.fromEntries(
                librarySeances.map((s) => [s.id, `${s.titre} (${SEANCE_TYPE_LABELS[s.type]})`])
              )}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une séance de bibliothèque" />
              </SelectTrigger>
              <SelectContent>
                {librarySeances.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.titre} ({SEANCE_TYPE_LABELS[s.type]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!selectedLibraryId}>
              Ajouter
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Une séance custom se construit bloc par bloc (allures, distances,
              récupérations) dans l&apos;éditeur.
            </p>
            <Button
              onClick={async () => {
                if (!date) return;
                const newSeanceId = await createBlankSeance(athleteId, date);
                if (newSeanceId) {
                  router.push(`/admin/athletes/${athleteId}/seances/${newSeanceId}`);
                }
              }}
            >
              Créer et ouvrir l&apos;éditeur
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DuplicateWeekDialog({
  weekStart,
  onOpenChange,
  sourceAthleteId,
  allAthletes,
}: {
  weekStart: string | null;
  onOpenChange: (open: boolean) => void;
  sourceAthleteId: string;
  allAthletes: AthleteRef[];
}) {
  const [targetAthleteId, setTargetAthleteId] = useState<string>(sourceAthleteId);
  const [targetDay, setTargetDay] = useState<string>("");

  return (
    <Dialog open={weekStart !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Dupliquer la semaine du{" "}
            {weekStart ? format(parseISO(weekStart), "dd/MM/yyyy") : ""}
          </DialogTitle>
        </DialogHeader>
        <form
          action={async () => {
            if (!weekStart || !targetDay) return;
            const target = new Date(targetDay);
            const day = target.getDay(); // 0=dim..6=sam
            const diffToMonday = day === 0 ? -6 : 1 - day;
            target.setDate(target.getDate() + diffToMonday);
            const targetWeekStart = format(target, "yyyy-MM-dd");
            await duplicateWeek(sourceAthleteId, weekStart, targetAthleteId, targetWeekStart);
            onOpenChange(false);
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-athlete">Athlète cible</Label>
            <Select
              value={targetAthleteId}
              onValueChange={(v) => setTargetAthleteId(v ?? sourceAthleteId)}
              items={Object.fromEntries(allAthletes.map((a) => [a.id, `${a.prenom} ${a.nom}`]))}
            >
              <SelectTrigger id="target-athlete">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allAthletes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.prenom} {a.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-day">N&apos;importe quel jour de la semaine cible</Label>
            <Input
              id="target-day"
              type="date"
              value={targetDay}
              onChange={(e) => setTargetDay(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={!targetDay}>
            Dupliquer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
