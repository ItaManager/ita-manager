#!/usr/bin/env tsx
/**
 * Seed types de pièce administrative M13 L1
 *
 * Source : M13-LOGISTIQUE.md §7.1 ter
 * 14 types relevés dans les fichiers du Service Logistique
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-types-piece-m13.ts
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

// M13-LOGISTIQUE.md §7.1 ter — 14 types, ligne à ligne
// VL = VEHICULE_LEGER, PL = VEHICULE_LOURD, ENGIN
const TYPES_PIECE = [
  {
    libelle: 'Assurance',
    periodiciteMois: 12,
    delaiAlerteJours: 60,
    bloquante: true,
    typesMateriel: ['VEHICULE_LEGER', 'VEHICULE_LOURD', 'ENGIN'],
    ordreAffichage: 1,
  },
  {
    libelle: 'Visite technique',
    periodiciteMois: 6,
    delaiAlerteJours: 45,
    bloquante: true,
    typesMateriel: ['VEHICULE_LEGER', 'VEHICULE_LOURD'],
    ordreAffichage: 2,
  },
  {
    libelle: 'Contrôle de levage',
    periodiciteMois: 12,
    delaiAlerteJours: 45,
    bloquante: true,
    typesMateriel: ['ENGIN'],
    ordreAffichage: 3,
  },
  {
    libelle: 'VGP',
    periodiciteMois: 6,
    delaiAlerteJours: 45,
    bloquante: true,
    typesMateriel: ['ENGIN'],
    ordreAffichage: 4,
  },
  {
    libelle: 'Contrôle AIR',
    periodiciteMois: 12,
    delaiAlerteJours: 45,
    bloquante: false,
    typesMateriel: ['ENGIN'],
    ordreAffichage: 5,
  },
  {
    libelle: 'Patente de transport',
    periodiciteMois: 12,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LOURD'],
    ordreAffichage: 6,
  },
  {
    libelle: 'Vignette de transport',
    periodiciteMois: 12,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LOURD'],
    ordreAffichage: 7,
  },
  {
    libelle: 'Carte de stationnement',
    periodiciteMois: 12,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LEGER', 'VEHICULE_LOURD'],
    ordreAffichage: 8,
  },
  {
    libelle: 'Carte de transport',
    periodiciteMois: 12,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LOURD'],
    ordreAffichage: 9,
  },
  {
    libelle: 'Autorisation hors gabarit',
    periodiciteMois: 12,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LOURD', 'ENGIN'],
    ordreAffichage: 10,
  },
  {
    libelle: 'Certificat CE',
    periodiciteMois: null,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['ENGIN'],
    ordreAffichage: 11,
  },
  {
    libelle: 'Carte grise',
    periodiciteMois: null,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LEGER', 'VEHICULE_LOURD'],
    ordreAffichage: 12,
  },
  {
    libelle: 'Autorisation d\'enfûtage',
    periodiciteMois: 12,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['VEHICULE_LOURD'],
    ordreAffichage: 13,
  },
  {
    libelle: 'Documents d\'achat — douanes',
    periodiciteMois: null,
    delaiAlerteJours: 30,
    bloquante: false,
    typesMateriel: ['ENGIN'],
    ordreAffichage: 14,
  },
];

async function main() {
  console.log('📝 Seed types de pièce administrative M13 L1\n');
  console.log('Source : M13-LOGISTIQUE.md §7.1 ter\n');

  let created = 0;
  let skipped = 0;

  for (const type of TYPES_PIECE) {
    const libelleNormalise = normaliser(type.libelle);

    const existant = await prisma.typePieceAdministrative.findFirst({
      where: { libelleNormalise },
    });

    if (existant) {
      console.log(`   ⏭️  ${type.libelle} (déjà existant)`);
      skipped++;
    } else {
      await prisma.typePieceAdministrative.create({
        data: {
          libelle: type.libelle,
          libelleNormalise,
          periodiciteMois: type.periodiciteMois,
          delaiAlerteJours: type.delaiAlerteJours,
          bloquante: type.bloquante,
          typesMateriel: JSON.stringify(type.typesMateriel),
          ordreAffichage: type.ordreAffichage,
          actif: true,
        },
      });
      console.log(
        `   ✅ ${type.libelle} (${type.periodiciteMois ? type.periodiciteMois + ' mois' : 'sans périodicité'} / ${type.delaiAlerteJours}j / ${type.bloquante ? 'BLOQUANTE' : 'alerte'})`
      );
      created++;
    }
  }

  console.log(`\n✅ Seed terminé : ${created} créés, ${skipped} existants\n`);
  console.log('Note : Les types marqués BLOQUANTE empêchent une sortie de matériel.');
  console.log('       Les types sans périodicité (carte grise, certificat CE) ne proposent pas de date d\'expiration.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed types de pièce M13 L1 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
