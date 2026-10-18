import { PrismaClient } from "@prisma/client";

// Client Prisma pour migrations, seeds, et scripts de vérification.
// Connexion directe au port 5432, pas pgBouncer (connection_limit=1).
//
// NE JAMAIS IMPORTER dans app/ ou lib/actions/ — réservé aux scripts uniquement.
// Une Server Action qui l'importe contournerait pgBouncer et épuiserait
// les connexions en production.

const globalForPrismaDirect = globalThis as unknown as {
  prismaDirect: PrismaClient | undefined;
};

export const prismaDirect =
  globalForPrismaDirect.prismaDirect ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaDirect.prismaDirect = prismaDirect;
}
