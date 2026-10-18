#!/usr/bin/env tsx

/**
 * Script de test : génération d'un lien de réinitialisation
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/test-reset-password.ts
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

  console.log(`🔄 Génération d'un lien de réinitialisation pour ${email}...\n`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/reinitialiser`,
    },
  });

  if (error) {
    console.error("❌ Erreur :", error.message);
    process.exit(1);
  }

  if (data.properties?.action_link) {
    console.log("✅ Lien généré avec succès !\n");
    console.log("📧 Normalement envoyé à :", email);
    console.log("\n🔗 Lien de réinitialisation (à copier-coller dans le navigateur) :\n");
    console.log(data.properties.action_link);
    console.log("\n💡 Ce lien est valide pendant 1 heure.");
    console.log("\n⚠️  En développement, collez ce lien directement dans votre navigateur.");
  } else {
    console.error("❌ Aucun lien généré");
  }
}

main().catch(console.error);
