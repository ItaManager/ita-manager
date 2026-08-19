/**
 * Script simple : Lier le profil armelgnakpa7@gmail.com
 * au premier employé sans profil disponible
 */

import { prismaDirect } from "./lib/prisma-direct";

async function main() {
  console.log("🔧 Liaison profil → employé...\n");

  // Profil sans employé
  const profil = await prismaDirect.profil.findFirst({
    where: {
      email: "armelgnakpa7@gmail.com",
      employeId: null,
    },
  });

  if (!profil) {
    console.log("✅ Le profil est déjà lié ou n'existe pas.");
    return;
  }

  // Premier employé sans profil
  const employe = await prismaDirect.employe.findFirst({
    where: {
      profil: null,
    },
  });

  if (!employe) {
    console.log("❌ Aucun employé sans profil disponible.");
    return;
  }

  console.log(`📧 Profil : ${profil.email}`);
  console.log(`👤 Employé : ${employe.prenom} ${employe.nom} (${employe.matricule})\n`);

  // Lier
  await prismaDirect.profil.update({
    where: { id: profil.id },
    data: { employeId: employe.id },
  });

  console.log("✅ Liaison réussie !");
  console.log("\n🎯 Vous pouvez maintenant créer des relevés.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaDirect.$disconnect();
  });
