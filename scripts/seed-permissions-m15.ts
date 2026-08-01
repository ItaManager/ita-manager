#!/usr/bin/env tsx
/**
 * Seed permissions M15 — ItaPay
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-permissions-m15.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const PERMISSIONS_M15 = [
  {
    code: 'paiement:consulter',
    libelle: 'Consulter les paiements',
    domaine: 'PAIEMENT',
  },
  {
    code: 'paiement:preparer',
    libelle: 'Préparer une demande de paiement',
    domaine: 'PAIEMENT',
  },
  {
    code: 'paiement:autoriser',
    libelle: 'Autoriser un paiement',
    domaine: 'PAIEMENT',
  },
  {
    code: 'paiement:executer',
    libelle: 'Exécuter un paiement',
    domaine: 'PAIEMENT',
  },
  {
    code: 'paiement:annuler',
    libelle: 'Annuler un paiement (< 3 jours)',
    domaine: 'PAIEMENT',
  },
  {
    code: 'paiement:parametres',
    libelle: 'Configurer les paramètres de paiement',
    domaine: 'PAIEMENT',
  },
];

const ATTRIBUTIONS = [
  {
    roleCode: 'ADMIN',
    permCodes: [
      'paiement:consulter',
      'paiement:preparer',
      'paiement:executer',
      'paiement:annuler',
      'paiement:parametres',
    ],
  },
  {
    roleCode: 'DG',
    permCodes: ['paiement:consulter', 'paiement:autoriser'],
  },
  {
    roleCode: 'DFC',
    permCodes: [
      'paiement:consulter',
      'paiement:preparer',
      'paiement:executer',
      'paiement:annuler',
    ],
  },
];

async function main() {
  console.log('📝 Seed permissions M15 — ItaPay\n');

  // ===========================================================================
  // 1. CRÉER LES PERMISSIONS
  // ===========================================================================

  for (const perm of PERMISSIONS_M15) {
    const existante = await prisma.permission.findUnique({
      where: { code: perm.code },
    });

    if (existante) {
      console.log(`   ⏭️  Permission existante : ${perm.code}`);
    } else {
      await prisma.permission.create({ data: perm });
      console.log(`   ✅ Permission créée : ${perm.code}`);
    }
  }

  // ===========================================================================
  // 2. ATTRIBUER AUX RÔLES
  // ===========================================================================

  console.log('\n📋 Attributions de permissions\n');

  for (const { roleCode, permCodes } of ATTRIBUTIONS) {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      console.log(`   ⚠️  Rôle ${roleCode} introuvable`);
      continue;
    }

    for (const permCode of permCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code: permCode },
      });

      if (!permission) {
        console.log(`   ⚠️  Permission ${permCode} introuvable`);
        continue;
      }

      const existante = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
      });

      if (existante) {
        console.log(`   ⏭️  ${roleCode} → ${permCode}`);
      } else {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        console.log(`   ✅ ${roleCode} → ${permCode}`);
      }
    }
  }

  console.log('\n✅ Seed permissions M15 terminé\n');
  console.log('Note : Séparation des rôles appliquée :');
  console.log('  • ADMIN et DFC : préparent et exécutent, NE peuvent PAS autoriser');
  console.log('  • DG : autorise, NE peut PAS exécuter');
  console.log('  • Interdits #1 et #2 vérifiés côté serveur (même avec cumul de permissions)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed permissions M15 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
