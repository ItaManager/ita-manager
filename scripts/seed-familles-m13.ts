#!/usr/bin/env tsx
/**
 * Seed familles matériel M13 L1
 *
 * 10 familles relevées dans les codes réels du Service Logistique :
 * AK-BUL01, AK-CHG02, AK-PICK006, AK-MV11, etc.
 *
 * Le référentiel sera complété depuis l'écran (R-04 : création inline).
 * La reprise de données (étape 1.7) listera les préfixes réellement présents.
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-familles-m13.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

/**
 * Normalise une chaîne pour comparaison insensible à la casse et aux accents.
 */
function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// 10 familles relevées dans les fichiers du Service Logistique
const FAMILLES = [
  { code: 'AK-BUL', libelle: 'Bulldozer', type: 'ENGIN' },
  { code: 'AK-CHG', libelle: 'Chargeuse', type: 'ENGIN' },
  { code: 'AK-CPT', libelle: 'Compacteur', type: 'ENGIN' },
  { code: 'AK-NIV', libelle: 'Niveleuse', type: 'ENGIN' },
  { code: 'AK-PELL', libelle: 'Pelle', type: 'ENGIN' },
  { code: 'AK-PICK', libelle: 'Pick-up', type: 'VEHICULE_LEGER' },
  { code: 'AK-VL', libelle: 'Véhicule léger', type: 'VEHICULE_LEGER' },
  { code: 'AK-PL', libelle: 'Poids lourd', type: 'VEHICULE_LOURD' },
  { code: 'AK-MV', libelle: 'Moteur vibreur', type: 'PETIT_MATERIEL' },
  { code: 'AK-MP', libelle: 'Motopompe', type: 'PETIT_MATERIEL' },
];

async function main() {
  console.log('📝 Seed familles matériel M13 L1\n');
  console.log('10 familles relevées dans les codes réels (AK-BUL01, AK-CHG02, etc.)\n');

  let created = 0;
  let skipped = 0;

  for (const famille of FAMILLES) {
    const libelleNormalise = normaliser(famille.libelle);

    const existante = await prisma.familleMateriel.findFirst({
      where: {
        OR: [{ code: famille.code }, { libelleNormalise }],
      },
    });

    if (existante) {
      console.log(`   ⏭️  ${famille.code} — ${famille.libelle} (déjà existant)`);
      skipped++;
    } else {
      await prisma.familleMateriel.create({
        data: {
          code: famille.code,
          libelle: famille.libelle,
          libelleNormalise,
          type: famille.type as any,
          actif: true,
        },
      });
      console.log(`   ✅ ${famille.code} — ${famille.libelle} (${famille.type})`);
      created++;
    }
  }

  console.log(`\n✅ Seed terminé : ${created} créés, ${skipped} existants\n`);
  console.log('Note : Référentiel avec création inline (R-04).');
  console.log('       La reprise (étape 1.7) complétera avec les préfixes réellement présents dans le tableur.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed familles M13 L1 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
