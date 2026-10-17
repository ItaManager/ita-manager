/**
 * Recrée un compte Supabase pour un profil Prisma existant
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const profilId = "abf2a5d3-7944-4ec0-b5e9-a9a86a9156f1";
  const email = "koffi.flo.1792252109020@example.com";
  const password = "TestMFA2024!";

  // Vérifier le profil existe
  const profil = await prisma.profil.findUnique({
    where: { id: profilId },
    include: { employe: true, roles: true, codesSecoursMfa: true },
  });

  if (!profil || !profil.employe) {
    console.log("❌ Profil ou employé introuvable");
    process.exit(1);
  }

  console.log("🔧 Recréation compte Supabase pour profil existant...");
  console.log("Email:", email);
  console.log("");

  // Supprimer ancien compte Supabase si existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers.users.find(
    (u) => u.id === profilId || u.email === email
  );

  if (existing) {
    console.log("⚠️  Ancien compte Supabase trouvé, suppression...");
    await supabase.auth.admin.deleteUser(existing.id);
  }

  // Créer nouveau compte Supabase
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        employeId: profil.employe.id,
        nom: profil.employe.nom,
        prenom: profil.employe.prenom,
        mfaObligatoire: true,
      },
    });

  if (authError || !authData.user) {
    console.log("❌ Erreur Supabase:", authError?.message);
    process.exit(1);
  }

  const newUserId = authData.user.id;
  console.log("✅ Nouveau compte Supabase créé");
  console.log("Nouvel ID:", newUserId);
  console.log("");

  // Mettre à jour le profil avec le nouvel ID
  console.log("🔄 Migration du profil vers le nouvel ID...");

  // Supprimer l'ancien profil et recréer avec nouvel ID
  await prisma.codeSecoursMfa.deleteMany({ where: { profilId } });
  await prisma.profilRole.deleteMany({ where: { profilId } });
  await prisma.profil.delete({ where: { id: profilId } });

  console.log("✅ Ancien profil supprimé");

  // Recréer avec nouvel ID
  await prisma.profil.create({
    data: {
      id: newUserId,
      email: profil.email,
      actif: profil.actif,
      employeId: profil.employeId,
    },
  });

  // Recréer rôles
  for (const role of profil.roles) {
    await prisma.profilRole.create({
      data: {
        profilId: newUserId,
        roleId: role.roleId,
      },
    });
  }

  // Recréer codes
  for (const code of profil.codesSecoursMfa) {
    await prisma.codeSecoursMfa.create({
      data: {
        profilId: newUserId,
        codeHache: code.codeHache,
      },
    });
  }

  console.log("✅ Profil migré avec succès\n");

  console.log("🎯 COMPTE PRÊT !\n");
  console.log(`📧 Email    : ${email}`);
  console.log(`🔑 Password : ${password}`);
  console.log("\n🌐 Connectez-vous sur http://localhost:3000/connexion\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
