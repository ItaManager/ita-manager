import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Ne charge aucun fichier en dur (contrairement à l'ancien prisma.config.ts,
// qui pointait sur .env.local — dangereux ici puisque .env.local porte les
// secrets de PRODUCTION). `loadEnv()` sans argument ne fait que compléter
// process.env à partir d'un éventuel `.env` générique, sans jamais écraser
// une variable déjà présente. C'est le script npm appelant (dotenv-cli) qui
// décide, en amont, quel fichier charger réellement — voir
// GUIDE-ENVIRONNEMENTS.md et la section « Gestion des deux fichiers
// d'environnement » du plan M0.
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  experimental: {
    // Requis par `migrations.initShadowDb` ci-dessous, et cohérent avec
    // `tables.external` : auth.users est gérée par Supabase, pas par nos
    // migrations Prisma.
    externalTables: true,
  },
  tables: {
    external: ["auth.users"],
  },
  migrations: {
    // La base fantôme ("shadow database") que `prisma migrate dev` crée
    // pour valider l'historique est vierge : elle n'a pas le schéma
    // `auth` propre à Supabase. Sans ce stub minimal, toute migration
    // qui référence auth.users (ex. le trigger de synchronisation des
    // profils) fait échouer la validation avec « schema "auth" does not
    // exist ». Ce stub ne sert qu'à la validation — jamais appliqué à la
    // vraie base.
    initShadowDb: `
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT
      );
    `,
  },
});
