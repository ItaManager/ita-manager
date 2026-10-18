#!/usr/bin/env tsx
/**
 * Script : Réinitialise la MFA d'un utilisateur
 *
 * Usage: tsx scripts/reset-mfa-current.ts <email>
 *
 * Supprime :
 * - Les facteurs TOTP de Supabase Auth
 * - Les codes de secours MFA de Prisma
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: tsx scripts/reset-mfa-current.ts <email>");
    process.exit(1);
  }

  console.log(`🔍 Recherche de l'utilisateur : ${email}`);

  // Client admin Supabase
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. Trouver l'utilisateur dans Supabase Auth
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", listError);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email === email);

  if (!user) {
    console.error(`❌ Utilisateur ${email} introuvable`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé : ${user.id}`);

  // 2. Récupérer les facteurs MFA via l'API admin getUserById
  const { data: userData, error: userDataError } =
    await supabaseAdmin.auth.admin.getUserById(user.id);

  if (userDataError) {
    console.error("❌ Erreur lors de la récupération de l'utilisateur:", userDataError);
    process.exit(1);
  }

  const factors = userData.user.factors || [];

  if (factors.length > 0) {
    console.log(`📱 ${factors.length} facteur(s) MFA trouvé(s)`);

    for (const factor of factors) {
      // Supprimer le facteur via l'API admin
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteFactor({
        id: factor.id,
        userId: user.id,
      });

      if (deleteError) {
        console.error(`❌ Erreur lors de la suppression du facteur ${factor.id}:`, deleteError);
      } else {
        console.log(`✅ Facteur ${factor.factor_type} supprimé (${factor.id})`);
      }
    }
  } else {
    console.log("ℹ️  Aucun facteur MFA trouvé");
  }

  // 3. Supprimer les codes de secours dans Prisma
  const deletedCodes = await prisma.codeSecoursMfa.deleteMany({
    where: { profilId: user.id },
  });

  console.log(`🗑️  ${deletedCodes.count} code(s) de secours supprimé(s)`);

  console.log("");
  console.log("✅ MFA réinitialisée avec succès !");
  console.log(`🔗 Vous pouvez maintenant accéder à : http://localhost:3000/auth/setup-mfa`);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
