#!/usr/bin/env tsx
/**
 * Add M14 Achats permissions to all roles according to MATRICE
 */

import { prismaDirect as prisma } from './lib/prisma-direct';

const MATRICE_ACHATS = {
  "achat:demander": ["ADMIN", "DG", "DRH", "RH", "DFC", "DT", "CT", "CC", "CE"],
  "achat:instruire": ["ADMIN", "DT"],
  "achat:valider": ["ADMIN", "DG", "DRH", "DFC", "DT"],
  "achat:receptionner": ["ADMIN"],
  "achat:facturer": ["ADMIN", "DFC"],
  "achat:regulariser": ["ADMIN"],
  "achat:parametres": ["ADMIN", "DFC"],
};

async function seedAchatsPermissions() {
  console.log('Adding M14 Achats permissions to roles...\n');

  // Get all permissions
  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        in: Object.keys(MATRICE_ACHATS)
      }
    }
  });

  const permissionMap = Object.fromEntries(
    permissions.map(p => [p.code, p.id])
  );

  // Get all roles
  const roles = await prisma.role.findMany();
  const roleMap = Object.fromEntries(
    roles.map(r => [r.code, r.id])
  );

  let count = 0;

  // Apply MATRICE
  for (const [permCode, roleCodes] of Object.entries(MATRICE_ACHATS)) {
    const permId = permissionMap[permCode];
    if (!permId) {
      console.log(`⚠️  Permission ${permCode} not found`);
      continue;
    }

    for (const roleCode of roleCodes) {
      const roleId = roleMap[roleCode];
      if (!roleId) {
        console.log(`⚠️  Role ${roleCode} not found`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permId,
          }
        },
        create: {
          roleId,
          permissionId: permId,
        },
        update: {}
      });

      count++;
    }
  }

  console.log(`✅ Added ${count} role-permission mappings for M14 Achats`);
  await prisma.$disconnect();
}

seedAchatsPermissions();
