# Quickstart: QA responsive et finalisation V1

Guide de validation manuelle pour vérifier que chaque page du périmètre respecte les critères de
succès du [spec.md](./spec.md).

## Prérequis

- `.env.local` configuré (Supabase) comme pour le développement habituel du projet.
- Un compte coach (admin) et au moins un compte athlète de test, avec :
  - au moins un athlète ayant une performance de référence (zones calculables) et un autre sans,
  - au moins une semaine de calendrier avec plusieurs séances sur un même jour,
  - une séance avec des sous-blocs (profondeur 2),
  - un titre de séance, une note coach et un commentaire de retour anormalement longs (test FR-006).

## Lancer l'environnement

```bash
npm run dev
```

Utiliser les DevTools du navigateur (mode responsive) pour tester aux largeurs de référence :
**320px**, **375px** (mobile — parcours athlète), **1280px**, **1440px** (desktop — parcours admin),
puis un balayage continu entre 375px et 1280px pour la non-régression (US3).

## Parcours à valider

### Athlète (mobile — 320px et 375px)

1. `/mon-plan` — accueil : séance du jour/prochaine séance, countdown compét. A, volume semaine.
2. `/mon-plan/calendrier` — liste verticale de la semaine.
3. `/mon-plan/seances/[seanceId]` — détail des blocs (y compris sous-blocs) + formulaire de retour.

Pour chacune : pas de défilement horizontal, pas de texte tronqué illisible, toutes les actions
atteignables au tap. Cf. SC-001, SC-002.

### Admin (desktop — 1280px et 1440px)

1. `/admin` — liste des athlètes (tester avec un nom/volume/libellé long).
2. `/admin/athletes/[identifiant]` — fiche athlète (zones, perfs, compétitions, notes éditables).
3. `/admin/athletes/[identifiant]/calendrier` — vues mois/semaine × détaillé/compact, drag and drop,
   duplication de semaine.
4. `/admin/athletes/[identifiant]/seances/[seanceId]` — éditeur bloc par bloc + aperçu live.
5. `/admin/bibliotheque` et `/admin/bibliotheque/[seanceId]` — filtre type + recherche + édition.
6. `/admin/retours` — 100 derniers retours, y compris un commentaire long.

Pour chacune : pas de chevauchement d'éléments interactifs, pas de contenu hors champ, actions clés
(drag and drop, sauvegarde, filtre/recherche) exécutables de bout en bout. Cf. SC-001, SC-003, SC-004.

### Largeurs intermédiaires (375–1280px, P3)

Redimensionner progressivement chaque page ci-dessus et vérifier l'absence de rupture bloquante
(élément totalement inaccessible ou contenu totalement illisible). Cf. FR-008.

## Definition of Done

- Toutes les cases de la checklist ci-dessus passent sans correction restante.
- `CLAUDE.md` : Étape 8 cochée.
- Aucun test Vitest existant cassé (`npm test`).
