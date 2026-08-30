import Link from "next/link";
import { addDays, addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentAthlete } from "@/app/mon-plan/_lib/current-athlete";
import { getMonthGridWeeks, getWeekGridDays } from "@/lib/calendar-grid";
import { nowInParis } from "@/lib/date";
import { toBlocSeanceInput, toPerformanceReference, toZoneManualOverrides } from "@/lib/mappers";
import { computeSeanceVolume } from "@/lib/volume";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
import { AddNoteButton, NoteChip } from "@/components/calendar-note-dialog";
import {
  CompetitionCardBody,
  SeanceRpeBadge,
  SeanceTypeBar,
  SeanceVolumeLine,
} from "./_components/seance-info";
import { createNote, deleteNote, updateNote } from "./actions";

export default async function AthleteCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/login");

  const { date } = await searchParams;
  const supabase = await createClient();
  const referenceDate = date ? new Date(date) : nowInParis();
  const today = format(nowInParis(), "yyyy-MM-dd");

  const monthWeeks = getMonthGridWeeks(referenceDate);
  const weekDays = getWeekGridDays(referenceDate);
  const gridStart = format(monthWeeks[0][0], "yyyy-MM-dd");
  const gridEnd = format(monthWeeks[monthWeeks.length - 1][6], "yyyy-MM-dd");

  const [
    { data: seances },
    { data: performanceRows },
    { data: zoneManuelleRows },
    { data: notes },
    { data: competitions },
  ] = await Promise.all([
    supabase
      .from("seance")
      .select("id, titre, type, date_prevue")
      .eq("athlete_id", athlete.id)
      .eq("est_modele", false)
      .gte("date_prevue", gridStart)
      .lte("date_prevue", gridEnd)
      .order("ordre_dans_journee"),
    supabase
      .from("performance_reference")
      .select("distance, temps_secondes, date_perf, type")
      .eq("athlete_id", athlete.id),
    supabase
      .from("zone_manuelle")
      .select("zone, allure_min_secondes_par_km, allure_max_secondes_par_km, fc_min_bpm, fc_max_bpm")
      .eq("athlete_id", athlete.id),
    supabase
      .from("note_calendrier")
      .select("id, titre, couleur, contenu, date_debut, date_fin")
      .eq("athlete_id", athlete.id)
      .lte("date_debut", gridEnd)
      .gte("date_fin", gridStart),
    supabase
      .from("competition")
      .select("id, nom, date, distance, objectif_temps_secondes")
      .eq("athlete_id", athlete.id)
      .gte("date", gridStart)
      .lte("date", gridEnd),
  ]);

  const seanceIds = (seances ?? []).map((s) => s.id);
  const [{ data: blocs }, { data: retours }] = await Promise.all([
    seanceIds.length > 0
      ? supabase.from("bloc_seance").select("*").in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
    seanceIds.length > 0
      ? supabase
          .from("retour_seance")
          .select("seance_id, statut, rpe, distance_reelle_metres")
          .in("seance_id", seanceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const performances = (performanceRows ?? []).map(toPerformanceReference);
  const zoneOverrides = toZoneManualOverrides(zoneManuelleRows ?? []);
  const retourBySeanceId = new Map((retours ?? []).map((r) => [r.seance_id, r]));
  const competitionByDay = new Map((competitions ?? []).map((c) => [c.date, c]));
  const blocsBySeanceId = new Map<string, typeof blocs>();
  for (const b of blocs ?? []) {
    const list = blocsBySeanceId.get(b.seance_id) ?? [];
    list.push(b);
    blocsBySeanceId.set(b.seance_id, list);
  }
  const seancesByDay = new Map<string, NonNullable<typeof seances>>();
  for (const s of seances ?? []) {
    if (!s.date_prevue) continue;
    const list = seancesByDay.get(s.date_prevue) ?? [];
    list.push(s);
    seancesByDay.set(s.date_prevue, list);
  }

  const prevWeekHref = `?date=${format(addDays(referenceDate, -7), "yyyy-MM-dd")}`;
  const nextWeekHref = `?date=${format(addDays(referenceDate, 7), "yyyy-MM-dd")}`;
  const prevMonthHref = `?date=${format(addMonths(referenceDate, -1), "yyyy-MM-dd")}`;
  const nextMonthHref = `?date=${format(addMonths(referenceDate, 1), "yyyy-MM-dd")}`;

  // Spans one or more days — plain string comparison works since dates are
  // ISO yyyy-MM-dd, which sorts lexicographically same as chronologically.
  function notesForDay(dayStr: string) {
    return (notes ?? []).filter((n) => n.date_debut <= dayStr && dayStr <= n.date_fin);
  }

  function daySummary(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    const daySeances = seancesByDay.get(dayStr) ?? [];
    const dayNotes = notesForDay(dayStr);
    const competition = competitionByDay.get(dayStr);
    return { dayStr, daySeances, dayNotes, competition };
  }

  const STATUT_GLYPH: Record<string, string> = { fait: "✓", partiel: "◐", non_fait: "✗" };
  const STATUT_LABEL: Record<string, string> = { fait: "faite", partiel: "en partie", non_fait: "non faite" };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Calendrier</h1>

      {/* Mobile: single week, vertical list */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between">
          <Link href={prevWeekHref} className="text-sm underline">
            ← Semaine préc.
          </Link>
          <Link href={`?date=${today}`} className="text-sm underline">
            Aujourd&apos;hui
          </Link>
          <Link href={nextWeekHref} className="text-sm underline">
            Semaine suiv. →
          </Link>
        </div>

        {weekDays.map((day) => {
          const { dayStr, daySeances, dayNotes, competition } = daySummary(day);
          return (
            <div
              key={dayStr}
              className={`rounded-lg border p-3 ${dayStr === today ? "border-primary" : ""} ${
                competition ? "bg-foreground text-background" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium capitalize opacity-70">
                  {format(day, "EEEE dd MMMM", { locale: fr })}
                </p>
                <AddNoteButton
                  day={dayStr}
                  athleteId={athlete.id}
                  onCreate={createNote}
                  onUpdate={updateNote}
                  onDelete={deleteNote}
                  label="+ note"
                  className={`text-xs underline ${competition ? "opacity-70" : "text-muted-foreground"}`}
                />
              </div>
              {dayNotes.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  {dayNotes.map((n) => (
                    <NoteChip
                      key={n.id}
                      note={{
                        id: n.id,
                        titre: n.titre,
                        couleur: n.couleur,
                        contenu: n.contenu,
                        dateDebut: n.date_debut,
                        dateFin: n.date_fin,
                      }}
                      athleteId={athlete.id}
                      onCreate={createNote}
                      onUpdate={updateNote}
                      onDelete={deleteNote}
                      variant={competition ? "inverted" : undefined}
                    />
                  ))}
                </div>
              )}
              {competition ? (
                <div className="mt-1 flex flex-col gap-1">
                  <CompetitionCardBody competition={competition} />
                </div>
              ) : daySeances.length === 0 ? (
                <p className="text-muted-foreground text-sm">Repos</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-2">
                  {daySeances.map((s) => {
                    const seanceBlocs = (blocsBySeanceId.get(s.id) ?? []).map(toBlocSeanceInput);
                    const volume = computeSeanceVolume(seanceBlocs, performances, zoneOverrides);
                    const retour = retourBySeanceId.get(s.id);
                    return (
                      <li key={s.id} className="flex flex-col gap-1">
                        <SeanceTypeBar type={s.type} />
                        <Link href={`/mon-plan/seances/${s.id}`} className="flex flex-col">
                          <span className="flex items-center gap-1.5 font-semibold">
                            {s.titre}
                            <SeanceRpeBadge rpe={retour?.rpe} />
                          </span>
                          <span className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">{SEANCE_TYPE_LABELS[s.type]}</span>
                            <SeanceVolumeLine retour={retour} volumeSeance={volume} />
                            {retour?.statut && (
                              <>
                                <span aria-hidden="true">{STATUT_GLYPH[retour.statut]}</span>
                                <span className="sr-only">{STATUT_LABEL[retour.statut]}</span>
                              </>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: full month grid */}
      <div className="hidden md:flex md:flex-col md:gap-2">
        <div className="flex items-center justify-between">
          <Link href={prevMonthHref} className="text-sm underline">
            ← Mois préc.
          </Link>
          <p className="font-medium capitalize">{format(referenceDate, "MMMM yyyy", { locale: fr })}</p>
          <Link href={nextMonthHref} className="text-sm underline">
            Mois suiv. →
          </Link>
        </div>

        {monthWeeks.map((week) => (
          <div key={format(week[0], "yyyy-MM-dd")} className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const { dayStr, daySeances, dayNotes, competition } = daySummary(day);
              const inCurrentMonth = format(day, "yyyy-MM") === format(referenceDate, "yyyy-MM");
              return (
                <div
                  key={dayStr}
                  className={`flex min-h-24 flex-col gap-1 rounded-md border p-2 ${
                    dayStr === today ? "border-primary" : ""
                  } ${inCurrentMonth ? "" : "opacity-50"} ${
                    competition ? "bg-foreground text-background" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs ${competition ? "opacity-70" : "text-muted-foreground"}`}>
                      {format(day, "dd/MM")}
                    </p>
                    <AddNoteButton
                      day={dayStr}
                      athleteId={athlete.id}
                      onCreate={createNote}
                      onUpdate={updateNote}
                      onDelete={deleteNote}
                      label="+"
                      className={`text-xs ${competition ? "opacity-70" : "text-muted-foreground"}`}
                    />
                  </div>
                  {dayNotes.map((n) => (
                    <NoteChip
                      key={n.id}
                      note={{
                        id: n.id,
                        titre: n.titre,
                        couleur: n.couleur,
                        contenu: n.contenu,
                        dateDebut: n.date_debut,
                        dateFin: n.date_fin,
                      }}
                      athleteId={athlete.id}
                      onCreate={createNote}
                      onUpdate={updateNote}
                      onDelete={deleteNote}
                      variant={competition ? "inverted" : undefined}
                    />
                  ))}
                  {competition ? (
                    <CompetitionCardBody competition={competition} />
                  ) : (
                    daySeances.map((s) => {
                      const seanceBlocs = (blocsBySeanceId.get(s.id) ?? []).map(toBlocSeanceInput);
                      const volume = computeSeanceVolume(seanceBlocs, performances, zoneOverrides);
                      const retour = retourBySeanceId.get(s.id);
                      return (
                        <Link
                          key={s.id}
                          href={`/mon-plan/seances/${s.id}`}
                          className="flex flex-col gap-0.5 rounded bg-muted/50 px-1 py-0.5 text-xs"
                        >
                          <SeanceTypeBar type={s.type} />
                          <span className="flex items-center gap-1">
                            <span className="min-w-0 flex-1 truncate font-medium">{s.titre}</span>
                            <SeanceRpeBadge rpe={retour?.rpe} />
                            {retour?.statut && (
                              <>
                                <span aria-hidden="true" className="shrink-0">
                                  {STATUT_GLYPH[retour.statut]}
                                </span>
                                <span className="sr-only">{STATUT_LABEL[retour.statut]}</span>
                              </>
                            )}
                          </span>
                          <SeanceVolumeLine retour={retour} volumeSeance={volume} />
                        </Link>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
