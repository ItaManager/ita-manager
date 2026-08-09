import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const columns = await prisma.$queryRaw<
    Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'competences'
    ORDER BY ordinal_position
  `;

  console.log("\nStructure de la table 'competences' en base :\n");
  columns.forEach((col) => {
    console.log(
      `  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${
        col.is_nullable === "NO" ? "NOT NULL" : "NULL"
      }`
    );
  });

  console.log("\n--- Vérification clé ---");
  console.log(
    'Si "tauxJournalier" existe → structure de 195346 (ancienne)'
  );
  console.log(
    'Si "tauxJournalier" absent → structure de 182247 (nouvelle, avec AffectationCompetence/TauxJournalier séparés)'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
