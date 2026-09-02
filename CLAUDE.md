# CLAUDE.md

Documentation d'architecture pour ce projet. À tenir à jour à chaque étape.

## Contexte

Application privée de suivi de plans d'entraînement en course à pied. Un coach (admin) construit les plans, une dizaine d'athlètes consultent leurs séances. Pas de SaaS, pas de multi-coach, pas de facturation.

- Mobile-first côté athlète (`/mon-plan`) : consultation depuis le téléphone, souvent juste avant de courir.
- Desktop-first côté admin (`/admin`) : construction des plans.

## Stack

- Next.js (App Router, TypeScript strict, React Server Components par défaut, Server Actions pour les mutations)
- Supabase : Postgres + Auth (identifiant + mot de passe) + Row Level Security
- date-fns, timezone Europe/Paris, semaines commençant le lundi

Pas de state manager global tant que le besoin n'est pas prouvé.

## Méthode de travail

Pour toute modification, évolution ou correction, présenter un plan avant de démarrer l'implémentation. Attendre validation avant d'écrire du code.

## Conventions

- Interface entièrement en français, code et commentaires en anglais.
- TypeScript strict, pas de `any`.
- Commentaires uniquement quand le "pourquoi" n'est pas évident (contrainte cachée, invariant, contournement).
- Pas d'abstraction ou de gestion d'erreur pour des cas qui ne peuvent pas arriver.

## Structure

```
app/                    routes (App Router)
  login/                page + Server Action de connexion (identifiant + mot de passe, coach compris)
  apres-connexion/      filet de sécurité seulement (voir lib/auth-destination.ts) : aiguille vers /admin ou /mon-plan selon profile.is_admin
  actions/auth.ts        Server Action de déconnexion
  admin/                parcours coach, protégé
    page.tsx             liste des athlètes (volume semaine, dernier RPE, prochaine compét)
    athletes/[identifiant]/ fiche athlète (zones calculées, perfs, compétitions, notes)
      calendrier/          vue mois/semaine, drag and drop, ajout (bibliothèque/custom), duplication de semaine
      seances/[seanceId]/  page fine : charge la séance de CET athlète, délègue à _components/seance-editor.tsx
    bibliotheque/          liste filtrable (type, recherche titre) des séances est_modele=true
      [seanceId]/           édition directe d'une séance de bibliothèque (même éditeur, sans athlète/allures réelles)
    retours/                liste chronologique de tous les retours (100 derniers)
    _components/seance-editor.tsx  éditeur bloc par bloc partagé (athlète nullable, cf redirectPath/allowSaveAsLibraryCopy)
    _lib/draft.ts                   type DraftBloc + helpers (brouillon client, jamais persisté tel quel)
    _lib/seance-actions.ts           saveSeance() : remplace tous les blocs plutôt qu'un diff incrémental
  mon-plan/              parcours athlète, protégé
    page.tsx               accueil : séance du jour ou prochaine séance, countdown compét. A, volume de la semaine
    calendrier/            lecture seule pour les séances (liste verticale semaine mobile / grille mois desktop via CSS) ; les notes de calendrier, elles, sont éditables ici (voir note_calendrier ci-dessous)
    seances/[seanceId]/    détail (blocs en clair, allures réelles) + formulaire de retour (3 taps max)
    _lib/current-athlete.ts résout la session vers la ligne athlete (auth_user_id)
    _components/bloc-list.tsx rendu lecture seule des blocs, contraste fort / valeurs en grand
components/ui/          composants shadcn/ui
components/calendar-note-dialog.tsx  NoteDialog/NoteChip/AddNoteButton — partagés entre le calendrier admin et /mon-plan/calendrier, actions passées en props (le composant ignore lequel des deux actions.ts les fournit)
lib/
  paces.ts              calcul des zones d'allure et de FC (Riegel + config des coefficients)
  volume.ts             calcul du volume (distance/durée) d'une séance à partir de ses blocs
  mappers.ts             conversion lignes Supabase (snake_case) -> types lib/paces, lib/volume
  date.ts                nowInParis() : "aujourd'hui" ancré Europe/Paris, jamais new Date() nu
  labels.ts               labels français pour les enums bruts sans lib dédiée (ex: seance_type)
  athlete-login.ts         mapping identifiant <-> email interne synthétique pour la connexion par mot de passe
  auth-destination.ts      résout où rediriger après connexion (/admin ou /mon-plan) selon profile.is_admin
  paces.test.ts
  volume.test.ts
utils/supabase/
  client.ts              client Supabase navigateur
  server.ts               client Supabase Server Components / Server Actions
  middleware.ts           rafraîchissement de session (appelé par proxy.ts racine)
  admin.ts                 client service_role (auth.admin.*), Server Actions only, jamais côté client
proxy.ts                 wiring Next.js du rafraîchissement de session Supabase (convention "proxy", ex-middleware.ts)
supabase/migrations/     migrations SQL (schéma + RLS + seed)
```

## Modèle de données — décisions clés

- **`seance` : une seule table avec discriminant `est_modele`**, plutôt que deux tables liées (bibliothèque vs occurrence planifiée). Le schéma est quasi identique entre les deux cas, et appliquer un modèle de bibliothèque à un athlète devient un `INSERT ... SELECT` qui copie les lignes de `bloc_seance` — pas de jointure inter-tables à gérer partout ailleurs. Une séance de bibliothèque appliquée à un athlète est **copiée**, jamais référencée : la modifier ensuite pour cet athlète ne touche pas la bibliothèque.
- **`bloc_seance`** est la brique centrale. Un bloc peut avoir des sous-blocs via `parent_bloc_id` auto-référent (profondeur max 2), pour représenter par ex. "6 x (400m Z5 + 1min récup)".
- **`type` de `seance`** inclut `cross_training` en plus de l'enum initial (endurance, seuil, vma, fractionne_court, fractionne_long, cote, sortie_longue, allure_specifique, recuperation, renforcement, repos, competition, test) — pour couvrir les séances hors course (vélo, escalade...) observées dans les plans réels du coach. Pour ce type, les blocs restent en `mode_duree = libre` et `cible_type = libre` : pas de champ supplémentaire au schéma.
- **`cible_rpe`** reste un entier unique 1-10 (pas de min/max). Le coach note parfois "RE 6/7" sur le papier, mais ça se résout en une seule valeur saisie (ex: 7), pas une plage stockée.
- **Contrainte export FIT (post-V1)** : chaque colonne de `bloc_seance` est pensée pour être traduisible directement en étape de workout FIT (type d'étape, condition de fin en durée/distance, cible en allure ou FC avec bornes). Aucune donnée structurante en texte libre. Voir [README.md](./README.md).
- **Zones d'allure et de FC** : logique isolée dans `lib/paces.ts`, coefficients dans un objet de config exporté et documenté (ajustable sans relire la logique). Formule de Riegel pour les équivalences entre distances, performance réelle la plus récente comme base, 5k/10k préférés au marathon pour estimer le seuil.
- **Volume d'une séance** : calculé automatiquement depuis les blocs (distance totale estimée en km, durée totale en minutes), avec conversion temps ↔ distance dans les deux sens via l'allure cible de l'athlète (milieu de la zone visée). Logique isolée dans `lib/volume.ts`. Un flag `estimationComplete` redescend à `false` quand un bloc visait une zone d'allure/FC mais que l'athlète n'a aucune performance de référence — pas quand la cible est `libre`/`rpe`, ce qui est un cas normal.
- **Sélection de la performance de référence** (`lib/paces.ts`) : parmi les performances `reel`, on prend d'abord la distance la plus fiable disponible (5k/10k > semi > marathon), puis la plus récente à fiabilité égale. Un marathon récent ne prime donc pas sur un 10k plus ancien mais plus fiable — la fiche athlète affiche la performance retenue pour que ce soit vérifiable en un coup d'œil.
- **Zones manuelles** (`zone_manuelle`) : le coach peut surcharger, zone par zone, la valeur calculée (allure et/ou FC indépendamment) — pour les athlètes sans performance de référence exploitable, ou trop novices pour que l'estimation Riegel ait un sens. Une ligne par `(athlete_id, zone)` réellement saisie ; les zones non surchargées retombent sur le calcul automatique. `lib/paces.ts` expose `resolvePaceZones`/`resolveHeartRateZones` (fusion override + calcul, avec un flag `isManual`) et `getAthletePaceZone` accepte les overrides en 3e paramètre — toutes les fonctions qui consomment une zone réelle (volume, aperçu séance, vue athlète) les propagent en plus des performances.
- **`note_calendrier`** : annotation libre (titre, couleur, texte optionnel) sur un ou plusieurs jours consécutifs (`date_debut`/`date_fin`), distincte de `athlete_note` (un unique bloc de texte coach-only sur la fiche athlète). Affichée identiquement des deux côtés (titre + couleur, cliquable pour éditer) via le composant partagé `components/calendar-note-dialog.tsx`. C'est la seule autre table, avec `retour_seance`, où l'athlète a un accès en écriture (voir Sécurité) — ici sans aucune restriction (le coach comme l'athlète créent/modifient/suppriment librement leurs propres notes).
- **Distance d'une compétition** (`competition.distance`) : texte libre plutôt que l'enum `distance_ref` — les compétitions réelles du coach (trails avec D+, distances non standards) ne rentrent pas dans 5k/10k/semi/marathon. `denivele_metres_dplus` est un champ optionnel séparé, purement informatif (pas encore consommé par un calcul).

## Sécurité

- **Une seule méthode de connexion pour tout le monde, identifiant + mot de passe** (`app/login/actions.ts`) — pas de magic link, pas d'email envoyé par l'app. Simplifie le déploiement (aucun SMTP/domaine à configurer côté Supabase) et évite qu'un athlète ait à gérer un email pour ça.
  - Tout identifiant (coach compris) s'appuie sur un compte Supabase Auth classique avec un email interne synthétique (`identifiant@appcoaching.internal`, jamais résolu ni envoyé) et un mot de passe — pas un système d'auth parallèle, pas de distinction de cas dans `signIn` (app/login/actions.ts) : un identifiant, un email synthétique, un `signInWithPassword`, quel que soit qui se connecte.
  - `athlete.identifiant` sert aussi de slug d'URL admin (`/admin/athletes/[identifiant]`, au lieu de l'UUID) — obligatoire et unique pour tout athlète, que le coach configure ou non des identifiants de connexion dessus. Le coach n'a pas de ligne `athlete` ni de table dédiée pour son propre identifiant (`jeremie`) — un seul coach, pas besoin d'une abstraction pour un cas qui ne peut pas encore arriver ; son compte Auth existant a simplement été repointé sur l'email synthétique correspondant.
  - Comptes créés/modifiés via `auth.admin.createUser`/`updateUserById` (`utils/supabase/admin.ts`, clé service_role, jamais exposée au client, jamais importée hors des Server Actions qui en ont besoin).
  - Un athlete_id ne pointe que vers UN auth_user_id : configurer l'identifiant sur un athlète déjà lié à un compte crée un nouveau compte et re-pointe le lien plutôt que d'écraser l'ancien en place (`setAthleteCredentials` vérifie si le compte lié est déjà un compte "interne" avant de décider update vs create).
  - Pas de réinitialisation de mot de passe en self-service (aucun email envoyé) : le coach réinitialise le code d'un athlète depuis sa fiche ; pour son propre compte, il faut passer par le dashboard Supabase (Authentication → Users) ou une intervention manuelle côté service_role.
- RLS Postgres : un athlète ne voit que ses propres données, et ne peut écrire que dans `retour_seance` (sur ses propres séances, occurrences pas modèles) et `note_calendrier` (sans restriction sur ses propres notes).
- Rôle admin porté par un champ sur le profil, pas par une liste d'emails en dur.
- Policies RLS écrites explicitement et commentées dans les migrations.
- Persistance de session : gérée nativement par les cookies `@supabase/ssr` (refresh token, pas d'expiration forcée côté projet) — aucun code custom nécessaire. Un test qui semble "se déconnecter tout seul" est probablement fait en navigation privée.

## Hors périmètre V1

Import Strava/Garmin, notifications, export FIT effectif, multi-coach, graphiques de charge dans le temps, application native. Le modèle de données ne doit pas fermer la porte à ces usages (voir contrainte export FIT ci-dessus).

## État d'avancement

- [x] Étape 0 — Socle du projet (scaffold Next.js, Tailwind, shadcn/ui, Supabase env/client/middleware, git init)
- [x] Étape 1 — Modèle de données (migration SQL, RLS, seed appliqués au projet distant, types TS générés dans `lib/database.types.ts`)
- [x] Étape 2 — Logique métier (`lib/paces.ts`, `lib/volume.ts`, 18 tests Vitest)
- [x] Étape 3 — Authentification (identifiant + mot de passe pour tout le monde, protection des routes dans `proxy.ts`) — magic link retiré au profit d'une connexion unique, plus simple, sans email
- [x] Étape 4 — Admin : athlètes (liste `/admin` avec création "+ Nouvel athlète", fiche `/admin/athletes/[identifiant]` avec zones calculées en clair et notes coach éditables)
- [x] Étape 5 — Admin : calendrier (`/admin/athletes/[identifiant]/calendrier`, vues mois/semaine × détaillé/compact, drag and drop, ajout bibliothèque/custom, duplication de semaine). Redessiné selon la maquette : sidebar switcher d'athlète + zones de référence toujours visibles, barre colorée par type de séance, barre de statut retour (plein/rayé/gris), volume réel/prévu en case, compétitions intégrées à la grille
- [x] Étape 6 — Éditeur de séance (`/admin/athletes/[identifiant]/seances/[seanceId]`), Bibliothèque (`/admin/bibliotheque`, filtre type + recherche titre — pas de filtre "tag" : ce champ n'existe pas dans le modèle de données malgré la mention dans le prompt initial), Retours (`/admin/retours`, chronologique, 100 derniers)
- [x] Étape 7 — Athlète (`/mon-plan`)
- [x] Étape 8 — QA responsive + finalisation (page d'accueil, `error.tsx`/`not-found.tsx`/`robots.ts`, safe-area iOS sur la nav mobile, confirmations et retours d'erreur sur les actions destructrices ou fire-and-forget, états vides manquants, petites incohérences de fuseau horaire et d'accessibilité)
(spec-kit `specs/001-qa-responsive-finalisation/`). Audit statique effectué (pas d'accès navigateur dans cette session) : 2 bugs réels corrigés (calendrier admin sans protection de débordement horizontal ; aperçu live de l'éditeur de séance en largeur fixe qui poussait l'éditeur hors écran sous ~1050px) + 1 amélioration mineure (filtres bibliothèque). Reste à faire : validation visuelle réelle dans un navigateur (T007, T015, T016, T019 de `tasks.md`) avant de cocher cette étape.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
