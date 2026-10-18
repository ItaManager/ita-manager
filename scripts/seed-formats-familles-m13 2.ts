#!/usr/bin/env tsx
/**
 * Renseigner les formats de code des 12 familles M13 L1
 *
 * Formats relevés dans le tableur :
 * - AK-BUL01 → 2 chiffres
 * - AK-PICK006 → 3 chiffres
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-formats-familles-m13.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

// Formats relevés depuis le tableur
// AK-BUL01 (2 chiffres), AK-PICK006 (3 chiffres)
const FORMATS_FAMILLES = [
  { code: 'AK-BUL', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-CHG', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-CPT', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-NIV', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-PELL', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-PICK', formatCode: '{FAMILLE}{SEQ:3}' },
  { code: 'AK-VL', formatCode: '{FAMILLE}{SEQ:3}' },
  { code: 'AK-PL', formatCode: '{FAMILLE}{SEQ:3}' },
  { code: 'AK-MV', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-MP', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-CMA', formatCode: '{FAMILLE}{SEQ:2}' },
  { code: 'AK-IMP', formatCode: '{FAMILLE}{SEQ:3}' },
];

async function main() {
  console.log('📝 Renseigner formats de code M13 L1\n');
  console.log('Formats relevés depuis le tableur :\n');

  let updated = 0;
  let skipped = 0;

  for (const { code, formatCode } of FORMATS_FAMILLES) {
    const famille = await prisma.familleMateriel.findUnique({
      where: { code },
    });

    if (!famille) {
      console.log(`   ⚠️  Famille ${code} introuvable`);
      continue;
    }

    if (famille.formatCode === formatCode) {
      console.log(`   ⏭️  ${code} : ${formatCode} (déjà à jour)`);
      skipped++;
    } else {
      await prisma.familleMateriel.update({
        where: { code },
        data: { formatCode },
      });
      console.log(`   ✅ ${code} : ${formatCode}`);
      updated++;
    }
  }

  console.log(`\n✅ Formats mis à jour : ${updated} modifiés, ${skipped} inchangés\n`);
  console.log('Exemples de codes générés :');
  console.log('  • AK-BUL01 (2 chiffres)');
  console.log('  • AK-PICK006 (3 chiffres)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed formats M13 L1 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
