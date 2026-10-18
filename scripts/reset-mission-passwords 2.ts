import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const accounts = [
    { email: "declann.armel@ita-manager.test", password: "Declann2026!" },
    { email: "drh@ita-manager.test", password: "DRH2026!" }
  ];

  console.log("\n🔑 Réinitialisation des mots de passe M19\n");

  for (const account of accounts) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === account.email);

    if (!user) {
      console.log(`❌ ${account.email} — compte inexistant`);
      continue;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: account.password,
    });

    if (error) {
      console.log(`❌ ${account.email} — erreur: ${error.message}`);
    } else {
      console.log(`✅ ${account.email}`);
      console.log(`   Mot de passe: ${account.password}\n`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
