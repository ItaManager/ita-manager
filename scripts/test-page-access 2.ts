#!/usr/bin/env tsx
/**
 * Test d'accès à une page protégée avec un compte spécifique
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/test-page-access.ts
 *
 * Teste l'accès à /paie avec le compte CC (doit être refusé)
 */

const TEST_EMAIL = "test-cc@ita-sarl.local";
const TEST_PASSWORD = "TestRole2026!";
const TEST_URL = "http://localhost:3000/paie";

async function main() {
  console.log("🧪 Test d'accès page protégée\n");
  console.log(`Compte : ${TEST_EMAIL}`);
  console.log(`URL    : ${TEST_URL}`);
  console.log(`Attendu: 403 Forbidden + entrée audit\n`);

  // 1. Se connecter
  console.log("1️⃣  Connexion...");
  const loginRes = await fetch("http://localhost:3000/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (!loginRes.ok) {
    console.error("❌ Échec connexion");
    console.error(await loginRes.text());
    process.exit(1);
  }

  // Récupérer le cookie de session
  const cookies = loginRes.headers.get("set-cookie");
  if (!cookies) {
    console.error("❌ Pas de cookie de session");
    process.exit(1);
  }

  console.log("✅ Connecté");

  // 2. Tenter d'accéder à /paie
  console.log("\n2️⃣  Accès à /paie...");
  const pageRes = await fetch(TEST_URL, {
    headers: { Cookie: cookies },
    redirect: "manual",
  });

  console.log(`   Status: ${pageRes.status} ${pageRes.statusText}`);

  if (pageRes.status === 303 || pageRes.status === 307) {
    const location = pageRes.headers.get("location");
    console.log(`   Redirect: ${location}`);

    if (location === "/403") {
      console.log("\n✅ SUCCÈS : Accès refusé avec redirection vers /403");
    } else {
      console.log(`\n❌ ÉCHEC : Redirection inattendue vers ${location}`);
      process.exit(1);
    }
  } else if (pageRes.status === 200) {
    console.log("\n❌ ÉCHEC : Page accessible (devrait être refusée)");
    process.exit(1);
  } else {
    console.log(`\n⚠️  Status inattendu: ${pageRes.status}`);
  }

  // 3. Vérifier l'entrée dans le journal d'audit
  console.log("\n3️⃣  Vérification journal d'audit...");
  console.log("   (Vérification manuelle requise via l'interface)");
}

main().catch(console.error);
