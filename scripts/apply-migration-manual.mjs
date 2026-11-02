import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('🔍 Vérification de la colonne litresAjoutes...');

  try {
    // Tester si la colonne existe
    await prisma.$queryRawUnsafe(`SELECT "litresAjoutes" FROM "distributions_carburant" LIMIT 1`);
    console.log('✅ La colonne litresAjoutes existe déjà !');
    return;
  } catch (error) {
    console.log('❌ La colonne litresAjoutes n\'existe pas, application de la migration...');
  }

  // Lire le fichier SQL
  const migrationSQL = readFileSync(
    './prisma/migrations/20261101090403_enrichissement_distribution_carburant/migration.sql',
    'utf8'
  );

  console.log('📝 Migration SQL :');
  console.log(migrationSQL);
  console.log('');

  try {
    // Appliquer la migration
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('✅ Migration appliquée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration :', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
