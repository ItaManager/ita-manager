import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const indexes = await prisma.$queryRaw<
    Array<{
      indexname: string;
      tablename: string;
    }>
  >`
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE tablename IN ('employes', 'affectations', 'contrats', 'profils')
      AND (
        indexname LIKE '%archiveLe%'
        OR indexname LIKE '%dateFin%'
        OR indexname LIKE '%typeContrat%'
        OR indexname LIKE '%employeId%'
      )
    ORDER BY tablename, indexname
  `;

  console.log(
    "\nIndex de performance de la migration 20260808 en base :\n"
  );

  if (indexes.length === 0) {
    console.log("  Aucun index trouvé — migration non appliquée.\n");
  } else {
    indexes.forEach((idx) => {
      console.log(`  ${idx.tablename}.${idx.indexname}`);
    });
    console.log(
      `\n${indexes.length} index trouvés — migration appliquée mais non enregistrée.\n`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
