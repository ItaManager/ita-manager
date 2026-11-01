import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("🧪 Création ultra-rapide des 7 employés test manquants...\n");

  // Récupérer le premier service disponible pour l'affectation temporaire
  const premierService = await prisma.service.findFirst({
    orderBy: { code: "asc" },
  });

  if (!premierService) {
    throw new Error("Aucun service disponible pour l'affectation");
  }

  const employes = [
    {
      matricule: "TEST-DT",
      nom: "TOURE",
      prenom: "Ibrahim",
      email: "test-dt@halgo.africa",
      telephone: "+225 07 01 00 02",
    },
    {
      matricule: "TEST-DF",
      nom: "N'GUESSAN",
      prenom: "François",
      email: "test-df@halgo.africa",
      telephone: "+225 07 01 00 03",
    },
    {
      matricule: "TEST-DRH",
      nom: "DIABATE",
      prenom: "Aminata",
      email: "test-drh@halgo.africa",
      telephone: "+225 07 01 00 04",
    },
    {
      matricule: "TEST-ASST",
      nom: "KONE",
      prenom: "Marie-Claire",
      email: "test-asst@halgo.africa",
      telephone: "+225 07 01 00 05",
    },
    {
      matricule: "TEST-ACHATS",
      nom: "BAMBA",
      prenom: "Karim",
      email: "test-achats@halgo.africa",
      telephone: "+225 07 01 00 06",
    },
    {
      matricule: "TEST-CHANTIER",
      nom: "COULIBALY",
      prenom: "Sekou",
      email: "test-chantier@halgo.africa",
      telephone: "+225 07 01 00 07",
    },
    {
      matricule: "TEST-COMPTA",
      nom: "YAO",
      prenom: "Sandrine",
      email: "test-compta@halgo.africa",
      telephone: "+225 07 01 00 08",
    },
  ];

  let count = 0;

  for (const emp of employes) {
    try {
      console.log(`[${count + 1}/7] Création de ${emp.prenom} ${emp.nom}...`);

      // Transaction simple : employé + contrat (pas d'affectation pour simplifier)
      const employe = await prisma.$transaction(async (tx) => {
        // Créer l'employé
        const e = await tx.employe.create({
          data: {
            matricule: emp.matricule,
            typeMainOeuvre: "PERMANENT",
            nom: emp.nom.toUpperCase(),
            prenom: emp.prenom,
            telephone: emp.telephone,
            email: emp.email,
            adresse: "",
          },
        });

        // Créer le contrat minimal
        await tx.contrat.create({
          data: {
            employeId: e.id,
            typeContrat: "CDI",
            dateDebut: new Date(),
            salaire: 0, // Sera configuré plus tard
            signe: false,
          },
        });

        return e;
      });

      console.log(`  ✅ ${employe.matricule} créé`);
      count++;
    } catch (error: any) {
      console.error(`  ❌ Erreur pour ${emp.matricule}:`, error.message);
    }
  }

  console.log(`\n✅ ${count}/7 employés créés avec succès`);
}

main()
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
