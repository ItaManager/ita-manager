#!/usr/bin/env tsx

/**
 * Script d'urgence : réinitialisation directe du mot de passe
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/reset-password-admin.ts
 */

import { createClient } from "@supabase/supabase-js";

const email = "armelgnakpa7@gmail.com";
const newPassword = "demo123456789"; // Mot de passe temporaire

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
  }

  console.log(`🔄 Réinitialisation du mot de passe pour ${email}...\n`);

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

  // Réinitialiser le mot de passe
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error.message);
    process.exit(1);
  }

  console.log("✅ Mot de passe réinitialisé avec succès !\n");
  console.log("📧 Email:", email);
  console.log("🔑 Mot de passe temporaire:", newPassword);
  console.log("\n⚠️  IMPORTANT:");
  console.log("   1. Connectez-vous avec ce mot de passe temporaire");
  console.log("   2. Changez-le immédiatement depuis votre profil");
  console.log("\n🔗 Connexion: http://localhost:3000/connexion");
}

main().catch(console.error);
