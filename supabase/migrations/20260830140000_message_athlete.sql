-- Athlete -> coach messaging (issue #15: "écrire à l'admin"). Athlete-side
-- only in this iteration (send + see own history) — no admin inbox UI yet,
-- but the admin policy is added upfront so a later admin UI needs no
-- migration of its own. `expediteur` is kept even though only 'athlete' is
-- written today: a message row is meaningless without knowing who sent it,
-- and the column is needed the moment an admin reply UI lands. Written
-- idempotent, same pattern as note_calendrier.

create table if not exists message_athlete (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  expediteur text not null default 'athlete' check (expediteur in ('coach', 'athlete')),
  contenu text not null,
  created_at timestamptz not null default now()
);

create index if not exists message_athlete_athlete_created_idx on message_athlete (athlete_id, created_at);

alter table message_athlete enable row level security;

drop policy if exists "message_athlete_all_admin" on message_athlete;
create policy "message_athlete_all_admin" on message_athlete
  for all using (is_admin()) with check (is_admin());

drop policy if exists "message_athlete_all_self" on message_athlete;
create policy "message_athlete_all_self" on message_athlete
  for all using (athlete_id = current_athlete_id()) with check (athlete_id = current_athlete_id());
