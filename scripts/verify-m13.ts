#!/usr/bin/env tsx
/**
 * Vérification M13 — Logistique
 *
 * Compare les données de seed aux valeurs attendues.
 * Exit code 0 = OK, 1 = échec
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🔍 Vérification M13 — Logistique L1\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. PERMISSIONS ATTENDUES M13 L1
  // ===========================================================================

  console.log('📋 Permissions M13 L1');
  const PERMISSIONS_M13 = [
    'materiel:lire',
    'materiel:creer',
    'materiel:modifier',
    'typePiece:gerer',
    'materiel:coutsAdministratifs',
    'logistique:parametres',
  ];

  for (const code of PERMISSIONS_M13) {
    const perm = await prisma.permission.findUnique({
      where: { code },
    });

    if (!perm) {
      console.log(`   ❌ Permission manquante : ${code}`);
      erreurs++;
    } else {
      console.log(`   ✅ ${code}`);
    }
  }

  // ===========================================================================
  // 2. TYPES DE PIÈCE ADMINISTRATIVE (14 attendus)
  // ===========================================================================

  console.log('\n📋 Types de pièce administrative');

  const typesCount = await prisma.typePieceAdministrative.count();
  if (typesCount < 14) {
    console.log(`   ❌ Types de pièce : ${typesCount} (attendu: 14)`);
    erreurs++;
  } else {
    console.log(`   ✅ Types de pièce : ${typesCount}`);
  }

  // Vérifier qu'Assurance est bloquante avec 12 mois / 60 jours
  const assurance = await prisma.typePieceAdministrative.findFirst({
    where: { libelle: 'Assurance' },
  });

  if (!assurance) {
    console.log('   ❌ Type "Assurance" manquant');
    erreurs++;
  } else if (!assurance.bloquante) {
    console.log('   ❌ Assurance devrait être BLOQUANTE');
    erreurs++;
  } else if (assurance.periodiciteMois !== 12) {
    console.log(`   ❌ Assurance : périodicité ${assurance.periodiciteMois} (attendu: 12 mois)`);
    erreurs++;
  } else if (assurance.delaiAlerteJours !== 60) {
    console.log(`   ❌ Assurance : alerte ${assurance.delaiAlerteJours}j (attendu: 60j)`);
    erreurs++;
  } else {
    console.log('   ✅ Assurance : 12 mois / 60 jours / BLOQUANTE');
  }

  // Compter les types bloquants
  const bloquantes = await prisma.typePieceAdministrative.count({
    where: { bloquante: true },
  });

  if (bloquantes < 4) {
    console.log(`   ❌ Types bloquants : ${bloquantes} (attendu: au moins 4)`);
    erreurs++;
  } else {
    console.log(`   ✅ Types bloquants : ${bloquantes}`);
  }

  // ===========================================================================
  // 3. FAMILLES MATÉRIEL (12 attendues)
  // ===========================================================================

  console.log('\n📋 Familles matériel');

  const famillesCount = await prisma.familleMateriel.count();
  if (famillesCount < 12) {
    console.log(`   ❌ Familles matériel : ${famillesCount} (attendu: 12)`);
    erreurs++;
  } else {
    console.log(`   ✅ Familles matériel : ${famillesCount}`);
  }

  // ===========================================================================
  // 4. CONTRÔLE CRUCIAL : Chaque TypeMateriel a au moins une famille active
  // ===========================================================================

  console.log('\n📋 Couverture TypeMateriel par Familles (contrôle crucial)');

  const TYPES_MATERIEL = [
    'VEHICULE_LEGER',
    'VEHICULE_LOURD',
    'ENGIN',
    'PETIT_MATERIEL',
    'CONTENEUR',
    'MOBILIER',
  ];

  for (const type of TYPES_MATERIEL) {
    const familles = await prisma.familleMateriel.count({
      where: {
        type: type as any,
        actif: true,
      },
    });

    if (familles === 0) {
      console.log(`   ❌ ${type} : AUCUNE famille active (impossible de générer un code)`);
      erreurs++;
    } else {
      console.log(`   ✅ ${type} : ${familles} famille(s) active(s)`);
    }
  }

  // ===========================================================================
  // 5. LIEUX DE STOCKAGE (au moins 3 de base)
  // ===========================================================================

  console.log('\n📋 Lieux de stockage');

  const lieuxCount = await prisma.lieuStockage.count();
  if (lieuxCount < 3) {
    console.log(`   ❌ Lieux de stockage : ${lieuxCount} (attendu: au moins 3)`);
    erreurs++;
  } else {
    console.log(`   ✅ Lieux de stockage : ${lieuxCount}`);
  }

  // Vérifier les 3 lieux de base
  const LIEUX_BASE = ['Garage', 'Magasin', 'Siège'];
  for (const libelle of LIEUX_BASE) {
    const lieu = await prisma.lieuStockage.findFirst({
      where: { libelle },
    });

    if (!lieu) {
      console.log(`   ❌ Lieu "${libelle}" manquant`);
      erreurs++;
    } else {
      console.log(`   ✅ ${libelle}`);
    }
  }

  // ===========================================================================
  // RÉSULTAT FINAL
  // ===========================================================================

  console.log('\n' + '='.repeat(60));
  if (erreurs === 0) {
    console.log('✅ Vérification M13 L1 : SUCCÈS\n');
    await prisma.$disconnect();
    process.exit(0);
  } else {
    console.log(`❌ Vérification M13 L1 : ${erreurs} erreur(s)\n`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
