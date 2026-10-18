/**
 * Test du 403 : compte CC essaie d'accéder à /paie
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log("\n🧪 Test 403 : CC → /paie\n");

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Connexion avec CC
  console.log("1️⃣  Connexion avec test-cc@ita-sarl.local...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "test-cc@ita-sarl.local",
    password: "TestRole2026!",
  });

  if (authError || !authData.session) {
    console.error("❌ Échec de la connexion:", authError?.message);
    process.exit(1);
  }

  console.log(`✅ Connecté : ${authData.user.email}`);
  console.log(`   Session token : ${authData.session.access_token.substring(0, 20)}...`);

  // 2. Tenter d'accéder à /paie
  console.log("\n2️⃣  Tentative d'accès à http://localhost:3000/paie...");

  const response = await fetch("http://localhost:3000/paie", {
    headers: {
      Cookie: `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}`,
    },
    redirect: "manual",
  });

  console.log(`   Status : ${response.status}`);
  console.log(`   Location : ${response.headers.get("location") || "(aucune)"}`);

  // 3. Vérifier la redirection vers /403
  if (response.status === 307 || response.status === 303 || response.status === 302) {
    const location = response.headers.get("location");
    if (location?.includes("/403")) {
      console.log("\n✅ SUCCÈS : Redirection vers /403 détectée");
      console.log(`   ${location}`);
    } else {
      console.log(`\n❌ ÉCHEC : Redirection vers ${location} au lieu de /403`);
      process.exit(1);
    }
  } else if (response.status === 200) {
    console.log("\n❌ ÉCHEC : Accès autorisé (200) au lieu de redirection /403");
    process.exit(1);
  } else {
    console.log(`\n⚠️  Statut inattendu : ${response.status}`);
  }

  // 4. Déconnexion
  await supabase.auth.signOut();
  console.log("\n4️⃣  Déconnexion effectuée");
}

main().catch(console.error);
