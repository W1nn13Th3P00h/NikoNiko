<!--
Sync Impact Report
- Version change: (unratified) → 1.0.0
- Rationale: Initial ratification. No prior constitution existed; principles derived
  from established conventions already documented and enforced in CLAUDE.md.
- Modified principles: n/a (initial adoption)
- Added sections: Core Principles (I–V), Stack & Architecture Constraints,
  Development Workflow, Governance
- Removed sections: none
- Deferred TODOs: none
-->

# NikoNiko Constitution

## Core Principles

### I. Simplicité et YAGNI
Le code n'implémente que ce que le besoin actuel exige. Aucune abstraction,
gestion d'erreur ou validation n'est ajoutée pour un cas qui ne peut pas
survenir dans le système actuel. Une fonctionnalité ponctuelle n'a pas besoin
d'un helper générique ; trois lignes similaires valent mieux qu'une
abstraction prématurée. Pas de feature flag ni de compatibilité descendante
tant qu'aucun besoin réel ne l'impose : le code est modifié directement.
**Rationale**: Application privée à usage restreint (un coach, une dizaine
d'athlètes) — la dette de sur-ingénierie coûte plus cher que le risque
d'évolution future.

### II. Rigueur TypeScript et conventions bilingues
TypeScript strict partout, `any` interdit. L'interface utilisateur est
entièrement en français ; le code et les commentaires sont en anglais. Les
commentaires ne sont écrits que lorsque le "pourquoi" n'est pas évident
(contrainte cachée, invariant, contournement) — jamais pour décrire ce que le
code fait déjà de façon lisible.
**Rationale**: Cohérence pour un projet à contributeur unique ou restreint ;
le typage strict remplace la validation défensive que le principe I interdit
par ailleurs.

### III. Sécurité par RLS et séparation des rôles (NON-NEGOTIABLE)
Toute donnée par athlète est protégée par des policies RLS Postgres explicites
et commentées dans les migrations : un athlète ne voit que ses propres
données et ne peut écrire que dans `retour_seance` sur ses propres séances
(occurrences, jamais les modèles de bibliothèque). Le rôle admin est porté
par un champ sur le profil, jamais par une liste d'emails en dur. La clé
`service_role` (`utils/supabase/admin.ts`) n'est utilisée que côté Server
Action et n'est jamais exposée ni importée côté client.
**Rationale**: Seule barrière technique entre les données privées de chaque
athlète et les autres utilisateurs de l'application ; une régression ici est
une fuite de données personnelles, pas un bug fonctionnel ordinaire.

### IV. Modèle de données compatible export FIT
Chaque colonne de `bloc_seance` doit rester traduisible directement en étape
de workout FIT (type d'étape, condition de fin en durée/distance, cible en
allure ou FC avec bornes). Aucune donnée structurante n'est stockée en texte
libre. Une séance de bibliothèque appliquée à un athlète est copiée, jamais
référencée.
**Rationale**: L'export FIT est hors périmètre V1 mais une décision de schéma
qui l'empêcherait a un coût de migration prohibitif ; voir README.md pour le
détail de la contrainte.

### V. Mobile-first athlète, desktop-first admin
Le parcours `/mon-plan` est conçu et testé d'abord pour un usage mobile,
souvent consulté juste avant de courir : contraste fort, valeurs en grand,
lecture rapide. Le parcours `/admin` est conçu d'abord pour un usage desktop,
adapté à la construction de plans (calendrier, éditeur de séance). Toute
nouvelle vue est développée en respectant ce point d'ancrage avant d'être
adaptée à l'autre format.
**Rationale**: Les deux profils d'utilisateurs (coach vs athlète) ont des
contextes d'usage physiquement différents ; concevoir pour le mauvais device
par défaut dégrade l'expérience du cas d'usage principal.

## Stack & Architecture Constraints

Next.js App Router, TypeScript strict, React Server Components par défaut,
Server Actions pour toute mutation. Supabase pour Postgres, Auth (magic link
et identifiant/code) et RLS. Tailwind CSS + shadcn/ui pour l'UI. date-fns
pour les dates, fuseau Europe/Paris, semaines commençant le lundi — jamais de
`new Date()` nu, toujours `lib/date.ts#nowInParis()`. Vitest pour les tests
unitaires de logique métier (`lib/`). Déploiement cible : Vercel. Pas de
state manager global tant que le besoin n'est pas prouvé par l'usage réel de
l'application (cf. Principe I).

## Development Workflow

`CLAUDE.md` documente l'architecture et l'état d'avancement du projet et doit
être tenu à jour à chaque étape livrée. La logique métier isolée dans `lib/`
(zones d'allure, volume) est couverte par des tests Vitest avant d'être
considérée terminée. Les Server Actions qui utilisent le client
`service_role` restent confinées à `utils/supabase/admin.ts` et aux fichiers
qui en ont explicitement besoin.

## Governance

Cette constitution prévaut sur toute pratique ad hoc divergente. Toute
modification (ajout, retrait ou reformulation d'un principe) est une
amendment et suit le versionnage sémantique :
- MAJOR : suppression ou redéfinition incompatible d'un principe existant.
- MINOR : ajout d'un principe ou d'une section, ou renforcement matériel
  d'une règle existante.
- PATCH : clarification, reformulation ou correction non sémantique.

Toute revue de code ou de plan (`/speckit-plan`, `/speckit-analyze`) doit
vérifier la conformité aux principes ci-dessus ; une dérogation doit être
justifiée explicitement dans le plan concerné plutôt que silencieusement
appliquée. `CLAUDE.md` reste la référence d'implémentation détaillée ; cette
constitution en fixe les règles non négociables.

**Version**: 1.0.0 | **Ratified**: 2026-08-28 | **Last Amended**: 2026-08-28
