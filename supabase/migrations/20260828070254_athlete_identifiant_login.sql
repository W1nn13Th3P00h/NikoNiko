-- Second login method: coach-assigned identifiant + code, alongside magic
-- link. Backed by a regular Supabase Auth user with a synthetic internal
-- email (identifiant@athlete.internal) and a password, created via the
-- service-role admin API (see utils/supabase/admin.ts). An athlete uses
-- one method or the other — setting up an identifiant overwrites which
-- auth.users row athlete.auth_user_id points to.

alter table athlete
  add column identifiant text unique,
  add constraint athlete_identifiant_format check (
    identifiant is null or identifiant ~ '^[a-z0-9_-]{3,20}$'
  );
