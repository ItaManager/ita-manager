import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  const employes = await prisma.employe.findMany({
    where: { profil: null },
    include: {
      affectations: {
        where: { dateFin: null },
        include: {
          poste: {
            include: { service: true },
          },
        },
        take: 1,
      },
    },
    take: 10,
  });

  console.log("\n📋 Employés SANS compte utilisateur :\n");

  if (employes.length === 0) {
    console.log("❌ Aucun employé sans compte trouvé");
    console.log("\n💡 Vous pouvez :");
    console.log("   1. Créer un employé via /personnel/employes");
    console.log("   2. Utiliser Prisma Studio : npm run db:studio:dev\n");
  } else {
    employes.forEach((emp, i) => {
      const aff = emp.affectations[0];
      console.log(`${i + 1}. ${emp.prenom} ${emp.nom} (${emp.matricule})`);
      if (aff) {
        console.log(`   📍 ${aff.poste.libelle} - ${aff.poste.service?.libelle || "N/A"}`);
      }
      console.log("");
    });

    console.log(`✅ ${employes.length} employé(s) disponible(s) pour invitation\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
