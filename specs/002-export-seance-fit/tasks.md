---
description: "Task list for Export de séance vers device"
---

# Tasks: Export de séance vers device

**Input**: Design documents from `/specs/002-export-seance-fit/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/export-route.md](./contracts/export-route.md), [quickstart.md](./quickstart.md)

**Tests**: Incluses pour `lib/fit-export.ts` — la Constitution du projet (Development Workflow) exige que la logique métier de `lib/` soit couverte par des tests Vitest avant d'être considérée terminée, sur le modèle de `lib/paces.test.ts`/`lib/volume.test.ts`.

**Organization**: Tâches groupées par user story (spec.md) pour permettre une implémentation et une validation indépendantes de chacune.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut être fait en parallèle (fichier différent, aucune dépendance bloquante)
- **[Story]**: US1 (athlète, P1), US2 (coach, P2), US3 (aide contextuelle, P3)

## Phase 1: Setup

- [X] T001 Ajouter `@garmin/fitsdk` aux dépendances de `package.json` et lancer `npm install`

---

## Phase 2: Foundational (bloquant pour toutes les user stories)

**Purpose**: la génération `.fit` elle-même — partagée à l'identique par US1 et US2 — doit exister et être testée avant tout point d'entrée HTTP.

- [X] T002 Définir dans `lib/fit-export.ts` le type `SeanceExportInput` (titre, date, type, blocs, performances, zoneOverrides, fcMax — voir `data-model.md#entrée`) et la fonction pure de mapping bloc → étape (`mapBlocToWorkoutStep` ou équivalent) couvrant : `mode_duree` → `duration_type`/`duration_value`, `cible_type` → `target_type`/bornes (résolution `zone_allure`/`zone_fc` via `getAthletePaceZone`/`getAthleteHeartRateZone` de `lib/paces.ts`, `allure_absolue` directe, `rpe`/`libre` → `open`), fallback `open` quand la zone n'est pas résolvable, `role` → `intensity`, et génération des étapes `repeat_steps` pour `repetitions > 1` (avec ou sans sous-blocs, profondeur 2 max) — voir `data-model.md#mapping-bloc--workout_step`
- [X] T003 Implémenter `buildFitWorkout(input: SeanceExportInput): Uint8Array` dans `lib/fit-export.ts` : instancier l'`Encoder` de `@garmin/fitsdk` et écrire les messages `file_id` (type `workout`), `workout` (nom = titre, sport dérivé de `type`) et un `workout_step` par étape produite par le mapping de T002 (dépend de T001, T002)
- [X] T004 Ajouter dans `lib/fit-export.ts` `seanceIsExportable(blocs: BlocSeanceInput[]): boolean` (faux pour une séance sans bloc exportable — repos/vide) et `seanceExportFilename(seance: { titre: string; datePrevue: string | null }): string` (`<date>-<titre-slugifie>.fit`, voir `contracts/export-route.md#nom-de-fichier`) (dépend de T002)
- [X] T005 Créer `lib/fit-export.test.ts` (Vitest, sur le modèle de `lib/volume.test.ts`) couvrant : les trois `mode_duree`, les cinq `cible_type` (dont le fallback `open` quand aucune performance de référence n'est disponible), un bloc `repetitions > 1` sans enfants, un bloc `repetitions > 1` avec sous-blocs (profondeur 2), et `seanceIsExportable`/`seanceExportFilename` (dépend de T002, T003, T004)

**Checkpoint**: `buildFitWorkout`, `seanceIsExportable` et `seanceExportFilename` existent et sont testés — les user stories peuvent commencer.

---

## Phase 3: User Story 1 - L'athlète télécharge sa séance pour la montre (Priority: P1) 🎯 MVP

**Goal**: un athlète télécharge, depuis le détail d'une séance qui lui est assignée, le fichier `.fit` de cette séance.

**Independent Test**: se connecter comme athlète, ouvrir `/mon-plan/seances/[seanceId]` sur une séance structurée avec blocs/répétitions/cibles variées, télécharger le fichier et vérifier son contenu ; vérifier qu'une séance de repos/vide n'affiche pas le bouton.

### Implementation for User Story 1

- [X] T006 [US1] Créer le Route Handler `app/mon-plan/seances/[seanceId]/export/route.ts` (`GET`) : résoudre l'athlète courant (`getCurrentAthlete()`, redirection `/login` si absent), charger `seance`/`bloc_seance`/`performance_reference`/`zone_manuelle` avec les mêmes requêtes que `app/mon-plan/seances/[seanceId]/page.tsx`, répondre `404` si séance introuvable/non assignée à cet athlète/modèle/`!seanceIsExportable`, sinon appeler `buildFitWorkout` et répondre avec `Content-Type: application/vnd.ant.fit` et `Content-Disposition: attachment; filename="<seanceExportFilename(...)>"` (voir `contracts/export-route.md`) (dépend de T002-T005)
- [X] T007 [P] [US1] Créer `components/export-seance-button.tsx` : composant partagé recevant l'URL d'export et un flag `exportable` ; ne rend rien si `!exportable`, sinon un bouton/lien de téléchargement (`<a href={exportUrl} download>`), style cohérent avec le reste de `/mon-plan` (contraste fort, cible tactile confortable)
- [X] T008 [US1] Intégrer `ExportSeanceButton` dans `app/mon-plan/seances/[seanceId]/page.tsx` : calculer `seanceIsExportable(blocInputs)` sur les blocs déjà chargés par la page et passer l'URL `./[seanceId]/export` (dépend de T006, T007)

**Checkpoint**: User Story 1 fonctionnelle et testable indépendamment (MVP).

---

## Phase 4: User Story 2 - Le coach exporte depuis l'éditeur (Priority: P2)

**Goal**: le coach télécharge, depuis l'éditeur d'une séance assignée à un athlète, le même fichier que celui que verrait cet athlète.

**Independent Test**: ouvrir l'éditeur admin d'une séance assignée à un athlète, télécharger le fichier et vérifier qu'il est identique à celui obtenu côté athlète ; vérifier qu'une séance de bibliothèque n'affiche pas le bouton.

### Implementation for User Story 2

- [X] T009 [P] [US2] Créer le Route Handler `app/admin/athletes/[identifiant]/seances/[seanceId]/export/route.ts` (`GET`) : résoudre l'athlète via `[identifiant]`, charger les mêmes données que `app/admin/athletes/[identifiant]/seances/[seanceId]/page.tsx`, mêmes règles `404`/génération que T006 (dépend de T002-T005 ; indépendant de T006-T008)
- [X] T010 [US2] Intégrer `ExportSeanceButton` (T007) dans `app/admin/_components/seance-editor.tsx` : afficher le bouton uniquement quand la séance a un athlète assigné (pas en mode bibliothèque) et `seanceIsExportable`, avec l'URL d'export correspondante (dépend de T007, T009)

**Checkpoint**: User Stories 1 et 2 fonctionnelles indépendamment.

---

## Phase 5: User Story 3 - Comprendre comment importer le fichier sur son device (Priority: P3)

**Goal**: au moment du téléchargement, une aide contextuelle explique le parcours réel pour Apple Watch et pour Suunto.

**Independent Test**: déclencher un export (athlète ou coach) et vérifier qu'un contenu d'aide distinct pour Apple Watch et pour Suunto est visible sans action supplémentaire.

### Implementation for User Story 3

- [X] T011 [P] [US3] Ajouter à `components/export-seance-button.tsx` le contenu d'aide contextuelle (popover ou dialog déclenché à côté du bouton) : un paragraphe pour Apple Watch (import via une app tierce type WatchFit/Watchletic) et un paragraphe pour Suunto (import via un pont type intervals.icu) — voir `spec.md` User Story 3 et `data-model.md#aide-contextuelle` (dépend de T007 ; indépendant de T008/T009/T010)

**Checkpoint**: les trois user stories sont fonctionnelles.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 [P] Lancer `npm run lint` et `npm test` à la racine du repo, corriger toute erreur TypeScript/lint introduite par `lib/fit-export.ts` et les nouveaux `route.ts`
- [X] T013 Mettre à jour `CLAUDE.md` (sections `Structure` et `État d'avancement`) pour documenter la nouvelle feature d'export, conformément à la convention du projet
- [X] T014 Exécuter les scénarios de `specs/002-export-seance-fit/quickstart.md` : parcours fonctionnel (étapes 1-5), vérification du contenu du fichier par décodage, et — au mieux, hors CI — les vérifications device Suunto et Apple Watch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance.
- **Foundational (Phase 2)** : dépend de Setup — bloque toutes les user stories.
- **User Story 1 (Phase 3)** : dépend de Foundational uniquement.
- **User Story 2 (Phase 4)** : dépend de Foundational uniquement pour son Route Handler (T009) ; son intégration UI (T010) dépend en plus de T007 (composant partagé créé dans US1).
- **User Story 3 (Phase 5)** : dépend de T007 (composant partagé) créé dans US1.
- **Polish (Phase 6)** : dépend de toutes les user stories retenues.

### Parallel Opportunities

- T007 (bouton, US1) peut être développé en parallèle de T006 (route handler, US1) — fichiers distincts.
- T009 (route handler admin, US2) peut démarrer dès la Foundational terminée, en parallèle de toute la Phase 3 — fichier indépendant, aucune dépendance sur US1.
- T011 (aide contextuelle, US3) peut être fait en parallèle de T008/T009/T010 dès que T007 existe.
- T012 (lint/test) et T013 (doc) peuvent être faits en parallèle.

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1).
2. **STOP et VALIDER** : un athlète peut télécharger un `.fit` correct depuis `/mon-plan`. C'est un MVP livrable seul.

### Incremental Delivery

1. Setup + Foundational → génération `.fit` prête et testée.
2. + US1 → valeur livrée à l'athlète (MVP).
3. + US2 → le coach peut vérifier/tester sans dépendre de l'athlète.
4. + US3 → l'aide contextuelle réduit le risque qu'un export ne mène nulle part sur Apple Watch/Suunto.
5. Polish → lint/tests/doc à jour, validation manuelle complète (y compris device).
