import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("🧪 Création des employés de test un par un...\n");

  const employes = [
    {
      matricule: "TEST-DG",
      nom: "KOUAME",
      prenom: "Jean",
      dateNaissance: new Date("1975-03-15"),
      lieuNaissance: "Abidjan",
      nationaliteId: "CI",
      sexe: "M" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 3,
      telephone: "+225 07 01 00 01",
      email: "test-dg@halgo.africa",
      adresse: "Cocody, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-DT",
      nom: "TOURE",
      prenom: "Ibrahim",
      dateNaissance: new Date("1980-06-20"),
      lieuNaissance: "Bouaké",
      nationaliteId: "CI",
      sexe: "M" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 2,
      telephone: "+225 07 01 00 02",
      email: "test-dt@halgo.africa",
      adresse: "Marcory, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-DF",
      nom: "N'GUESSAN",
      prenom: "Francois",
      dateNaissance: new Date("1978-11-10"),
      lieuNaissance: "Yamoussoukro",
      nationaliteId: "CI",
      sexe: "M" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 4,
      telephone: "+225 07 01 00 03",
      email: "test-df@halgo.africa",
      adresse: "Plateau, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-DRH",
      nom: "DIABATE",
      prenom: "Aminata",
      dateNaissance: new Date("1982-04-25"),
      lieuNaissance: "Abidjan",
      nationaliteId: "CI",
      sexe: "F" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 2,
      telephone: "+225 07 01 00 04",
      email: "test-drh@halgo.africa",
      adresse: "Riviera, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-ASST",
      nom: "KONE",
      prenom: "Marie-Claire",
      dateNaissance: new Date("1990-08-12"),
      lieuNaissance: "Abidjan",
      nationaliteId: "CI",
      sexe: "F" as const,
      situationMatrimoniale: "CELIBATAIRE" as const,
      nombreEnfants: 0,
      telephone: "+225 07 01 00 05",
      email: "test-asst@halgo.africa",
      adresse: "Cocody, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-ACHATS",
      nom: "BAMBA",
      prenom: "Karim",
      dateNaissance: new Date("1985-02-18"),
      lieuNaissance: "Daloa",
      nationaliteId: "CI",
      sexe: "M" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 1,
      telephone: "+225 07 01 00 06",
      email: "test-achats@halgo.africa",
      adresse: "Treichville, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-CHANTIER",
      nom: "COULIBALY",
      prenom: "Sekou",
      dateNaissance: new Date("1983-07-05"),
      lieuNaissance: "Korhogo",
      nationaliteId: "CI",
      sexe: "M" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 3,
      telephone: "+225 07 01 00 07",
      email: "test-chantier@halgo.africa",
      adresse: "Yopougon, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
    {
      matricule: "TEST-COMPTA",
      nom: "YAO",
      prenom: "Sandrine",
      dateNaissance: new Date("1988-12-30"),
      lieuNaissance: "Abidjan",
      nationaliteId: "CI",
      sexe: "F" as const,
      situationMatrimoniale: "CELIBATAIRE" as const,
      nombreEnfants: 0,
      telephone: "+225 07 01 00 08",
      email: "test-compta@halgo.africa",
      adresse: "Adjamé, Abidjan",
      typeMainOeuvre: "PERMANENT" as const,
    },
  ];

  let count = 0;

  for (const emp of employes) {
    try {
      console.log(`\n[${count + 1}/8] Création de ${emp.prenom} ${emp.nom} (${emp.email})...`);

      const employe = await prisma.employe.upsert({
        where: { matricule: emp.matricule },
        create: emp,
        update: {
          nom: emp.nom,
          prenom: emp.prenom,
          email: emp.email,
        },
      });

      console.log(`  ✅ ${employe.matricule} créé (ID: ${employe.id})`);
      count++;
    } catch (error: any) {
      console.error(`  ❌ Erreur pour ${emp.matricule}:`, error.message);
    }
  }

  console.log(`\n✅ ${count}/8 employés créés avec succès`);
}

main()
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
