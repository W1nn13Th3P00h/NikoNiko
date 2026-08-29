-- zone_manuelle: per-zone manual override of the computed pace/HR zones,
-- for athletes with no usable reference performance (or too novice for the
-- Riegel-based estimate to mean anything). One row per (athlete, zone) that
-- the coach has actually set; missing rows fall back to the computed value.
-- Both pace and FC bounds live on the same row rather than two tables: a
-- zone is one concept with two possible expressions, and they're always
-- edited together in the same form.
create table zone_manuelle (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  zone cible_zone not null,
  allure_min_secondes_par_km int check (allure_min_secondes_par_km is null or allure_min_secondes_par_km > 0),
  allure_max_secondes_par_km int check (allure_max_secondes_par_km is null or allure_max_secondes_par_km > 0),
  fc_min_bpm int check (fc_min_bpm is null or fc_min_bpm > 0),
  fc_max_bpm int check (fc_max_bpm is null or fc_max_bpm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, zone),
  constraint zone_manuelle_has_a_value check (
    allure_max_secondes_par_km is not null or fc_max_bpm is not null
  )
);

create trigger trg_zone_manuelle_updated_at
before update on zone_manuelle
for each row execute function set_updated_at();

alter table zone_manuelle enable row level security;

-- zone_manuelle: the coach enters these; an athlete can read their own to
-- see where their real pace/FC targets come from, same as performance_reference.
create policy "zone_manuelle_select_admin" on zone_manuelle
  for select using (is_admin());

create policy "zone_manuelle_select_self" on zone_manuelle
  for select using (athlete_id = current_athlete_id());

create policy "zone_manuelle_write_admin" on zone_manuelle
  for all using (is_admin()) with check (is_admin());
