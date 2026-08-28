# Implementation Plan: QA responsive et finalisation V1

**Branch**: `001-qa-responsive-finalisation` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-qa-responsive-finalisation/spec.md`

## Summary

Auditer puis corriger l'affichage et l'ergonomie des pages déjà livrées de NikoNiko, sur les
largeurs de référence mobile (320px/375px, parcours athlète `/mon-plan`) et desktop (1280px/1440px,
parcours admin `/admin`), sans toucher à la logique métier ni aux données. Approche : passage manuel
systématique page par page dans le navigateur (dev server), correction ciblée des classes Tailwind /
composants shadcn concernés, re-vérification. Pas de nouvelle dépendance, pas de nouvel outillage de
test visuel.

## Technical Context

**Language/Version**: TypeScript strict (Next.js App Router, React Server Components)

**Primary Dependencies**: Next.js, Tailwind CSS, shadcn/ui (Radix), date-fns

**Storage**: N/A (pas de changement de schéma — feature purement UI/ergonomie)

**Testing**: Vitest (tests unitaires existants sur `lib/`, non affectés) ; validation de cette feature par passage manuel dans le navigateur aux largeurs de référence (pas de suite de tests visuels automatisés dans le projet)

**Target Platform**: Web responsive — navigateur mobile (athlète) et navigateur desktop (admin), déploiement Vercel

**Project Type**: Application web unique (Next.js), pas de séparation frontend/backend séparée

**Performance Goals**: N/A — aucun objectif de performance nouveau, seulement non-régression de l'existant

**Constraints**: Aucune régression fonctionnelle (FR-009) ; aucune nouvelle dépendance ; corrections limitées à l'affichage/l'ergonomie (mise en page, tailles, débordements, zones cliquables)

**Scale/Scope**: 8 pages/parcours listés dans le spec (accueil et calendrier athlète, détail séance athlète ; liste athlètes, fiche athlète, calendrier admin, éditeur de séance, bibliothèque, retours)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicité et YAGNI** — PASS. Corrections ciblées page par page, pas d'abstraction de layout générique introduite sans besoin avéré sur au moins deux pages.
- **II. Rigueur TypeScript et conventions bilingues** — PASS. Pas de nouveau code métier ; tout JSX/TS modifié reste strict, sans `any` ; UI toujours en français.
- **III. Sécurité par RLS et séparation des rôles** — N/A (aucune donnée, policy ou accès touché par cette feature).
- **IV. Modèle de données compatible export FIT** — N/A (aucune colonne ni structure de données modifiée).
- **V. Mobile-first athlète, desktop-first admin** — PASS (c'est l'objet même de la feature : faire respecter ce principe déjà établi sur les pages livrées).

Aucune violation. Pas d'entrée nécessaire dans Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-qa-responsive-finalisation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command) — N/A pour cette feature
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — N/A pour cette feature
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Application Next.js existante, structure déjà en place (voir CLAUDE.md) — cette feature ne crée
aucun nouveau dossier de premier niveau, elle modifie des fichiers existants dans :

```text
app/
├── mon-plan/
│   ├── page.tsx                    # US1 — accueil athlète
│   ├── calendrier/                 # US1 — calendrier athlète (lecture seule)
│   ├── seances/[seanceId]/         # US1 — détail séance + formulaire de retour
│   └── _components/bloc-list.tsx   # US1 — rendu des blocs (contraste, taille)
├── admin/
│   ├── page.tsx                     # US2 — liste des athlètes
│   ├── athletes/[identifiant]/
│   │   ├── page.tsx                 # US2 — fiche athlète
│   │   ├── calendrier/              # US2 — calendrier admin (drag&drop, vues mois/semaine)
│   │   └── seances/[seanceId]/      # US2 — éditeur de séance (délègue à seance-editor.tsx)
│   ├── bibliotheque/                # US2 — liste filtrable + édition modèle
│   ├── retours/                     # US2 — liste chronologique des retours
│   └── _components/seance-editor.tsx # US2 — éditeur bloc par bloc + aperçu live
components/ui/                       # composants shadcn/ui partagés (ajustements ponctuels si un
                                      # composant de base est en cause sur plusieurs pages)
```

**Structure Decision**: Aucune nouvelle structure — corrections in-place dans l'arborescence
`app/` existante décrite dans CLAUDE.md, éventuellement dans `components/ui/` si un composant
partagé (ex: card, dialog) est la source d'un défaut répété sur plusieurs pages.

## Complexity Tracking

*Aucune violation de la constitution — section non applicable.*
