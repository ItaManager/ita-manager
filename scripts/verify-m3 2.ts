#!/usr/bin/env tsx
/**
 * Vérification M3 — Congés et Absences
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
  console.log('🔍 Vérification M3 — Congés et Absences\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. TYPES D'ABSENCE ATTENDUS
  // ===========================================================================

  console.log('📋 Types d\'absence');
  const typesAttendus = [
    'Congé annuel',
    'Congé maladie',
    'Permission exceptionnelle',
    'Congé sans solde',
  ];

  for (const libelle of typesAttendus) {
    const type = await prisma.typeAbsence.findFirst({
      where: {
        libelle: { contains: libelle.split(' ')[1], mode: 'insensitive' },
      },
    });

    if (!type) {
      console.log(`   ❌ Type manquant : ${libelle}`);
      erreurs++;
    } else {
      console.log(`   ✅ ${type.libelle}`);
    }
  }

  // ===========================================================================
  // 2. TYPE MALADIE PARTICULIER
  // ===========================================================================

  console.log('\n📋 Type maladie (classification PARTICULIER)');
  const typeMaladie = await prisma.typeAbsence.findFirst({
    where: {
      libelle: { contains: 'maladie', mode: 'insensitive' },
    },
  });

  if (!typeMaladie) {
    console.log('   ❌ Type \'Congé maladie\' introuvable');
    erreurs++;
  } else {
    console.log(`   Type trouvé : ${typeMaladie.libelle}`);

    if (!typeMaladie.pieceRequise) {
      console.log('   ❌ pieceRequise = false (attendu : true)');
      erreurs++;
    } else {
      console.log('   ✅ pieceRequise = true');
    }

    if (!typeMaladie.pieceClassification) {
      console.log('   ❌ pieceClassification = false (attendu : true)');
      erreurs++;
    } else {
      console.log('   ✅ pieceClassification = true (PARTICULIER)');
    }
  }

  // ===========================================================================
  // 3. JOURS FÉRIÉS 2026
  // ===========================================================================

  console.log('\n📋 Jours fériés 2026');
  const feries2026 = await prisma.jourFerie.count({
    where: {
      date: {
        gte: new Date('2026-01-01'),
        lt: new Date('2027-01-01'),
      },
    },
  });

  const feriesAttendus = 11;

  if (feries2026 < feriesAttendus) {
    console.log(`   ❌ ${feries2026} jours fériés trouvés (attendu : ${feriesAttendus})`);
    erreurs++;
  } else {
    console.log(`   ✅ ${feries2026} jours fériés chargés`);
  }

  // ===========================================================================
  // 4. RÈGLES DE CONGÉS
  // ===========================================================================

  console.log('\n📋 Règles de congés');
  const reglesCount = await prisma.regleConge.count();

  const reglesAttendues = 11;

  if (reglesCount < reglesAttendues) {
    console.log(`   ❌ ${reglesCount} règles trouvées (attendu : ${reglesAttendues})`);
    erreurs++;
  } else {
    console.log(`   ✅ ${reglesCount} règles de congés chargées`);
  }

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
    console.error('❌ Erreur verify-m3 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
