# Data Model: Export de séance vers device

Aucune nouvelle table ni colonne. Cette feature lit `seance`, `bloc_seance`, `performance_reference`, `zone_manuelle` et `athlete` (déjà en place) et produit un fichier `.fit` à la volée — rien n'est persisté (FR-010).

## Entrée : `SeanceExportInput` (nouveau type, `lib/fit-export.ts`)

Assemblée par le Route Handler à partir des mêmes requêtes que les pages `seances/[seanceId]` existantes (voir `research.md#4`), puis passée à la fonction pure de génération.

| Champ | Origine | Notes |
|---|---|---|
| `titre` | `seance.titre` | Utilisé dans le nom de fichier et le nom du workout FIT. |
| `datePrevue` | `seance.date_prevue` | Utilisé dans le nom de fichier. |
| `type` | `seance.type` | Informatif (nom du workout) ; `cross_training` implique que tous les blocs sont en `cible_type = libre` (déjà garanti par le modèle existant). |
| `blocs` | `bloc_seance` (toute la séance, triés par `ordre`) | Passés via `toBlocSeanceInput` + `role`/`cibleRpe`/`commentaire` (déjà réunis par `BlocDisplayItem` dans `lib/mappers.ts` — réutilisé tel quel). |
| `performances` | `performance_reference` de l'athlète | Réutilisé tel quel (`toPerformanceReference`). |
| `zoneOverrides` | `zone_manuelle` de l'athlète | Réutilisé tel quel (`toZoneManualOverrides`). |
| `fcMax` | `athlete.fc_max` | Pour résoudre les zones FC (`getAthleteHeartRateZone`). |

## Sortie : buffer `.fit`

Un `Uint8Array`/`Buffer` produit par `@garmin/fitsdk` `Encoder`, contenant :

- 1 message `file_id` (`type: "workout"`).
- 1 message `workout` (nom = `titre` de la séance, sport = running sauf `cross_training`).
- N messages `workout_step`, un par bloc (récursion sur l'arbre `bloc_seance`, profondeur max 2 déjà garantie par le schéma — voir `research.md#5`).

## Mapping bloc → `workout_step`

C'est le cœur de la logique métier de cette feature (fonction pure testable en Vitest, sans dépendance à l'Encoder pour la partie mapping).

### Condition de fin (`duration_type` / `duration_value`)

| `bloc_seance.mode_duree` | `workout_step.duration_type` | `duration_value` |
|---|---|---|
| `distance` | `distance` | `distance_metres` (converti dans l'unité attendue par le SDK) |
| `temps` | `time` | `duree_secondes` (converti dans l'unité attendue par le SDK) |
| `libre` | `open` | — |

### Cible (`target_type` / bornes)

| `bloc_seance.cible_type` | Résolution | `workout_step.target_type` | Bornes |
|---|---|---|---|
| `zone_allure` | `getAthletePaceZone(cible_zone, performances, zoneOverrides)` | `speed` | `custom_target_speed_low/high` dérivées de `minSecondsPerKm`/`maxSecondsPerKm` (conversion allure → vitesse) |
| `allure_absolue` | `cible_allure_secondes_par_km` directement | `speed` | bornes égales (pas de plage), ou légère tolérance — à trancher en implémentation, hors périmètre du plan |
| `zone_fc` | `getAthleteHeartRateZone(cible_zone, fcMax, zoneOverrides)` | `heart_rate` | `custom_target_heart_rate_low/high` = `minBpm`/`maxBpm` |
| `rpe` | — | `open` | aucune, `cible_rpe` reporté dans le nom/note de l'étape (FR-005) |
| `libre` | — | `open` | aucune ; `commentaire` reporté dans le nom/note de l'étape si présent |

**Cas non disponible** : si `zone_allure`/`zone_fc` ne peut pas être résolu (`available: false`, athlète sans performance de référence exploitable), l'étape est générée en `target_type = open` plutôt que d'échouer — conforme à l'Acceptance Scenario 3 de la User Story 1.

### Répétitions (`repeat_steps`)

- Un bloc avec `repetitions > 1` et sans enfants devient une paire d'étapes : l'étape elle-même, suivie d'une étape `duration_type = repeat_until_steps_cmplt` qui la référence `repetitions` fois (mécanique standard du profil `workout` FIT pour représenter une répétition d'une seule étape).
- Un bloc avec `repetitions > 1` et des sous-blocs (profondeur 2) devient : les étapes des sous-blocs (dans l'ordre), suivies d'une étape `repeat_until_steps_cmplt` référençant cette plage `repetitions` fois.
- Un bloc avec `repetitions = 1` (valeur par défaut) ne génère aucune étape de répétition, juste son étape propre (ou celles de ses enfants, à plat).

### Métadonnées portées dans le libellé de l'étape (`wkt_step_name`)

- `role` (`echauffement`/`corps`/`recuperation`/`retour_au_calme`/`gammes`) → informe `intensity` du `workout_step` (`warmup`/`active`/`rest` ou `recovery`/`cooldown`/`active`) et peut préfixer le nom affiché sur la montre.
- `commentaire` et `cible_rpe`, quand présents, sont ajoutés au nom de l'étape (troncature à la longueur max acceptée par le champ FIT `wkt_step_name`, à vérifier en implémentation).

## Aide contextuelle (contenu statique, pas une entité de données)

Deux blocs de texte (Apple Watch, Suunto) associés à l'action d'export, décrivant le parcours réel (voir `spec.md`, User Story 3). Pas de table ni de configuration dynamique : contenu en dur dans le composant, cohérent avec la Constitution (Principe I — pas d'abstraction pour un besoin qui ne varie pas).
