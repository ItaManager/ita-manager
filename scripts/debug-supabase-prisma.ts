/**
 * Test : Créer un compte Supabase puis un profil Prisma avec le même ID
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const timestamp = Date.now();
  const email = `debug.${timestamp}@example.com`;
  const password = "DebugTest2024!";

  console.log("\n🧪 Test Supabase → Prisma\n");
  console.log("Email :", email);
  console.log("");

  // 1. Créer compte Supabase
  console.log("1️⃣ Création compte Supabase...");
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    console.log("❌ Erreur Supabase :", authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("✅ Compte Supabase créé");
  console.log("   ID :", userId);
  console.log("");

  // 2. Vérifier si un profil existe déjà avec cet ID
  console.log("2️⃣ Vérification profil existant...");
  const profilExistant = await prisma.profil.findUnique({
    where: { id: userId },
  });

  if (profilExistant) {
    console.log("⚠️  PROFIL DÉJÀ EXISTANT !");
    console.log("   Email :", profilExistant.email);
    console.log("");

    // Nettoyer
    await prisma.profil.delete({ where: { id: userId } });
    console.log("✅ Profil existant supprimé");
  } else {
    console.log("✅ Aucun profil avec cet ID");
  }
  console.log("");

  // 3. Créer profil Prisma avec l'ID Supabase
  console.log("3️⃣ Création profil Prisma...");
  try {
    const profil = await prisma.profil.create({
      data: {
        id: userId,
        email,
        actif: true,
      },
    });

    console.log("✅ Profil créé avec succès");
    console.log("   ID :", profil.id);
    console.log("");
  } catch (error: any) {
    console.log("❌ ERREUR lors de la création du profil :");
    console.log("   Message :", error.message);
    console.log("   Code :", error.code);
    console.log("   Meta :", error.meta);
    console.log("");

    // Vérifier si le profil a été créé malgré l'erreur
    const profilCreeMalgreErreur = await prisma.profil.findUnique({
      where: { id: userId },
    });

    console.log(
      "   Profil créé malgré erreur ?",
      profilCreeMalgreErreur ? "OUI ✅" : "NON ❌"
    );
    console.log("");
  }

  // 4. Nettoyage
  console.log("4️⃣ Nettoyage...");

  const profilFinal = await prisma.profil.findUnique({ where: { id: userId } });
  if (profilFinal) {
    await prisma.profil.delete({ where: { id: userId } });
    console.log("✅ Profil Prisma supprimé");
  }

  await supabase.auth.admin.deleteUser(userId);
  console.log("✅ Compte Supabase supprimé");
  console.log("");
}

main()
  .catch((e) => {
    console.error("💥 Erreur fatale :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
