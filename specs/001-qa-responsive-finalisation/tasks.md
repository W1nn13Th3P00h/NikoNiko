# Tasks: QA responsive et finalisation V1

**Input**: Design documents from `/specs/001-qa-responsive-finalisation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (N/A), quickstart.md

**Tests**: Non demandés explicitement dans le spec — feature validée par passage manuel (voir quickstart.md), pas de tâche de test automatisé générée.

**Organization**: Tâches groupées par user story (US1, US2, US3) pour permettre une livraison indépendante.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, sans dépendance bloquante)
- **[Story]**: US1 / US2 / US3, cf. spec.md
- Chemins de fichiers exacts inclus dans chaque description

## Phase 1: Setup

**Purpose**: Préparer les données et l'environnement de validation (aucune nouvelle dépendance, aucun changement de schéma — cf. plan.md)

- [ ] T001 Préparer les comptes/données de test décrits dans `specs/001-qa-responsive-finalisation/quickstart.md` (Prérequis) : un athlète sans performance de référence, une semaine avec plusieurs séances le même jour, une séance avec sous-blocs, un titre/note/commentaire anormalement longs
- [ ] T002 [P] Lancer `npm run dev` et configurer le mode responsive du navigateur aux largeurs de référence 320px, 375px, 1280px, 1440px

**Checkpoint**: Environnement et données prêts pour tous les audits ci-dessous.

---

## Phase 2: Foundational

Aucune tâche bloquante commune identifiée : US1 (`app/mon-plan/`) et US2 (`app/admin/`) touchent des arborescences disjointes et peuvent être menées en parallèle. Si un audit révèle qu'un composant partagé de `components/ui/` est la cause racine d'un défaut répété sur plusieurs pages, corriger ce composant en priorité au sein de la tâche qui l'a détecté plutôt que de dupliquer le correctif (principe I de la constitution).

---

## Phase 3: User Story 1 - L'athlète consulte son plan sur téléphone sans friction (Priority: P1) 🎯 MVP athlète

**Goal**: Les 3 pages du parcours `/mon-plan` s'affichent et se manipulent sans friction à 320px et 375px.

**Independent Test**: Parcourir accueil → calendrier → détail d'une séance → envoi d'un retour à 320px et 375px sans défilement horizontal ni élément inatteignable (cf. quickstart.md).

- [ ] T003 [P] [US1] Auditer et corriger `app/mon-plan/page.tsx` (séance du jour/prochaine séance, countdown compét. A, volume semaine) à 320px et 375px — FR-001
- [ ] T004 [P] [US1] Auditer et corriger `app/mon-plan/calendrier/page.tsx` (liste verticale de la semaine) à 320px et 375px — FR-001
- [ ] T005 [P] [US1] Auditer et corriger `app/mon-plan/_components/bloc-list.tsx` (rendu des blocs et sous-blocs, contraste fort, valeurs en grand) à 320px et 375px — FR-001, FR-006
- [ ] T006 [US1] Auditer et corriger `app/mon-plan/seances/[seanceId]/page.tsx`, `app/mon-plan/seances/[seanceId]/retour/page.tsx` et `app/mon-plan/seances/[seanceId]/_components/retour-form.tsx` (détail séance + formulaire de retour, 3 taps max) à 320px et 375px — FR-002 (dépend de T005, réutilise bloc-list)
- [ ] T007 [US1] Valider le parcours complet US1 de bout en bout à 320px et 375px selon `specs/001-qa-responsive-finalisation/quickstart.md` — SC-002, FR-007

**Checkpoint**: US1 livrable indépendamment — le parcours athlète mobile est utilisable de bout en bout.

---

## Phase 4: User Story 2 - Le coach construit et ajuste les plans sur desktop sans blocage visuel (Priority: P1) 🎯 MVP admin

**Goal**: Les 6 pages/parcours admin s'affichent et se manipulent sans blocage à 1280px et 1440px.

**Independent Test**: Parcourir liste athlètes → fiche → calendrier (mois/semaine, détaillé/compact) → éditeur de séance → bibliothèque → retours à 1280px et 1440px, chaque action clé restant utilisable (cf. quickstart.md).

- [ ] T008 [P] [US2] Auditer et corriger `app/admin/page.tsx`, `app/admin/_components/new-athlete-dialog.tsx` et `app/admin/_components/rpe-badge.tsx` (liste des athlètes : nom/volume/compétition longs, dialog "+ Nouvel athlète") à 1280px et 1440px — FR-003, FR-006
- [ ] T009 [P] [US2] Auditer et corriger `app/admin/athletes/[identifiant]/page.tsx` et ses dialogs `_components/performance-dialog.tsx`, `_components/competition-dialog.tsx` (zones calculées, perfs, compétitions, notes éditables) à 1280px et 1440px — FR-003
- [ ] T010 [P] [US2] Auditer et corriger `app/admin/athletes/[identifiant]/calendrier/` (vues mois/semaine × détaillé/compact, drag and drop, duplication de semaine) à 1280px et 1440px — FR-003, FR-004
- [ ] T011 [US2] Auditer et corriger `app/admin/_components/seance-editor.tsx` (éditeur bloc par bloc + aperçu live côte à côte) à 1280px et 1440px — FR-005
- [ ] T012 [US2] Auditer et corriger `app/admin/athletes/[identifiant]/seances/[seanceId]/page.tsx` (délègue à seance-editor.tsx) à 1280px et 1440px — FR-003 (dépend de T011)
- [ ] T013 [US2] Auditer et corriger `app/admin/bibliotheque/page.tsx`, `app/admin/bibliotheque/[seanceId]/page.tsx`, `app/admin/bibliotheque/_components/library-filters.tsx` et `app/admin/bibliotheque/_components/new-seance-button.tsx` (filtre type + recherche titre, même éditeur) à 1280px et 1440px — FR-003 (dépend de T011)
- [ ] T014 [P] [US2] Auditer et corriger `app/admin/retours/page.tsx` (100 derniers retours, commentaires longs) à 1280px et 1440px — FR-003, FR-006
- [ ] T015 [US2] Valider le parcours complet US2 de bout en bout à 1280px et 1440px selon `specs/001-qa-responsive-finalisation/quickstart.md` — SC-003, SC-004, FR-007

**Checkpoint**: US2 livrable indépendamment — le parcours admin desktop est utilisable de bout en bout.

---

## Phase 5: User Story 3 - Les pages restent utilisables aux largeurs intermédiaires (Priority: P3)

**Goal**: Aucune rupture bloquante entre 375px et 1280px sur l'ensemble des pages du périmètre.

**Independent Test**: Redimensionner chaque page listée dans US1/US2 entre 375px et 1280px par paliers et vérifier l'absence de superposition ou d'élément inatteignable.

- [ ] T016 [US3] Balayer chaque page corrigée en Phase 3 et Phase 4 entre 375px et 1280px et corriger toute rupture bloquante constatée — FR-008, FR-007 (dépend de T003–T015)

**Checkpoint**: Toutes les pages du périmètre restent consultables sur toute la plage de largeurs testée.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Mettre à jour `CLAUDE.md` : cocher l'Étape 8 — QA responsive + finalisation dans l'État d'avancement — SC-005
- [ ] T018 Lancer `npm test` (Vitest) pour confirmer l'absence de régression sur `lib/paces.ts` et `lib/volume.ts` — FR-009
- [ ] T019 Revue finale de cohérence visuelle (espacements, contrastes) sur l'ensemble des pages du périmètre — SC-001

---

## Dependencies & Execution Order

- **Setup (Phase 1)** : aucune dépendance, en premier.
- **Foundational (Phase 2)** : aucune tâche — voir note ci-dessus.
- **US1 (Phase 3)** et **US2 (Phase 4)** : indépendantes l'une de l'autre (fichiers disjoints), peuvent être menées en parallèle par deux personnes/sessions différentes après la Phase 1.
- **US3 (Phase 5)** : dépend de l'achèvement de US1 et US2 (elle audite les pages qu'elles ont corrigées).
- **Polish (Phase 6)** : après US1, US2 et US3.

Au sein de chaque story :
- T003, T004, T005 sont parallélisables (fichiers différents) ; T006 dépend de T005.
- T008, T009, T010, T014 sont parallélisables ; T011 doit précéder T012 et T013.

## Parallel Example: User Story 1

```text
T003 [P] [US1] app/mon-plan/page.tsx
T004 [P] [US1] app/mon-plan/calendrier/page.tsx
T005 [P] [US1] app/mon-plan/_components/bloc-list.tsx
# puis, une fois T005 terminé :
T006 [US1] app/mon-plan/seances/[seanceId]/page.tsx
```

## Implementation Strategy

- **MVP le plus étroit** : US1 seul livre un parcours athlète mobile fiable — déployable indépendamment si le calendrier admin desktop n'est pas encore audité.
- **Portée V1 complète** : US1 et US2 sont toutes deux P1 et nécessaires pour clôturer l'Étape 8 du roadmap (un seul des deux parcours ne suffit pas à considérer la V1 terminée).
- **Livraison incrémentale recommandée** : Phase 1 → (Phase 3 et Phase 4 en parallèle) → Phase 5 → Phase 6.
