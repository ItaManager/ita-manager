#!/usr/bin/env tsx
/**
 * Vérification post-seed M2 — Nationalités et Permissions Employés
 *
 * Contrôles :
 * - 10 nationalités en base
 * - 7 permissions M2 présentes
 * - Rôle DRH a `employe:donneesSensibles`
 * - Rôle RH a `employe:creer` mais PAS `employe:donneesSensibles`
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/verify-m2.ts
 *
 * Code de sortie : 0 si succès, 1 si échec
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
  console.log('🔍 Vérification M2 — Nationalités et Permissions\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. NATIONALITÉS
  // ===========================================================================

  console.log('📋 Nationalités');
  const nationalites = await prisma.nationalite.findMany();
  if (nationalites.length !== 10) {
    console.log(`   ❌ Attendu: 10 nationalités, trouvé: ${nationalites.length}`);
    erreurs++;
  } else {
    console.log(`   ✅ 10 nationalités présentes`);
  }

  const ATTENDUES = [
    'Ivoirienne',
    'Burkinabè',
    'Malienne',
    'Guinéenne',
    'Ghanéenne',
    'Sénégalaise',
    'Béninoise',
    'Togolaise',
    'Nigérienne',
    'Française',
  ];

  for (const libelle of ATTENDUES) {
    const found = nationalites.find((n) => n.libelle === libelle);
    if (!found) {
      console.log(`   ❌ Nationalité manquante: ${libelle}`);
      erreurs++;
    }
  }

  // ===========================================================================
  // 2. PERMISSIONS M2
  // ===========================================================================

  console.log('\n📋 Permissions M2');
  const PERMISSIONS_M2 = [
    'employe:lire',
    'employe:creer',
    'employe:modifier',
    'employe:archiver',
    'employe:donneesSensibles',
    'derogation:valider',
    'posteDirection:affecter',
  ];

  const permissions = await prisma.permission.findMany({
    where: {
      code: { in: PERMISSIONS_M2 },
    },
  });

  if (permissions.length !== 7) {
    console.log(`   ❌ Attendu: 7 permissions M2, trouvé: ${permissions.length}`);
    erreurs++;
  } else {
    console.log(`   ✅ 7 permissions M2 présentes`);
  }

  for (const code of PERMISSIONS_M2) {
    const found = permissions.find((p) => p.code === code);
    if (!found) {
      console.log(`   ❌ Permission manquante: ${code}`);
      erreurs++;
    }
  }

  // ===========================================================================
  // 3. PERMISSIONS DU RÔLE DRH
  // ===========================================================================

  console.log('\n📋 Rôle DRH');
  const roleDRH = await prisma.role.findUnique({
    where: { code: 'DRH' },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!roleDRH) {
    console.log('   ❌ Rôle DRH non trouvé');
    erreurs++;
  } else {
    const permDRH = roleDRH.permissions.map((rp) => rp.permission.code);

    // DRH doit avoir employe:donneesSensibles
    if (!permDRH.includes('employe:donneesSensibles')) {
      console.log('   ❌ DRH n\'a PAS la permission employe:donneesSensibles');
      erreurs++;
    } else {
      console.log('   ✅ DRH a la permission employe:donneesSensibles');
    }

    // DRH doit avoir employe:creer, modifier, archiver
    const attendues = ['employe:lire', 'employe:creer', 'employe:modifier', 'employe:archiver'];
    for (const code of attendues) {
      if (!permDRH.includes(code)) {
        console.log(`   ❌ DRH n'a PAS la permission ${code}`);
        erreurs++;
      }
    }
  }

  // ===========================================================================
  // 4. PERMISSIONS DU RÔLE RH (Assistant RH)
  // ===========================================================================

  console.log('\n📋 Rôle RH');
  const roleRH = await prisma.role.findUnique({
    where: { code: 'RH' },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!roleRH) {
    console.log('   ❌ Rôle RH non trouvé');
    erreurs++;
  } else {
    const permRH = roleRH.permissions.map((rp) => rp.permission.code);

    // RH doit avoir employe:creer
    if (!permRH.includes('employe:creer')) {
      console.log('   ❌ RH n\'a PAS la permission employe:creer');
      erreurs++;
    } else {
      console.log('   ✅ RH a la permission employe:creer');
    }

    // RH ne doit PAS avoir employe:donneesSensibles (règle importante §5)
    if (permRH.includes('employe:donneesSensibles')) {
      console.log('   ❌ RH a la permission employe:donneesSensibles (ne devrait PAS)');
      console.log('      → L\'Assistant RH crée et modifie, mais ne voit pas les rémunérations');
      erreurs++;
    } else {
      console.log('   ✅ RH n\'a PAS employe:donneesSensibles (correct)');
    }
  }

  // ===========================================================================
  // 5. PERMISSIONS DU RÔLE DFC
  // ===========================================================================

  console.log('\n📋 Rôle DFC');
  const roleDFC = await prisma.role.findUnique({
    where: { code: 'DFC' },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!roleDFC) {
    console.log('   ❌ Rôle DFC non trouvé');
    erreurs++;
  } else {
    const permDFC = roleDFC.permissions.map((rp) => rp.permission.code);

    // DFC doit avoir derogation:valider
    if (!permDFC.includes('derogation:valider')) {
      console.log('   ❌ DFC n\'a PAS la permission derogation:valider');
      erreurs++;
    } else {
      console.log('   ✅ DFC a la permission derogation:valider');
    }

    // DFC doit avoir employe:donneesSensibles
    if (!permDFC.includes('employe:donneesSensibles')) {
      console.log('   ❌ DFC n\'a PAS la permission employe:donneesSensibles');
      erreurs++;
    } else {
      console.log('   ✅ DFC a la permission employe:donneesSensibles');
    }
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
    console.error('❌ Erreur verify-m2 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
