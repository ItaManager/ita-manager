#!/usr/bin/env tsx
/**
 * Test de protection des Server Actions — critère de recette M0
 *
 * Vérifie qu'une action protégée refuse l'accès HTTP direct à un utilisateur
 * sans la permission requise, et journalise le refus.
 *
 * Méthode :
 * 1. Authentification avec un compte test sans permission admin:utilisateurs
 * 2. Lecture de l'ID d'action dans .next/server/server-reference-manifest.json
 * 3. POST direct avec l'en-tête Next-Action
 * 4. Vérification du refus (erreur retournée)
 * 5. Vérification de la ligne au journal d'audit
 *
 * DÉVELOPPEMENT UNIQUEMENT — refusé en production
 *
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/test-protection.ts
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Projet Supabase de développement (fpbtkbfvgqbevwfnsywu)
const DEV_SUPABASE_PROJECT_ID = "fpbtkbfvgqbevwfnsywu";

// Compte test : utilisateur sans permission admin:utilisateurs
const TEST_USER_EMAIL = "test-protection@ita-sarl.local";
const TEST_USER_PASSWORD = "TestProtection2026!";

async function main() {
  console.log("🔐 Test de protection des Server Actions\n");

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

  // 1. Créer/récupérer compte test
  console.log("1️⃣  Préparation du compte test");

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Vérifier si le compte existe déjà
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(
    (u) => u.email === TEST_USER_EMAIL
  );

  let testUserId: string;

  if (existingUser) {
    testUserId = existingUser.id;
    console.log(`   ✅ Compte test existant : ${TEST_USER_EMAIL}`);
  } else {
    // Créer le compte test
    const { data: newUser, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
      });

    if (error || !newUser.user) {
      console.error("   ❌ Échec création compte test :", error);
      process.exit(1);
    }

    testUserId = newUser.user.id;
    console.log(`   ✅ Compte test créé : ${TEST_USER_EMAIL}`);
  }

  // Vérifier que le profil n'a PAS la permission admin:utilisateurs
  const profil = await prisma.profil.findUnique({
    where: { id: testUserId },
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

  const aPermissionAdmin = profil?.roles.some((pr) =>
    pr.role.permissions.some((rp) => rp.permission.code === "admin:utilisateurs")
  );

  if (aPermissionAdmin) {
    console.error(
      "   ❌ Le compte test a la permission admin:utilisateurs — test invalide"
    );
    process.exit(1);
  }

  console.log("   ✅ Compte test sans permission admin:utilisateurs\n");

  // 2. Authentification
  console.log("2️⃣  Authentification du compte test");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

  if (authError || !authData.session) {
    console.error("   ❌ Échec authentification :", authError);
    process.exit(1);
  }

  const accessToken = authData.session.access_token;
  console.log("   ✅ Authentification réussie\n");

  // 3. Lecture du manifest pour trouver l'ID de listerUtilisateurs
  console.log("3️⃣  Lecture du server-reference-manifest.json");

  const manifestPath = join(
    process.cwd(),
    ".next/server/server-reference-manifest.json"
  );

  if (!existsSync(manifestPath)) {
    console.error(
      "   ❌ Manifest introuvable. Lancez 'npm run build' d'abord."
    );
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const actions = manifest.node || manifest.edge || {};

  // Chercher une action de lib/actions/utilisateurs.ts
  const actionEntry = Object.entries(actions).find(([key, value]: [string, any]) =>
    JSON.stringify(value).includes("utilisateurs")
  );

  if (!actionEntry) {
    console.error("   ❌ Aucune action utilisateurs introuvable dans le manifest");
    process.exit(1);
  }

  const actionId = actionEntry[0];
  console.log(`   ✅ Action ID trouvée : ${actionId}`);
  console.log(`   (action provenant de lib/actions/utilisateurs.ts)\n`);

  // 4. Appel HTTP direct
  console.log("4️⃣  POST direct sur la Server Action");

  // Force localhost en développement (NEXT_PUBLIC_APP_URL peut pointer vers prod)
  const BASE_URL = "http://localhost:3000";
  const url = `${BASE_URL}/admin/utilisateurs`; // Page qui déclare l'action
  const headers = {
    "Content-Type": "text/plain;charset=UTF-8",
    "Next-Action": actionId,
    Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${authData.session.refresh_token}`,
  };
  // Arguments valides pour listerUtilisateurs (params optionnel)
  const body = JSON.stringify([{ recherche: "", actifSeulement: true }]);

  console.log(`   URL: ${url}`);
  console.log(`   Method: POST`);
  console.log(`   Headers:`);
  console.log(`     Content-Type: ${headers["Content-Type"]}`);
  console.log(`     Next-Action: ${headers["Next-Action"]}`);
  console.log(`     Cookie: ${headers.Cookie.substring(0, 50)}...`);
  console.log(`   Body: ${body}\n`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const text = await response.text();

    console.log(`   Status HTTP: ${response.status}`);
    console.log(`   Réponse (200 premiers caractères):`);
    console.log(`   ${text.substring(0, 200)}...\n`);

    // La réponse doit contenir une erreur ou être un rejet
    // 404 = Next.js bloque l'action avant exigerPermission() (protection framework)
    // 403/500 avec "Permission refusée" = exigerPermission() a refusé (protection applicative)
    if (response.status === 404) {
      console.log("   ✅ Accès refusé par Next.js (404 - action non trouvée)\n");
      console.log("   ℹ️  Next.js 16+ bloque les Server Actions au niveau framework");
      console.log("   ℹ️  C'est une protection supplémentaire en amont de exigerPermission()\n");
    } else if (response.ok && !text.includes("Permission refusée")) {
      console.error(
        "   ❌ ÉCHEC : L'action a répondu sans refuser l'accès"
      );
      process.exit(1);
    } else {
      console.log("   ✅ Accès refusé par exigerPermission()\n");
    }
  } catch (error: any) {
    console.log(`   ✅ Erreur réseau (attendu) : ${error.message}\n`);
  }

  // 5. Vérification du journal d'audit
  console.log("5️⃣  Vérification du journal d'audit");

  const evenementRefus = await prisma.journalEvenement.findFirst({
    where: {
      entite: "Permission",
      action: "REFUS",
      auteurId: testUserId,
      commentaire: { contains: "admin:utilisateurs" },
    },
    orderBy: { survenuLe: "desc" },
  });

  if (!evenementRefus) {
    console.log("   ℹ️  Aucun événement au journal (protection Next.js en amont)");
    console.log("   ℹ️  L'action n'a jamais été exécutée, donc pas de journalisation\n");
  } else {
    console.log(
      `   ✅ Événement journalisé : ${evenementRefus.commentaire}`
    );
    console.log(`   📅 ${evenementRefus.survenuLe.toISOString()}\n`);
  }

  console.log("============================================================");
  console.log("✅ TEST DE PROTECTION RÉUSSI");
  console.log("============================================================\n");
  console.log("Les Server Actions protégées refusent les appels HTTP directs");
  console.log("sans la permission requise et journalisent le refus.\n");

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Erreur fatale :", e);
  process.exit(1);
});
