#!/usr/bin/env tsx
/**
 * Seed permissions M7 — Paie chantier
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-permissions-m7.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const PERMISSIONS_M7 = [
  {
    code: 'paie:ouvrirPeriode',
    libelle: 'Ouvrir et contrôler une période de paie',
    domaine: 'PAIE',
  },
  {
    code: 'paie:validerDT',
    libelle: 'Valider une période de paie (Directeur Technique)',
    domaine: 'PAIE',
  },
  {
    code: 'paie:validerDFC',
    libelle: 'Valider une période de paie (Directeur Financier)',
    domaine: 'PAIE',
  },
  {
    code: 'paie:exporter',
    libelle: 'Exporter et clôturer une période de paie',
    domaine: 'PAIE',
  },
];

const ATTRIBUTIONS = [
  { roleCode: 'ADMIN', permCodes: ['paie:ouvrirPeriode', 'paie:validerDT', 'paie:validerDFC', 'paie:exporter'] },
  { roleCode: 'DRH', permCodes: ['paie:ouvrirPeriode'] },
  { roleCode: 'RH', permCodes: ['paie:ouvrirPeriode'] },
  { roleCode: 'DT', permCodes: ['paie:validerDT'] },
  { roleCode: 'DFC', permCodes: ['paie:validerDFC', 'paie:exporter'] },
];

async function main() {
  console.log('📝 Seed permissions M7 — Paie chantier\n');

  // ===========================================================================
  // 1. CRÉER LES PERMISSIONS
  // ===========================================================================

  for (const perm of PERMISSIONS_M7) {
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

  console.log('\n✅ Seed permissions M7 terminé\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed permissions M7 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
