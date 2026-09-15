# Research: Export de séance vers device

## 1. Format de fichier

**Décision** : `.fit` (Flexible and Interoperable Data Transfer), profil `workout` (messages `workout` + `workout_step`).

**Rationale** :
- C'est le format que la Constitution du projet (Principe IV) anticipe déjà : chaque colonne de `bloc_seance` est pensée pour être traduisible directement en étape FIT. Aucune migration de schéma n'est nécessaire pour cette feature.
- Recherche de compatibilité menée avant la spec (voir `specs/002-export-seance-fit/spec.md#assumptions`) : Suunto (via un pont type intervals.icu) et Apple Watch (via une app tierce type WatchFit/Watchletic) consomment tous les deux un fichier `.fit`, ce qui permet un seul format de sortie pour les deux devices prioritaires du V1.
- Garmin et Coros consomment également du `.fit` en pratique (copie directe sur device pour Garmin, import web pour Coros), donc rien n'empêche techniquement le même fichier de leur servir plus tard — seule la vérification manuelle (Suunto/Apple Watch) est dans le périmètre V1.

**Alternatives envisagées** :
- `.tcx` (Garmin Training Center XML) : lisible par plus d'outils mais moins bien supporté pour les séances *structurées* par les ponts Suunto/Apple Watch identifiés ; le `.fit` est la valeur sûre pour les deux devices prioritaires.
- Formats propriétaires par device (export différencié) : rejeté, sur-ingénierie pour un besoin qu'un seul format couvre déjà (Principe I — YAGNI).

## 2. Génération du fichier .fit en TypeScript/Node

**Décision** : `@garmin/fitsdk` (SDK officiel Garmin, publié sur npm, maintenu par Garmin — [github.com/garmin/fit-javascript-sdk](https://github.com/garmin/fit-javascript-sdk)). Utilisation de son `Encoder` pour écrire les messages `file_id`, `workout` et `workout_step`.

**Rationale** :
- SDK officiel plutôt qu'une lib tierce non maintenue : réduit le risque de divergence avec le format réellement lu par les devices/apps-ponts.
- Fournit directement l'`Encoder` avec gestion du header/CRC — pas besoin de ré-implémenter l'encodage binaire FIT à la main.
- Fonctionne côté serveur (Node.js), donc compatible avec un Route Handler Next.js en runtime Node (pas besoin du runtime Edge, non pertinent ici).

**Alternatives envisagées** :
- `@markw65/fit-file-writer`, `fit-encoder`, `fit-file-parser` (encodage) : libs communautaires plus légères mais non officielles ; rejetées au profit du SDK Garmin pour la fiabilité du mapping des champs.

## 3. Point de sortie HTTP (Next.js 16 App Router)

**Décision** : un Route Handler (`route.ts`) par contexte (athlète et admin), retournant une `Response` binaire avec `Content-Type` et `Content-Disposition: attachment`, plutôt qu'une Server Action.

**Rationale** :
- Vérifié dans la documentation Next.js embarquée (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) : les Route Handlers acceptent les API Web `Request`/`Response` standards, sans changement de comportement pertinent en v16.3.3 par rapport aux versions précédentes. `RouteContext<'/chemin/[param]'>` est la façon typée de récupérer les params dynamiques (types générés par `next dev`/`next build`).
- Un téléchargement de fichier binaire correspond à une lecture (`GET`), pas à une mutation : une Server Action forcerait un aller-retour supplémentaire (retourner un base64 au client, le convertir en Blob) sans bénéfice, alors qu'un lien `<a href=".../export">` déclenche nativement le téléchargement navigateur via un Route Handler.
- Le projet n'a aujourd'hui aucun Route Handler (`app/**/route.ts` n'existe pas) ; toutes les mutations passent par des Server Actions. Ce choix introduit donc le premier `route.ts` du projet — justifié précisément parce que ce n'est pas une mutation mais une réponse fichier.

**Alternatives envisagées** :
- Server Action retournant un base64 + déclenchement client d'un `Blob`/`<a download>` : fonctionne mais complexifie inutilement le flux pour un besoin que `GET` + `Content-Disposition` couvre nativement.

## 4. Vérification d'accès (sécurité)

**Décision** : chaque Route Handler reproduit exactement le filtre déjà utilisé par les pages existantes pour charger une séance :
- Côté athlète : `seance.athlete_id = <athlète courant résolu via getCurrentAthlete()>` et `est_modele = false`.
- Côté admin : `seance.athlete_id = <athlète résolu depuis [identifiant]>` et `est_modele = false`.

**Rationale** : c'est le même modèle d'accès que `app/mon-plan/seances/[seanceId]/page.tsx` et `app/admin/athletes/[identifiant]/seances/[seanceId]/page.tsx` appliquent déjà pour charger la séance et ses blocs — aucune nouvelle policy RLS n'est nécessaire (Principe III de la Constitution), l'export lit les mêmes tables que ces pages avec les mêmes contraintes.

## 5. Mapping profondeur des blocs vers les répétitions FIT

**Décision** : la profondeur max 2 de `bloc_seance` (bloc → sous-blocs via `parent_bloc_id`) correspond au niveau de nesting que le format FIT `workout_step` supporte nativement via son step de type "repeat" (une étape "repeat" référence une plage d'étapes précédentes, qui peuvent elles-mêmes contenir une autre étape "repeat"). Aucun aplatissement n'est nécessaire : la limite de profondeur du schéma est déjà alignée sur la limite pratique du format FIT.

**Rationale** : confirme que le Principe IV de la Constitution ("profondeur max 2" pensée pour l'export FIT) avait anticipé correctement cette contrainte — aucune surprise à ce stade du plan.
