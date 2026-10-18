import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  // Vérifier si la colonne existe
  const columns = await prisma.$queryRaw<
    Array<{
      column_name: string;
    }>
  >`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'employes'
      AND column_name = 'competenceId'
  `;

  if (columns.length === 0) {
    console.log(
      "\nLa colonne employes.competenceId n'existe pas en base.\n"
    );
    return;
  }

  console.log(
    "\nLa colonne employes.competenceId existe. Vérification des valeurs...\n"
  );

  const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM employes
    WHERE "competenceId" IS NOT NULL
  `;

  const total = Number(count[0].count);

  if (total === 0) {
    console.log("  Aucune valeur — colonne vide, DROP sans risque.\n");
  } else {
    console.log(
      `  ${total} lignes avec competenceId renseignée — MIGRATION NÉCESSAIRE.\n`
    );
    console.log(
      "  Il faudra reprendre ces affectations dans AffectationCompetence\n"
    );
    console.log("  avant de supprimer la colonne.\n");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
