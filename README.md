# NikoNiko

Application web de suivi de plans d'entraînement en course à pied. Un coach administre, les athlètes consultent leurs séances.

Stack : Next.js (App Router, TypeScript strict), Supabase (Postgres, Auth par identifiant + mot de passe, RLS), Tailwind CSS + shadcn/ui, date-fns.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Les variables d'environnement Supabase sont dans `.env.local` (voir `.env.local.example`).

Connexion par identifiant + mot de passe pour tout le monde (coach y compris) — aucun réglage email/SMTP à faire côté Supabase, l'app n'envoie jamais d'email. Voir `lib/athlete-login.ts` et `app/login/actions.ts`.

## Tests

```bash
npm run test
```

## Déploiement (Netlify)

Le repo est branché sur Netlify via `netlify.toml` (`@netlify/plugin-nextjs`) : tout push sur `main` déclenche un build et un déploiement.

Variables d'environnement à configurer dans **Site configuration → Environment variables** sur Netlify (mêmes noms qu'en local, voir `.env.local.example`) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — jamais exposée au client, à ne configurer que dans les variables serveur Netlify.

Rien à changer côté Supabase Auth après déploiement (pas d'email, pas de Site URL/Redirect URLs à tenir à jour).

## Contrainte de conception : export futur vers les montres (FIT)

`bloc_seance` n'est volontairement pas un champ de texte libre : chaque colonne (type de bloc, condition de fin en distance ou en durée, cible en allure ou en FC avec borne basse et haute) est pensée pour être directement traduisible en une étape de workout au format FIT (Suunto, Garmin...). Rien de structurant dans une séance ne doit finir en texte libre — l'export n'est pas implémenté en V1, mais le modèle de données doit le permettre sans migration de refonte.

Voir [CLAUDE.md](./CLAUDE.md) pour l'architecture et le modèle de données complets.
