import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const employe = await prisma.employe.findFirst({
    where: { prenom: "Christ", nom: "DOSSO" },
  });

  if (!employe) {
    console.log("❌ Employé Christ DOSSO introuvable");
    process.exit(1);
  }

  await prisma.profil.update({
    where: { email: "armelgnakpa7@gmail.com" },
    data: { employeId: employe.id },
  });

  console.log("✓ Profil armelgnakpa7@gmail.com lié à", employe.prenom, employe.nom);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
