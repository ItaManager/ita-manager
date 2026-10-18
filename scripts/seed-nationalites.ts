/**
 * Ajoute les nationalités de base
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("\n🌍 Ajout des nationalités...\n");

  const nationalites = [
    "Côte d'Ivoire",
    "France",
    "Burkina Faso",
    "Mali",
    "Sénégal",
    "Ghana",
    "Bénin",
    "Togo",
    "Niger",
    "Guinée",
  ];

  for (const libelle of nationalites) {
    await prisma.nationalite.upsert({
      where: { libelle },
      create: { libelle },
      update: {},
    });
    console.log(`✅ ${libelle}`);
  }

  console.log(`\n✨ ${nationalites.length} nationalités ajoutées !\n`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
