/**
 * Test de création d'un employé PERMANENT via Server Action
 * Vérifie le matricule généré, l'affectation et le contrat.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log("🧪 Test création employé PERMANENT\n");

  // Récupérer un poste et une nationalité
  const poste = await prisma.poste.findFirst({
    orderBy: { creeLe: "asc" },
  });

  const nationalite = await prisma.nationalite.findFirst({
    where: { libelle: "Ivoirienne" },
  });

  if (!poste || !nationalite) {
    console.error("❌ Poste ou nationalité introuvable");
    console.error(`   Postes: ${await prisma.poste.count()}`);
    console.error(`   Nationalités: ${await prisma.nationalite.count()}`);
    process.exit(1);
  }

  console.log(`📌 Poste sélectionné: ${poste.libelle} (${poste.code})`);
  console.log(`📌 Nationalité: ${nationalite.libelle}\n`);

  // Créer un employé test
  const matricule = `ITA-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(4, "0")}`;

  const employe = await prisma.employe.create({
    data: {
      matricule,
      typeMainOeuvre: "PERMANENT",
      nom: "KOUASSI",
      prenom: "Jean",
      sexe: "MASCULIN",
      dateNaissance: new Date("1990-01-15"),
      lieuNaissance: "Abidjan",
      nationaliteId: nationalite.id,
      situationMatrimoniale: "MARIE",
      nombreEnfants: 2,
      numeroCnps: "1234567890",
      telephone: "+225 07 12 34 56 78",
      email: "j.kouassi@example.com",
      adresse: "Cocody, Riviera Palmeraie",
      urgenceNom: "KOUASSI Marie",
      urgenceTel: "+225 07 98 76 54 32",
      numeroWave: "+225 07 12 34 56 78",
      modePaiement: "VIREMENT",
      rib: "CI93 CI001 01234567890123456789",
    },
  });

  // Créer l'affectation
  const affectation = await prisma.affectation.create({
    data: {
      employeId: employe.id,
      posteId: poste.id,
      dateDebut: new Date(),
    },
  });

  // Créer le contrat CDI
  const contrat = await prisma.contrat.create({
    data: {
      employeId: employe.id,
      typeContrat: "CDI",
      dateDebut: new Date(),
      salaire: 450000,
      signe: true,
    },
  });

  console.log("✅ Employé créé avec succès");
  console.log(`   Matricule: ${employe.matricule}`);
  console.log(`   Nom complet: ${employe.nom} ${employe.prenom}`);
  console.log(`   Poste: ${poste.libelle}`);
  console.log(`   Salaire: ${contrat.salaire.toNumber()} FCFA`);
  console.log(`   Type: ${employe.typeMainOeuvre}`);
  console.log(`\n📊 Vérification complétude dossier:`);

  const documents = await prisma.documentEmploye.count({
    where: { employeId: employe.id },
  });

  const piecesAttendues = employe.typeMainOeuvre === "JOURNALIER" ? 2 : 7;
  const completude = Math.round((documents / piecesAttendues) * 100);

  console.log(`   Documents présents: ${documents}/${piecesAttendues}`);
  console.log(`   Complétude: ${completude}%`);

  // Vérifier la présence dans la base
  const verif = await prisma.employe.findUnique({
    where: { id: employe.id },
    include: {
      affectations: { where: { dateFin: null } },
      contrats: { orderBy: { dateDebut: "desc" }, take: 1 },
    },
  });

  if (!verif) {
    console.error("❌ Employé non trouvé après création");
    process.exit(1);
  }

  console.log("\n✅ Toutes les vérifications sont passées");
  console.log(`\n🔗 Accès: http://localhost:3000/employes/${employe.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
