# CLAUDE.md

Documentation d'architecture pour ce projet. À tenir à jour à chaque étape.

## Contexte

Application privée de suivi de plans d'entraînement en course à pied. Un coach (admin) construit les plans, une dizaine d'athlètes consultent leurs séances. Pas de SaaS, pas de multi-coach, pas de facturation.

- Mobile-first côté athlète (`/mon-plan`) : consultation depuis le téléphone, souvent juste avant de courir.
- Desktop-first côté admin (`/admin`) : construction des plans.

## Stack

- Next.js (App Router, TypeScript strict, React Server Components par défaut, Server Actions pour les mutations)
- Supabase : Postgres + Auth (magic link) + Row Level Security
- Tailwind CSS + shadcn/ui
- date-fns, timezone Europe/Paris, semaines commençant le lundi
- Vitest pour les tests unitaires
- Déploiement cible : Vercel

Pas de state manager global tant que le besoin n'est pas prouvé.

## Conventions

- Interface entièrement en français, code et commentaires en anglais.
- TypeScript strict, pas de `any`.
- Commentaires uniquement quand le "pourquoi" n'est pas évident (contrainte cachée, invariant, contournement).
- Pas d'abstraction ou de gestion d'erreur pour des cas qui ne peuvent pas arriver.

## Structure

```
app/                    routes (App Router)
  login/                page + Server Action d'envoi du magic link
  auth/confirm/         Route Handler qui échange token_hash contre une session
  apres-connexion/      aiguille vers /admin ou /mon-plan selon profile.is_admin
  actions/auth.ts        Server Action de déconnexion
  admin/                parcours coach, protégé
  mon-plan/              parcours athlète, protégé
components/ui/          composants shadcn/ui
lib/
  paces.ts              calcul des zones d'allure et de FC (Riegel + config des coefficients)
  volume.ts             calcul du volume (distance/durée) d'une séance à partir de ses blocs
  paces.test.ts
  volume.test.ts
utils/supabase/
  client.ts              client Supabase navigateur
  server.ts               client Supabase Server Components / Server Actions
  middleware.ts           rafraîchissement de session (appelé par proxy.ts racine)
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

## Sécurité

- Magic link Supabase Auth pour tout le monde.
- RLS Postgres : un athlète ne voit que ses propres données, et ne peut écrire que dans `retour_seance` sur ses propres séances (occurrences, pas modèles).
- Rôle admin porté par un champ sur le profil, pas par une liste d'emails en dur.
- Policies RLS écrites explicitement et commentées dans les migrations.

## Hors périmètre V1

Import Strava/Garmin, notifications, export FIT effectif, multi-coach, graphiques de charge dans le temps, application native. Le modèle de données ne doit pas fermer la porte à ces usages (voir contrainte export FIT ci-dessus).

## État d'avancement

- [x] Étape 0 — Socle du projet (scaffold Next.js, Tailwind, shadcn/ui, Supabase env/client/middleware, git init)
- [x] Étape 1 — Modèle de données (migration SQL, RLS, seed appliqués au projet distant, types TS générés dans `lib/database.types.ts`)
- [x] Étape 2 — Logique métier (`lib/paces.ts`, `lib/volume.ts`, 18 tests Vitest)
- [x] Étape 3 — Authentification (magic link via `token_hash`/`verifyOtp`, protection des routes dans `proxy.ts`) — nécessite un réglage manuel ponctuel du template email dans le dashboard Supabase, voir README.md
- [ ] Étape 4 — Admin : athlètes
- [ ] Étape 5 — Admin : calendrier
- [ ] Étape 6 — Admin : éditeur de séance + bibliothèque
- [ ] Étape 7 — Athlète (`/mon-plan`)
- [ ] Étape 8 — QA responsive + finalisation

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
