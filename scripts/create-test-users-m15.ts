#!/usr/bin/env tsx
/**
 * Créer 2 profils de test pour M15
 *
 * - dfc-test@ita.ci (rôle DFC) → préparer et exécuter
 * - dg-test@ita.ci (rôle DG) → autoriser
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('📝 Création de 2 profils de test pour M15\n');

  // Récupérer les rôles
  const roleDFC = await prisma.role.findUnique({ where: { code: 'DFC' } });
  const roleDG = await prisma.role.findUnique({ where: { code: 'DG' } });

  if (!roleDFC || !roleDG) {
    console.error('❌ Rôles DFC ou DG introuvables');
    process.exit(1);
  }

  // 1. Créer profil DFC (pour préparer et exécuter)
  const profilDFC = await prisma.profil.upsert({
    where: { email: 'dfc-test@ita.ci' },
    create: {
      id: randomUUID(),
      email: 'dfc-test@ita.ci',
      roles: {
        create: {
          roleId: roleDFC.id,
        },
      },
    },
    update: {},
  });

  console.log('✅ Profil DFC créé : dfc-test@ita.ci');

  // 2. Créer profil DG (pour autoriser)
  const profilDG = await prisma.profil.upsert({
    where: { email: 'dg-test@ita.ci' },
    create: {
      id: randomUUID(),
      email: 'dg-test@ita.ci',
      roles: {
        create: {
          roleId: roleDG.id,
        },
      },
    },
    update: {},
  });

  console.log('✅ Profil DG créé : dg-test@ita.ci');

  console.log('\n💡 Profils de test disponibles :');
  console.log('   • dfc-test@ita.ci → préparer et exécuter');
  console.log('   • dg-test@ita.ci → autoriser');
  console.log('\nNote : Ces profils n\'ont pas de compte auth.users associé.');
  console.log('       Utilisez armelgnakpa7@gmail.com (ADMIN) pour tester.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
