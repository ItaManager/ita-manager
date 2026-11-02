import { PrismaClient } from '@prisma/client';

const prismaWithDirect = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

const prismaWithBouncer = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔍 Test avec DIRECT_URL (port 5432)...');
  try {
    await prismaWithDirect.$queryRawUnsafe(`SELECT "litresAjoutes" FROM "distributions_carburant" LIMIT 1`);
    console.log('✅ DIRECT_URL : La colonne litresAjoutes EXISTE\n');
  } catch (error) {
    console.log('❌ DIRECT_URL : La colonne litresAjoutes N\'EXISTE PAS');
    console.log('Erreur:', error.message, '\n');
  }

  console.log('🔍 Test avec DATABASE_URL (port 6543 pgbouncer)...');
  try {
    await prismaWithBouncer.$queryRawUnsafe(`SELECT "litresAjoutes" FROM "distributions_carburant" LIMIT 1`);
    console.log('✅ DATABASE_URL : La colonne litresAjoutes EXISTE\n');
  } catch (error) {
    console.log('❌ DATABASE_URL : La colonne litresAjoutes N\'EXISTE PAS');
    console.log('Erreur:', error.message, '\n');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaWithDirect.$disconnect();
    await prismaWithBouncer.$disconnect();
  });
