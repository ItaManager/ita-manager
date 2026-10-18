/**
 * Script rapide pour créer 3 employés de test SANS compte utilisateur
 * Pour tester le flux d'invitation avec MFA
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("🧪 Création d'employés de test...\n");

  // Récupérer un poste existant
  const poste = await prisma.poste.findFirst({
    orderBy: { creeLe: "asc" },
  });

  if (!poste) {
    console.log("❌ Aucun poste trouvé. Exécutez d'abord le seed principal.");
    process.exit(1);
  }

  console.log(`📌 Poste sélectionné : ${poste.libelle}`);

  const employesTest = [
    {
      matricule: "TEST-001",
      nom: "KOUASSI",
      prenom: "Marie",
      dateNaissance: new Date("1990-05-15"),
      lieuNaissance: "Abidjan",
      nationalite: "CI",
      sexe: "F" as const,
      situationMatrimoniale: "CELIBATAIRE" as const,
      nombreEnfants: 0,
      telephone: "+225 07 00 00 01",
      email: "marie.kouassi.test@example.com",
      adresse: "Cocody, Abidjan",
      dateEmbauche: new Date("2024-01-15"),
      typeMainOeuvre: "PERMANENT" as const,
      actif: true,
    },
    {
      matricule: "TEST-002",
      nom: "YAO",
      prenom: "Arnaud",
      dateNaissance: new Date("1988-08-22"),
      lieuNaissance: "Bouaké",
      nationalite: "CI",
      sexe: "M" as const,
      situationMatrimoniale: "MARIE" as const,
      nombreEnfants: 2,
      telephone: "+225 07 00 00 02",
      email: "arnaud.yao.test@example.com",
      adresse: "Marcory, Abidjan",
      dateEmbauche: new Date("2024-02-01"),
      typeMainOeuvre: "PERMANENT" as const,
      actif: true,
    },
    {
      matricule: "TEST-003",
      nom: "BAMBA",
      prenom: "Fatou",
      dateNaissance: new Date("1992-03-10"),
      lieuNaissance: "Yamoussoukro",
      nationalite: "CI",
      sexe: "F" as const,
      situationMatrimoniale: "CELIBATAIRE" as const,
      nombreEnfants: 0,
      telephone: "+225 07 00 00 03",
      email: "fatou.bamba.test@example.com",
      adresse: "Plateau, Abidjan",
      dateEmbauche: new Date("2024-03-10"),
      typeMainOeuvre: "PERMANENT" as const,
      actif: true,
    },
  ];

  for (const emp of employesTest) {
    // Vérifier si l'employé existe déjà
    const existant = await prisma.employe.findUnique({
      where: { matricule: emp.matricule },
      include: { profil: true },
    });

    if (existant) {
      if (existant.profil) {
        console.log(`⚠️  ${emp.matricule} - ${emp.prenom} ${emp.nom} : A DÉJÀ un compte utilisateur`);
      } else {
        console.log(`✅ ${emp.matricule} - ${emp.prenom} ${emp.nom} : Existe déjà (sans compte)`);
      }
      continue;
    }

    // Créer l'employé
    const employe = await prisma.employe.create({
      data: emp,
    });

    // Créer une affectation active
    await prisma.affectation.create({
      data: {
        employeId: employe.id,
        posteId: poste.id,
        dateDebut: emp.dateEmbauche,
        dateFin: null,
        superieurId: null,
      },
    });

    console.log(`✅ ${emp.matricule} - ${emp.prenom} ${emp.nom} : Créé avec succès`);
  }

  console.log("\n🎉 Terminé !");
  console.log("\n📋 Employés disponibles pour invitation :");
  console.log("   1. Marie KOUASSI (TEST-001)");
  console.log("   2. Arnaud YAO (TEST-002)");
  console.log("   3. Fatou BAMBA (TEST-003)");
}

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
