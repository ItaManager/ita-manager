#!/usr/bin/env tsx
/**
 * Script : Seed données démo M16 L2 Carburant
 *
 * Usage: tsx scripts/seed-carburant-demo.ts
 *
 * Crée :
 * - 3 demandes de carburant (STATION + GARAGE)
 * - 2 remises station en cours
 * - 2 demandes de rechargement garage
 * - Données de consommation pour tests
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";
import { Decimal } from "@prisma/client/runtime/library";

async function main() {
  console.log("🔧 Seed données démo M16 L2 Carburant...\n");

  // 1. Récupérer IDs nécessaires
  const [employes, materiels, projets, garages] = await Promise.all([
    prisma.employe.findMany({ take: 5 }),
    prisma.materiel.findMany({
      where: { categorie: { in: ["VEHICULE_LEGER", "ENGIN"] } },
      take: 5
    }),
    prisma.projet.findMany({ where: { statut: "EN_COURS" }, take: 3 }),
    prisma.lieuStockage.findMany({
      where: { typeStockage: "GARAGE" },
      take: 2
    }),
  ]);

  if (employes.length === 0 || materiels.length === 0 || projets.length === 0) {
    console.error("❌ Données de base manquantes (employés, matériels ou projets)");
    process.exit(1);
  }

  const demandeur = employes[0];
  const valideur = employes[1];
  const vehicule = materiels[0];
  const engin = materiels[1];
  const projet = projets[0];
  const garage = garages[0];

  console.log(`✅ Demandeur : ${demandeur.nom} ${demandeur.prenom}`);
  console.log(`✅ Véhicule : ${vehicule.codeIta}`);
  console.log(`✅ Projet : ${projet.code}`);
  if (garage) console.log(`✅ Garage : ${garage.nom}\n`);

  // 2. Nettoyer données démo existantes
  console.log("🗑️  Nettoyage données démo existantes...");
  await prisma.remiseStation.deleteMany({});
  await prisma.distributionCarburant.deleteMany({});
  await prisma.demandeRechargement.deleteMany({});
  await prisma.demandeCarburant.deleteMany({});
  console.log("✅ Nettoyage terminé\n");

  // 3. Créer demandes STATION
  console.log("📝 Création demandes STATION...");

  const demandeStation1 = await prisma.demandeCarburant.create({
    data: {
      reference: `CAR-${new Date().getFullYear()}-001`,
      circuit: "STATION",
      demandeurId: demandeur.id,
      materielId: vehicule.id,
      projetId: projet.id,
      montantEstime: new Decimal(25000),
      justification: "Déplacement chantier Yopougon",
      statut: "EN_ATTENTE",
      creePar: demandeur.id,
    },
  });

  const demandeStation2 = await prisma.demandeCarburant.create({
    data: {
      reference: `CAR-${new Date().getFullYear()}-002`,
      circuit: "STATION",
      demandeurId: employes[2]?.id || demandeur.id,
      materielId: vehicule.id,
      projetId: projet.id,
      montantEstime: new Decimal(30000),
      justification: "Mission Abidjan-San Pedro",
      statut: "VALIDEE",
      valideParId: valideur.id,
      valideLe: new Date(),
      creePar: employes[2]?.id || demandeur.id,
    },
  });

  console.log(`✅ ${demandeStation1.reference} - EN_ATTENTE`);
  console.log(`✅ ${demandeStation2.reference} - VALIDEE\n`);

  // 4. Créer remise station pour demande validée
  console.log("💰 Création remise station...");

  const remise = await prisma.remiseStation.create({
    data: {
      demandeId: demandeStation2.id,
      montantRemis: new Decimal(30000),
      modeRemise: "ARGENT",
      remisLe: new Date(),
      statutRemise: "EN_COURS",
      creePar: valideur.id,
    },
  });

  console.log(`✅ Remise ${remise.id} - 30 000 F remis, EN_COURS\n`);

  // 5. Créer demandes GARAGE (si garage existe)
  if (garage) {
    console.log("🏪 Création demandes GARAGE...");

    const demandeGarage1 = await prisma.demandeCarburant.create({
      data: {
        reference: `CAR-${new Date().getFullYear()}-003`,
        circuit: "GARAGE",
        demandeurId: demandeur.id,
        materielId: engin.id,
        projetId: projet.id,
        garageId: garage.id,
        quantiteLitres: new Decimal(50),
        justification: "Plein engin chantier",
        statut: "EN_ATTENTE",
        creePar: demandeur.id,
      },
    });

    const demandeGarage2 = await prisma.demandeCarburant.create({
      data: {
        reference: `CAR-${new Date().getFullYear()}-004`,
        circuit: "GARAGE",
        demandeurId: employes[3]?.id || demandeur.id,
        materielId: vehicule.id,
        projetId: projet.id,
        garageId: garage.id,
        quantiteLitres: new Decimal(40),
        justification: "Carburant véhicule service",
        statut: "VALIDEE",
        valideParId: valideur.id,
        valideLe: new Date(),
        creePar: employes[3]?.id || demandeur.id,
      },
    });

    console.log(`✅ ${demandeGarage1.reference} - GARAGE - EN_ATTENTE`);
    console.log(`✅ ${demandeGarage2.reference} - GARAGE - VALIDEE\n`);

    // 6. Créer demandes de rechargement
    console.log("🚚 Création demandes rechargement...");

    const rechargement1 = await prisma.demandeRechargement.create({
      data: {
        reference: `RCH-${new Date().getFullYear()}-001`,
        garageId: garage.id,
        quantiteDemandee: new Decimal(500),
        projetId: projet.id,
        justification: "Réapprovisionnement mensuel",
        statut: "EN_ATTENTE",
        creePar: demandeur.id,
      },
    });

    const rechargement2 = await prisma.demandeRechargement.create({
      data: {
        reference: `RCH-${new Date().getFullYear()}-002`,
        garageId: garage.id,
        quantiteDemandee: new Decimal(1000),
        projetId: projet.id,
        justification: "Stock bas - urgent",
        statut: "VALIDEE",
        valideParId: valideur.id,
        valideLe: new Date(),
        creePar: demandeur.id,
      },
    });

    console.log(`✅ ${rechargement1.reference} - 500 L - EN_ATTENTE`);
    console.log(`✅ ${rechargement2.reference} - 1000 L - VALIDEE\n`);

    // 7. Simuler réception pour rechargement validé
    await prisma.demandeRechargement.update({
      where: { id: rechargement2.id },
      data: {
        statut: "RECEPTIONNEE",
        quantiteLivree: new Decimal(1000),
        dateLivraison: new Date(),
        receptionneParId: valideur.id,
        receptionneLe: new Date(),
      },
    });

    // 8. Mettre à jour stock garage
    await prisma.lieuStockage.update({
      where: { id: garage.id },
      data: {
        stockActuel: { increment: 1000 },
      },
    });

    console.log(`✅ Stock garage ${garage.nom} augmenté de 1000 L\n`);
  }

  // 9. Créer distributions avec compteurs pour tester consommation
  console.log("📊 Création distributions pour calcul consommation...");

  const distributions = await prisma.distributionCarburant.createMany({
    data: [
      {
        materielId: vehicule.id,
        quantite: new Decimal(45),
        compteur: new Decimal(15000),
        pleinComplet: true,
        dateDistribution: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // -15j
        uniteCompteur: "KM",
        creePar: demandeur.id,
      },
      {
        materielId: vehicule.id,
        quantite: new Decimal(48),
        compteur: new Decimal(15450),
        pleinComplet: true,
        dateDistribution: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // -7j
        uniteCompteur: "KM",
        creePar: demandeur.id,
      },
      {
        materielId: vehicule.id,
        quantite: new Decimal(50),
        compteur: new Decimal(15920),
        pleinComplet: true,
        dateDistribution: new Date(),
        uniteCompteur: "KM",
        creePar: demandeur.id,
      },
    ],
  });

  console.log(`✅ ${distributions.count} distributions créées pour calcul consommation\n`);

  // 10. Résumé
  const stats = await Promise.all([
    prisma.demandeCarburant.count(),
    prisma.remiseStation.count(),
    prisma.demandeRechargement.count(),
    prisma.distributionCarburant.count(),
  ]);

  console.log("\n📊 RÉSUMÉ SEED CARBURANT");
  console.log("========================");
  console.log(`Demandes carburant : ${stats[0]}`);
  console.log(`Remises station    : ${stats[1]}`);
  console.log(`Rechargements      : ${stats[2]}`);
  console.log(`Distributions      : ${stats[3]}`);
  console.log("\n✅ Seed terminé avec succès !");
}

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
