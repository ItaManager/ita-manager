#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { prismaDirect as p } from './lib/prisma-direct';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testTrigger() {
  const { data, error } = await sb.auth.admin.createUser({
    email: 'test-trigger@ita-sarl.local',
    password: 'Test-Trigger-2026!',
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error('❌ Échec création compte:', JSON.stringify(error, null, 2));
    console.error('Data:', JSON.stringify(data, null, 2));
    await p.$disconnect();
    return;
  }

  await new Promise(r => setTimeout(r, 1000));

  const profil = await p.profil.findUnique({ where: { id: data.user.id } });
  console.log(profil ? '✅ trigger OK' : '❌ trigger inopérant');

  await sb.auth.admin.deleteUser(data.user.id);
  await p.$disconnect();
}

testTrigger();
