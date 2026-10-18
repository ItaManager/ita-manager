#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const code = process.argv[2];
  const actif = process.argv[3] === 'true';

  if (!code) {
    console.error('Usage: npx tsx temp-desactiver-famille.ts CODE [true|false]');
    process.exit(1);
  }

  await prisma.familleMateriel.update({
    where: { code },
    data: { actif },
  });

  console.log(`${code} : actif=${actif}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
