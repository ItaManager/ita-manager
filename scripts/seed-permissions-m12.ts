/**
 * Seed permissions M12 — Présences bureau
 *
 * Ajoute les 3 permissions M12 si elles n'existent pas déjà.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log("\n🌱 Seed permissions M12...\n");

  const permissionsM12 = [
    {
      code: "presence:gererCodes",
      libelle: "Gérer les codes de pointage",
      domaine: "ADMIN",
    },
    {
      code: "presence:gererBornes",
      libelle: "Gérer les appareils de pointage",
      domaine: "ADMIN",
    },
    {
      code: "presence:corriger",
      libelle: "Corriger un pointage",
      domaine: "RH",
    },
  ];

  for (const perm of permissionsM12) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    console.log(`✅ ${perm.code}`);
  }

  console.log("\n✅ Seed permissions M12 terminé\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Erreur lors du seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
