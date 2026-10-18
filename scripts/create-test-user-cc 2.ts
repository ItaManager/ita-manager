#!/usr/bin/env tsx
/**
 * Crée un compte de test avec rôle CC (Chef de Chantier)
 * pour tester le masquage des prix dans M14 Achats
 *
 * CC a achat:demander mais PAS achat:instruire
 */

import { createClient } from '@supabase/supabase-js';
import { prismaDirect as prisma } from './lib/prisma-direct';
import { randomBytes } from 'node:crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_EMAIL = 'test-cc@ita-sarl.local';
const TEST_PASSWORD = 'Test-CC-2026!';

async function createTestUser() {
  console.log('🧪 Création compte test CC (Chef de Chantier)');

  // Vérifier si le compte existe déjà dans auth.users
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users.find(u => u.email === TEST_EMAIL);

  let userId: string;

  if (existingUser) {
    console.log(`  ✓ Compte auth existant : ${TEST_EMAIL}`);
    userId = existingUser.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error('❌ Échec création compte:', error?.message);
      await prisma.$disconnect();
      return;
    }

    userId = data.user.id;
    console.log(`  ✓ Compte créé : ${TEST_EMAIL}`);
    console.log(`  ✓ Mot de passe : ${TEST_PASSWORD}`);

    // Attendre le trigger
    await new Promise(r => setTimeout(r, 1000));
  }

  // S'assurer que le profil existe
  await prisma.profil.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: TEST_EMAIL,
      actif: true,
    },
    update: {},
  });

  // Trouver le rôle CC
  const ccRole = await prisma.role.findUnique({
    where: { code: 'CC' },
  });

  if (!ccRole) {
    console.error('❌ Rôle CC introuvable');
    await prisma.$disconnect();
    return;
  }

  // Attribuer le rôle CC
  await prisma.profilRole.upsert({
    where: { profilId_roleId: { profilId: userId, roleId: ccRole.id } },
    create: { profilId: userId, roleId: ccRole.id },
    update: {},
  });

  console.log(`  ✓ Rôle CC attribué`);
  console.log('');
  console.log('✅ Compte de test prêt :');
  console.log(`   Email     : ${TEST_EMAIL}`);
  console.log(`   Password  : ${TEST_PASSWORD}`);
  console.log(`   Rôle      : CC (Chef de Chantier)`);
  console.log(`   Permissions : achat:demander (MAIS PAS achat:instruire)`);
  console.log('');
  console.log('Ce compte verra les prix MASQUÉS dans /achats/suivi');

  await prisma.$disconnect();
}

createTestUser();
