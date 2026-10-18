#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } }
});

async function createSuperAdmin() {
  const userId = '6798fa25-88fe-44b8-9954-3997b1666f3a';
  const email = 'armelgnakpa7@gmail.com';

  // Vérifier si le profil existe déjà
  const existant = await prisma.profil.findUnique({
    where: { id: userId }
  });

  if (existant) {
    console.log('✅ Profil Super Admin existe déjà');
    await prisma.$disconnect();
    return;
  }

  // Créer le profil
  const profil = await prisma.profil.create({
    data: {
      id: userId,
      email: email,
    }
  });

  console.log('✅ Profil créé:', profil.email);

  // Trouver le rôle ADMIN
  const adminRole = await prisma.role.findUnique({
    where: { code: 'ADMIN' }
  });

  if (!adminRole) {
    console.error('❌ Rôle ADMIN introuvable');
    await prisma.$disconnect();
    return;
  }

  // Attribuer le rôle ADMIN
  await prisma.profilRole.create({
    data: {
      profilId: profil.id,
      roleId: adminRole.id,
    }
  });

  console.log('✅ Rôle ADMIN attribué');

  // Journaliser
  await prisma.journalEvenement.create({
    data: {
      entite: 'Profil',
      entiteId: profil.id,
      action: 'CREATION',
      auteurId: profil.id,
      auteurNom: profil.email,
      commentaire: 'Profil Super Admin créé manuellement',
    }
  });

  console.log('✅ Événement journalisé');
  console.log('');
  console.log('✅ Le Super Admin est prêt. Vous pouvez maintenant vous connecter avec:');
  console.log('   Email:', email);
  console.log('   UUID:', userId);

  await prisma.$disconnect();
}

createSuperAdmin()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
