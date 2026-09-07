-- An athlete can reschedule their own occurrence when they can't run it on
-- the planned day. Flag lets the coach's calendar surface that the date was
-- moved by the athlete rather than by them, since the write is otherwise
-- silent from the coach's point of view.
alter table seance add column date_modifiee_par_athlete boolean not null default false;

create policy "seance_update_self" on seance
  for update using (
    athlete_id = current_athlete_id() and est_modele = false
  ) with check (
    athlete_id = current_athlete_id() and est_modele = false
  );
