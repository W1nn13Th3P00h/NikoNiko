-- These three trigger functions reference unqualified table names
-- (bloc_seance, seance, retour_seance) without a pinned search_path,
-- unlike is_admin()/current_athlete_id()/handle_new_auth_user() which
-- already set one. A mutable search_path lets a role that can create
-- objects earlier in its search_path shadow those unqualified references.
-- Flagged by `supabase db advisors` (function_search_path_mutable).
alter function set_updated_at() set search_path = public;
alter function enforce_bloc_seance_depth() set search_path = public;
alter function enforce_retour_on_occurrence() set search_path = public;
