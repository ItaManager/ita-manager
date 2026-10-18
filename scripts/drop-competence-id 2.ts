import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log(
    "\nSuppression du résidu employes.competenceId de la migration 195346...\n"
  );

  // Drop de l'index d'abord
  await prisma.$executeRaw`
    DROP INDEX IF EXISTS employes_competenceId_idx;
  `;
  console.log("  ✓ Index employes_competenceId_idx supprimé");

  // Drop de la colonne
  await prisma.$executeRaw`
    ALTER TABLE employes DROP COLUMN IF EXISTS "competenceId";
  `;
  console.log("  ✓ Colonne employes.competenceId supprimée");

  console.log(
    "\nLa colonne était vide (vérifié par check-competence-id.ts)."
  );
  console.log(
    "Le schéma de base correspond maintenant à la migration 182247.\n"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
