#!/usr/bin/env tsx
/**
 * Check user permissions
 */

import { prismaDirect as prisma } from './lib/prisma-direct';

const email = process.argv[2] || 'armelgnakpa3@gmail.com';

async function checkUser() {
  const profil = await prisma.profil.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!profil) {
    console.log(`❌ User ${email} not found`);
  } else {
    console.log(`✅ User found: ${email}`);
    console.log('   Roles:', profil.roles.map(r => r.role.code).join(', ') || 'NONE');

    const permissions = profil.roles.flatMap(r => r.role.permissions.map(p => p.permission.code));
    console.log('   Permissions count:', permissions.length);
    console.log('   Has achat:demander:', permissions.includes('achat:demander') ? 'YES' : 'NO');
    console.log('   Has achat:instruire:', permissions.includes('achat:instruire') ? 'YES' : 'NO');
    console.log('   Has employe:lire:', permissions.includes('employe:lire') ? 'YES' : 'NO');
  }

  await prisma.$disconnect();
}

checkUser();
