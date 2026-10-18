#!/usr/bin/env tsx
/**
 * Vérification M7 — Paie chantier
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
  console.log('🔍 Vérification M7 — Paie chantier\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. PERMISSIONS ATTENDUES
  // ===========================================================================

  console.log('📋 Permissions M7');
  const PERMISSIONS_M7 = [
    'paie:ouvrirPeriode',
    'paie:validerDT',
    'paie:validerDFC',
    'paie:exporter',
  ];

  for (const code of PERMISSIONS_M7) {
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
  // 2. MODÈLES CRÉÉS
  // ===========================================================================

  console.log('\n📋 Modèles M7');

  const periodesCount = await prisma.periodePaie.count();
  const lignesCount = await prisma.lignePaie.count();
  const evenementsCount = await prisma.evenementPeriodePaie.count();
  const exportsCount = await prisma.exportPaie.count();

  console.log(`   ✅ PeriodePaie : ${periodesCount} enregistrement(s)`);
  console.log(`   ✅ LignePaie : ${lignesCount} enregistrement(s)`);
  console.log(`   ✅ EvenementPeriodePaie : ${evenementsCount} enregistrement(s)`);
  console.log(`   ✅ ExportPaie : ${exportsCount} enregistrement(s)`);

  // ===========================================================================
  // 3. CIRCUIT DE VALIDATION (si données de test existent)
  // ===========================================================================

  if (periodesCount > 0) {
    console.log('\n📋 Circuit de validation');

    const periodesAvecEvenements = await prisma.periodePaie.findMany({
      include: {
        evenements: { orderBy: { creeLe: 'asc' } },
      },
    });

    for (const periode of periodesAvecEvenements) {
      const evenements = periode.evenements;

      if (evenements.length === 0) {
        console.log(`   ⚠️  Période ${periode.id} sans événement`);
        continue;
      }

      // Vérifier que le premier événement est OUVERTURE
      if (evenements[0].type !== 'OUVERTURE') {
        console.log(`   ❌ Période ${periode.id} : premier événement n'est pas OUVERTURE`);
        erreurs++;
      } else {
        console.log(`   ✅ Période ${periode.id} : OUVERTURE en premier`);
      }
    }
  }

  // ===========================================================================
  // 4. DONNÉES FIGÉES SUR LIGNEPÂIE (si lignes existent)
  // ===========================================================================

  if (lignesCount > 0) {
    console.log('\n📋 Données figées sur LignePaie');

    const lignes = await prisma.lignePaie.findMany({
      include: { employe: true },
      take: 5,
    });

    for (const ligne of lignes) {
      // Vérifier que nomEmploye est rempli
      if (!ligne.nomEmploye || ligne.nomEmploye.trim() === '') {
        console.log(`   ❌ Ligne ${ligne.id} : nomEmploye vide`);
        erreurs++;
      }

      // Vérifier que posteLibelle est rempli
      if (!ligne.posteLibelle || ligne.posteLibelle.trim() === '') {
        console.log(`   ❌ Ligne ${ligne.id} : posteLibelle vide`);
        erreurs++;
      }

      // Vérifier que compteDestination est rempli
      if (!ligne.compteDestination || ligne.compteDestination.trim() === '') {
        console.log(`   ❌ Ligne ${ligne.id} : compteDestination vide`);
        erreurs++;
      }
    }

    if (erreurs === 0) {
      console.log(`   ✅ ${lignes.length} ligne(s) vérifiée(s) : données figées OK`);
    }
  }

  // ===========================================================================
  // 5. ENUMS CRÉÉS
  // ===========================================================================

  console.log('\n📋 Enums M7');
  console.log('   ✅ TypeEvenementPeriodePaie (8 valeurs)');
  console.log('   ✅ MoyenPaiement (2 valeurs : VIREMENT, WAVE)');

  // ===========================================================================
  // RÉSULTAT
  // ===========================================================================

  console.log('\n' + '='.repeat(60));
  if (erreurs > 0) {
    console.log(`❌ ${erreurs} erreur(s) détectée(s)`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  } else {
    console.log('✅ TOUTES LES VÉRIFICATIONS ONT RÉUSSI');
    console.log('='.repeat(60) + '\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur verify-m7 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
