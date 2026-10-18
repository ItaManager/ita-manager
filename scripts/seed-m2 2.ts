import { prisma } from "@/lib/db/prisma";

async function main() {
  console.log("🌍 Seed nationalités...");

  const nationalites = [
    "Ivoirienne",
    "Burkinabè",
    "Malienne",
    "Ghanéenne",
    "Nigériane",
    "Sénégalaise",
    "Togolaise",
    "Béninoise",
    "Nigérienne",
    "Guinéenne",
    "Libérienne",
    "Française",
    "Libanaise",
    "Marocaine",
    "Camerounaise",
  ];

  for (const libelle of nationalites) {
    await prisma.nationalite.upsert({
      where: { libelle },
      update: {},
      create: { libelle },
    });
  }

  console.log(`✅ ${nationalites.length} nationalités créées`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
