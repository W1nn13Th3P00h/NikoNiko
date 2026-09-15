# Implementation Plan: Export de séance vers device

**Branch**: `export-seance` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-export-seance-fit/spec.md`

## Summary

Permettre à un athlète (et au coach depuis l'éditeur) de télécharger, depuis le détail d'une séance structurée, un fichier `.fit` représentant fidèlement ses blocs, répétitions et cibles (allure/FC résolues pour l'athlète, RPE/libre en étape ouverte). Génération à la volée via le SDK officiel `@garmin/fitsdk`, servie par un Route Handler Next.js, sans persistance ni intégration tierce. Périmètre de vérification V1 : Apple Watch et Suunto (via leurs ponts respectifs), avec une aide contextuelle expliquant le parcours réel par device.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16.3.3 (App Router), Node.js (runtime par défaut des Route Handlers, pas Edge)

**Primary Dependencies**: `@garmin/fitsdk` (nouvelle dépendance, Encoder FIT officiel) ; réutilisation de `lib/paces.ts`, `lib/volume.ts`, `lib/mappers.ts` existants

**Storage**: N/A — le fichier est généré à la demande à partir de `seance`/`bloc_seance`/`performance_reference`/`zone_manuelle`/`athlete` existants, jamais persisté (FR-010)

**Testing**: Vitest, sur le modèle de `lib/paces.test.ts` et `lib/volume.test.ts` — nouveau `lib/fit-export.test.ts` pour la logique de mapping bloc → étape FIT

**Target Platform**: Web (navigateur mobile pour l'athlète, desktop pour le coach), téléchargement de fichier local

**Project Type**: Application web existante (pas de nouveau projet/service)

**Performance Goals**: Non pertinent au-delà d'une génération perçue comme instantanée pour un fichier d'une séance (dizaines d'étapes maximum)

**Constraints**: Aucun appel réseau externe (FR-007) ; export non bloqué par une estimation incomplète (FR-005) ; fichier non stocké côté serveur (FR-010)

**Scale/Scope**: Une dizaine d'athlètes, export à la demande séance par séance — aucun enjeu de montée en charge

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicité et YAGNI** — PASS. Un seul format de sortie (`.fit`), une seule fonction de mapping, pas d'abstraction multi-device ni de flag de configuration. L'aide contextuelle est un contenu statique, pas un système de gestion de contenu.
- **II. Rigueur TypeScript et conventions bilingues** — PASS. `lib/fit-export.ts` en TypeScript strict, pas de `any` (les types du SDK `@garmin/fitsdk` doivent être vérifiés en implémentation ; à défaut de déclarations fournies, écrire un fichier `.d.ts` minimal plutôt que `any`). Code/commentaires en anglais, UI en français.
- **III. Sécurité par RLS et séparation des rôles** — PASS. Aucune nouvelle policy : les Route Handlers reproduisent exactement le filtre déjà utilisé par les pages existantes pour charger une séance (`athlete_id` + `est_modele = false`), donc protégés par les mêmes policies RLS que la lecture de séance aujourd'hui. Aucun usage du client `service_role`.
- **IV. Modèle de données compatible export FIT** — PASS (déjà satisfait par le schéma existant, voir `research.md#5`). Aucune migration nécessaire.
- **V. Mobile-first athlète, desktop-first admin** — PASS. Le bouton d'export sur `/mon-plan/seances/[seanceId]` s'intègre au layout mobile existant (contraste fort, un geste) ; côté admin il s'intègre à l'éditeur desktop existant.

Aucune violation — pas de section Complexity Tracking à remplir.

*Re-check post Phase 1 (data-model.md, contracts/) : toujours PASS, aucune décision de conception n'a introduit de dérogation.*

## Project Structure

### Documentation (this feature)

```text
specs/002-export-seance-fit/
├── plan.md              # Ce fichier
├── research.md          # Phase 0
├── data-model.md         # Phase 1
├── quickstart.md         # Phase 1
├── contracts/
│   └── export-route.md   # Phase 1
└── tasks.md              # Phase 2 (/speckit-tasks, pas encore généré)
```

### Source Code (repository root)

```text
lib/
  fit-export.ts            # Nouveau : mapping bloc_seance -> workout_step FIT (fonction pure) + génération du buffer via @garmin/fitsdk
  fit-export.test.ts        # Nouveau : tests Vitest du mapping (durées, cibles, répétitions, cas non disponible)

app/
  mon-plan/seances/[seanceId]/
    export/
      route.ts              # Nouveau : GET, athlète courant, réutilise le chargement de page.tsx
    page.tsx                 # Existant : ajoute le bouton "Exporter" (lien vers ./export) + aide contextuelle
    _components/
      export-seance-button.tsx  # Nouveau : bouton + popover/dialog d'aide contextuelle (Apple Watch / Suunto), partagé avec l'admin

  admin/
    athletes/[identifiant]/seances/[seanceId]/
      export/
        route.ts              # Nouveau : GET, résout l'athlète via [identifiant], même génération
    _components/
      seance-editor.tsx        # Existant : ajoute le même bouton d'export (import du composant partagé) quand une séance a un athlète assigné (pas en mode bibliothèque)
```

**Structure Decision** : pas de nouveau dossier de haut niveau. Le mapping et la génération FIT vivent dans `lib/` (logique métier pure, testable, à côté de `paces.ts`/`volume.ts` qu'elle consomme). Les deux points d'entrée HTTP sont des Route Handlers colocalisés avec les pages existantes (`export/route.ts` sous chaque `seances/[seanceId]`), pas un module `app/api/` séparé — cohérent avec le routage par segment déjà utilisé partout ailleurs dans `app/`. Le bouton et son aide contextuelle sont un composant partagé (probablement sous `components/` plutôt que dupliqué dans `app/mon-plan` et `app/admin`, à trancher en implémentation selon le pattern le plus proche : voir `components/calendar-note-dialog.tsx` pour un précédent de composant partagé entre les deux parcours).

## Complexity Tracking

*Aucune violation de la Constitution — section non applicable.*
