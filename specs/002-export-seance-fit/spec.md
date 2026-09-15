# Feature Specification: Export de séance vers device

**Feature Branch**: `export-seance`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Export manuel de séances structurées vers device (Apple Watch, Suunto en priorité V1 ; Garmin et Coros en V2/itération suivante). L'athlète (et le coach depuis l'éditeur) peut, depuis la page détail d'une séance, télécharger un fichier .fit représentant la séance structurée (blocs, cibles d'allure/FC/RPE, répétitions), afin de l'importer dans son app compagnon (ex: app Suunto, ou une app tierce iOS type WatchFit/Watchletic pour Apple Watch) puis de suivre la séance guidée sur sa montre. Pas d'intégration API tierce en V1 : juste la génération et le téléchargement du fichier .fit, plus une aide contextuelle expliquant le parcours par device."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - L'athlète télécharge sa séance pour la montre (Priority: P1)

Un athlète ouvre le détail d'une séance qui lui est assignée et télécharge un fichier représentant sa séance structurée, pour l'importer ensuite dans son app compagnon (Suunto, ou une app tierce pour Apple Watch) et la suivre guidée pendant qu'il court.

**Why this priority**: C'est la valeur centrale de la fonctionnalité — sans ce téléchargement, rien d'autre n'a d'utilité. C'est aussi le cas d'usage déclaré comme prioritaire par les utilisateurs actuels (Apple Watch, Suunto).

**Independent Test**: Peut être testé en ouvrant `/mon-plan/seances/[seanceId]` pour une séance structurée assignée à un athlète disposant de zones d'allure/FC, en téléchargeant le fichier, puis en vérifiant que son contenu correspond aux blocs affichés à l'écran.

**Acceptance Scenarios**:

1. **Given** une séance structurée (ex: fractionné avec blocs et répétitions) assignée à un athlète avec des zones d'allure calculées, **When** l'athlète clique sur "Exporter" sur le détail de la séance, **Then** un fichier est téléchargé et contient l'ensemble des blocs, sous-blocs, répétitions et cibles avec leurs valeurs numériques réelles.
2. **Given** une séance sans contenu structuré exportable (ex: repos, séance vide), **When** l'athlète consulte le détail de la séance, **Then** aucune option d'export ne lui est proposée.
3. **Given** un bloc ciblant une zone d'allure ou de FC pour laquelle l'athlète n'a aucune performance de référence exploitable, **When** l'athlète exporte la séance, **Then** le fichier est tout de même généré, avec ce bloc en étape "libre" plutôt que de bloquer l'export.

---

### User Story 2 - Le coach exporte depuis l'éditeur pour vérifier une séance (Priority: P2)

Le coach, en train de construire ou d'ajuster une séance pour un athlète dans l'éditeur, télécharge le même fichier pour vérifier son rendu avant que l'athlète ne s'en serve, ou pour la déposer lui-même sur son propre device de test.

**Why this priority**: Utile pour fiabiliser la fonctionnalité et gagner en autonomie de vérification, mais non bloquant pour la valeur livrée à l'athlète (P1 fonctionne seul).

**Independent Test**: Peut être testé en ouvrant l'éditeur d'une séance assignée à un athlète (`/admin/athletes/[identifiant]/seances/[seanceId]`) et en déclenchant le même téléchargement que côté athlète.

**Acceptance Scenarios**:

1. **Given** une séance assignée à un athlète ouverte dans l'éditeur admin, **When** le coach clique sur "Exporter", **Then** il obtient le même fichier que celui que l'athlète téléchargerait pour cette séance.
2. **Given** une séance de bibliothèque (modèle, sans athlète assigné) ouverte dans l'éditeur, **When** le coach consulte la page, **Then** aucune option d'export ne lui est proposée (pas de zones d'allure/FC réelles à résoudre sans athlète).

---

### User Story 3 - Comprendre comment importer le fichier sur son device (Priority: P3)

Au moment de télécharger, l'athlète (ou le coach) voit une explication courte du parcours réel pour faire arriver la séance sur une Apple Watch ou une montre Suunto, puisque ce parcours n'est pas un simple glisser-déposer sur ces deux plateformes.

**Why this priority**: Sans cette aide, le fichier téléchargé risque de ne mener nulle part pour une bonne partie des utilisateurs (Suunto et Apple Watch n'ont pas d'import natif direct) — mais la valeur du téléchargement en lui-même (P1) existe indépendamment de cette aide.

**Independent Test**: Peut être testé en déclenchant un export et en vérifiant qu'un contenu d'aide, distinct pour Apple Watch et pour Suunto, est visible sans action supplémentaire.

**Acceptance Scenarios**:

1. **Given** un athlète qui vient de télécharger le fichier de sa séance, **When** il consulte l'aide associée, **Then** il trouve les étapes concrètes pour l'utiliser avec une app compagnon Suunto d'une part, et avec une app tierce Apple Watch d'autre part.

---

### Edge Cases

- Séance de repos, séance vide, ou séance de type `cross_training` (toujours en cible libre) : bouton d'export absent ou étape exportée sans cible chiffrée.
- Bloc ciblant une zone d'allure/FC mais athlète sans performance de référence exploitable (`estimationComplete = false`) : export non bloqué, étape "libre" avec mention de la zone visée dans le libellé.
- Bloc en cible RPE ou libre : pas d'équivalent chiffré, exporté comme étape "libre" avec la consigne en texte.
- Sous-blocs / répétitions imbriquées (profondeur 2) : doivent rester lisibles dans le fichier (répétitions imbriquées si le format le permet, sinon séquence à plat clairement nommée).
- Zones d'allure/FC surchargées manuellement par le coach (`zone_manuelle`) : ce sont ces valeurs, et non le calcul automatique, qui doivent apparaître dans le fichier.
- Séance de bibliothèque (modèle, sans athlète) : hors périmètre de l'export tant qu'elle n'est pas appliquée à un athlète.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un athlète de télécharger, depuis le détail d'une séance qui lui est assignée, un fichier représentant la structure complète de cette séance.
- **FR-002**: Le système DOIT permettre au coach de télécharger, depuis l'éditeur d'une séance assignée à un athlète, le même fichier que celui que verrait cet athlète.
- **FR-003**: Le fichier exporté DOIT représenter fidèlement : les blocs et sous-blocs dans leur ordre, les répétitions, les conditions de fin (durée ou distance), et les cibles (zone d'allure, zone de FC, RPE, libre).
- **FR-004**: Quand un bloc vise une zone d'allure ou de FC résolvable pour l'athlète (calculée ou surchargée manuellement), le fichier DOIT porter les valeurs numériques réelles de cette zone, pas seulement son nom.
- **FR-005**: Quand un bloc n'a pas de cible chiffrable (RPE, libre) ou que l'estimation est incomplète faute de performance de référence, le fichier DOIT rester généré (étape sans cible numérique, avec l'information textuelle disponible) plutôt que bloquer l'export.
- **FR-006**: Le système DOIT afficher, au moment du téléchargement, une aide contextuelle décrivant le parcours réel d'import pour Apple Watch et pour Suunto, y compris le recours à une application compagnon tierce quand il est nécessaire.
- **FR-007**: Le téléchargement NE DOIT PAS dépendre d'un service tiers ni d'un appel réseau externe : le fichier est généré et servi par l'application elle-même.
- **FR-008**: Le nom du fichier téléchargé DOIT permettre d'identifier la séance sans l'ouvrir (a minima la date et le titre de la séance).
- **FR-009**: L'option d'export NE DOIT PAS être proposée pour une séance sans contenu structuré exportable (repos, séance vide) ni pour une séance de bibliothèque sans athlète assigné.
- **FR-010**: Le fichier exporté NE DOIT PAS être conservé côté serveur au-delà de sa génération : chaque téléchargement le régénère depuis l'état courant de la séance.

### Key Entities

- **Export de séance** : représentation ponctuelle et non persistée d'une séance existante (blocs, cibles résolues pour l'athlète), générée à la demande au moment du téléchargement.
- **Aide contextuelle d'import** : contenu explicatif par device (Apple Watch, Suunto) associé à l'action d'export, décrivant le parcours réel côté utilisateur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un athlète peut lancer le téléchargement du fichier de n'importe laquelle de ses séances structurées en un seul geste depuis son détail de séance.
- **SC-002**: Sur un échantillon de séances couvrant blocs simples, répétitions imbriquées, et les quatre types de cible (allure, FC, RPE, libre), 100% des blocs à cible chiffrable apparaissent avec la bonne valeur numérique dans le fichier généré.
- **SC-003**: Le fichier généré est importé avec succès, lors d'un test manuel, à la fois via le pont Suunto documenté et via une app tierce Apple Watch (WatchFit ou Watchletic), sans modification manuelle du fichier.
- **SC-004**: Un athlète suit l'aide contextuelle et mène l'import à bien sur son device sans solliciter le coach.

## Assumptions

- **Format de fichier** : `.fit` pour le V1. C'est le format que consomment, directement ou via une app-pont, à la fois Suunto (via un service tiers type intervals.icu) et Apple Watch (via une app tierce type WatchFit/Watchletic) — voir recherche de compatibilité menée avant cette spec. Le même fichier reste très probablement exploitable pour Garmin et Coros plus tard, mais leur parcours ne sera testé qu'en V2.
- **Garmin et Coros hors périmètre de test V1** : le code n'exclut pas techniquement ces devices, mais la vérification manuelle (SC-003) et l'aide contextuelle (FR-006) ne couvrent que Apple Watch et Suunto pour cette itération.
- **Aucune intégration tierce en V1** : pas d'appel à une API Suunto/Garmin/Apple/TrainingPeaks. L'utilisateur reste responsable d'amener le fichier jusqu'à son device via l'app compagnon de son choix.
- **Contexte athlète requis** : l'export a besoin de zones d'allure/FC résolues pour un athlète donné ; une séance de bibliothèque pure (sans athlète assigné) n'est pas exportable.
- **RPE et cibles libres** : sans équivalent chiffré dans le fichier, ces blocs sont exportés comme étapes "libres" portant l'information en texte, pas comme une erreur ou un blocage.
- **Pas de persistance** : le fichier est généré à la volée à chaque téléchargement, jamais stocké.
