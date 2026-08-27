-- Initial schema: athletes, performances, séances, blocs, compétitions, retours.
-- See CLAUDE.md for the modeling decisions behind this schema.

create extension if not exists pgcrypto;

-- =========================================================================
-- Enums
-- =========================================================================

create type distance_ref as enum ('5k', '10k', 'semi', 'marathon');

create type performance_type as enum ('reel', 'estime', 'objectif');

create type seance_type as enum (
  'endurance',
  'seuil',
  'vma',
  'fractionne_court',
  'fractionne_long',
  'cote',
  'sortie_longue',
  'allure_specifique',
  'recuperation',
  'renforcement',
  'repos',
  'competition',
  'test',
  'cross_training'
);

create type bloc_role as enum ('echauffement', 'corps', 'recuperation', 'retour_au_calme', 'gammes');

create type mode_duree as enum ('distance', 'temps', 'libre');

create type cible_type as enum ('zone_allure', 'allure_absolue', 'zone_fc', 'rpe', 'libre');

create type cible_zone as enum (
  'z1_recup',
  'z2_endurance',
  'z3_marathon',
  'z4_seuil',
  'z5_vma',
  'z6_anaerobie'
);

create type priorite_competition as enum ('A', 'B', 'C');

create type retour_statut as enum ('fait', 'partiel', 'non_fait');

-- =========================================================================
-- Tables
-- =========================================================================

-- One row per authenticated user (coach or athlete). Created automatically
-- by the on_auth_user_created trigger below. is_admin is the single source
-- of truth for the coach role — never a hardcoded email allowlist.
create table profile (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table athlete (
  id uuid primary key default gen_random_uuid(),
  -- Set by the on_auth_user_created trigger on first magic-link sign-in,
  -- matched by email. Null until then: the coach creates athlete records
  -- before the athlete ever logs in.
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  prenom text not null,
  nom text not null,
  email text not null unique,
  date_naissance date,
  fc_max int check (fc_max is null or fc_max > 0),
  fc_repos int check (fc_repos is null or fc_repos > 0),
  actif boolean not null default true
);

-- Coach-only notes, split out from athlete into its own table so RLS can
-- deny athletes any access at the row level (a shared column on `athlete`
-- can't be hidden from the row's own owner via RLS alone).
create table athlete_note (
  athlete_id uuid primary key references athlete (id) on delete cascade,
  contenu text not null default '',
  updated_at timestamptz not null default now()
);

create table performance_reference (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  distance distance_ref not null,
  temps_secondes int not null check (temps_secondes > 0),
  date_perf date not null,
  type performance_type not null,
  created_at timestamptz not null default now()
);

-- A "séance" is either a library template (est_modele = true) or a
-- scheduled occurrence for one athlete (est_modele = false). Single table
-- with a discriminant rather than two linked tables: the columns are
-- nearly identical, and applying a template to an athlete becomes a plain
-- INSERT ... SELECT copy of the row (and its bloc_seance rows) instead of
-- a cross-table join threaded through every query.
create table seance (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  titre text not null,
  type seance_type not null,
  objectif text,
  consignes text,
  est_modele boolean not null default false,
  athlete_id uuid references athlete (id) on delete cascade,
  date_prevue date,
  ordre_dans_journee int not null default 1,
  constraint seance_modele_shape check (
    (est_modele = true and athlete_id is null and date_prevue is null)
    or
    (est_modele = false and athlete_id is not null and date_prevue is not null)
  )
);

create index seance_athlete_date_idx on seance (athlete_id, date_prevue) where est_modele = false;

-- Ordered list of steps making up a séance. Each column is a directly
-- typed field (never free text) so a bloc can later be translated 1:1 into
-- a FIT workout step (duration/distance end condition, pace or HR target
-- with low/high bounds) without a data migration. See README.md.
create table bloc_seance (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references seance (id) on delete cascade,
  -- Self-referent, max depth 2 (enforced by trigger below): lets a bloc
  -- represent "6 x (400m Z5 + 1min récup)" as a repeated group of sub-blocs.
  parent_bloc_id uuid references bloc_seance (id) on delete cascade,
  ordre int not null,
  role bloc_role not null,
  repetitions int not null default 1 check (repetitions > 0),
  mode_duree mode_duree not null,
  distance_metres int check (distance_metres is null or distance_metres > 0),
  duree_secondes int check (duree_secondes is null or duree_secondes > 0),
  cible_type cible_type not null,
  cible_zone cible_zone,
  cible_allure_secondes_par_km int check (cible_allure_secondes_par_km is null or cible_allure_secondes_par_km > 0),
  cible_rpe int check (cible_rpe is null or cible_rpe between 1 and 10),
  commentaire text,
  constraint bloc_mode_duree_shape check (
    (mode_duree = 'distance' and distance_metres is not null)
    or (mode_duree = 'temps' and duree_secondes is not null)
    or (mode_duree = 'libre')
  ),
  constraint bloc_cible_shape check (
    (cible_type in ('zone_allure', 'zone_fc') and cible_zone is not null)
    or (cible_type = 'allure_absolue' and cible_allure_secondes_par_km is not null)
    or (cible_type = 'rpe' and cible_rpe is not null)
    or (cible_type = 'libre')
  )
);

create index bloc_seance_seance_idx on bloc_seance (seance_id, ordre);
create index bloc_seance_parent_idx on bloc_seance (parent_bloc_id);

create table competition (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete (id) on delete cascade,
  nom text not null,
  date date not null,
  lieu text,
  distance distance_ref,
  -- For a trail or any distance outside the standard enum.
  distance_metres_custom int check (distance_metres_custom is null or distance_metres_custom > 0),
  objectif_temps_secondes int check (objectif_temps_secondes is null or objectif_temps_secondes > 0),
  objectif_texte text,
  priorite priorite_competition not null default 'B',
  resultat_temps_secondes int check (resultat_temps_secondes is null or resultat_temps_secondes > 0),
  resultat_commentaire text,
  created_at timestamptz not null default now(),
  constraint competition_distance_specified check (distance is not null or distance_metres_custom is not null)
);

create index competition_athlete_date_idx on competition (athlete_id, date);

create table retour_seance (
  id uuid primary key default gen_random_uuid(),
  -- One retour per occurrence: enforced by the unique index below plus a
  -- trigger (not a plain FK) since "seance_id must point to a non-template
  -- séance" can't be expressed as a foreign key constraint.
  seance_id uuid not null references seance (id) on delete cascade,
  athlete_id uuid not null references athlete (id) on delete cascade,
  statut retour_statut not null,
  rpe int check (rpe is null or rpe between 1 and 10),
  commentaire text,
  duree_reelle_secondes int check (duree_reelle_secondes is null or duree_reelle_secondes > 0),
  distance_reelle_metres int check (distance_reelle_metres is null or distance_reelle_metres > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retour_rpe_required_shape check (
    statut = 'non_fait' or rpe is not null
  )
);

create unique index retour_seance_seance_unique on retour_seance (seance_id);

-- =========================================================================
-- Triggers
-- =========================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_retour_seance_updated_at
before update on retour_seance
for each row execute function set_updated_at();

create or replace function enforce_bloc_seance_depth()
returns trigger
language plpgsql
as $$
declare
  parent_has_parent boolean;
begin
  if new.parent_bloc_id is not null then
    select (parent_bloc_id is not null) into parent_has_parent
    from bloc_seance
    where id = new.parent_bloc_id;

    if parent_has_parent is null then
      raise exception 'parent_bloc_id % does not exist', new.parent_bloc_id;
    end if;

    if parent_has_parent then
      raise exception 'bloc_seance nesting depth exceeds the maximum of 2 levels';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_bloc_seance_depth
before insert or update on bloc_seance
for each row execute function enforce_bloc_seance_depth();

create or replace function enforce_retour_on_occurrence()
returns trigger
language plpgsql
as $$
declare
  target_is_modele boolean;
begin
  select est_modele into target_is_modele from seance where id = new.seance_id;

  if target_is_modele is null then
    raise exception 'seance_id % does not exist', new.seance_id;
  end if;

  if target_is_modele then
    raise exception 'retour_seance must reference a scheduled occurrence, not a library template';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_retour_on_occurrence
before insert or update on retour_seance
for each row execute function enforce_retour_on_occurrence();

-- Creates the profile row and links any pre-existing athlete record (by
-- email) as soon as someone signs in for the first time via magic link.
-- SECURITY DEFINER: auth.users can't be read by the authenticating user's
-- own role yet at this point, and this function must write to `profile`
-- regardless of RLS.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profile (id, is_admin) values (new.id, false)
  on conflict (id) do nothing;

  update athlete set auth_user_id = new.id
  where email = new.email and auth_user_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_auth_user();

-- =========================================================================
-- RLS helper functions
-- =========================================================================

-- SECURITY DEFINER so RLS policies can call this without re-triggering RLS
-- on `profile` itself (which would recurse into the policy being evaluated).
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from profile where id = auth.uid()), false);
$$;

create or replace function current_athlete_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from athlete where auth_user_id = auth.uid();
$$;

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table profile enable row level security;
alter table athlete enable row level security;
alter table athlete_note enable row level security;
alter table performance_reference enable row level security;
alter table seance enable row level security;
alter table bloc_seance enable row level security;
alter table competition enable row level security;
alter table retour_seance enable row level security;

-- profile: everyone can read their own row (needed client-side to know
-- whether they're the coach); no self-service writes, is_admin is flipped
-- manually by the coach via the SQL editor (bootstrapping the first admin).
create policy "profile_select_own" on profile
  for select using (id = auth.uid());

-- athlete: the coach manages every athlete; an athlete can only read their
-- own row, and never writes to it directly (the coach edits FC, notes...).
create policy "athlete_select_admin" on athlete
  for select using (is_admin());

create policy "athlete_select_self" on athlete
  for select using (auth_user_id = auth.uid());

create policy "athlete_write_admin" on athlete
  for all using (is_admin()) with check (is_admin());

-- athlete_note: coach-only in both directions. No policy at all for
-- athletes, which under RLS means an outright deny rather than a filtered
-- read — the note never reaches the athlete's client.
create policy "athlete_note_admin_all" on athlete_note
  for all using (is_admin()) with check (is_admin());

-- performance_reference: the coach enters these; an athlete can read their
-- own to see where their computed pace zones come from.
create policy "performance_select_admin" on performance_reference
  for select using (is_admin());

create policy "performance_select_self" on performance_reference
  for select using (athlete_id = current_athlete_id());

create policy "performance_write_admin" on performance_reference
  for all using (is_admin()) with check (is_admin());

-- seance: the coach manages templates and occurrences; an athlete can only
-- read their own scheduled occurrences (athlete_id never matches their id
-- on a template row, so library entries are naturally excluded).
create policy "seance_select_admin" on seance
  for select using (is_admin());

create policy "seance_select_self" on seance
  for select using (athlete_id = current_athlete_id());

create policy "seance_write_admin" on seance
  for all using (is_admin()) with check (is_admin());

-- bloc_seance: same shape as seance, via a join since bloc_seance itself
-- doesn't carry athlete_id.
create policy "bloc_select_admin" on bloc_seance
  for select using (is_admin());

create policy "bloc_select_self" on bloc_seance
  for select using (
    exists (
      select 1 from seance s
      where s.id = bloc_seance.seance_id and s.athlete_id = current_athlete_id()
    )
  );

create policy "bloc_write_admin" on bloc_seance
  for all using (is_admin()) with check (is_admin());

-- competition: coach-managed, athlete reads their own (including past
-- results once filled in).
create policy "competition_select_admin" on competition
  for select using (is_admin());

create policy "competition_select_self" on competition
  for select using (athlete_id = current_athlete_id());

create policy "competition_write_admin" on competition
  for all using (is_admin()) with check (is_admin());

-- retour_seance: the one table an athlete can write to, and only on their
-- own occurrences. Insert requires the target séance to belong to them;
-- update is further restricted to séances less than 7 days old. The coach
-- retains full access to review and correct any retour.
create policy "retour_select_admin" on retour_seance
  for select using (is_admin());

create policy "retour_select_self" on retour_seance
  for select using (athlete_id = current_athlete_id());

create policy "retour_insert_self" on retour_seance
  for insert with check (
    athlete_id = current_athlete_id()
    and exists (
      select 1 from seance s
      where s.id = seance_id and s.athlete_id = current_athlete_id() and s.est_modele = false
    )
  );

create policy "retour_update_self_within_7_days" on retour_seance
  for update using (
    athlete_id = current_athlete_id()
    and exists (
      select 1 from seance s
      where s.id = seance_id and s.date_prevue >= (current_date - interval '7 days')
    )
  ) with check (athlete_id = current_athlete_id());

create policy "retour_write_admin" on retour_seance
  for all using (is_admin()) with check (is_admin());
