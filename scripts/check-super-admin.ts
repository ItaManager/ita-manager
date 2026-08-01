#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } }
});

async function check() {
  const profil = await prisma.profil.findUnique({
    where: { email: 'armelgnakpa7@gmail.com' },
    include: {
      roles: { include: { role: true } },
      employe: true,
    }
  });

  if (!profil) {
    console.log('❌ Profil Super Admin introuvable');
  } else {
    console.log('✅ Profil Super Admin trouvé');
    console.log('   Email:', profil.email);
    console.log('   UUID:', profil.id);
    console.log('   Employé:', profil.employe ? profil.employe.matricule : 'NULL (normal pour Super Admin)');
    console.log('   Rôles:', profil.roles.map(r => r.role.code).join(', '));
    // console.log('   TOTP activé:', profil.totpActive ? 'OUI' : 'NON'); // totpActive n'existe plus dans Profil
  }

  await prisma.$disconnect();
}

check();
