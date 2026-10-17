/**
 * Script de test MFA - Création directe d'un utilisateur pour tester le flux MFA
 * Sans limitation d'emails
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const timestamp = Date.now();
  const email = `test.mfa.${timestamp}@example.com`;
  const password = "TestMFA2024!";

  console.log("\n🧪 Test MFA Direct\n");
  console.log("📧 Email:", email);
  console.log("🔑 Mot de passe:", password);
  console.log("");

  // 1. Trouver Koffi FLO
  const employe = await prisma.employe.findUnique({
    where: { matricule: "JRN-2026-0002" },
  });

  if (!employe) {
    console.log("❌ Employé JRN-2026-0002 non trouvé");
    process.exit(1);
  }

  // 2. Créer le compte Supabase Auth directement (pas d'email envoyé)
  console.log("1️⃣ Création compte Supabase Auth...");
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Pas besoin de confirmer l'email
      user_metadata: {
        employeId: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        mfaObligatoire: true,
      },
    });

  if (authError || !authData.user) {
    console.log("❌ Erreur Supabase:", authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("✅ Compte créé, ID:", userId);

  // 3. Créer le profil + rôles + codes de secours
  console.log("\n2️⃣ Création profil en base...");

  const roleEmploye = await prisma.role.findUnique({
    where: { code: "RH" },
  });

  if (!roleEmploye) {
    console.log("❌ Rôle RH non trouvé");
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  // Générer codes de secours
  const { randomBytes } = await import("crypto");
  const codesSecours: string[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = randomBytes(4);
    const hex = bytes.toString("hex").toUpperCase();
    const code = `${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
    codesSecours.push(code);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Créer profil
      await tx.profil.create({
        data: {
          id: userId,
          email,
          actif: true,
          employeId: employe.id,
        },
      });

      // Assigner rôle
      await tx.profilRole.create({
        data: {
          profilId: userId,
          roleId: roleEmploye.id,
        },
      });

      // Stocker codes de secours
      const bcrypt = await import("bcrypt");
      await tx.codeSecoursMfa.createMany({
        data: await Promise.all(
          codesSecours.map(async (code) => ({
            profilId: userId,
            codeHache: await bcrypt.hash(code, 10),
          }))
        ),
      });
    });

    console.log("✅ Profil créé avec succès");
  } catch (error) {
    console.log("❌ Erreur Prisma:", error);
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  // 4. Instructions pour tester
  console.log("\n🎯 COMPTE DE TEST CRÉÉ !\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📋 Informations de connexion :\n");
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log("");
  console.log("🔐 Codes de secours (à sauvegarder) :\n");
  codesSecours.forEach((code, i) => {
    console.log(`   ${(i + 1).toString().padStart(2, "0")}. ${code}`);
  });
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("🧪 ÉTAPES DE TEST :\n");
  console.log("1. Allez sur : http://localhost:3000/connexion");
  console.log(`2. Connectez-vous avec : ${email}`);
  console.log(`3. Password : ${password}`);
  console.log("4. Vous serez redirigé vers /auth/setup-mfa");
  console.log("5. Générez le QR code et scannez-le");
  console.log("6. Vérifiez que les codes de secours s'affichent");
  console.log("7. Téléchargez-les et confirmez");
  console.log("\n✨ Bon test !\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
