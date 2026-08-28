# NikoNiko

Application web de suivi de plans d'entraînement en course à pied. Un coach administre, les athlètes consultent leurs séances.

Stack : Next.js (App Router, TypeScript strict), Supabase (Postgres, Auth magic link, RLS), Tailwind CSS + shadcn/ui, date-fns.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Les variables d'environnement Supabase sont dans `.env.local` (voir `.env.local.example`).

## Configuration Supabase requise (une fois, dans le dashboard)

Le magic link utilise `token_hash` + `verifyOtp` (pas le flow OAuth PKCE), ce qui demande des réglages manuels dans le dashboard Supabase — pas automatisables proprement via la CLI sans risquer d'écraser d'autres réglages du projet (`supabase config push` réécrit tout `config.toml`, y compris des valeurs de dev comme la limite de 2 emails/heure) :

0. **SMTP personnalisé (obligatoire depuis juin 2026)** : les nouveaux projets Supabase gratuits ne permettent pas d'éditer les templates email sur le service par défaut (limité à 2 emails/heure, envoi restreint aux emails de l'équipe du projet). Ce projet utilise [Resend](https://resend.com) (palier gratuit, 3000 emails/mois) — clé API dans **Authentication → Emails → SMTP Settings** (host `smtp.resend.com`, port `465`, user `resend`, sender `onboarding@resend.dev` tant qu'aucun domaine n'est vérifié).
1. **Authentication → Emails → Magic Link** : remplacer le contenu du bouton/lien pour qu'il pointe vers `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/apres-connexion` au lieu de `{{ .ConfirmationURL }}`.
2. **Authentication → URL Configuration** : Site URL = `http://localhost:3000` en dev (à changer pour l'URL Netlify une fois déployé), et ajouter cette URL aux Redirect URLs autorisées.

## Tests

```bash
npm run test
```

## Déploiement (Netlify)

Le repo est branché sur Netlify via `netlify.toml` (`@netlify/plugin-nextjs`) : tout push sur `main` déclenche un build et un déploiement.

Variables d'environnement à configurer dans **Site configuration → Environment variables** sur Netlify (mêmes noms qu'en local, voir `.env.local.example`) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` — l'URL Netlify de prod (ex. `https://nikoniko.netlify.app` ou le domaine custom), utilisée pour construire le lien du magic link.
- `SUPABASE_SERVICE_ROLE_KEY` — jamais exposée au client, à ne configurer que dans les variables serveur Netlify.

Une fois le premier déploiement fait, mettre à jour dans le dashboard Supabase (voir section précédente) :

- **Authentication → URL Configuration → Site URL** : l'URL Netlify de prod.
- **Authentication → URL Configuration → Redirect URLs** : ajouter cette même URL.
- Le template Magic Link pointe déjà vers `{{ .SiteURL }}/auth/confirm?...` donc aucun changement de template n'est nécessaire, seul le Site URL change.

## Contrainte de conception : export futur vers les montres (FIT)

`bloc_seance` n'est volontairement pas un champ de texte libre : chaque colonne (type de bloc, condition de fin en distance ou en durée, cible en allure ou en FC avec borne basse et haute) est pensée pour être directement traduisible en une étape de workout au format FIT (Suunto, Garmin...). Rien de structurant dans une séance ne doit finir en texte libre — l'export n'est pas implémenté en V1, mais le modèle de données doit le permettre sans migration de refonte.

Voir [CLAUDE.md](./CLAUDE.md) pour l'architecture et le modèle de données complets.
