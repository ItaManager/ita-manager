#!/usr/bin/env tsx
/**
 * Seed démo échéances M13 L1 — DÉVELOPPEMENT UNIQUEMENT
 *
 * Crée 10 matériels et leurs pièces administratives couvrant les 6 cas d'états :
 * 1. PÉRIMÉE DEPUIS LONGTEMPS (273 jours) — critère de recette
 * 2. Périmée récemment (12 jours)
 * 3. En alerte proche (J+8, délai 60j)
 * 4. En alerte limite (J+45, délai 45j) — cas frontière
 * 5. Valide (J+200)
 * 6. Absente (engin sans pièce)
 *
 * Plus une chaîne de renouvellement (assurance renouvelée 2×)
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

// Désactivé en production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Ce script est réservé au développement.');
  process.exit(1);
}

async function main() {
  console.log('🔧 Seed démo échéances M13 L1\n');

  // Nettoyer les matériels de test existants
  const codesTest = [
    'AK-PL004',
    'AK-VL101',
    'AK-VL102',
    'AK-VL103',
    'AK-PL005',
    'AK-PELL01',
    'AK-BUL01',
    'AK-CHG01',
    'AK-CMA01',
    'AK-VL104',
  ];

  const deleted = await prisma.materiel.deleteMany({
    where: { codeIta: { in: codesTest } },
  });

  if (deleted.count > 0) {
    console.log(`🧹 Nettoyage : ${deleted.count} matériel(s) de test supprimé(s)\n`);
  }

  // Récupérer les familles
  const familles = await prisma.familleMateriel.findMany({
    where: {
      code: { in: ['AK-VL', 'AK-PL', 'AK-BUL', 'AK-PELL', 'AK-CHG', 'AK-CMA'] },
    },
    select: { id: true, code: true },
  });

  const familleMap = Object.fromEntries(familles.map((f) => [f.code, f.id]));

  // Récupérer les types de pièce
  const types = await prisma.typePieceAdministrative.findMany({
    where: {
      libelle: { in: ['Assurance', 'Visite technique'] },
    },
    select: { id: true, libelle: true, delaiAlerteJours: true },
  });

  const typeMap = Object.fromEntries(types.map((t) => [t.libelle, t]));

  // Récupérer le lieu Garage
  const garage = await prisma.lieuStockage.findFirst({
    where: { libelle: 'Garage' },
    select: { id: true },
  });

  console.log('📦 Création de 10 matériels...\n');

  // Dates calculées depuis aujourd'hui (2026-08-02)
  const aujourdhui = new Date('2026-08-02');

  // 1. PÉRIMÉE DEPUIS LONGTEMPS (273 jours) — LE CAS CRITIQUE
  const plBenne = await prisma.materiel.create({
    data: {
      codeIta: 'AK-PL004',
      designation: 'Camion benne',
      familleId: familleMap['AK-PL'],
      type: 'VEHICULE_LOURD',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Renault',
      modele: 'C380',
    },
  });

  await prisma.pieceAdministrative.create({
    data: {
      materielId: plBenne.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2025-001',
      emetteur: 'NSIA',
      dateEdition: new Date('2024-11-01'),
      dateExpiration: new Date('2025-11-01'), // Il y a 273 jours
    },
  });

  console.log('1. ✅ AK-PL004 Camion benne — Assurance périmée depuis 273 jours');

  // 2. PÉRIMÉE RÉCEMMENT (12 jours)
  const vl1 = await prisma.materiel.create({
    data: {
      codeIta: 'AK-VL101',
      designation: 'Toyota Hilux',
      familleId: familleMap['AK-VL'],
      type: 'VEHICULE_LEGER',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Toyota',
      modele: 'Hilux',
    },
  });

  await prisma.pieceAdministrative.create({
    data: {
      materielId: vl1.id,
      typeId: typeMap['Visite technique'].id,
      numero: 'VT-2026-045',
      emetteur: 'Centre technique Abidjan',
      dateEdition: new Date('2025-07-21'),
      dateExpiration: new Date('2026-07-21'), // Il y a 12 jours
    },
  });

  console.log('2. ✅ AK-VL101 Toyota Hilux — Visite technique périmée depuis 12 jours');

  // 3. EN ALERTE PROCHE (J+8, délai 60j)
  const vl2 = await prisma.materiel.create({
    data: {
      codeIta: 'AK-VL102',
      designation: 'Nissan Navara',
      familleId: familleMap['AK-VL'],
      type: 'VEHICULE_LEGER',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Nissan',
      modele: 'Navara',
    },
  });

  await prisma.pieceAdministrative.create({
    data: {
      materielId: vl2.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2026-102',
      emetteur: 'NSIA',
      dateEdition: new Date('2025-08-10'),
      dateExpiration: new Date('2026-08-10'), // Dans 8 jours, délai alerte 60j
    },
  });

  console.log('3. ✅ AK-VL102 Nissan Navara — Assurance en alerte proche (J+8)');

  // 4. EN ALERTE LIMITE (J+45, délai 45j) — CAS FRONTIÈRE
  const vl3 = await prisma.materiel.create({
    data: {
      codeIta: 'AK-VL103',
      designation: 'Ford Ranger',
      familleId: familleMap['AK-VL'],
      type: 'VEHICULE_LEGER',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Ford',
      modele: 'Ranger',
    },
  });

  await prisma.pieceAdministrative.create({
    data: {
      materielId: vl3.id,
      typeId: typeMap['Visite technique'].id,
      numero: 'VT-2026-103',
      emetteur: 'Centre technique Abidjan',
      dateEdition: new Date('2025-09-16'),
      dateExpiration: new Date('2026-09-16'), // Dans 45 jours, délai alerte 45j
    },
  });

  console.log('4. ✅ AK-VL103 Ford Ranger — Visite technique en alerte limite (J+45)');

  // 5. VALIDE (J+200)
  const pl2 = await prisma.materiel.create({
    data: {
      codeIta: 'AK-PL005',
      designation: 'Camion citerne',
      familleId: familleMap['AK-PL'],
      type: 'VEHICULE_LOURD',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Iveco',
      modele: 'Trakker',
    },
  });

  await prisma.pieceAdministrative.create({
    data: {
      materielId: pl2.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2027-001',
      emetteur: 'NSIA',
      dateEdition: new Date('2026-02-18'),
      dateExpiration: new Date('2027-02-18'), // Dans 200 jours
    },
  });

  console.log('5. ✅ AK-PL005 Camion citerne — Assurance valide (J+200)');

  // 6. ABSENTE (engin sans pièce)
  const pelle = await prisma.materiel.create({
    data: {
      codeIta: 'AK-PELL01',
      designation: 'Pelle hydraulique CAT 320D',
      familleId: familleMap['AK-PELL'],
      type: 'ENGIN',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Caterpillar',
      modele: '320D',
    },
  });

  console.log('6. ✅ AK-PELL01 Pelle hydraulique — Aucune pièce');

  // Matériel supplémentaire : un autre engin sans pièce
  const bulldozer = await prisma.materiel.create({
    data: {
      codeIta: 'AK-BUL01',
      designation: 'Bulldozer Komatsu D65',
      familleId: familleMap['AK-BUL'],
      type: 'ENGIN',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Komatsu',
      modele: 'D65',
    },
  });

  console.log('7. ✅ AK-BUL01 Bulldozer Komatsu — Aucune pièce (diversité)');

  const chargeuse = await prisma.materiel.create({
    data: {
      codeIta: 'AK-CHG01',
      designation: 'Chargeuse sur pneus CAT 966H',
      familleId: familleMap['AK-CHG'],
      type: 'ENGIN',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Caterpillar',
      modele: '966H',
    },
  });

  await prisma.pieceAdministrative.create({
    data: {
      materielId: chargeuse.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2027-CHG',
      emetteur: 'NSIA',
      dateEdition: new Date('2026-01-15'),
      dateExpiration: new Date('2027-01-15'), // Dans ~167 jours
    },
  });

  console.log('8. ✅ AK-CHG01 Chargeuse — Assurance valide (J+167)');

  const conteneur = await prisma.materiel.create({
    data: {
      codeIta: 'AK-CMA01',
      designation: 'Conteneur bureau 20 pieds',
      familleId: familleMap['AK-CMA'],
      type: 'CONTENEUR',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
    },
  });

  console.log('9. ✅ AK-CMA01 Conteneur bureau — Aucune pièce');

  // 10. CHAÎNE DE RENOUVELLEMENT (assurance renouvelée 2×)
  const vl4 = await prisma.materiel.create({
    data: {
      codeIta: 'AK-VL104',
      designation: 'Toyota Land Cruiser',
      familleId: familleMap['AK-VL'],
      type: 'VEHICULE_LEGER',
      statut: 'DISPONIBLE',
      lieuBaseId: garage?.id,
      marque: 'Toyota',
      modele: 'Land Cruiser',
    },
  });

  // Assurance 2024 (périmée)
  await prisma.pieceAdministrative.create({
    data: {
      materielId: vl4.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2024-104',
      emetteur: 'NSIA',
      dateEdition: new Date('2023-08-01'),
      dateExpiration: new Date('2024-08-01'),
    },
  });

  // Assurance 2025 (périmée)
  await prisma.pieceAdministrative.create({
    data: {
      materielId: vl4.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2025-104',
      emetteur: 'NSIA',
      dateEdition: new Date('2024-08-01'),
      dateExpiration: new Date('2025-08-01'),
    },
  });

  // Assurance 2026 (valide)
  await prisma.pieceAdministrative.create({
    data: {
      materielId: vl4.id,
      typeId: typeMap['Assurance'].id,
      numero: 'NSIA-2026-104',
      emetteur: 'NSIA',
      dateEdition: new Date('2025-08-01'),
      dateExpiration: new Date('2026-08-01'),
    },
  });

  console.log('10. ✅ AK-VL104 Land Cruiser — Chaîne de renouvellement (3 assurances)');

  console.log('\n✅ Seed démo échéances terminé');
  console.log('\n📊 Cas couverts :');
  console.log('  1. PÉRIMÉE depuis 273 jours (critère recette) ⚠️');
  console.log('  2. Périmée récemment (12 jours)');
  console.log('  3. En alerte proche (J+8)');
  console.log('  4. En alerte limite (J+45, cas frontière)');
  console.log('  5. Valide (J+200)');
  console.log('  6. Absente (2 engins + 1 conteneur sans pièce)');
  console.log('  + Chaîne de renouvellement (3 assurances historique)');

  await prisma.$disconnect();
}

main();
