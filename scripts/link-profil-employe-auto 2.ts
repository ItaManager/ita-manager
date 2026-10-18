/**
 * Script automatique : Lier le profil armelgnakpa7@gmail.com à un employé
 */

import { prismaDirect } from "./lib/prisma-direct";

async function main() {
  console.log("🔧 Liaison automatique profil → employé...\n");

  // Récupérer le profil sans employé
  const profil = await prismaDirect.profil.findFirst({
    where: {
      email: "armelgnakpa7@gmail.com",
      employeId: null,
    },
  });

  if (!profil) {
    console.log("✅ Le profil est déjà lié à un employé ou n'existe pas.");
    return;
  }

  console.log(`📧 Profil trouvé : ${profil.email}`);
  console.log(`   ID : ${profil.id}\n`);

  // Vérifier s'il existe déjà un employé pour cette personne
  const employeExistant = await prismaDirect.employe.findFirst({
    where: {
      OR: [
        { email: profil.email },
        { profil: { email: profil.email } },
      ],
    },
  });

  let employeId: string;

  if (employeExistant) {
    console.log(`✓ Employé existant trouvé : ${employeExistant.prenom} ${employeExistant.nom}`);
    employeId = employeExistant.id;
  } else {
    // Créer un employé pour ce profil
    console.log("📝 Création d'un nouvel employé...\n");

    // Générer un matricule unique
    const annee = new Date().getFullYear();
    const count = await prismaDirect.employe.count({
      where: {
        matricule: {
          startsWith: `EMP-${annee}-`,
        },
      },
    });
    const matricule = `EMP-${annee}-${String(count + 1).padStart(4, "0")}`;

    const employe = await prismaDirect.employe.create({
      data: {
        prenom: "Armel",
        nom: "GNAKPA",
        matricule,
        telephone: "+225 0000000000",
        email: profil.email || undefined,
        typeMainOeuvre: "PERMANENT",
        actif: true,
      },
    });

    console.log(`✓ Employé créé :`);
    console.log(`   Nom : ${employe.prenom} ${employe.nom}`);
    console.log(`   Matricule : ${employe.matricule}`);
    console.log(`   ID : ${employe.id}\n`);

    employeId = employe.id;
  }

  // Lier le profil à l'employé
  await prismaDirect.profil.update({
    where: { id: profil.id },
    data: { employeId },
  });

  console.log("✅ Profil lié à l'employé avec succès !");
  console.log("\n🎯 Vous pouvez maintenant créer des relevés d'activité.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaDirect.$disconnect();
  });
