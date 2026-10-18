#!/usr/bin/env tsx
/**
 * Crée un compte test pour test-protection.ts
 * Compte : test-protection@ita-sarl.local avec rôle CC (Chef de Chantier)
 *
 * DÉVELOPPEMENT UNIQUEMENT — refusé en production
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Projet Supabase de développement (fpbtkbfvgqbevwfnsywu)
const DEV_SUPABASE_PROJECT_ID = "fpbtkbfvgqbevwfnsywu";

const TEST_EMAIL = "test-protection@ita-sarl.local";
const TEST_PASSWORD = "TestProtection2026!";

async function main() {
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

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Créer le compte Supabase
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error("Erreur création compte:", error);
    process.exit(1);
  }

  console.log("✅ Compte créé :", TEST_EMAIL);
  console.log("   ID :", data.user.id);
  console.log("   Mot de passe :", TEST_PASSWORD);

  // Attribuer le rôle CC
  const roleCC = await prisma.role.findUnique({
    where: { code: "CC" },
  });

  if (!roleCC) {
    console.error("❌ Rôle CC introuvable");
    process.exit(1);
  }

  await prisma.profilRole.create({
    data: {
      profilId: data.user.id,
      roleId: roleCC.id,
    },
  });

  console.log("✅ Rôle CC attribué");

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

  console.log("\nPermissions du compte test:");
  permissions?.forEach((p) => console.log(`  - ${p}`));

  const aAdminUtilisateurs = permissions?.includes("admin:utilisateurs");
  console.log(
    `\n${aAdminUtilisateurs ? "❌" : "✅"} admin:utilisateurs : ${aAdminUtilisateurs ? "présente (PROBLÈME)" : "absente (OK)"}`
  );
}

main().catch(console.error);
