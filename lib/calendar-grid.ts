import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Full weeks (Monday-Sunday) covering the month containing referenceDate. */
export function getMonthGridWeeks(referenceDate: Date): Date[][] {
  const gridStart = startOfWeek(startOfMonth(referenceDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(referenceDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

/** The single Monday-Sunday week containing referenceDate. */
export function getWeekGridDays(referenceDate: Date): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}
