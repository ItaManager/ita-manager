/**
 * Crée un employé test simple pour tester les invitations
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("\n👤 Création d'un employé test...\n");

  // Trouver une nationalité
  const nationalite = await prisma.nationalite.findFirst();
  if (!nationalite) {
    console.log("❌ Aucune nationalité trouvée");
    process.exit(1);
  }

  // Générer un matricule unique
  const timestamp = Date.now().toString().slice(-6);
  const matricule = `TEST-${timestamp}`;

  const employe = await prisma.employe.create({
    data: {
      matricule,
      nom: "TEST",
      prenom: "Invitation",
      nationaliteId: nationalite.id,
      typeMainOeuvre: "PERMANENT",
    },
  });

  console.log("✅ Employé créé :");
  console.log(`   Matricule : ${employe.matricule}`);
  console.log(`   Nom       : ${employe.prenom} ${employe.nom}`);
  console.log(`   ID        : ${employe.id}\n`);
  console.log("💡 Cet employé peut maintenant être invité !\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
