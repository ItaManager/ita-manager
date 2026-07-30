/**
 * Invalide toutes les sessions Supabase Auth
 * Force tous les utilisateurs à se reconnecter
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/invalidate-all-sessions.ts
 */

import { createClient } from "@supabase/supabase-js";

async function main() {
  console.log("🔒 Invalidation de toutes les sessions Supabase\n");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Variables d'environnement Supabase manquantes");
    process.exit(1);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Lister tous les utilisateurs
  const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("❌ Erreur Supabase:", error);
    process.exit(1);
  }

  console.log(`📋 ${authUsers.users.length} utilisateur(s) trouvé(s)\n`);

  let invalidated = 0;

  for (const user of authUsers.users) {
    console.log(`🔓 Invalidation sessions: ${user.email}`);

    // Invalider toutes les sessions de l'utilisateur
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user.id);

    if (signOutError) {
      console.error(`   ❌ Erreur: ${signOutError.message}`);
    } else {
      console.log(`   ✓ Sessions invalidées`);
      invalidated++;
    }
  }

  console.log(`\n✅ Terminé : ${invalidated}/${authUsers.users.length} utilisateur(s) déconnecté(s)`);
  console.log("\n⚠️  Tous les utilisateurs devront se reconnecter");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  });
