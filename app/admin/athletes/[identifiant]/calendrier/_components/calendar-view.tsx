"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addMonths, addWeeks, differenceInCalendarDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { computeSeanceVolume } from "@/lib/volume";
import { toBlocSeanceInput } from "@/lib/mappers";
import {
  computePaceZones,
  computeThresholdPaceSecondsPerKm,
  formatPaceSecondsPerKm,
  selectBasePerformance,
  ZONE_SHORT_LABELS,
  type PerformanceReference,
  type ZoneAllure,
} from "@/lib/paces";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
import { ZONE_COLORS, seanceTypeColor } from "@/lib/zone-colors";
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
import {
  applyLibrarySeance,
  createBlankSeance,
  deleteSeance,
  duplicateWeek,
  moveSeanceDate,
} from "../actions";

type SeanceType = Database["public"]["Enums"]["seance_type"];
type RetourStatut = Database["public"]["Enums"]["retour_statut"];

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
  statut: RetourStatut;
  distance_reelle_metres: number | null;
  duree_reelle_secondes: number | null;
}

interface CompetitionRow {
  id: string;
  nom: string;
  date: string;
  objectif_temps_secondes: number | null;
  priorite: Database["public"]["Enums"]["priorite_competition"];
}

interface AthleteRef {
  id: string;
  prenom: string;
  nom: string;
  // Only present on the main `athlete` prop, not on `allAthletes` — used to
  // build links back into this athlete's own routes.
  identifiant?: string;
}

interface LibrarySeanceRef {
  id: string;
  titre: string;
  type: SeanceType;
}

const ZONE_ORDER: ZoneAllure[] = [
  "z1_recup",
  "z2_endurance",
  "z3_marathon",
  "z4_seuil",
  "z5_vma",
  "z6_anaerobie",
];

function formatDurationHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export function CalendarView({
  athlete,
  allAthletes,
  librarySeances,
  weeks,
  seances,
  blocs,
  retours,
  competitions,
  nextCompetition,
  performances,
  view,
  density,
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
  competitions: CompetitionRow[];
  nextCompetition: { nom: string; date: string; priorite: string } | null;
  performances: PerformanceReference[];
  view: "mois" | "semaine";
  density: "detaille" | "compact";
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

  const competitionByDay = new Map(competitions.map((c) => [c.date, c]));
  const retourBySeanceId = new Map(retours.map((r) => [r.seance_id, r]));
  const blocsBySeanceId = new Map<string, BlocRow[]>();
  for (const b of blocs) {
    const list = blocsBySeanceId.get(b.seance_id) ?? [];
    list.push(b);
    blocsBySeanceId.set(b.seance_id, list);
  }

  function weekTotals(week: string[]) {
    const daySet = new Set(week);
    const weekSeances = seances.filter((s) => s.date_prevue && daySet.has(s.date_prevue));
    const weekSeanceIds = new Set(weekSeances.map((s) => s.id));
    const weekBlocs = blocs.filter((b) => weekSeanceIds.has(b.seance_id)).map(toBlocSeanceInput);
    const volume = computeSeanceVolume(weekBlocs, performances);

    let doneKm = 0;
    let doneCount = 0;
    for (const s of weekSeances) {
      const r = retourBySeanceId.get(s.id);
      if (!r) continue;
      if (r.statut !== "non_fait") {
        doneCount += 1;
        if (r.distance_reelle_metres) doneKm += r.distance_reelle_metres / 1000;
      }
    }

    return {
      volume,
      seanceCount: weekSeances.length,
      doneKm: Math.round(doneKm * 10) / 10,
      doneCount,
    };
  }

  function navigate(nextView: "mois" | "semaine", nextDensity: "detaille" | "compact", nextDate: string) {
    router.push(`?vue=${nextView}&densite=${nextDensity}&date=${nextDate}`);
  }

  function shiftReference(direction: 1 | -1) {
    const ref = parseISO(referenceDate);
    const next = view === "mois" ? addMonths(ref, direction) : addWeeks(ref, direction);
    navigate(view, density, format(next, "yyyy-MM-dd"));
  }

  async function handleDrop(seanceId: string, newDate: string) {
    await moveSeanceDate(seanceId, newDate);
  }

  async function handleDelete(seanceId: string, titre: string) {
    if (!window.confirm(`Supprimer « ${titre} » ?`)) return;
    const { error } = await deleteSeance(seanceId);
    if (error) window.alert(`Échec de la suppression : ${error}`);
  }

  const basePerformance = selectBasePerformance(performances);
  const threshold = basePerformance ? computeThresholdPaceSecondsPerKm(basePerformance) : null;
  const paceZones = threshold ? computePaceZones(threshold) : null;

  return (
    <div className="flex gap-8">
      <aside className="flex w-52 shrink-0 flex-col gap-1">
        <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Athlètes
        </p>
        {allAthletes.map((a) => (
          <Link
            key={a.id}
            href={`/admin/athletes/${a.identifiant}/calendrier`}
            className={`rounded-[3px] px-2.5 py-2 text-sm ${
              a.id === athlete.id ? "bg-primary font-semibold text-primary-foreground" : "text-[#3D4B50]"
            }`}
          >
            {a.prenom} {a.nom}
          </Link>
        ))}

        <div className="mt-4 flex flex-col gap-1.5 border-t pt-4">
          <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Zones de {athlete.prenom}
          </p>
          {!paceZones ? (
            <p className="text-xs text-muted-foreground">Aucune performance de référence.</p>
          ) : (
            ZONE_ORDER.map((zone) => {
              const pace = paceZones[zone];
              return (
                <div key={zone} className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-[2px]"
                    style={{ backgroundColor: ZONE_COLORS[zone] }}
                  />
                  <span className="font-mono text-[11px] text-[#3D4B50]">
                    {ZONE_SHORT_LABELS[zone]}{" "}
                    {pace.minSecondsPerKm === null
                      ? `< ${formatPaceSecondsPerKm(pace.maxSecondsPerKm)}`
                      : `${formatPaceSecondsPerKm(pace.minSecondsPerKm)}–${formatPaceSecondsPerKm(pace.maxSecondsPerKm)}`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {athlete.prenom} {athlete.nom}
            </h1>
            {nextCompetition && (
              <p className="font-mono text-xs text-muted-foreground">
                {nextCompetition.nom} · {format(parseISO(nextCompetition.date), "dd MMMM", { locale: fr })} · J-
                {differenceInCalendarDays(parseISO(nextCompetition.date), parseISO(today))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex overflow-hidden rounded-[3px] border">
              <button
                type="button"
                onClick={() => navigate("mois", density, referenceDate)}
                className={`px-3.5 py-2 text-[13px] font-medium ${view === "mois" ? "bg-foreground text-background" : ""}`}
              >
                Mois
              </button>
              <button
                type="button"
                onClick={() => navigate("semaine", density, referenceDate)}
                className={`px-3.5 py-2 text-[13px] font-medium ${view === "semaine" ? "bg-foreground text-background" : ""}`}
              >
                Semaine
              </button>
            </div>
            <div className="flex overflow-hidden rounded-[3px] border">
              <button
                type="button"
                onClick={() => navigate(view, "detaille", referenceDate)}
                className={`px-3.5 py-2 text-[13px] font-medium ${density === "detaille" ? "bg-foreground text-background" : ""}`}
              >
                Détaillé
              </button>
              <button
                type="button"
                onClick={() => navigate(view, "compact", referenceDate)}
                className={`px-3.5 py-2 text-[13px] font-medium ${density === "compact" ? "bg-foreground text-background" : ""}`}
              >
                Compact
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => shiftReference(-1)} aria-label="Précédent">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="min-w-[110px] text-center text-[15px] font-semibold capitalize">
                {format(parseISO(referenceDate), view === "mois" ? "MMMM yyyy" : "'sem.' dd MMM", { locale: fr })}
              </span>
              <button type="button" onClick={() => shiftReference(1)} aria-label="Suivant">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <Button variant="outline" size="sm" onClick={() => navigate(view, density, today)}>
                Aujourd&apos;hui
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 overflow-x-auto">
          {weeks.map((week) => {
            const totals = weekTotals(week);
            return (
              <div
                key={week[0]}
                className="grid min-w-[820px] grid-cols-[repeat(7,1fr)_130px] gap-1.5"
              >
                {week.map((day) => {
                  const daySeances = seancesByDay.get(day) ?? [];
                  const competition = competitionByDay.get(day);
                  const isToday = day === today;
                  const inCurrentMonth =
                    view === "semaine" ||
                    format(parseISO(day), "yyyy-MM") === format(parseISO(referenceDate), "yyyy-MM");

                  if (competition) {
                    return (
                      <div
                        key={day}
                        className="flex flex-col gap-1.5 rounded-[3px] bg-foreground p-2.5 text-background"
                        style={{ height: density === "compact" ? 44 : 132 }}
                      >
                        <span className="font-mono text-[11px] opacity-70">
                          {format(parseISO(day), "d MMM", { locale: fr })}
                        </span>
                        <span className="text-[11px] font-bold tracking-[0.09em] uppercase">
                          Compétition
                        </span>
                        <span className="text-[13px] font-semibold">{competition.nom}</span>
                        {competition.objectif_temps_secondes && (
                          <span className="font-mono text-xs opacity-70">
                            objectif{" "}
                            {Math.floor(competition.objectif_temps_secondes / 60)}:
                            {String(competition.objectif_temps_secondes % 60).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={day}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const seanceId = e.dataTransfer.getData("text/plain");
                        if (seanceId) void handleDrop(seanceId, day);
                      }}
                      className={`relative flex flex-col gap-1 overflow-hidden rounded-[3px] border bg-card p-2 ${
                        isToday ? "border-foreground" : ""
                      } ${inCurrentMonth ? "" : "opacity-50"}`}
                      style={{ minHeight: density === "compact" ? 44 : 132 }}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {format(parseISO(day), "d")}
                      </span>

                      {daySeances.length === 0 ? (
                        <span className="text-[13px] font-medium text-[#B4C2C2]">Repos</span>
                      ) : (
                        <div className="flex flex-1 flex-col gap-1.5">
                          {daySeances.map((s) => {
                            const seanceBlocs = (blocsBySeanceId.get(s.id) ?? []).map(toBlocSeanceInput);
                            const volumeSeance = computeSeanceVolume(seanceBlocs, performances);
                            const retour = retourBySeanceId.get(s.id);

                            return (
                              <div
                                key={s.id}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                                className="group relative flex flex-col gap-1 pl-2"
                              >
                                <span
                                  className="absolute top-0 bottom-0 left-0 w-[3px] rounded-full"
                                  style={{
                                    background: !retour
                                      ? "transparent"
                                      : retour.statut === "fait"
                                        ? "var(--foreground)"
                                        : retour.statut === "partiel"
                                          ? "repeating-linear-gradient(180deg, var(--foreground) 0 4px, transparent 4px 8px)"
                                          : "var(--border)",
                                  }}
                                />
                                {retour?.rpe && (
                                  <span className="absolute top-0 right-0 flex size-[22px] items-center justify-center rounded-full border bg-card text-[11px] font-bold">
                                    {retour.rpe}
                                  </span>
                                )}
                                {density === "detaille" && (
                                  <span
                                    className="h-1 rounded-full"
                                    style={{ backgroundColor: seanceTypeColor(s.type) }}
                                  />
                                )}
                                <div className="flex items-start justify-between gap-1 pr-6">
                                  <Link
                                    href={`/admin/athletes/${athlete.identifiant}/seances/${s.id}`}
                                    className="text-[13px] leading-tight font-semibold hover:underline"
                                  >
                                    {s.titre}
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(s.id, s.titre)}
                                    className="flex size-5 items-center justify-center text-muted-foreground"
                                    aria-label={`Supprimer ${s.titre}`}
                                  >
                                    ×
                                  </button>
                                </div>
                                {density === "detaille" && (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {retour?.statut === "non_fait"
                                      ? "non fait"
                                      : retour?.distance_reelle_metres
                                        ? `${(retour.distance_reelle_metres / 1000).toFixed(1)} / ${volumeSeance.distanceKm} km`
                                        : `${volumeSeance.distanceKm} km`}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {density === "detaille" && (
                        <button
                          type="button"
                          onClick={() => setAddDialogDate(day)}
                          className="mt-auto text-left text-[11px] text-muted-foreground hover:underline"
                        >
                          + Ajouter
                        </button>
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-col justify-center gap-1 border-l pl-4">
                  <span className="font-mono text-[19px] font-semibold tracking-tight">
                    {totals.doneKm}{" "}
                    <span className="text-[13px] font-normal text-muted-foreground">
                      / {totals.volume.distanceKm} km
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {totals.doneCount}/{totals.seanceCount} séances
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {formatDurationHM(totals.volume.dureeMinutes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDuplicateAnchor(week[0])}
                    className="mt-1 text-left text-[11px] text-muted-foreground hover:underline"
                  >
                    Dupliquer →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddSeanceDialog
        date={addDialogDate}
        onOpenChange={(open) => !open && setAddDialogDate(null)}
        athleteId={athlete.id}
        athleteIdentifiant={athlete.identifiant ?? ""}
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
  athleteIdentifiant,
  librarySeances,
  mode,
  onModeChange,
}: {
  date: string | null;
  onOpenChange: (open: boolean) => void;
  athleteId: string;
  athleteIdentifiant: string;
  librarySeances: LibrarySeanceRef[];
  mode: "bibliotheque" | "custom";
  onModeChange: (mode: "bibliotheque" | "custom") => void;
}) {
  const router = useRouter();
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

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
              disabled={isCreating}
              onClick={async () => {
                if (!date || isCreating) return;
                setIsCreating(true);
                const newSeanceId = await createBlankSeance(athleteId, date);
                if (newSeanceId) {
                  router.push(`/admin/athletes/${athleteIdentifiant}/seances/${newSeanceId}`);
                } else {
                  setIsCreating(false);
                }
              }}
            >
              {isCreating ? "Création…" : "Créer et ouvrir l'éditeur"}
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
            const target = parseISO(targetDay);
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
