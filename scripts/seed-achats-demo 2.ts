import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  console.log("🌱 Seed M14 Achats — démonstration");

  // Trouver ou créer un employé de test pour les demandes
  let employe = await prisma.employe.findFirst({
    where: { matricule: "DEMO-M14" },
  });

  if (!employe) {
    employe = await prisma.employe.create({
      data: {
        matricule: "DEMO-M14",
        nom: "Démo",
        prenom: "Module",
        telephone: "+225 00 00 00 00",
        typeMainOeuvre: "PERMANENT",
      },
    });
    console.log(`  ✓ Employé test créé : ${employe.matricule}`);
  } else {
    console.log(`  ✓ Employé existant : ${employe.matricule}`);
  }

  // Trouver ou créer une direction pour la destination
  let direction = await prisma.direction.findFirst();
  if (!direction) {
    direction = await prisma.direction.create({
      data: {
        code: "DT",
        libelle: "Direction Technique",
        ordre: 1,
      },
    });
    console.log(`  ✓ Direction créée : ${direction.code}`);
  }

  // Trouver ou créer une destination (service)
  let destination = await prisma.service.findFirst();
  if (!destination) {
    destination = await prisma.service.create({
      data: {
        code: "ACH",
        libelle: "Service Achats",
        directionId: direction.id,
      },
    });
    console.log(`  ✓ Service créé : ${destination.code}`);
  }

  // ======================================================================
  // RÉFÉRENTIELS
  // ======================================================================

  console.log("\n=== Référentiels ===");

  // Unités
  const unites = await Promise.all([
    prisma.unite.create({ data: { libelle: "kg", creePar: employe.id } }),
    prisma.unite.create({ data: { libelle: "m³", creePar: employe.id } }),
    prisma.unite.create({ data: { libelle: "unité", creePar: employe.id } }),
    prisma.unite.create({ data: { libelle: "forfait", creePar: employe.id } }),
  ]);
  console.log(`  ${unites.length} unités`);

  // Articles
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        designation: "Sac de ciment 50kg",
        designationNormalisee: "sac de ciment 50kg",
        uniteId: unites[0].id, // kg
        creePar: employe.id,
      },
    }),
    prisma.article.create({
      data: {
        designation: "Gravier 5/15",
        designationNormalisee: "gravier 5/15",
        uniteId: unites[1].id, // m³
        creePar: employe.id,
      },
    }),
    prisma.article.create({
      data: {
        designation: "Pelle ronde",
        designationNormalisee: "pelle ronde",
        uniteId: unites[2].id, // unité
        creePar: employe.id,
      },
    }),
    prisma.article.create({
      data: {
        designation: "Location grue",
        designationNormalisee: "location grue",
        uniteId: unites[3].id, // forfait
        creePar: employe.id,
      },
    }),
  ]);
  console.log(`  ${articles.length} articles`);

  // Fournisseurs
  const fournisseurs = await Promise.all([
    prisma.fournisseur.create({
      data: {
        nom: "CIMAF Côte d'Ivoire",
        nomNormalise: "cimaf cote d'ivoire",
        creePar: employe.id,
      },
    }),
    prisma.fournisseur.create({
      data: {
        nom: "Carrière Anyama",
        nomNormalise: "carriere anyama",
        creePar: employe.id,
      },
    }),
    prisma.fournisseur.create({
      data: {
        nom: "Quincaillerie Centrale",
        nomNormalise: "quincaillerie centrale",
        creePar: employe.id,
      },
    }),
  ]);
  console.log(`  ${fournisseurs.length} fournisseurs`);

  // Prix fournisseur
  const prix = await Promise.all([
    prisma.prixFournisseur.create({
      data: {
        articleId: articles[0].id, // Ciment
        fournisseurId: fournisseurs[0].id, // CIMAF
        prixHT: 4500,
        creePar: employe.id,
      },
    }),
    prisma.prixFournisseur.create({
      data: {
        articleId: articles[1].id, // Gravier
        fournisseurId: fournisseurs[1].id, // Carrière
        prixHT: 15000,
        creePar: employe.id,
      },
    }),
    prisma.prixFournisseur.create({
      data: {
        articleId: articles[2].id, // Pelle
        fournisseurId: fournisseurs[2].id, // Quincaillerie
        prixHT: 3500,
        creePar: employe.id,
      },
    }),
  ]);
  console.log(`  ${prix.length} prix fournisseur`);

  // ======================================================================
  // DEMANDES D'ACHAT (8 demandes, 7 statuts différents)
  // ======================================================================

  console.log("\n=== Demandes d'achat ===");

  const now = new Date();

  // Demande 1 : BROUILLON (créée mais pas encore soumise)
  const demande1 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-001",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Réfection toiture bâtiment administratif",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande1.id,
      articleId: articles[0].id,
      fournisseurId: fournisseurs[0].id,
      designation: articles[0].designation,
      unite: "sac",
      quantite: 100,
      prixUnitaire: 4500,
      tauxTva: 18, // TVA 18%
    },
  });

  // Demande 2 : ATTENTE_N1 (soumise, en attente validation N+1)
  const demande2 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-002",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Matériaux chantier Bouaké Nord",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande2.id,
      articleId: articles[1].id,
      fournisseurId: fournisseurs[1].id,
      designation: articles[1].designation,
      unite: "m³",
      quantite: 10,
      prixUnitaire: 15000,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.create({
    data: {
      demandeId: demande2.id,
      type: "SOUMISSION",
      auteurId: employe.id,
        auteurNom: "demo@ita.ci",
      timestamp: new Date(now.getTime() - 2 * 86400000), // -2 jours
    },
  });

  // Demande 3 : ATTENTE_ACHATS (validée N+1, en instruction)
  const demande3 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-003",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Outillage équipe terrassement",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande3.id,
      articleId: articles[2].id,
      fournisseurId: fournisseurs[2].id,
      designation: articles[2].designation,
      unite: "unité",
      quantite: 5,
      prixUnitaire: 3500,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.createMany({
    data: [
      {
        demandeId: demande3.id,
        type: "SOUMISSION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 5 * 86400000), // -5 jours
      },
      {
        demandeId: demande3.id,
        type: "VALIDATION_N1",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 4 * 86400000), // -4 jours
      },
    ],
  });

  // Demande 4 : ATTENTE_COMITE (instruite, transmise au comité)
  const demande4 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-004",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Location grue chantier Abidjan Sud",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande4.id,
      articleId: articles[3].id,
      fournisseurId: fournisseurs[2].id,
      designation: articles[3].designation,
      unite: "forfait",
      quantite: 1,
      prixUnitaire: 850000,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.createMany({
    data: [
      {
        demandeId: demande4.id,
        type: "SOUMISSION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 10 * 86400000), // -10 jours
      },
      {
        demandeId: demande4.id,
        type: "VALIDATION_N1",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 9 * 86400000),
      },
      {
        demandeId: demande4.id,
        type: "INSTRUCTION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 7 * 86400000),
      },
      {
        demandeId: demande4.id,
        type: "TRANSMISSION_COMITE",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 5 * 86400000),
      },
    ],
  });

  // Demande 5 : BC_EMIS (bon de commande émis, en attente réception)
  const demande5 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-005",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Ciment projet assainissement Yamoussoukro",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
      refBC: "BC-2026-012",
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande5.id,
      articleId: articles[0].id,
      fournisseurId: fournisseurs[0].id,
      designation: articles[0].designation,
      unite: "sac",
      quantite: 500,
      prixUnitaire: 4500,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.createMany({
    data: [
      {
        demandeId: demande5.id,
        type: "SOUMISSION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 15 * 86400000), // -15 jours
      },
      {
        demandeId: demande5.id,
        type: "VALIDATION_N1",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 14 * 86400000),
      },
      {
        demandeId: demande5.id,
        type: "INSTRUCTION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 12 * 86400000),
      },
      {
        demandeId: demande5.id,
        type: "TRANSMISSION_COMITE",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 10 * 86400000),
      },
      {
        demandeId: demande5.id,
        type: "EMISSION_BC",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 5 * 86400000), // Délai: 10 jours (retard)
      },
    ],
  });

  // Demande 6 : SOLDEE (réceptionnée et facturée)
  const demande6 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-006",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Gravier route Divo",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
      refBC: "BC-2026-008",
      refFacture: "FACT-2026-032",
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande6.id,
      articleId: articles[1].id,
      fournisseurId: fournisseurs[1].id,
      designation: articles[1].designation,
      unite: "m³",
      quantite: 50,
      prixUnitaire: 15000,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.createMany({
    data: [
      {
        demandeId: demande6.id,
        type: "SOUMISSION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 30 * 86400000), // -30 jours
      },
      {
        demandeId: demande6.id,
        type: "VALIDATION_N1",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 29 * 86400000),
      },
      {
        demandeId: demande6.id,
        type: "INSTRUCTION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 27 * 86400000),
      },
      {
        demandeId: demande6.id,
        type: "TRANSMISSION_COMITE",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 25 * 86400000),
      },
      {
        demandeId: demande6.id,
        type: "EMISSION_BC",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 23 * 86400000), // Délai: 7 jours (normal)
      },
      {
        demandeId: demande6.id,
        type: "TRANSMISSION_LOG",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 22 * 86400000),
      },
      {
        demandeId: demande6.id,
        type: "RECEPTION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 15 * 86400000),
      },
      {
        demandeId: demande6.id,
        type: "FACTURATION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 10 * 86400000),
      },
    ],
  });

  // Demande 7 : REFUSEE (refusée par N+1)
  const demande7 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-007",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Achat non justifié",
      type: "INITIALE",
      dateBesoin: new Date("2026-08-15"),
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande7.id,
      articleId: articles[2].id,
      fournisseurId: fournisseurs[2].id,
      designation: articles[2].designation,
      unite: "unité",
      quantite: 20,
      prixUnitaire: 3500,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.createMany({
    data: [
      {
        demandeId: demande7.id,
        type: "SOUMISSION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 8 * 86400000),
      },
      {
        demandeId: demande7.id,
        type: "REFUS_N1",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 7 * 86400000),
      },
    ],
  });

  // Demande 8 : REGULARISATION (type régularisation)
  const demande8 = await prisma.demandeAchat.create({
    data: {
      ref: "ACH-2026-008",
      demandeurId: employe.id,
      beneficiaireId: employe.id,
      destinationId: destination.id,
      description: "Achat urgent effectué (régularisation)",
      type: "REGULARISATION",
      dateBesoin: new Date("2026-08-15"),
      refFacture: "FACT-2026-045",
    },
  });
  await prisma.ligneAchat.create({
    data: {
      demandeId: demande8.id,
      articleId: articles[0].id,
      fournisseurId: fournisseurs[0].id,
      designation: articles[0].designation,
      unite: "sac",
      quantite: 50,
      prixUnitaire: 4500,
      tauxTva: 18,
    },
  });
  await prisma.evenementAchat.createMany({
    data: [
      {
        demandeId: demande8.id,
        type: "SOUMISSION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 3 * 86400000),
      },
      {
        demandeId: demande8.id,
        type: "VALIDATION_N1",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 2 * 86400000),
      },
      {
        demandeId: demande8.id,
        type: "FACTURATION",
        auteurId: employe.id,
        auteurNom: "demo@ita.ci",
        timestamp: new Date(now.getTime() - 1 * 86400000),
      },
    ],
  });

  console.log(`  8 demandes créées`);
  console.log(`  ✓ BROUILLON : ${demande1.ref}`);
  console.log(`  ✓ ATTENTE_N1 : ${demande2.ref}`);
  console.log(`  ✓ ATTENTE_ACHATS : ${demande3.ref}`);
  console.log(`  ✓ ATTENTE_COMITE : ${demande4.ref}`);
  console.log(`  ✓ BC_EMIS : ${demande5.ref} (retard 10j)`);
  console.log(`  ✓ SOLDEE : ${demande6.ref}`);
  console.log(`  ✓ REFUSEE : ${demande7.ref}`);
  console.log(`  ✓ REGULARISATION : ${demande8.ref}`);

  console.log("\n✅ Seed M14 Achats terminé\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
