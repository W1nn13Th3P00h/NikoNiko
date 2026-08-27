# App Coaching

Application web de suivi de plans d'entraînement en course à pied. Un coach administre, les athlètes consultent leurs séances.

Stack : Next.js (App Router, TypeScript strict), Supabase (Postgres, Auth magic link, RLS), Tailwind CSS + shadcn/ui, date-fns.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Les variables d'environnement Supabase sont dans `.env.local` (voir `.env.local.example`).

## Tests

```bash
npm run test
```

## Contrainte de conception : export futur vers les montres (FIT)

`bloc_seance` n'est volontairement pas un champ de texte libre : chaque colonne (type de bloc, condition de fin en distance ou en durée, cible en allure ou en FC avec borne basse et haute) est pensée pour être directement traduisible en une étape de workout au format FIT (Suunto, Garmin...). Rien de structurant dans une séance ne doit finir en texte libre — l'export n'est pas implémenté en V1, mais le modèle de données doit le permettre sans migration de refonte.

Voir [CLAUDE.md](./CLAUDE.md) pour l'architecture et le modèle de données complets.
