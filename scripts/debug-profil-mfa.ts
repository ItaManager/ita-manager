#!/usr/bin/env npx tsx
/**
 * Script : Debug profil et MFA
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const email = process.argv[2] || "halgoafrica@gmail.com";

  console.log(`🔍 Debug pour : ${email}\n`);

  // 1. Chercher dans Prisma
  const profil = await prisma.profil.findUnique({
    where: { email },
    include: {
      employe: {
        select: { nom: true, prenom: true },
      },
    },
  });

  if (profil) {
    console.log("✅ Profil trouvé dans Prisma:");
    console.log(`   ID: ${profil.id}`);
    console.log(`   Email: ${profil.email}`);
    console.log(`   Actif: ${profil.actif}`);
    if (profil.employe) {
      console.log(`   Employé: ${profil.employe.prenom} ${profil.employe.nom}`);
    }
  } else {
    console.log("❌ Profil introuvable dans Prisma");
  }

  // 2. Chercher dans Supabase Auth
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("\n❌ Erreur Supabase:", error);
    process.exit(1);
  }

  const authUser = users.users.find((u) => u.email === email);

  if (authUser) {
    console.log("\n✅ Utilisateur trouvé dans Supabase Auth:");
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Créé le: ${authUser.created_at}`);

    // Vérifier les facteurs MFA
    const { data: factors } = await supabaseAdmin.auth.mfa.listFactors({
      userId: authUser.id,
    });

    if (factors?.totp && factors.totp.length > 0) {
      console.log(`\n📱 ${factors.totp.length} facteur(s) TOTP:`);
      factors.totp.forEach((f) => {
        console.log(`   - ID: ${f.id}`);
        console.log(`     Statut: ${f.status}`);
        console.log(`     Créé: ${f.created_at}`);
      });
    } else {
      console.log("\nℹ️  Aucun facteur TOTP");
    }
  } else {
    console.log("\n❌ Utilisateur introuvable dans Supabase Auth");
    console.log(`\nℹ️  Total utilisateurs Auth: ${users.users.length}`);
    console.log("   Emails présents:");
    users.users.slice(0, 10).forEach((u) => {
      console.log(`   - ${u.email}`);
    });
  }

  // 3. Codes de secours
  if (profil) {
    const codes = await prisma.codeSecoursMfa.findMany({
      where: { profilId: profil.id },
    });

    console.log(`\n🔐 ${codes.length} code(s) de secours en base`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
