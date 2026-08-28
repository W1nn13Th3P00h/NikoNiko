-- Email was required so every athlete could log in via magic link, but the
-- identifiant + code login doesn't need one at all (see athlete-login.ts).
-- Coaches shouldn't have to invent a placeholder email for athletes who'll
-- only ever use a code. The on_auth_user_created trigger's email match
-- (init_schema.sql) simply never fires for an athlete with no email —
-- magic link stays unavailable for them until one is set, which is correct.
alter table athlete alter column email drop not null;
