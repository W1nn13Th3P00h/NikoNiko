-- Reminder push notifications (issue #27): the athlete opts in (per
-- reminder type) from /mon-plan/profil, then registers a Web Push
-- subscription per device. A Netlify Scheduled Function reads these to
-- send the actual pushes; rappel_seance_envoye makes that job idempotent
-- across cron runs within the same time window.

alter table athlete
  add column notif_veille_seance boolean not null default true,
  add column notif_jour_meme_seance boolean not null default true;

-- No RLS/trigger change needed: athlete_update_self already allows the
-- athlete to update their own row, and enforce_athlete_self_update_columns
-- (20260830130000_athlete_self_service.sql) only blocks identifiant,
-- auth_user_id, actif, email, fc_max, fc_repos — these two columns aren't
-- in that list.

create table abonnement_push (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index abonnement_push_athlete_idx on abonnement_push (athlete_id);

alter table abonnement_push enable row level security;

drop policy if exists "abonnement_push_all_self" on abonnement_push;
create policy "abonnement_push_all_self" on abonnement_push
  for all using (athlete_id = current_athlete_id()) with check (athlete_id = current_athlete_id());

create type type_rappel_notification as enum ('veille', 'jour_meme');

-- Written only by the scheduled function (service_role, bypasses RLS) —
-- RLS is enabled with no policy so it defaults to deny for every other
-- role, same intent as tables with no self-service access.
create table rappel_seance_envoye (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  seance_id uuid not null references seance (id) on delete cascade,
  type type_rappel_notification not null,
  envoye_at timestamptz not null default now(),
  unique (athlete_id, seance_id, type)
);

alter table rappel_seance_envoye enable row level security;
