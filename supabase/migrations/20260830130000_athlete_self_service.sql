-- Athlete self-service (issue #15): the athlete can now edit their own
-- competitions and reference performances (same table, same shape as the
-- coach's), and their own name/date of birth from a new /mon-plan/profil
-- page. Written idempotent, same pattern as note_calendrier.

drop policy if exists "competition_all_self" on competition;
create policy "competition_all_self" on competition
  for all using (athlete_id = current_athlete_id()) with check (athlete_id = current_athlete_id());

drop policy if exists "performance_all_self" on performance_reference;
create policy "performance_all_self" on performance_reference
  for all using (athlete_id = current_athlete_id()) with check (athlete_id = current_athlete_id());

drop policy if exists "athlete_update_self" on athlete;
create policy "athlete_update_self" on athlete
  for update using (id = current_athlete_id()) with check (id = current_athlete_id());

-- RLS alone can't restrict an UPDATE to specific columns — it only checks
-- whether a row is visible/writable, not which columns changed. Without
-- this guard, athlete_update_self above would let an athlete PATCH their
-- own `identifiant`, `auth_user_id` or `actif` directly via the Supabase
-- client, bypassing the Server Action that only ever sends prenom/nom/
-- date_naissance. The coach (is_admin()) is exempt: this is what lets
-- setAthleteCredentials and updateAthleteInfos keep working unchanged.
create or replace function enforce_athlete_self_update_columns()
returns trigger
language plpgsql
as $$
begin
  if is_admin() then
    return new;
  end if;

  if new.identifiant is distinct from old.identifiant
    or new.auth_user_id is distinct from old.auth_user_id
    or new.actif is distinct from old.actif
    or new.email is distinct from old.email
    or new.fc_max is distinct from old.fc_max
    or new.fc_repos is distinct from old.fc_repos
  then
    raise exception 'Champ non modifiable par l''athlète.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_athlete_self_update_guard on athlete;
create trigger trg_athlete_self_update_guard
before update on athlete
for each row execute function enforce_athlete_self_update_columns();
