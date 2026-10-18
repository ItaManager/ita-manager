/**
 * Nettoie les utilisateurs Supabase Auth sans profil correspondant
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/cleanup-orphan-users.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Nettoyage des utilisateurs orphelins\n");

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

  // Lister tous les utilisateurs Supabase
  const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("❌ Erreur Supabase:", error);
    process.exit(1);
  }

  console.log(`📋 ${authUsers.users.length} utilisateurs dans Supabase Auth\n`);

  let suppressed = 0;

  for (const user of authUsers.users) {
    // Vérifier si le profil existe
    const profil = await prisma.profil.findUnique({
      where: { id: user.id },
    });

    if (!profil) {
      console.log(`🗑️  Suppression: ${user.email} (ID: ${user.id})`);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error(`   ❌ Erreur: ${deleteError.message}`);
      } else {
        console.log(`   ✓ Supprimé`);
        suppressed++;
      }
    }
  }

  console.log(`\n✅ Nettoyage terminé : ${suppressed} utilisateur(s) orphelin(s) supprimé(s)`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
