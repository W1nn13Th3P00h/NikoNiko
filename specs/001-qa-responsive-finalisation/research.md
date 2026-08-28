# Phase 0 Research: QA responsive et finalisation V1

Aucun `NEEDS CLARIFICATION` n'a été laissé dans le Technical Context : le stack, l'outillage de
test et le périmètre sont déjà fixés par le projet existant (CLAUDE.md, constitution). Cette page
documente les décisions retenues plutôt que des inconnues à résoudre.

## Décision : largeurs de référence

- **Decision**: Tester et corriger prioritairement à 320px et 375px (mobile, athlète) et 1280px et
  1440px (desktop, admin). Les largeurs intermédiaires (375–1280px) sont vérifiées en non-régression
  uniquement (P3).
- **Rationale**: 375px correspond à la largeur d'un iPhone standard (le terminal principal visé par
  CLAUDE.md pour `/mon-plan`), 320px couvre le plus petit cas courant (iPhone SE / Android bas de
  gamme). 1280/1440px couvrent les résolutions desktop les plus fréquentes pour un usage bureau.
- **Alternatives considered**: Tester sur une matrice complète d'appareils réels — rejeté, hors
  proportion pour une app privée à une dizaine d'utilisateurs (principe I, YAGNI) ; l'objectif est de
  couvrir les cas réels d'usage du coach et des athlètes, pas l'exhaustivité des devices du marché.

## Décision : méthode de validation

- **Decision**: Passage manuel dans le navigateur (dev server Next.js), redimensionnement de la
  fenêtre / DevTools responsive, page par page, à chaque largeur de référence.
- **Rationale**: Aucune suite de tests visuels automatisés n'existe dans le projet ; en introduire une
  pour une étape de finalisation ponctuelle serait disproportionné (principe I). Les tests Vitest
  existants couvrent la logique métier (`lib/`), pas le rendu visuel.
- **Alternatives considered**: Outillage de visual regression testing (ex: Playwright + screenshots)
  — rejeté pour cette étape, réévaluable si l'app grandit significativement en nombre de pages/écrans.

## Décision : périmètre des corrections

- **Decision**: Corrections limitées aux classes Tailwind, à la structure de mise en page (flex/grid),
  et aux composants `components/ui/` partagés si un défaut y est localisé et touche plusieurs pages.
  Aucune modification de Server Action, de requête Supabase, ou de logique dans `lib/`.
- **Rationale**: Le spec (FR-009) exclut explicitement toute régression fonctionnelle ; le problème
  identifié (Étape 8 du roadmap) est un problème d'affichage/ergonomie, pas de comportement.
- **Alternatives considered**: Refonte de composants — rejetée sauf si un composant partagé s'avère
  être la cause racine répétée d'un même défaut (auquel cas la correction du composant reste plus
  simple que N corrections locales dupliquées, conformément au principe I).

**Output**: Aucun `NEEDS CLARIFICATION` restant — prêt pour la Phase 1.
