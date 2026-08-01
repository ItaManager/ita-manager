#!/usr/bin/env tsx
/**
 * Add employe:lire permission to CC and CE roles
 */

import { prismaDirect as prisma } from './lib/prisma-direct';

async function updatePermissions() {
  // Get employe:lire permission
  const employeLire = await prisma.permission.findUnique({ where: { code: 'employe:lire' } });
  if (!employeLire) {
    console.log('❌ Permission employe:lire not found');
    await prisma.$disconnect();
    return;
  }

  // Get CC and CE roles
  const cc = await prisma.role.findUnique({ where: { code: 'CC' } });
  const ce = await prisma.role.findUnique({ where: { code: 'CE' } });

  if (!cc || !ce) {
    console.log('❌ Roles CC or CE not found');
    await prisma.$disconnect();
    return;
  }

  // Add employe:lire to CC
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: cc.id,
        permissionId: employeLire.id,
      }
    },
    create: {
      roleId: cc.id,
      permissionId: employeLire.id,
    },
    update: {}
  });

  // Add employe:lire to CE
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: ce.id,
        permissionId: employeLire.id,
      }
    },
    create: {
      roleId: ce.id,
      permissionId: employeLire.id,
    },
    update: {}
  });

  console.log('✅ Added employe:lire permission to CC and CE roles');
  await prisma.$disconnect();
}

updatePermissions();
