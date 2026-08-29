-- Distance was previously an enum (distance_ref) with a "custom" meters
-- fallback for trails — too rigid for how the coach actually describes a
-- competition ("Trail des Calades, 28km, D+1200"). Free text instead, plus
-- an optional D+ field that stays numeric since it feeds no calculation
-- today but might (elevation-adjusted pace) later.
alter table competition
  drop constraint competition_distance_specified,
  drop column distance,
  drop column distance_metres_custom;

alter table competition
  add column distance text not null default '',
  add column denivele_metres_dplus int check (denivele_metres_dplus is null or denivele_metres_dplus > 0);

alter table competition alter column distance drop default;
