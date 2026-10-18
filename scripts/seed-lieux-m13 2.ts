#!/usr/bin/env tsx
/**
 * Seed lieux de stockage M13 L1
 *
 * 3 lieux de base : Garage, Magasin, Siège
 *
 * Le référentiel sera complété depuis l'écran (R-04 : création inline).
 * Les chantiers (nature SITE/CHANTIER avec projetId) seront ajoutés au besoin.
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-lieux-m13.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

// 3 lieux de base (non liés à un projet)
const LIEUX = [
  { libelle: 'Garage', nature: 'GARAGE' },
  { libelle: 'Magasin', nature: 'MAGASIN' },
  { libelle: 'Siège', nature: 'BUREAU' },
];

async function main() {
  console.log('📝 Seed lieux de stockage M13 L1\n');
  console.log('3 lieux de base (garage, magasin, siège)\n');

  let created = 0;
  let skipped = 0;

  for (const lieu of LIEUX) {
    const existant = await prisma.lieuStockage.findFirst({
      where: { libelle: lieu.libelle },
    });

    if (existant) {
      console.log(`   ⏭️  ${lieu.libelle} (${lieu.nature}) — déjà existant`);
      skipped++;
    } else {
      await prisma.lieuStockage.create({
        data: {
          libelle: lieu.libelle,
          nature: lieu.nature as any,
          projetId: null,
          actif: true,
        },
      });
      console.log(`   ✅ ${lieu.libelle} (${lieu.nature})`);
      created++;
    }
  }

  console.log(`\n✅ Seed terminé : ${created} créés, ${skipped} existants\n`);
  console.log('Note : Référentiel avec création inline (R-04).');
  console.log('       Les chantiers (nature SITE/CHANTIER avec projetId) seront ajoutés au besoin.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed lieux M13 L1 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
