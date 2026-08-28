# Feature Specification: QA responsive et finalisation V1

**Feature Branch**: `001-qa-responsive-finalisation`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "QA responsive et finalisation de l'application (Étape 8 du roadmap CLAUDE.md) : vérifier et corriger l'affichage et l'ergonomie sur mobile (parcours athlète /mon-plan) et desktop (parcours admin), sur les pages déjà livrées (liste athlètes, fiche athlète, calendrier, éditeur de séance, bibliothèque, retours, accueil et calendrier athlète), avant de considérer la V1 comme terminée."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - L'athlète consulte son plan sur téléphone sans friction (Priority: P1)

Un athlète ouvre l'application sur son téléphone, souvent juste avant de partir courir, pour voir sa séance du jour, le détail d'une séance à venir, son calendrier de la semaine et pour laisser un retour après l'effort. Il doit pouvoir tout faire d'une main, sans zoomer, sans que le texte ou les boutons ne soient coupés ou superposés.

**Why this priority**: C'est l'usage le plus fréquent et le plus contraint de l'application (mobile, en extérieur, en peu de temps) ; une régression ici empêche l'usage quotidien pour lequel l'app existe.

**Independent Test**: Sur un écran de largeur mobile (375px et 320px), parcourir accueil → calendrier → détail d'une séance → envoi d'un retour, et vérifier qu'aucun contenu n'est coupé, tronqué ou inatteignable au doigt.

**Acceptance Scenarios**:

1. **Given** un athlète connecté sur un téléphone (largeur ≤ 375px), **When** il ouvre l'accueil `/mon-plan`, **Then** la séance du jour (ou la prochaine séance), le countdown de la compétition A et le volume de la semaine sont visibles sans défilement horizontal et sans texte tronqué.
2. **Given** un athlète sur `/mon-plan/calendrier` en mobile, **When** il consulte la liste verticale de la semaine, **Then** chaque jour et chaque séance associée restent lisibles et l'athlète peut ouvrir le détail d'une séance en un tap.
3. **Given** un athlète sur le détail d'une séance (`/mon-plan/seances/[seanceId]`), **When** la séance contient plusieurs blocs (y compris des sous-blocs), **Then** tous les blocs s'affichent lisiblement, dans l'ordre, avec un contraste fort et sans chevauchement.
4. **Given** un athlète sur le détail d'une séance déjà passée, **When** il remplit le formulaire de retour, **Then** les trois interactions du formulaire restent accessibles et utilisables sans défilement horizontal ni éléments qui se chevauchent, sur un écran de 320px de large.

---

### User Story 2 - Le coach construit et ajuste les plans sur desktop sans blocage visuel (Priority: P1)

Le coach utilise l'admin sur ordinateur pour parcourir la liste des athlètes, ouvrir une fiche athlète, construire ou modifier un calendrier d'entraînement (drag and drop, duplication de semaine), éditer une séance bloc par bloc, chercher dans la bibliothèque de séances modèles, et consulter les retours des athlètes. Aucune de ces actions ne doit être bloquée ou rendue peu fiable par un problème d'affichage.

**Why this priority**: C'est l'outil de travail quotidien du coach ; un défaut d'affichage ou une zone cliquable mal positionnée y a un impact direct sur la fiabilité perçue de l'app côté admin.

**Independent Test**: Sur une largeur desktop standard (1280px et 1440px), parcourir la liste des athlètes → fiche athlète → calendrier (vues mois et semaine, détaillé et compact) → éditeur de séance → bibliothèque → retours, et vérifier que chaque action clé (drag and drop, ajout de séance, sauvegarde, recherche/filtre) reste utilisable sans chevauchement ni élément hors champ.

**Acceptance Scenarios**:

1. **Given** le coach sur `/admin`, **When** la liste des athlètes contient un nom, un volume ou un libellé de compétition long, **Then** l'information reste lisible (tronquée proprement ou enroulée) sans casser l'alignement des colonnes/cartes.
2. **Given** le coach sur la fiche athlète, **When** il consulte les zones d'allure/FC calculées et les notes coach, **Then** l'édition des notes et l'affichage des zones restent utilisables sans chevauchement, y compris quand la liste des performances ou compétitions est longue.
3. **Given** le coach sur le calendrier (`/admin/athletes/[identifiant]/calendrier`), **When** il fait glisser une séance d'un jour à l'autre en vue mois compacte, **Then** la zone de dépôt reste visuellement identifiable et l'action aboutit sans que la grille ne se déforme.
4. **Given** le coach dans l'éditeur de séance, **When** il ajoute des blocs et sous-blocs jusqu'à la profondeur maximale supportée, **Then** l'éditeur et l'aperçu live restent lisibles côte à côte sans que l'un ne pousse l'autre hors de l'écran.
5. **Given** le coach sur `/admin/bibliotheque`, **When** il filtre par type et recherche un titre, **Then** les résultats et les contrôles de filtre/recherche restent visibles et utilisables simultanément.
6. **Given** le coach sur `/admin/retours`, **When** la liste affiche des commentaires longs parmi les 100 derniers retours, **Then** chaque entrée reste lisible sans déborder de sa carte/ligne.

---

### User Story 3 - Les pages restent utilisables aux largeurs intermédiaires (Priority: P3)

Un utilisateur (coach ou athlète) ouvre l'application sur une largeur d'écran intermédiaire (tablette, fenêtre desktop redimensionnée) plutôt que sur les formats de référence mobile ou desktop large.

**Why this priority**: Cas secondaire par rapport aux usages principaux mobile-athlète et desktop-admin, mais une casse totale à ces largeurs dégraderait la confiance dans l'app pour un usage occasionnel (ex: coach sur iPad).

**Independent Test**: Redimensionner chaque page listée entre 375px et 1280px de large par paliers et vérifier l'absence de rupture de mise en page (superposition, débordement, contenu inatteignable).

**Acceptance Scenarios**:

1. **Given** n'importe quelle page listée dans le périmètre, **When** la largeur de la fenêtre est comprise entre 375px et 1280px, **Then** il n'y a ni défilement horizontal involontaire ni élément qui recouvre un autre élément interactif.

---

### Edge Cases

- Que se passe-t-il quand un texte libre (titre de séance, note coach, commentaire de retour) est anormalement long ?
- Comment le calendrier admin affiche-t-il une semaine avec un grand nombre de séances sur un même jour (ex: séance planifiée + compétition) ?
- Que se passe-t-il sur un athlète sans aucune performance de référence (zones non calculables) sur les pages qui affichent normalement des zones d'allure/FC ?
- Comment l'éditeur de séance se comporte-t-il en mobile si un coach y accède exceptionnellement depuis son téléphone (l'admin reste desktop-first mais ne doit pas être totalement inutilisable) ?
- Que se passe-t-il en orientation paysage sur mobile pour les pages athlète ?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sur les largeurs mobiles de référence (320px et 375px), les pages `/mon-plan`, `/mon-plan/calendrier` et `/mon-plan/seances/[seanceId]` DOIVENT s'afficher sans défilement horizontal et sans contenu tronqué de façon illisible.
- **FR-002**: Sur `/mon-plan/seances/[seanceId]`, le formulaire de retour DOIT rester utilisable en 3 interactions maximum sur mobile, sans que ses éléments ne se chevauchent ou ne sortent de l'écran.
- **FR-003**: Sur les largeurs desktop de référence (1280px et 1440px), les pages `/admin`, `/admin/athletes/[identifiant]`, `/admin/athletes/[identifiant]/calendrier`, `/admin/athletes/[identifiant]/seances/[seanceId]`, `/admin/bibliotheque`, `/admin/bibliotheque/[seanceId]` et `/admin/retours` DOIVENT s'afficher sans chevauchement d'éléments interactifs ni contenu hors champ.
- **FR-004**: Le drag and drop d'une séance dans le calendrier admin (vues mois/semaine, détaillé/compact) DOIT rester fonctionnel et visuellement clair sur les deux largeurs desktop de référence.
- **FR-005**: L'aperçu live de l'éditeur de séance (vue athlète en temps réel) DOIT rester visible simultanément avec l'éditeur bloc par bloc sur les largeurs desktop de référence, sans recouvrement.
- **FR-006**: Un texte libre anormalement long (titre de séance, note coach, commentaire de retour) DOIT être affiché de façon maîtrisée (troncature avec accès au texte complet, ou retour à la ligne) sur toutes les pages concernées, sans casser la mise en page.
- **FR-007**: Toutes les actions déclenchables au clic/tap sur les pages du périmètre DOIVENT rester atteignables et actionnables sur l'ensemble des largeurs de référence (mobile 320-375px, desktop 1280-1440px), sans être masquées par un autre élément.
- **FR-008**: Aux largeurs intermédiaires (375px à 1280px), chaque page du périmètre DOIT rester consultable sans rupture bloquante de mise en page (élément totalement inaccessible ou contenu totalement illisible).
- **FR-009**: Les corrections apportées dans le cadre de cette étape NE DOIVENT PAS modifier le comportement fonctionnel existant des pages concernées (données affichées, logique métier, permissions) — seul l'affichage et l'ergonomie sont dans le périmètre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des pages du périmètre (liste ci-dessus, parcours admin et athlète) s'affichent sans défilement horizontal involontaire sur les largeurs de référence mobile (320px, 375px) et desktop (1280px, 1440px).
- **SC-002**: Un athlète peut, sur téléphone, aller de l'accueil jusqu'à l'envoi d'un retour de séance sans avoir besoin de zoomer ni de faire défiler horizontalement à aucune étape.
- **SC-003**: Un coach peut, sur desktop, réaliser une action de bout en bout par page du périmètre (ex: déplacer une séance dans le calendrier, éditer et sauvegarder une séance, filtrer la bibliothèque) sans qu'un défaut d'affichage n'interrompe l'action.
- **SC-004**: Zéro élément interactif masqué ou inatteignable constaté lors d'un passage manuel sur chacune des pages du périmètre aux largeurs de référence.
- **SC-005**: L'état d'avancement du roadmap (CLAUDE.md) peut cocher l'Étape 8 comme terminée à l'issue de cette fonctionnalité.

## Assumptions

- Le périmètre couvre uniquement les pages déjà livrées listées dans la description (Étapes 4 à 7 du roadmap) ; aucune nouvelle page ou fonctionnalité n'est ajoutée.
- Les largeurs de référence retenues sont 320px et 375px pour mobile (athlète) et 1280px et 1440px pour desktop (admin), conformément à l'orientation mobile-first / desktop-first déjà actée dans CLAUDE.md.
- Les largeurs intermédiaires (tablette) sont un objectif de non-régression (P3), pas un objectif d'optimisation dédiée.
- Aucune nouvelle dépendance ni changement de stack n'est nécessaire : il s'agit de corrections d'affichage et d'ergonomie sur l'existant.
- La vérification se fait par passage manuel sur les pages listées (pas de suite de tests visuels automatisés existante à ce jour).
