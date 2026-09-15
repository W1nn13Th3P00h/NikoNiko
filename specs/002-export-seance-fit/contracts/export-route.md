# Contract : téléchargement du fichier de séance

Deux Route Handlers exposant le même comportement, avec un contrôle d'accès différent selon le contexte (athlète vs coach).

## `GET /mon-plan/seances/[seanceId]/export`

**Contexte** : athlète authentifié (session Supabase existante, résolue comme sur la page `page.tsx` du même dossier).

**Comportement** :
1. Résout l'athlète courant (`getCurrentAthlete()`). Pas de session → redirection `/login` (comportement déjà standard du parcours `/mon-plan`).
2. Charge `seance` filtrée sur `id = seanceId AND athlete_id = athlete.id AND est_modele = false`. Absente ou appartenant à un autre athlète → `404`.
3. Charge `bloc_seance`, `performance_reference`, `zone_manuelle`, `athlete.fc_max` (mêmes requêtes que `page.tsx`).
4. Si la séance n'a aucun bloc exportable → `404` (cohérent avec FR-009 : le bouton n'est de toute façon pas affiché dans ce cas, mais la route reste protégée si elle est appelée directement).
5. Génère le fichier `.fit` (`lib/fit-export.ts`).

**Réponse (succès)** :
- `200`
- `Content-Type: application/vnd.ant.fit`
- `Content-Disposition: attachment; filename="<date>-<titre-slugifie>.fit"`
- Corps : le buffer `.fit`.

**Réponses (erreur)** : `404` (séance introuvable, non assignée à cet athlète, ou modèle), `302` vers `/login` (session absente).

## `GET /admin/athletes/[identifiant]/seances/[seanceId]/export`

**Contexte** : coach authentifié (protection déjà assurée par `proxy.ts` sur le préfixe `/admin`).

**Comportement** : identique, mais résout l'athlète via `identifiant` (comme `app/admin/athletes/[identifiant]/seances/[seanceId]/page.tsx`) plutôt que via la session — pas de filtre `athlete_id` propre au coach puisqu'il gère tous les athlètes.

**Réponse** : identique au contrat ci-dessus.

## Nom de fichier

Format : `<yyyy-MM-dd>-<titre-slugifie>.fit` (ex: `2026-09-18-fractionne-vma.fit`), pour satisfaire FR-008 sans dépendre d'un champ supplémentaire.

## Non-couvert par ce contrat

- Pas de endpoint pour la bibliothèque (`/admin/bibliotheque/[seanceId]`) : hors périmètre (FR-009, pas d'athlète assigné donc pas de zones résolvables).
- Pas de export groupé (semaine, plan complet) : un fichier par séance uniquement, conforme à la spec.
