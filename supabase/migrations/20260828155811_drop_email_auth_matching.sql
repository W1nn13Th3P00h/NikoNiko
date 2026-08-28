-- Magic link is gone (identifiant + mot de passe for everyone, coach
-- included — see app/login/actions.ts). The only remaining reason a fresh
-- auth.users row appears is setAthleteCredentials, which already points
-- athlete.auth_user_id at the new user itself. The email-matching update
-- below is now permanently dead (it could only ever fire from a magic-link
-- sign-in): drop it, keep the profile-row creation it was bundled with.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profile (id, is_admin) values (new.id, false)
  on conflict (id) do nothing;

  return new;
end;
$$;
