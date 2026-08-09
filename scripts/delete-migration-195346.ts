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
    "\nSuppression de la migration 20260806195346_m17_competences_taux_journaliers de _prisma_migrations...\n"
  );

  const result = await prisma.$executeRaw`
    DELETE FROM _prisma_migrations
    WHERE migration_name = '20260806195346_m17_competences_taux_journaliers'
  `;

  console.log(`Lignes supprimées : ${result}`);
  console.log(
    "\nCette migration n'avait aucun effet en base (écrasée par 182247)."
  );
  console.log(
    "Sa suppression de l'historique ne crée aucune divergence.\n"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
