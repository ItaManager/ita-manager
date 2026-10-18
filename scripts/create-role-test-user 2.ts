#!/usr/bin/env tsx
/**
 * Crée un compte test avec un rôle spécifique
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/create-role-test-user.ts <ROLE>
 * Exemple: npx dotenv -e .env.dev -- npx tsx scripts/create-role-test-user.ts CC
 *
 * DÉVELOPPEMENT UNIQUEMENT — refusé en production
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Projet Supabase de développement (fpbtkbfvgqbevwfnsywu)
const DEV_SUPABASE_PROJECT_ID = "fpbtkbfvgqbevwfnsywu";

const ROLE_EMAILS: Record<string, string> = {
  CC: "test-cc@ita-sarl.local",
  DT: "test-dt@ita-sarl.local",
  RH: "test-rh@ita-sarl.local",
  DG: "test-dg@ita-sarl.local",
  DRH: "test-drh@ita-sarl.local",
  DFC: "test-dfc@ita-sarl.local",
  CT: "test-ct@ita-sarl.local",
  CE: "test-ce@ita-sarl.local",
};

const TEST_PASSWORD = "TestRole2026!";

async function main() {
  const roleCode = process.argv[2]?.toUpperCase();

  if (!roleCode) {
    console.error("❌ Usage: npx tsx scripts/create-role-test-user.ts <ROLE>");
    console.error("   Rôles disponibles: CC, DT, RH, DG, DRH, DFC, CT, CE");
    process.exit(1);
  }

  if (!ROLE_EMAILS[roleCode]) {
    console.error(`❌ Rôle inconnu: ${roleCode}`);
    console.error("   Rôles disponibles:", Object.keys(ROLE_EMAILS).join(", "));
    process.exit(1);
  }

  // GARDE-FOU : refus explicite en production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ INTERDIT : Ce script ne peut s'exécuter en production");
    console.error("   Un compte au mot de passe connu ne doit jamais atteindre la base réelle.");
    process.exit(1);
  }

  // GARDE-FOU : vérification du projet Supabase (développement uniquement)
  if (!SUPABASE_URL.includes(DEV_SUPABASE_PROJECT_ID)) {
    console.error("❌ INTERDIT : URL Supabase ne correspond pas au projet de développement");
    console.error(`   Attendu : ${DEV_SUPABASE_PROJECT_ID}`);
    console.error(`   Reçu    : ${SUPABASE_URL}`);
    process.exit(1);
  }

  console.log("✅ Garde-fous validés : environnement de développement\n");

  const testEmail = ROLE_EMAILS[roleCode];

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Vérifier si le compte existe déjà
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  const userExists = existingUser?.users.find((u) => u.email === testEmail);

  if (userExists) {
    console.log(`ℹ️  Compte ${testEmail} existe déjà (ID: ${userExists.id})`);
    console.log(`   Mot de passe : ${TEST_PASSWORD}`);

    // Vérifier les permissions
    const profil = await prisma.profil.findUnique({
      where: { id: userExists.id },
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

    const permissions = profil?.roles.flatMap((pr) =>
      pr.role.permissions.map((rp) => rp.permission.code)
    );

    console.log(`\nPermissions du compte ${roleCode}:`);
    permissions?.forEach((p) => console.log(`  - ${p}`));

    return;
  }

  // Créer le compte Supabase
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error("Erreur création compte:", error);
    process.exit(1);
  }

  console.log("✅ Compte créé :", testEmail);
  console.log("   ID :", data.user.id);
  console.log("   Mot de passe :", TEST_PASSWORD);

  // Attribuer le rôle
  const role = await prisma.role.findUnique({
    where: { code: roleCode },
  });

  if (!role) {
    console.error(`❌ Rôle ${roleCode} introuvable`);
    process.exit(1);
  }

  await prisma.profilRole.create({
    data: {
      profilId: data.user.id,
      roleId: role.id,
    },
  });

  console.log(`✅ Rôle ${roleCode} attribué`);

  // Vérifier les permissions
  const profil = await prisma.profil.findUnique({
    where: { id: data.user.id },
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

  const permissions = profil?.roles.flatMap((pr) =>
    pr.role.permissions.map((rp) => rp.permission.code)
  );

  console.log(`\nPermissions du compte ${roleCode}:`);
  permissions?.forEach((p) => console.log(`  - ${p}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
