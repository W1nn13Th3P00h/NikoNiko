// "Today" must be Europe/Paris's calendar date, not the server runtime's
// (Vercel serverless functions default to UTC — right after Paris midnight,
// UTC is still on the previous day, which would silently misclassify
// "today"'s séance as upcoming for up to two hours).

import { TZDate } from "@date-fns/tz";

export const APP_TIMEZONE = "Europe/Paris";

export function nowInParis(): TZDate {
  return TZDate.tz(APP_TIMEZONE);
}
