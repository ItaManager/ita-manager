/**
 * Script pour nettoyer un compte Supabase Auth orphelin
 * (créé mais transaction Prisma échouée)
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log("❌ Variables Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const emailRecherche = process.argv[2];

  if (!emailRecherche) {
    console.log("Usage: npx tsx scripts/nettoyer-compte-orphelin.ts EMAIL");
    console.log("\nListe des comptes Supabase récents :\n");

    const { data: users } = await supabase.auth.admin.listUsers();

    users?.users.slice(0, 10).forEach((user, i) => {
      console.log(`${i + 1}. ${user.email || "Pas d'email"} (${user.id})`);
      console.log(`   Créé: ${new Date(user.created_at).toLocaleString()}`);
    });

    process.exit(0);
  }

  // Chercher l'utilisateur par email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(
    (u) => u.email?.toLowerCase() === emailRecherche.toLowerCase()
  );

  if (!user) {
    console.log(`❌ Aucun compte Supabase avec l'email: ${emailRecherche}`);
    process.exit(1);
  }

  console.log(`\n👤 Compte trouvé :`);
  console.log(`   Email: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Créé: ${new Date(user.created_at).toLocaleString()}\n`);

  // Vérifier si le profil existe en base
  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
  });

  if (profil) {
    console.log(`✅ Profil Prisma existe → compte complet, rien à nettoyer`);
    process.exit(0);
  }

  console.log(`⚠️  Profil Prisma ABSENT → compte orphelin détecté`);
  console.log(`🧹 Suppression du compte Supabase Auth...\n`);

  const { error } = await supabase.auth.admin.deleteUser(user.id);

  if (error) {
    console.log(`❌ Erreur lors de la suppression:`, error.message);
    process.exit(1);
  }

  console.log(`✅ Compte Supabase supprimé`);
  console.log(`\n🎯 Vous pouvez maintenant réessayer l'invitation\n`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
