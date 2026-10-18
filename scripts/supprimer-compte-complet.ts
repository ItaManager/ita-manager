/**
 * Supprime complètement un compte (Supabase + Prisma)
 * Pour libérer un employé et permettre une nouvelle invitation
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx scripts/supprimer-compte-complet.ts EMAIL");
    process.exit(0);
  }

  console.log(`\n🗑️  Suppression du compte : ${email}\n`);

  // Trouver l'utilisateur Supabase
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find((u) => u.email === email);

  if (!user) {
    console.log("❌ Utilisateur Supabase introuvable");
    process.exit(1);
  }

  const userId = user.id;
  console.log(`📧 Email    : ${email}`);
  console.log(`🆔 ID       : ${userId}`);

  // Vérifier le profil Prisma
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    include: { employe: true },
  });

  if (profil) {
    console.log(`👤 Employé  : ${profil.employe?.prenom} ${profil.employe?.nom}`);
    console.log(`📋 Matricule: ${profil.employe?.matricule}\n`);

    // Supprimer dans l'ordre (clés étrangères)
    console.log("1️⃣ Suppression codes de secours MFA...");
    await prisma.codeSecoursMfa.deleteMany({ where: { profilId: userId } });

    console.log("2️⃣ Suppression rôles...");
    await prisma.profilRole.deleteMany({ where: { profilId: userId } });

    console.log("3️⃣ Suppression profil Prisma...");
    await prisma.profil.delete({ where: { id: userId } });
  }

  console.log("4️⃣ Suppression compte Supabase Auth...");
  await supabase.auth.admin.deleteUser(userId);

  console.log("\n✅ Compte supprimé avec succès !");
  if (profil?.employe) {
    console.log(
      `\n💡 L'employé ${profil.employe.prenom} ${profil.employe.nom} (${profil.employe.matricule}) peut maintenant être invité à nouveau.\n`
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
