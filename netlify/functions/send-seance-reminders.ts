import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";
import webpush from "web-push";
import type { Database } from "../../lib/database.types";

// Self-contained on purpose: bundled separately from the Next.js app by
// Netlify's own esbuild, so it doesn't rely on the "@/" path aliases or the
// "server-only" import guard that assume a Next.js webpack build.

const APP_TIMEZONE = "Europe/Paris";

type ReminderType = Database["public"]["Enums"]["type_rappel_notification"];

export default async function handler() {
  const now = TZDate.tz(APP_TIMEZONE);
  const hour = now.getHours();
  const minute = now.getMinutes();

  let type: ReminderType;
  let targetDate: string;
  if (hour === 20 && minute < 15) {
    type = "veille";
    targetDate = format(addDays(now, 1), "yyyy-MM-dd");
  } else if (hour === 7 && minute < 15) {
    type = "jour_meme";
    targetDate = format(now, "yyyy-MM-dd");
  } else {
    return new Response("Hors fenêtre d'envoi.", { status: 200 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const { data: seances, error: seancesError } = await supabase
    .from("seance")
    .select("id, titre, athlete_id")
    .eq("est_modele", false)
    .eq("date_prevue", targetDate)
    .neq("type", "repos");
  if (seancesError || !seances || seances.length === 0) {
    if (seancesError) console.error(seancesError);
    return new Response("Rien à envoyer.", { status: 200 });
  }

  const prefColumn = type === "veille" ? "notif_veille_seance" : "notif_jour_meme_seance";
  const athleteIds = [...new Set(seances.map((s) => s.athlete_id!))];
  const { data: eligibleAthletes } = await supabase
    .from("athlete")
    .select("id")
    .in("id", athleteIds)
    .eq(prefColumn, true);
  const eligibleIds = new Set((eligibleAthletes ?? []).map((a) => a.id));

  for (const seance of seances) {
    const athleteId = seance.athlete_id!;
    if (!eligibleIds.has(athleteId)) continue;

    const { data: alreadySent } = await supabase
      .from("rappel_seance_envoye")
      .select("id")
      .eq("athlete_id", athleteId)
      .eq("seance_id", seance.id)
      .eq("type", type)
      .maybeSingle();
    if (alreadySent) continue;

    const { data: subscriptions } = await supabase
      .from("abonnement_push")
      .select("*")
      .eq("athlete_id", athleteId);
    if (!subscriptions || subscriptions.length === 0) continue;

    const payload = JSON.stringify({
      title: type === "veille" ? "Séance demain" : "Séance aujourd'hui",
      body: seance.titre,
      url: `/mon-plan/seances/${seance.id}`,
    });

    let sentAtLeastOnce = false;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sentAtLeastOnce = true;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("abonnement_push").delete().eq("id", sub.id);
        } else {
          console.error("Envoi push échoué", err);
        }
      }
    }

    if (sentAtLeastOnce) {
      await supabase.from("rappel_seance_envoye").insert({
        athlete_id: athleteId,
        seance_id: seance.id,
        type,
      });
    }
  }

  return new Response("OK", { status: 200 });
}

export const config: Config = {
  schedule: "*/30 * * * *",
};
