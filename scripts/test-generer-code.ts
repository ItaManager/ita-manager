#!/usr/bin/env tsx
/**
 * Test de la fonction genererCode avec les 12 familles
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-generer-code.ts
 */

import { PrismaClient } from '@prisma/client';
import { genererCode, validerFormat } from '../lib/logistique/code';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🧪 Test génération codes matériel\n');

  const familles = await prisma.familleMateriel.findMany({
    where: { actif: true },
    select: {
      code: true,
      formatCode: true,
      prochainNumero: true,
    },
    orderBy: { code: 'asc' },
  });

  console.log('=== Génération avec numéro actuel ===\n');

  for (const famille of familles) {
    try {
      const code = genererCode(famille);
      const valide = validerFormat(famille.formatCode);
      console.log(`✅ ${famille.code.padEnd(8)} : "${famille.formatCode}" → ${code} ${valide ? '✓' : '✗'}`);
    } catch (error) {
      console.log(`❌ ${famille.code.padEnd(8)} : ERREUR → ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n=== Génération avec année ===\n');

  const familleAvecAnnee = {
    code: 'AK-VL',
    formatCode: 'ITA-{FAMILLE}{SEQ:4}-{ANNEE}',
    prochainNumero: 1,
  };

  try {
    const code1 = genererCode(familleAvecAnnee, 2022);
    console.log(`✅ Format avec année : ITA-VE0001-2022 (attendu)`);
    console.log(`   Généré : ${code1}`);
  } catch (error) {
    console.log(`❌ Erreur : ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n=== Test jeton manquant ===\n');

  const familleJetonManquant = {
    code: 'AK-TEST',
    formatCode: '{FAMILLE}{SEQ:3}-{ANNEE}',
    prochainNumero: 5,
  };

  try {
    const code = genererCode(familleJetonManquant); // Sans annee
    console.log(`❌ Devrait échouer : ${code}`);
  } catch (error) {
    console.log(`✅ Erreur attendue : ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n=== Test format invalide ===\n');

  const familleInvalide = {
    code: 'AK-INVALIDE',
    formatCode: '{FAMILLE}-FIXE',
    prochainNumero: 1,
  };

  const formatValide = validerFormat(familleInvalide.formatCode);
  console.log(`Format sans {SEQ:n} : "${familleInvalide.formatCode}"`);
  console.log(`Validation : ${formatValide ? '✅ Valide' : '❌ Invalide (attendu)'}`);

  console.log('\n✅ Tests terminés\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur test :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
