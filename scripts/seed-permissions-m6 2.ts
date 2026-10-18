#!/usr/bin/env tsx
/**
 * Seed M6 uniquement — Permissions Relevés d'activité
 *
 * Ce script seed les permissions du module M6 :
 * - 2 permissions M6 (source : M6-RELEVES.md §6)
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-permissions-m6.ts
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
  console.log('🌱 Seed M6 — Permissions Relevés\n');

  // ===========================================================================
  // PERMISSIONS M6 (source : M6-RELEVES.md §6)
  // ===========================================================================

  const PERMISSIONS_M6 = [
    {
      code: 'releve:saisir',
      libelle: 'Créer et modifier ses relevés d\'activité',
      domaine: 'TECHNIQUE',
    },
    {
      code: 'releve:viser',
      libelle: 'Viser un relevé d\'activité',
      domaine: 'TECHNIQUE',
    },
  ];

  console.log('📋 Permissions M6');
  let countPerms = 0;
  for (const perm of PERMISSIONS_M6) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: {
        libelle: perm.libelle,
        domaine: perm.domaine,
      },
    });
    countPerms++;
  }
  console.log(`   ✅ ${countPerms} permissions M6 créées/mises à jour\n`);

  // ===========================================================================
  // ATTRIBUTION DES PERMISSIONS AUX RÔLES (source : M6-RELEVES.md §6)
  // ===========================================================================

  console.log('📋 Attribution des permissions aux rôles');

  const ATTRIBUTIONS = [
    // ADMIN : toutes les permissions
    { roleCode: 'ADMIN', permCodes: ['releve:saisir', 'releve:viser'] },
    // DT : toutes les permissions
    { roleCode: 'DT', permCodes: ['releve:saisir', 'releve:viser'] },
    // CT : toutes les permissions
    { roleCode: 'CT', permCodes: ['releve:saisir', 'releve:viser'] },
    // CC : seulement saisir
    { roleCode: 'CC', permCodes: ['releve:saisir'] },
  ];

  for (const { roleCode, permCodes } of ATTRIBUTIONS) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      console.log(`   ⚠️  Rôle ${roleCode} non trouvé`);
      continue;
    }

    for (const permCode of permCodes) {
      const perm = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
        update: {},
      });
    }
    console.log(`   ✅ ${roleCode} : ${permCodes.length} permission(s)`);
  }

  console.log('\n✅ Seed M6 terminé\n');
}

main()
  .catch((e) => {
    console.error('Erreur seed M6 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
