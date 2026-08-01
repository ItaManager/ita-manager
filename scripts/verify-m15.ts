#!/usr/bin/env tsx
/**
 * Vérification M15 — ItaPay
 *
 * Compare les données de seed aux valeurs attendues.
 * Exit code 0 = OK, 1 = échec
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🔍 Vérification M15 — ItaPay\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. PERMISSIONS M15
  // ===========================================================================

  console.log('📋 Permissions M15');
  const permissionsAttendues = [
    { code: 'paiement:consulter', libelle: 'Consulter les paiements' },
    { code: 'paiement:preparer', libelle: 'Préparer une demande de paiement' },
    { code: 'paiement:autoriser', libelle: 'Autoriser un paiement' },
    { code: 'paiement:executer', libelle: 'Exécuter un paiement' },
  ];

  for (const { code, libelle } of permissionsAttendues) {
    const permission = await prisma.permission.findUnique({
      where: { code },
    });

    if (!permission) {
      console.log(`   ❌ Permission manquante : ${code}`);
      erreurs++;
    } else {
      console.log(`   ✅ ${code} — ${permission.libelle}`);
    }
  }

  // ===========================================================================
  // 2. RÔLES AVEC PERMISSIONS M15
  // ===========================================================================

  console.log('\n📋 Rôles avec permissions M15');

  const rolesAttendus = [
    { code: 'DFC', permissions: ['paiement:consulter', 'paiement:preparer', 'paiement:executer'] },
    { code: 'DG', permissions: ['paiement:consulter', 'paiement:autoriser'] },
    { code: 'ADMIN', permissions: ['paiement:consulter', 'paiement:preparer', 'paiement:executer'] },
  ];

  for (const { code, permissions } of rolesAttendus) {
    const role = await prisma.role.findUnique({
      where: { code },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      console.log(`   ❌ Rôle manquant : ${code}`);
      erreurs++;
      continue;
    }

    const permissionsRole = role.permissions.map((rp) => rp.permission.code);
    const manquantes = permissions.filter((p) => !permissionsRole.includes(p));

    if (manquantes.length > 0) {
      console.log(`   ❌ ${code} : permissions manquantes → ${manquantes.join(', ')}`);
      erreurs++;
    } else {
      console.log(`   ✅ ${code} : ${permissions.join(', ')}`);
    }
  }

  // ===========================================================================
  // 3. MODÈLES PRISMA
  // ===========================================================================

  console.log('\n📋 Modèles Prisma');

  try {
    const demandes = await prisma.demandePaiement.count();
    console.log(`   ✅ DemandePaiement : ${demandes} enregistrement(s)`);
  } catch (error) {
    console.log(`   ❌ DemandePaiement : modèle inaccessible`);
    erreurs++;
  }

  try {
    const lignes = await prisma.lignePaiement.count();
    console.log(`   ✅ LignePaiement : ${lignes} enregistrement(s)`);
  } catch (error) {
    console.log(`   ❌ LignePaiement : modèle inaccessible`);
    erreurs++;
  }

  try {
    const autorisations = await prisma.autorisationPaiement.count();
    console.log(`   ✅ AutorisationPaiement : ${autorisations} enregistrement(s)`);
  } catch (error) {
    console.log(`   ❌ AutorisationPaiement : modèle inaccessible`);
    erreurs++;
  }

  try {
    const tentatives = await prisma.tentativePaiement.count();
    console.log(`   ✅ TentativePaiement : ${tentatives} enregistrement(s)`);
  } catch (error) {
    console.log(`   ❌ TentativePaiement : modèle inaccessible`);
    erreurs++;
  }

  // ===========================================================================
  // 4. TEST DES 8 INTERDITS
  // ===========================================================================

  console.log('\n📋 Test des 8 interdits en dur (SECURITE-M15.md § 1)');
  console.log('   Exécution de test-interdits-m15.ts...\n');

  try {
    execSync('npx dotenv -e .env.dev -- npx tsx scripts/test-interdits-m15.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('\n   ✅ Tous les interdits sont vérifiés');
  } catch (error) {
    console.log('\n   ❌ Échec du test des interdits');
    erreurs++;
  }

  // ===========================================================================
  // RÉSULTAT FINAL
  // ===========================================================================

  console.log('\n' + '═'.repeat(60));
  if (erreurs === 0) {
    console.log('✅ VÉRIFICATION M15 RÉUSSIE — Toutes les vérifications sont OK');
    console.log('═'.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.log(`❌ VÉRIFICATION M15 ÉCHOUÉE — ${erreurs} erreur(s) détectée(s)`);
    console.log('═'.repeat(60) + '\n');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 ERREUR INATTENDUE\n', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
