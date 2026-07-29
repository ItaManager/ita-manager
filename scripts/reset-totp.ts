#!/usr/bin/env tsx

/**
 * Script de nettoyage : suppression des facteurs MFA existants
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/reset-totp.ts
 */

import { createClient } from "@supabase/supabase-js";

const email = "armelgnakpa7@gmail.com";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
  }

  console.log(`🔄 Nettoyage des facteurs MFA pour ${email}...\n`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Trouver l'utilisateur
  const { data: users, error: searchError } = await supabase.auth.admin.listUsers();

  if (searchError) {
    console.error("❌ Erreur lors de la recherche:", searchError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email ${email}`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})\n`);

  // Lister les facteurs MFA
  const { data: factors, error: listError } = await supabase.auth.admin.mfa.listFactors({
    userId: user.id,
  });

  if (listError) {
    console.error("❌ Erreur lors de la liste des facteurs:", listError.message);
    process.exit(1);
  }

  if (!factors || factors.factors.length === 0) {
    console.log("ℹ️  Aucun facteur MFA trouvé. Le compte est déjà propre.");
    return;
  }

  console.log(`📋 ${factors.factors.length} facteur(s) trouvé(s):\n`);

  for (const factor of factors.factors) {
    console.log(`   - ID: ${factor.id}`);
    console.log(`     Type: ${factor.factor_type}`);
    console.log(`     Statut: ${factor.status}`);
    console.log(`     Créé: ${factor.created_at}\n`);
  }

  // Supprimer chaque facteur
  for (const factor of factors.factors) {
    console.log(`🗑️  Suppression du facteur ${factor.id}...`);

    const { error: deleteError } = await supabase.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: user.id,
    });

    if (deleteError) {
      console.error(`   ❌ Erreur: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Supprimé avec succès`);
    }
  }

  console.log("\n✅ Nettoyage terminé !");
  console.log("\n💡 Vous pouvez maintenant configurer la double authentification depuis:");
  console.log("   http://localhost:3000/securite/2fa");
}

main().catch(console.error);
