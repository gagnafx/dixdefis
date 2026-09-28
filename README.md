# TogoMarket · Les défis d'Aného

Application Next.js avec accès direct, interface Tailwind et persistance PostgreSQL via Neon.

## Démarrage

```bash
npm install
cp .env.example .env.local
# renseigner DATABASE_URL avec la chaîne de connexion Neon
npm run dev
```

Le schéma est créé automatiquement au premier appel de `/api/challenges`. Le script
équivalent est disponible dans `db/schema.sql` si vous préférez l'exécuter depuis la
console SQL de Neon.

## Déploiement Vercel

1. Importer le projet dans Vercel.
2. Ajouter `DATABASE_URL` dans les variables d'environnement de l'environnement ciblé.
3. Utiliser la commande de build `npm run build`.

La route API réalise le transfert mensuel de `weekly_earnings` vers
`togo_market_balance` uniquement le premier jour du mois. La condition SQL et la remise
à zéro rendent l'opération idempotente si plusieurs requêtes arrivent en même temps.