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

- [ ] T001 ⚠️ Non exécuté (pas d'accès base de données live dans cette session) — Préparer les comptes/données de test décrits dans `specs/001-qa-responsive-finalisation/quickstart.md` (Prérequis) : un athlète sans performance de référence, une semaine avec plusieurs séances le même jour, une séance avec sous-blocs, un titre/note/commentaire anormalement longs
- [ ] T002 [P] ⚠️ Non exécuté (pas d'outil navigateur/screenshot disponible dans cette session) — Lancer `npm run dev` et configurer le mode responsive du navigateur aux largeurs de référence 320px, 375px, 1280px, 1440px

**Checkpoint**: Environnement et données prêts pour tous les audits ci-dessous. **Note d'implémentation** : cette session n'a pas d'accès navigateur/DB live ; les tâches T003–T014 ont été réalisées par audit statique du code (lecture des JSX/Tailwind, calcul manuel des largeurs) plutôt que par vérification visuelle. Les tâches de validation de bout en bout (T007, T015, T016, T019) nécessitent une vérification humaine dans un vrai navigateur avant d'être cochées.

---

## Phase 2: Foundational

Aucune tâche bloquante commune identifiée : US1 (`app/mon-plan/`) et US2 (`app/admin/`) touchent des arborescences disjointes et peuvent être menées en parallèle. Si un audit révèle qu'un composant partagé de `components/ui/` est la cause racine d'un défaut répété sur plusieurs pages, corriger ce composant en priorité au sein de la tâche qui l'a détecté plutôt que de dupliquer le correctif (principe I de la constitution).

---

## Phase 3: User Story 1 - L'athlète consulte son plan sur téléphone sans friction (Priority: P1) 🎯 MVP athlète

**Goal**: Les 3 pages du parcours `/mon-plan` s'affichent et se manipulent sans friction à 320px et 375px.

**Independent Test**: Parcourir accueil → calendrier → détail d'une séance → envoi d'un retour à 320px et 375px sans défilement horizontal ni élément inatteignable (cf. quickstart.md).

- [X] T003 [P] [US1] Auditer et corriger `app/mon-plan/page.tsx` (séance du jour/prochaine séance, countdown compét. A, volume semaine) à 320px et 375px — FR-001 — Audit statique : layouts flex-col sans largeur fixe, texte qui wrap naturellement. Aucun défaut trouvé, aucune correction nécessaire.
- [X] T004 [P] [US1] Auditer et corriger `app/mon-plan/calendrier/page.tsx` (liste verticale de la semaine) à 320px et 375px — FR-001 — Audit statique : branches mobile/desktop dédiées (`md:hidden`/`hidden md:flex`), pas de largeur fixe côté mobile. Aucun défaut trouvé.
- [X] T005 [P] [US1] Auditer et corriger `app/mon-plan/_components/bloc-list.tsx` (rendu des blocs et sous-blocs, contraste fort, valeurs en grand) à 320px et 375px — FR-001, FR-006 — Audit statique : ligne flex avec `flex-1` sur le libellé, tailles fixes uniquement en `px` internes (icônes/badges), pas de risque de débordement. Aucun défaut trouvé.
- [X] T006 [US1] Auditer et corriger `app/mon-plan/seances/[seanceId]/page.tsx`, `app/mon-plan/seances/[seanceId]/retour/page.tsx` et `app/mon-plan/seances/[seanceId]/_components/retour-form.tsx` (détail séance + formulaire de retour, 3 taps max) à 320px et 375px — FR-002 — Audit statique : boutons statut/RPE dimensionnés explicitement (`h-14`, `h-[58px]`, `h-[82px]`, cibles tactiles ≥44px), grille RPE `grid-cols-5` reste jouable à 320px. Aucun défaut trouvé.
- [ ] T007 [US1] ⚠️ Non exécuté (nécessite un navigateur réel) — Valider le parcours complet US1 de bout en bout à 320px et 375px selon `specs/001-qa-responsive-finalisation/quickstart.md` — SC-002, FR-007

**Checkpoint**: US1 livrable indépendamment — le parcours athlète mobile est utilisable de bout en bout.

---

## Phase 4: User Story 2 - Le coach construit et ajuste les plans sur desktop sans blocage visuel (Priority: P1) 🎯 MVP admin

**Goal**: Les 6 pages/parcours admin s'affichent et se manipulent sans blocage à 1280px et 1440px.

**Independent Test**: Parcourir liste athlètes → fiche → calendrier (mois/semaine, détaillé/compact) → éditeur de séance → bibliothèque → retours à 1280px et 1440px, chaque action clé restant utilisable (cf. quickstart.md).

- [X] T008 [P] [US2] Auditer et corriger `app/admin/page.tsx`, `app/admin/_components/new-athlete-dialog.tsx` et `app/admin/_components/rpe-badge.tsx` (liste des athlètes : nom/volume/compétition longs, dialog "+ Nouvel athlète") à 1280px et 1440px — FR-003, FR-006 — Audit statique : table shadcn déjà encapsulée dans un conteneur `overflow-x-auto` propre, dialog en `flex-1` sans largeur fixe. Aucun défaut trouvé.
- [X] T009 [P] [US2] Auditer et corriger `app/admin/athletes/[identifiant]/page.tsx` et ses dialogs `_components/performance-dialog.tsx`, `_components/competition-dialog.tsx` (zones calculées, perfs, compétitions, notes éditables) à 1280px et 1440px — FR-003 — Audit statique : Cards empilées en colonne, dialogs shadcn (`max-w-sm`) avec champs `flex-1`, `athlete-info-form.tsx` déjà en `grid grid-cols-2 sm:grid-cols-4`. Aucun défaut trouvé.
- [X] T010 [P] [US2] **Corrigé** `app/admin/athletes/[identifiant]/calendrier/_components/calendar-view.tsx` (vues mois/semaine × détaillé/compact, drag and drop, duplication de semaine) à 1280px et 1440px — FR-003, FR-004 — Bug réel identifié : sidebar `w-52` fixe + grille `grid-cols-[repeat(7,1fr)_130px]` sans protection de débordement, aucun `overflow-x-auto` sur la zone de calendrier → dépassement horizontal possible dès que la fenêtre se resserre. Fix : zone des semaines passée en `overflow-x-auto` avec `min-w-[820px]` par ligne, la sidebar reste fixe et visible.
- [X] T011 [US2] **Corrigé** `app/admin/_components/seance-editor.tsx` (éditeur bloc par bloc + aperçu live côte à côte) à 1280px et 1440px — FR-005 — Bugs réels identifiés : (1) aperçu live en `w-[380px] shrink-0` à côté de l'éditeur `flex-1` sans point de rupture, ce qui dépasse la largeur disponible dès que la fenêtre devient étroite (cf. cas limite noté dans spec.md) ; (2) barre d'actions fixe en bas (`justify-between` sans wrap) risquant de pousser le bouton Enregistrer hors champ à largeur réduite. Fix : mise en colonne sous `lg` (`flex-col lg:flex-row`, aperçu `w-full lg:w-[380px]`) + `flex-wrap` sur la barre d'actions.
- [X] T012 [US2] Auditer et corriger `app/admin/athletes/[identifiant]/seances/[seanceId]/page.tsx` (délègue à seance-editor.tsx) à 1280px et 1440px — FR-003 — Audit statique : wrapper de récupération de données uniquement, aucune mise en page propre ; bénéficie directement du correctif T011.
- [X] T013 [US2] **Corrigé** `app/admin/bibliotheque/page.tsx`, `app/admin/bibliotheque/[seanceId]/page.tsx`, `app/admin/bibliotheque/_components/library-filters.tsx` et `app/admin/bibliotheque/_components/new-seance-button.tsx` (filtre type + recherche titre, même éditeur) à 1280px et 1440px — FR-003 — `library-filters.tsx` : `flex gap-3` sans wrap pouvait se resserrer inutilement à largeur réduite → `flex-wrap` ajouté. `[seanceId]/page.tsx` bénéficie de T011. Reste : aucun autre défaut trouvé.
- [X] T014 [P] [US2] Auditer et corriger `app/admin/retours/page.tsx` (100 derniers retours, commentaires longs) à 1280px et 1440px — FR-003, FR-006 — Audit statique : commentaire dans un `<p>` sans `whitespace-nowrap`, wrap naturel dans la Card. Aucun défaut trouvé.
- [ ] T015 [US2] ⚠️ Non exécuté (nécessite un navigateur réel) — Valider le parcours complet US2 de bout en bout à 1280px et 1440px selon `specs/001-qa-responsive-finalisation/quickstart.md` — SC-003, SC-004, FR-007

**Checkpoint**: US2 livrable indépendamment — le parcours admin desktop est utilisable de bout en bout.

---

## Phase 5: User Story 3 - Les pages restent utilisables aux largeurs intermédiaires (Priority: P3)

**Goal**: Aucune rupture bloquante entre 375px et 1280px sur l'ensemble des pages du périmètre.

**Independent Test**: Redimensionner chaque page listée dans US1/US2 entre 375px et 1280px par paliers et vérifier l'absence de superposition ou d'élément inatteignable.

- [ ] T016 [US3] ⚠️ Partiellement traité, non validé visuellement (nécessite un navigateur réel) — Balayer chaque page corrigée en Phase 3 et Phase 4 entre 375px et 1280px et corriger toute rupture bloquante constatée — FR-008, FR-007 (dépend de T003–T015). Les deux ruptures structurelles identifiables par lecture de code (calendrier admin, éditeur de séance — cf. T010/T011) sont déjà corrigées ; une confirmation visuelle au balayage reste nécessaire pour clore cette tâche.

**Checkpoint**: Toutes les pages du périmètre restent consultables sur toute la plage de largeurs testée.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] Mettre à jour `CLAUDE.md` : cocher l'Étape 8 — QA responsive + finalisation dans l'État d'avancement — SC-005 — Fait, avec une note explicite renvoyant vers ce qui reste à valider visuellement.
- [X] T018 Lancer `npm test` (Vitest) pour confirmer l'absence de régression sur `lib/paces.ts` et `lib/volume.ts` — FR-009 — 22/22 tests passent. `npx tsc --noEmit` : aucune nouvelle erreur introduite (une erreur `LayoutProps` dans `app/layout.tsx` est préexistante, confirmée en la reproduisant sur l'arbre sans ces changements).
- [ ] T019 ⚠️ Non exécuté (nécessite un navigateur réel) — Revue finale de cohérence visuelle (espacements, contrastes) sur l'ensemble des pages du périmètre — SC-001

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
