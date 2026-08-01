/**
 * Script de diagnostic - Vérifier la session et les permissions
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/debug-session.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Diagnostic de session\n");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Variables d'environnement Supabase manquantes");
    process.exit(1);
  }

  // 1. Vérifier tous les utilisateurs Supabase Auth
  console.log("📋 1. Utilisateurs dans Supabase Auth");
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
  const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("❌ Erreur Supabase:", error);
    process.exit(1);
  }

  console.log(`   Trouvé ${authUsers.users.length} utilisateur(s)\n`);

  for (const user of authUsers.users) {
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Créé: ${user.created_at}`);

    // Chercher le profil correspondant
    const profil = await prisma.profil.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (profil) {
      console.log(`   ✓ Profil trouvé (actif: ${profil.actif})`);
      console.log(`   Rôles: ${profil.roles.map((r) => r.role.libelle).join(", ")}`);

      const perms = new Set<string>();
      profil.roles.forEach((pr) => {
        pr.role.permissions.forEach((rp) => {
          perms.add(rp.permission.code);
        });
      });

      console.log(`   Permissions: ${perms.size} dont employe:lire=${perms.has("employe:lire")}`);
    } else {
      console.log(`   ❌ Aucun profil trouvé dans la base`);
    }

    console.log("");
  }

  // 2. Vérifier les profils sans utilisateur Supabase
  console.log("\n📋 2. Profils sans utilisateur Supabase Auth");
  const allProfiles = await prisma.profil.findMany({
    select: { id: true, email: true, actif: true },
  });

  const authUserIds = new Set(authUsers.users.map((u) => u.id));

  for (const profil of allProfiles) {
    if (!authUserIds.has(profil.id)) {
      console.log(`   ⚠️  Profil orphelin: ${profil.email} (ID: ${profil.id})`);
    }
  }

  console.log("\n✅ Diagnostic terminé");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
