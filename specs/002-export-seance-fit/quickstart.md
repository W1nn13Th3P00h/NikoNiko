# Quickstart : validation de l'export de séance

## Prérequis

- Base Supabase locale ou distante avec au moins un athlète ayant :
  - une performance de référence `reel` (5k ou 10k) pour tester la résolution de zone d'allure/FC,
  - une séance structurée assignée avec : un bloc simple, un bloc avec `repetitions > 1`, un bloc avec sous-blocs (profondeur 2), et au moins un bloc par `cible_type` (`zone_allure`, `allure_absolue`, `zone_fc`, `rpe`, `libre`).
- `npm install` exécuté après ajout de `@garmin/fitsdk` aux dépendances.

## Vérification fonctionnelle (`npm run dev`)

1. Se connecter en tant qu'athlète, ouvrir `/mon-plan/seances/[seanceId]` sur la séance de test → le bouton d'export est visible.
2. Cliquer sur "Exporter" → un fichier `.fit` est téléchargé, nommé `<date>-<titre>.fit`.
3. Ouvrir une séance de repos/vide → le bouton d'export est absent.
4. Se connecter en tant que coach, ouvrir `/admin/athletes/[identifiant]/seances/[seanceId]` sur la même séance → même bouton, même fichier obtenu.
5. Ouvrir `/admin/bibliotheque/[seanceId]` (modèle sans athlète) → pas de bouton d'export.

## Vérification du contenu du fichier

Décoder le fichier obtenu avec le `Decoder` du même SDK (`@garmin/fitsdk`) dans un script ponctuel, ou un lecteur `.fit` en ligne, et vérifier :
- un message `workout` avec le bon nom,
- un `workout_step` par bloc dans le bon ordre,
- les bornes numériques d'allure/FC correspondant à ce qu'affiche `/mon-plan/seances/[seanceId]` à l'écran pour les mêmes blocs,
- les étapes `rpe`/`libre` présentes en `target_type = open` avec l'information textuelle attendue,
- la répétition (bloc à `repetitions > 1`) traduite en étape `repeat_until_steps_cmplt` référençant le bon nombre d'étapes et le bon compte.

## Vérification device (manuelle, hors CI)

- **Suunto** : importer le fichier via le pont documenté (ex: intervals.icu → sync Suunto) et vérifier que la séance apparaît structurée dans l'app Suunto.
- **Apple Watch** : importer le fichier dans une app tierce (WatchFit ou Watchletic) et vérifier qu'elle propose de l'envoyer à la montre avec les étapes correctes.

Ces deux vérifications device correspondent à SC-003 de la spec et ne sont pas automatisables — à documenter (capture d'écran ou note) plutôt qu'à bloquer sur un test automatisé.

## Tests automatisés

- `lib/fit-export.test.ts` (Vitest) : couvre le mapping bloc → étape (conditions de fin, cibles, répétitions, cas non disponible) en isolant la logique pure de l'appel à l'`Encoder`, sur le modèle de `lib/paces.test.ts`/`lib/volume.test.ts` déjà en place.
