-- A bloc with sub-blocs is a pure container (e.g. "6 x (400m Z5 + 1min
-- récup)"): only its repetitions matter. 36 existing parents still carried
-- the editor's default own params (10 min Z2), which the volume added on top
-- of their children at every repetition and the FIT export emitted as an
-- extra step. The editor now enforces this on save (normalizeContainers).
update bloc_seance p
set mode_duree = 'libre',
    distance_metres = null,
    duree_secondes = null,
    cible_type = 'libre',
    cible_zone = null,
    cible_allure_secondes_par_km = null,
    cible_rpe = null
where exists (select 1 from bloc_seance c where c.parent_bloc_id = p.id);
