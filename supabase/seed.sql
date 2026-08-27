-- Realistic seed data: 3 athletes of different levels, ~12 library séances,
-- 4 weeks of plan on one athlete (Karim), a handful of retours already
-- filled in. Meant to run once against a freshly migrated database.

-- =========================================================================
-- Athletes
-- =========================================================================

insert into athlete (id, prenom, nom, email, date_naissance, fc_max, fc_repos, actif) values
  ('a1111111-1111-1111-1111-111111111111', 'Émilie', 'Rocher', 'emilie.rocher@example.com', '1994-03-12', 188, 58, true),
  ('a2222222-2222-2222-2222-222222222222', 'Karim', 'Haddad', 'karim.haddad@example.com', '1989-07-25', 192, 50, true),
  ('a3333333-3333-3333-3333-333333333333', 'Sophie', 'Lenoir', 'sophie.lenoir@example.com', '1991-11-02', 185, 46, true);

insert into athlete_note (athlete_id, contenu) values
  ('a1111111-1111-1111-1111-111111111111', 'Reprise après une pause de 6 mois, attention à la progressivité du volume.'),
  ('a2222222-2222-2222-2222-222222222222', 'Objectif principal : passer sous 1h30 au semi. Bonne régularité à l''entraînement.'),
  ('a3333333-3333-3333-3333-333333333333', 'Profil trail/montagne, complète souvent ses sorties de course par du vélo et de l''escalade.');

-- =========================================================================
-- Performances de référence
-- =========================================================================

insert into performance_reference (athlete_id, distance, temps_secondes, date_perf, type) values
  ('a1111111-1111-1111-1111-111111111111', '10k', 3480, '2026-06-15', 'reel'),   -- 58:00
  ('a2222222-2222-2222-2222-222222222222', '10k', 2550, '2026-07-01', 'reel'),   -- 42:30
  ('a3333333-3333-3333-3333-333333333333', 'semi', 5700, '2026-05-20', 'reel'),  -- 1:35:00
  ('a3333333-3333-3333-3333-333333333333', '10k', 2640, '2026-07-10', 'reel');   -- 44:00, plus récent et plus fiable

-- =========================================================================
-- Compétitions
-- =========================================================================

insert into competition (athlete_id, nom, date, lieu, distance, distance_metres_custom, objectif_temps_secondes, objectif_texte, priorite) values
  ('a1111111-1111-1111-1111-111111111111', 'Course des Lumières', '2026-10-11', 'Lyon', '10k', null, 3300, null, 'A'),
  ('a2222222-2222-2222-2222-222222222222', 'Semi de Paris', '2027-03-01', 'Paris', 'semi', null, 5400, null, 'A'),
  ('a3333333-3333-3333-3333-333333333333', 'Trail des Calades', '2026-09-20', 'Cassis', null, 28000, null, 'finir sans marcher', 'A');

-- =========================================================================
-- Bibliothèque de séances (est_modele = true)
-- =========================================================================

-- L1 — Endurance fondamentale, bloc unique
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000001', 'Endurance fondamentale 45''', 'endurance', 'Développer l''endurance fondamentale', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000001', 1, 'corps', 'temps', 2700, 'zone_allure', 'z2_endurance');

-- L2 — Récupération active, bloc unique
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000002', 'Récupération active 30''', 'recuperation', 'Favoriser la récupération entre deux séances de qualité', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000002', 1, 'corps', 'temps', 1800, 'zone_allure', 'z1_recup');

-- L3 — Fractionné court 15''/15'' x8
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000003', 'Fractionné 15''/15'' x8', 'fractionne_court', 'Travailler la VMA sur des efforts très courts', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000003', 1, 'echauffement', 'temps', 1200, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 2, 'corps', 8, 'libre', 'libre', '8 répétitions de 15''''/15''''');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 1, 'corps', 'temps', 15, 'zone_allure', 'z6_anaerobie', 'Effort 15'''''),
  ('b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 2, 'recuperation', 'temps', 15, 'zone_allure', 'z1_recup', 'Récupération 15''''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000003', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L4 — Fractionné court 30''/30'' x10
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000004', 'Fractionné 30''/30'' x10', 'fractionne_court', 'Développer la puissance aérobie', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000004', 1, 'echauffement', 'temps', 1200, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 2, 'corps', 10, 'libre', 'libre', '10 répétitions de 30''''/30''''');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 1, 'corps', 'temps', 30, 'zone_allure', 'z5_vma', 'Effort 30'''''),
  ('b1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 2, 'recuperation', 'temps', 30, 'zone_allure', 'z1_recup', 'Récupération 30''''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000004', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L5 — Fractionné long 1'/1' x8
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000005', 'Fractionné long 1''/1'' x8', 'fractionne_long', 'Développer la VMA sur des efforts plus longs', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000005', 1, 'echauffement', 'temps', 1200, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 2, 'corps', 8, 'libre', 'libre', '8 répétitions de 1''''/1''''');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 1, 'corps', 'temps', 60, 'zone_allure', 'z5_vma', 'Effort 1'''''),
  ('b1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 2, 'recuperation', 'temps', 60, 'zone_allure', 'z1_recup', 'Récupération 1''''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000005', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L6 — Seuil 4 x 1000m
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000006', 'Seuil 4 x 1000m', 'seuil', 'Travailler l''allure seuil sur volume moyen', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000006', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 2, 'corps', 4, 'libre', 'libre', '4 répétitions de 1000m au seuil');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004', 1, 'corps', 'distance', 1000, 'zone_allure', 'z4_seuil', '1000m au seuil');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004', 2, 'recuperation', 'temps', 120, 'zone_allure', 'z1_recup', 'Récupération 2''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000006', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L7 — VMA courte 200m x10
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000007', 'VMA courte 200m x10', 'vma', 'Développer la VMA pure', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000007', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000007', 2, 'corps', 10, 'libre', 'libre', '10 répétitions de 200m rapide');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005', 1, 'corps', 'distance', 200, 'zone_allure', 'z6_anaerobie', '200m rapide');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005', 2, 'recuperation', 'temps', 60, 'zone_allure', 'z1_recup', 'Récupération 1''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000007', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L8 — Sortie longue, bloc unique
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000008', 'Sortie longue 1h30', 'sortie_longue', 'Développer l''endurance et la résistance', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000008', 1, 'corps', 'temps', 5400, 'zone_allure', 'z2_endurance');

-- L9 — Allure spécifique 3 x 2000m
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000009', 'Allure spécifique 3 x 2000m', 'allure_specifique', 'S''approprier l''allure objectif marathon', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000009', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000009', 2, 'corps', 3, 'libre', 'libre', '3 répétitions de 2000m à l''allure marathon');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 1, 'corps', 'distance', 2000, 'zone_allure', 'z3_marathon', '2000m à l''allure marathon');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 2, 'recuperation', 'temps', 180, 'zone_allure', 'z1_recup', 'Récupération 3''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000009', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L10 — Côte 8 x 200m
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000010', 'Côte 8 x 200m', 'cote', 'Renforcer la foulée et la puissance en côte', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000010', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000010', 2, 'corps', 8, 'libre', 'libre', '8 répétitions de 200m en côte');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('b1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000007', 1, 'corps', 'distance', 200, 'zone_allure', 'z5_vma', '200m en côte');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, cible_type, commentaire) values
  ('b1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000007', 2, 'recuperation', 'libre', 'libre', 'Redescente trot, récupération libre');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('b1000000-0000-0000-0000-000000000010', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

-- L11 — Cross-training vélo, bloc unique
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000011', 'Vélo 1h', 'cross_training', 'Travail cardio à faible impact articulaire', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, commentaire) values
  ('b1000000-0000-0000-0000-000000000011', 1, 'corps', 'temps', 3600, 'libre', 'Vélo, endurance légère');

-- L12 — Renforcement, bloc unique
insert into seance (id, titre, type, objectif, est_modele) values
  ('b1000000-0000-0000-0000-000000000012', 'Renforcement gainage + PPG', 'renforcement', 'Prévenir les blessures, renforcer la chaîne posturale', true);
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, commentaire) values
  ('b1000000-0000-0000-0000-000000000012', 1, 'corps', 'temps', 1200, 'libre', 'Circuit gainage + PPG, 20 minutes');

-- =========================================================================
-- Plan de Karim : 4 semaines, 3 séances/semaine (1 EF, 1 spécifique, 1
-- sortie longue), copiées depuis la bibliothèque — pas référencées.
-- =========================================================================

-- Semaine 1 : lundi 2026-08-10 → dimanche 2026-08-16

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000001', 'Endurance fondamentale 45''', 'endurance', 'Développer l''endurance fondamentale', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-10');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000001', 1, 'corps', 'temps', 2700, 'zone_allure', 'z2_endurance');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000002', 'Seuil 4 x 1000m', 'seuil', 'Travailler l''allure seuil sur volume moyen', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-12');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000002', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 2, 'corps', 4, 'libre', 'libre', '4 répétitions de 1000m au seuil');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 1, 'corps', 'distance', 1000, 'zone_allure', 'z4_seuil', '1000m au seuil');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 2, 'recuperation', 'temps', 120, 'zone_allure', 'z1_recup', 'Récupération 2''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000002', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000003', 'Sortie longue 1h15', 'sortie_longue', 'Développer l''endurance et la résistance', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-15');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000003', 1, 'corps', 'temps', 4500, 'zone_allure', 'z2_endurance');

-- Semaine 2 : lundi 2026-08-17 → dimanche 2026-08-23

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000004', 'Endurance fondamentale 45''', 'endurance', 'Développer l''endurance fondamentale', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-17');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000004', 1, 'corps', 'temps', 2700, 'zone_allure', 'z2_endurance');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000005', 'VMA courte 200m x10', 'vma', 'Développer la VMA pure', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-19');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000005', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000005', 2, 'corps', 10, 'libre', 'libre', '10 répétitions de 200m rapide');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000002', 1, 'corps', 'distance', 200, 'zone_allure', 'z6_anaerobie', '200m rapide');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000002', 2, 'recuperation', 'temps', 60, 'zone_allure', 'z1_recup', 'Récupération 1''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000005', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000006', 'Sortie longue 1h20', 'sortie_longue', 'Développer l''endurance et la résistance', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-22');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000006', 1, 'corps', 'temps', 4800, 'zone_allure', 'z2_endurance');

-- Semaine 3 : lundi 2026-08-24 → dimanche 2026-08-30 (semaine en cours)

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000007', 'Endurance fondamentale 45''', 'endurance', 'Développer l''endurance fondamentale', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-24');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000007', 1, 'corps', 'temps', 2700, 'zone_allure', 'z2_endurance');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000008', 'Fractionné 15''/15'' x8', 'fractionne_court', 'Travailler la VMA sur des efforts très courts', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-26');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000008', 1, 'echauffement', 'temps', 1200, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000008', 2, 'corps', 8, 'libre', 'libre', '8 répétitions de 15''''/15''''');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000003', 1, 'corps', 'temps', 15, 'zone_allure', 'z6_anaerobie', 'Effort 15'''''),
  ('c2000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000003', 2, 'recuperation', 'temps', 15, 'zone_allure', 'z1_recup', 'Récupération 15''''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000008', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000009', 'Sortie longue 1h25', 'sortie_longue', 'Développer l''endurance et la résistance', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-29');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000009', 1, 'corps', 'temps', 5100, 'zone_allure', 'z2_endurance');

-- Semaine 4 : lundi 2026-08-31 → dimanche 2026-09-06

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000010', 'Endurance fondamentale 45''', 'endurance', 'Développer l''endurance fondamentale', false, 'a2222222-2222-2222-2222-222222222222', '2026-08-31');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000010', 1, 'corps', 'temps', 2700, 'zone_allure', 'z2_endurance');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000011', 'Allure spécifique 3 x 2000m', 'allure_specifique', 'S''approprier l''allure objectif marathon', false, 'a2222222-2222-2222-2222-222222222222', '2026-09-02');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000011', 1, 'echauffement', 'temps', 900, 'zone_allure', 'z2_endurance');
insert into bloc_seance (id, seance_id, ordre, role, repetitions, mode_duree, cible_type, commentaire) values
  ('d2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000011', 2, 'corps', 3, 'libre', 'libre', '3 répétitions de 2000m à l''allure marathon');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, distance_metres, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000011', 'd2000000-0000-0000-0000-000000000004', 1, 'corps', 'distance', 2000, 'zone_allure', 'z3_marathon', '2000m à l''allure marathon');
insert into bloc_seance (seance_id, parent_bloc_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone, commentaire) values
  ('c2000000-0000-0000-0000-000000000011', 'd2000000-0000-0000-0000-000000000004', 2, 'recuperation', 'temps', 180, 'zone_allure', 'z1_recup', 'Récupération 3''');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000011', 3, 'retour_au_calme', 'temps', 600, 'zone_allure', 'z1_recup');

insert into seance (id, titre, type, objectif, est_modele, athlete_id, date_prevue) values
  ('c2000000-0000-0000-0000-000000000012', 'Sortie longue 1h30', 'sortie_longue', 'Développer l''endurance et la résistance', false, 'a2222222-2222-2222-2222-222222222222', '2026-09-05');
insert into bloc_seance (seance_id, ordre, role, mode_duree, duree_secondes, cible_type, cible_zone) values
  ('c2000000-0000-0000-0000-000000000012', 1, 'corps', 'temps', 5400, 'zone_allure', 'z2_endurance');

-- =========================================================================
-- Retours déjà saisis (séances des semaines 1, 2 et le début de la 3)
-- =========================================================================

insert into retour_seance (seance_id, athlete_id, statut, rpe, commentaire) values
  ('c2000000-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 'fait', 3, 'Bonnes sensations, léger courbatures des jambes'),
  ('c2000000-0000-0000-0000-000000000002', 'a2222222-2222-2222-2222-222222222222', 'fait', 7, 'Allure tenue sur les 4 répétitions');

insert into retour_seance (seance_id, athlete_id, statut, rpe, commentaire, duree_reelle_secondes, distance_reelle_metres) values
  ('c2000000-0000-0000-0000-000000000003', 'a2222222-2222-2222-2222-222222222222', 'fait', 5, null, 4560, 15200);

insert into retour_seance (seance_id, athlete_id, statut, rpe, commentaire) values
  ('c2000000-0000-0000-0000-000000000004', 'a2222222-2222-2222-2222-222222222222', 'non_fait', null, 'Reprise tardive le soir, séance sautée'),
  ('c2000000-0000-0000-0000-000000000005', 'a2222222-2222-2222-2222-222222222222', 'partiel', 8, 'Arrêt après la 8e répétition, fatigue musculaire');

insert into retour_seance (seance_id, athlete_id, statut, rpe, commentaire, duree_reelle_secondes, distance_reelle_metres) values
  ('c2000000-0000-0000-0000-000000000006', 'a2222222-2222-2222-2222-222222222222', 'fait', 6, null, 4860, 16000);

insert into retour_seance (seance_id, athlete_id, statut, rpe, commentaire) values
  ('c2000000-0000-0000-0000-000000000007', 'a2222222-2222-2222-2222-222222222222', 'fait', 4, null),
  ('c2000000-0000-0000-0000-000000000008', 'a2222222-2222-2222-2222-222222222222', 'fait', 8, 'Séance difficile mais objectif atteint');
