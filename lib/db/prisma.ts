import { PrismaClient } from "@prisma/client";

// Garde globalThis contre la recréation du client à chaque hot-reload
// en développement (Next.js recharge les modules à chaud, ce qui sans
// cette garde épuiserait rapidement le pool de connexions pgBouncer).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Aucune ligne "profils" n'est jamais créée directement par le code
// applicatif, seed compris : seul le trigger Postgres sur auth.users
// (prisma/migrations/20260729103725_trigger_sync_profils) le fait. Un
// prisma.profil.create() produirait un id sans utilisateur Supabase
// correspondant.
