import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const migrations = await prisma.$queryRaw<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >`
    SELECT migration_name, finished_at, rolled_back_at
    FROM _prisma_migrations
    ORDER BY finished_at DESC
    LIMIT 6
  `;

  console.log("\nDernières 6 migrations en base :\n");
  migrations.forEach((m) => {
    console.log(
      `${m.migration_name}${m.rolled_back_at ? " (ROLLED BACK)" : ""}`
    );
    console.log(`  finished_at: ${m.finished_at}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
