#!/usr/bin/env tsx
/**
 * Seed permissions M8 — Ressources et matériel
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-permissions-m8.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const PERMISSIONS_M8 = [
  {
    code: 'ressource:demander',
    libelle: 'Demander des ressources (humaines ou matérielles)',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'ressource:arbitrer',
    libelle: 'Arbitrer les demandes de ressources',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'ressource:gererParc',
    libelle: 'Gérer le parc matériel',
    domaine: 'TECHNIQUE',
  },
];

const ATTRIBUTIONS = [
  { roleCode: 'ADMIN', permCodes: ['ressource:demander', 'ressource:arbitrer', 'ressource:gererParc'] },
  { roleCode: 'DT', permCodes: ['ressource:demander', 'ressource:arbitrer', 'ressource:gererParc'] },
  { roleCode: 'CT', permCodes: ['ressource:demander'] },
  { roleCode: 'CC', permCodes: ['ressource:demander'] },
];

async function main() {
  console.log('📝 Seed permissions M8 — Ressources et matériel\n');

  // ===========================================================================
  // 1. CRÉER LES PERMISSIONS
  // ===========================================================================

  for (const perm of PERMISSIONS_M8) {
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

  console.log('\n✅ Seed permissions M8 terminé\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed permissions M8 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
