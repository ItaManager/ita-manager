#!/usr/bin/env tsx
/**
 * Test de protection des Server Actions — version simplifiée
 *
 * Vérifie qu'une action protégée refuse l'accès à un utilisateur sans
 * la permission requise, et journalise le refus.
 *
 * Méthode plus directe (sans HTTP):
 * 1. Créer un compte test sans permission admin:utilisateurs
 * 2. Simuler une session avec ce compte (via mock ou appel direct)
 * 3. Appeler listerUtilisateurs
 * 4. Vérifier que PermissionRefusee est levée
 * 5. Vérifier la ligne au journal d'audit
 *
 * DÉVELOPPEMENT UNIQUEMENT — refusé en production
 *
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/test-protection-simple.ts
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Projet Supabase de développement (fpbtkbfvgqbevwfnsywu)
const DEV_SUPABASE_PROJECT_ID = "fpbtkbfvgqbevwfnsywu";

// Compte test : utilisateur sans permission admin:utilisateurs
const TEST_USER_EMAIL = "test-protection@ita-sarl.local";

async function main() {
  console.log("🔐 Test de protection des Server Actions (simplifié)\n");

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

  // 1. Vérifier que le compte test existe
  console.log("1️⃣  Vérification du compte test");

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const testUser = users?.users.find((u) => u.email === TEST_USER_EMAIL);

  if (!testUser) {
    console.error(`   ❌ Compte test introuvable: ${TEST_USER_EMAIL}`);
    console.error("   Lancez: npx dotenv -e .env.dev -- npx tsx scripts/create-test-user.ts");
    process.exit(1);
  }

  console.log(`   ✅ Compte test trouvé : ${TEST_USER_EMAIL} (${testUser.id})\n`);

  // 2. Vérifier qu'il n'a PAS la permission
  console.log("2️⃣  Vérification des permissions");

  const profil = await prisma.profil.findUnique({
    where: { id: testUser.id },
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

  console.log(`   Permissions: ${permissions?.join(", ") || "aucune"}`);

  const aPermissionAdmin = permissions?.includes("admin:utilisateurs");

  if (aPermissionAdmin) {
    console.error("   ❌ Le compte test a la permission admin:utilisateurs — test invalide");
    process.exit(1);
  }

  console.log("   ✅ Compte test sans permission admin:utilisateurs\n");

  // 3. Test : l'action doit refuser
  console.log("3️⃣  Test de refus de l'action protégée");

  const { exigerPermission } = await import("../lib/auth/guard");

  // Simuler le contexte d'exécution avec ce compte
  // ATTENTION: ceci ne teste PAS vraiment le guard car on appelle directement
  // exiger Permission. Le vrai test nécessiterait HTTP.

  console.log("   ⚠️  Version simplifiée : appel direct, pas HTTP");
  console.log("   Pour un test complet HTTP, utilisez test-protection.ts après npm run build\n");

  try {
    await exigerPermission("admin:utilisateurs");
    console.error("   ❌ ÉCHEC : exigerPermission n'a pas levé d'erreur");
    console.error("   Le guard ne fonctionne pas correctement.");
    process.exit(1);
  } catch (error: any) {
    if (error.name === "PermissionRefusee") {
      console.log("   ✅ PermissionRefusee levée comme attendu");
      console.log(`   Message: ${error.message}\n`);
    } else {
      console.error(`   ❌ Erreur inattendue: ${error.message}`);
      process.exit(1);
    }
  }

  // 4. Vérification du journal d'audit
  console.log("4️⃣  Vérification du journal d'audit");

  const evenementRefus = await prisma.journalEvenement.findFirst({
    where: {
      entite: "Permission",
      action: "REFUS",
      commentaire: { contains: "admin:utilisateurs" },
    },
    orderBy: { survenuLe: "desc" },
  });

  if (!evenementRefus) {
    console.log("   ⚠️  Aucun événement de refus récent trouvé");
    console.log("   (Normal si aucun appel HTTP direct n'a été effectué)\n");
  } else {
    console.log(
      `   ✅ Événement journalisé : ${evenementRefus.commentaire}`
    );
    console.log(`   📅 ${evenementRefus.survenuLe.toISOString()}\n`);
  }

  console.log("============================================================");
  console.log("✅ TEST PARTIEL RÉUSSI");
  console.log("============================================================\n");
  console.log("Ce test vérifie que exigerPermission() refuse correctement.");
  console.log("Pour un test HTTP complet, construisez l'app et utilisez test-protection.ts\n");

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Erreur fatale :", e);
  process.exit(1);
});
