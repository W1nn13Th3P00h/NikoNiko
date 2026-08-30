-- Free-form calendar annotation (title + color + optional text), spanning
-- one or more days — distinct from athlete_note (a single coach-only free
-- text blurb on the athlete's fiche). Unlike every other athlete-scoped
-- table, both the coach and the athlete can read AND write their own rows
-- here: the coach uses it for cycles/context, the athlete for holidays or
-- comments (see CLAUDE.md).
create table note_calendrier (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  titre text not null,
  couleur text not null,
  contenu text,
  date_debut date not null,
  date_fin date not null,
  created_at timestamptz not null default now(),
  constraint note_calendrier_dates_check check (date_fin >= date_debut)
);

create index note_calendrier_athlete_dates_idx on note_calendrier (athlete_id, date_debut, date_fin);

alter table note_calendrier enable row level security;

create policy "note_calendrier_all_admin" on note_calendrier
  for all using (is_admin()) with check (is_admin());

create policy "note_calendrier_all_self" on note_calendrier
  for all using (athlete_id = current_athlete_id()) with check (athlete_id = current_athlete_id());
