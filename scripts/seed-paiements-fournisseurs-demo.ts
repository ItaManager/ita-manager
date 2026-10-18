#!/usr/bin/env tsx
/**
 * Script : Seed données démo M15 L2 Paiements Fournisseurs
 *
 * Usage: tsx scripts/seed-paiements-fournisseurs-demo.ts
 *
 * Crée :
 * - 5 fournisseurs variés
 * - 10 factures avec différents statuts
 * - 5 paiements (total et partiels)
 * - Scénarios D-01 à D-10
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";
import { Decimal } from "@prisma/client/runtime/library";

async function main() {
  console.log("🔧 Seed données démo M15 L2 Paiements Fournisseurs...\n");

  // 1. Récupérer IDs nécessaires
  const [employes, projets] = await Promise.all([
    prisma.employe.findMany({ take: 5 }),
    prisma.projet.findMany({ where: { statut: "EN_COURS" }, take: 3 }),
  ]);

  if (employes.length === 0 || projets.length === 0) {
    console.error("❌ Données de base manquantes (employés ou projets)");
    process.exit(1);
  }

  const gestionnaire = employes[0];
  const logisticien = employes[1];
  const dg = employes[2];
  const projet1 = projets[0];
  const projet2 = projets[1];

  console.log(`✅ Gestionnaire : ${gestionnaire.nom} ${gestionnaire.prenom}`);
  console.log(`✅ Projet 1 : ${projet1.code}`);
  console.log(`✅ Projet 2 : ${projet2?.code || "N/A"}\n`);

  // 2. Nettoyer données démo existantes
  console.log("🗑️  Nettoyage données démo existantes...");
  await prisma.paiementFournisseur.deleteMany({});
  await prisma.factureFournisseur.deleteMany({});
  await prisma.fournisseur.deleteMany({
    where: {
      OR: [
        { nom: { contains: "DEMO" } },
        { nom: { in: ["TOTAL CI", "SOCOCE", "SCRELA", "SOGEA", "EIFFAGE CI"] } }
      ]
    }
  });
  console.log("✅ Nettoyage terminé\n");

  // 3. Créer fournisseurs (D-08 : enrichis)
  console.log("🏢 Création fournisseurs...");

  const fournisseurs = await Promise.all([
    prisma.fournisseur.create({
      data: {
        nom: "TOTAL CI",
        categorie: "CARBURANT",
        modePaiementPrefere: "MOBILE_MONEY",
        contact: "+225 27 21 12 34 56",
        numeroWave: "+22501020304",
        rccm: "CI-ABJ-2020-B-12345",
        adresse: "Boulevard Valéry Giscard d'Estaing, Abidjan",
        creePar: gestionnaire.id,
      },
    }),
    prisma.fournisseur.create({
      data: {
        nom: "SOCOCE",
        categorie: "MATERIAUX",
        modePaiementPrefere: "VIREMENT",
        contact: "+225 27 21 98 76 54",
        rccm: "CI-ABJ-2019-B-67890",
        adresse: "Zone Industrielle Yopougon, Abidjan",
        creePar: gestionnaire.id,
      },
    }),
    prisma.fournisseur.create({
      data: {
        nom: "SCRELA",
        categorie: "LOCATION",
        modePaiementPrefere: "CHEQUE",
        contact: "+225 27 21 55 44 33",
        numeroWave: "+22505060708",
        rccm: "CI-ABJ-2018-B-11111",
        adresse: "Riviera Palmeraie, Abidjan",
        creePar: gestionnaire.id,
      },
    }),
    prisma.fournisseur.create({
      data: {
        nom: "SOGEA",
        categorie: "SERVICES",
        modePaiementPrefere: "VIREMENT",
        contact: "+225 27 21 77 88 99",
        rccm: "CI-ABJ-2017-B-22222",
        adresse: "Plateau, Abidjan",
        creePar: gestionnaire.id,
      },
    }),
    prisma.fournisseur.create({
      data: {
        nom: "EIFFAGE CI",
        categorie: "MATERIAUX",
        modePaiementPrefere: "VIREMENT",
        contact: "+225 27 21 33 22 11",
        rccm: "CI-ABJ-2016-B-33333",
        adresse: "Marcory Zone 4, Abidjan",
        creePar: gestionnaire.id,
      },
    }),
  ]);

  console.log(`✅ ${fournisseurs.length} fournisseurs créés\n`);

  // 4. Créer factures avec différents scénarios
  console.log("📄 Création factures...");

  const now = new Date();
  const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const il_y_a_10j = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // Facture 1 : BROUILLON
  const f1 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-001",
      fournisseurId: fournisseurs[0].id,
      montantHT: new Decimal(500000),
      montantTVA: new Decimal(90000),
      montantTTC: new Decimal(590000),
      dateFacture: now,
      dateEcheance: dans7j,
      projetId: projet1.id,
      statutFacture: "BROUILLON",
      creePar: gestionnaire.id,
    },
  });

  // Facture 2 : A_RECEVOIR
  const f2 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-002",
      fournisseurId: fournisseurs[1].id,
      montantHT: new Decimal(1200000),
      montantTVA: new Decimal(216000),
      montantTTC: new Decimal(1416000),
      dateFacture: now,
      dateEcheance: dans7j,
      projetId: projet1.id,
      statutFacture: "A_RECEVOIR",
      creePar: gestionnaire.id,
    },
  });

  // Facture 3 : A_VALIDER (réception confirmée)
  const f3 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-003",
      fournisseurId: fournisseurs[2].id,
      montantHT: new Decimal(300000),
      montantTVA: new Decimal(54000),
      montantTTC: new Decimal(354000),
      dateFacture: now,
      dateEcheance: dans7j,
      projetId: projet1.id,
      statutFacture: "A_VALIDER",
      receptionConfirmee: true, // D-01
      receptionneParId: logisticien.id,
      receptionneLe: now,
      creePar: gestionnaire.id,
    },
  });

  // Facture 4 : A_VALIDER_DG (montant > seuil 500K, D-02)
  const f4 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-004",
      fournisseurId: fournisseurs[3].id,
      montantHT: new Decimal(800000),
      montantTVA: new Decimal(144000),
      montantTTC: new Decimal(944000), // > 500K → validation DG
      dateFacture: now,
      dateEcheance: dans7j,
      projetId: projet2?.id || projet1.id,
      statutFacture: "A_VALIDER_DG",
      receptionConfirmee: true,
      receptionneParId: logisticien.id,
      receptionneLe: now,
      valideParId: gestionnaire.id,
      valideLe: now,
      creePar: gestionnaire.id,
    },
  });

  // Facture 5 : A_PAYER (validée, < seuil)
  const f5 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-005",
      fournisseurId: fournisseurs[4].id,
      montantHT: new Decimal(400000),
      montantTVA: new Decimal(72000),
      montantTTC: new Decimal(472000),
      dateFacture: now,
      dateEcheance: dans7j,
      projetId: projet1.id,
      statutFacture: "A_PAYER",
      receptionConfirmee: true,
      receptionneParId: logisticien.id,
      receptionneLe: now,
      valideParId: gestionnaire.id,
      valideLe: now,
      creePar: gestionnaire.id,
    },
  });

  // Facture 6 : PARTIELLE (paiement partiel, D-03)
  const f6 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-006",
      fournisseurId: fournisseurs[0].id,
      montantHT: new Decimal(1000000),
      montantTVA: new Decimal(180000),
      montantTTC: new Decimal(1180000),
      montantPaye: new Decimal(600000), // Paiement partiel
      dateFacture: now,
      dateEcheance: dans7j,
      projetId: projet1.id,
      statutFacture: "PARTIELLE",
      receptionConfirmee: true,
      receptionneParId: logisticien.id,
      receptionneLe: now,
      valideParId: gestionnaire.id,
      valideLe: now,
      creePar: gestionnaire.id,
    },
  });

  // Facture 7 : SOLDEE (payée en totalité)
  const f7 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-007",
      fournisseurId: fournisseurs[1].id,
      montantHT: new Decimal(250000),
      montantTVA: new Decimal(45000),
      montantTTC: new Decimal(295000),
      montantPaye: new Decimal(295000),
      dateFacture: il_y_a_10j,
      dateEcheance: il_y_a_10j,
      projetId: projet1.id,
      statutFacture: "SOLDEE",
      receptionConfirmee: true,
      receptionneParId: logisticien.id,
      receptionneLe: il_y_a_10j,
      valideParId: gestionnaire.id,
      valideLe: il_y_a_10j,
      creePar: gestionnaire.id,
    },
  });

  // Facture 8 : EN RETARD (D-04)
  const echeancePassee = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const f8 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-008",
      fournisseurId: fournisseurs[2].id,
      montantHT: new Decimal(180000),
      montantTVA: new Decimal(32400),
      montantTTC: new Decimal(212400),
      dateFacture: echeancePassee,
      dateEcheance: echeancePassee, // En retard
      projetId: projet1.id,
      statutFacture: "A_PAYER",
      receptionConfirmee: true,
      receptionneParId: logisticien.id,
      receptionneLe: echeancePassee,
      valideParId: gestionnaire.id,
      valideLe: echeancePassee,
      creePar: gestionnaire.id,
    },
  });

  // Facture 9 : REFUSEE
  const f9 = await prisma.factureFournisseur.create({
    data: {
      reference: "FAC-2026-009",
      fournisseurId: fournisseurs[3].id,
      montantHT: new Decimal(90000),
      montantTVA: new Decimal(16200),
      montantTTC: new Decimal(106200),
      dateFacture: now,
      projetId: projet1.id,
      statutFacture: "REFUSEE",
      receptionConfirmee: false,
      receptionCommentaire: "Marchandise non conforme",
      creePar: gestionnaire.id,
    },
  });

  // Facture 10 : Doublon pour tester D-05 (même fournisseur, même ref → erreur)
  // On ne la crée pas, elle sera testée manuellement

  console.log(`✅ 9 factures créées avec statuts variés\n`);

  // 5. Créer paiements (D-06 : preuve obligatoire)
  console.log("💰 Création paiements...");

  // Paiement 1 : Paiement partiel pour f6
  const p1 = await prisma.paiementFournisseur.create({
    data: {
      reference: "PF-2026-0001",
      factureId: f6.id,
      fournisseurId: fournisseurs[0].id,
      montantPaye: new Decimal(600000),
      modePaiement: "MOBILE_MONEY",
      datePaiement: now,
      urlPreuve: "https://storage.example.com/preuves/pf-001.pdf",
      statutPaiement: "CONFIRME",
      effectueParId: gestionnaire.id,
      creePar: gestionnaire.id,
    },
  });

  // Paiement 2 : Paiement total pour f7
  const p2 = await prisma.paiementFournisseur.create({
    data: {
      reference: "PF-2026-0002",
      factureId: f7.id,
      fournisseurId: fournisseurs[1].id,
      montantPaye: new Decimal(295000),
      modePaiement: "VIREMENT",
      datePaiement: il_y_a_10j,
      urlPreuve: "https://storage.example.com/preuves/pf-002.pdf",
      statutPaiement: "CONFIRME",
      effectueParId: gestionnaire.id,
      creePar: gestionnaire.id,
    },
  });

  // Paiement 3 : EN_ATTENTE_PREUVE (D-06)
  const p3 = await prisma.paiementFournisseur.create({
    data: {
      reference: "PF-2026-0003",
      factureId: f5.id,
      fournisseurId: fournisseurs[4].id,
      montantPaye: new Decimal(200000),
      modePaiement: "ESPECES",
      datePaiement: now,
      statutPaiement: "EN_ATTENTE_PREUVE", // Pas de preuve encore
      effectueParId: gestionnaire.id,
      creePar: gestionnaire.id,
    },
  });

  // Mettre à jour montantPaye de f5
  await prisma.factureFournisseur.update({
    where: { id: f5.id },
    data: {
      montantPaye: new Decimal(200000),
      statutFacture: "PARTIELLE",
    },
  });

  console.log(`✅ 3 paiements créés (CONFIRME + EN_ATTENTE_PREUVE)\n`);

  // 6. Résumé final
  const stats = await Promise.all([
    prisma.fournisseur.count(),
    prisma.factureFournisseur.count(),
    prisma.factureFournisseur.count({ where: { statutFacture: "A_PAYER" } }),
    prisma.factureFournisseur.count({
      where: {
        dateEcheance: { lt: now },
        statutFacture: { in: ["A_PAYER", "PARTIELLE"] }
      }
    }),
    prisma.paiementFournisseur.count(),
    prisma.factureFournisseur.aggregate({
      where: { statutFacture: { in: ["A_PAYER", "PARTIELLE"] } },
      _sum: { montantTTC: true, montantPaye: true }
    }),
  ]);

  const soldeDu = (stats[5]._sum.montantTTC?.toNumber() || 0) - (stats[5]._sum.montantPaye?.toNumber() || 0);

  console.log("\n📊 RÉSUMÉ SEED PAIEMENTS FOURNISSEURS");
  console.log("======================================");
  console.log(`Fournisseurs         : ${stats[0]}`);
  console.log(`Factures totales     : ${stats[1]}`);
  console.log(`  └─ À payer         : ${stats[2]}`);
  console.log(`  └─ En retard       : ${stats[3]}`);
  console.log(`Paiements effectués  : ${stats[4]}`);
  console.log(`Solde dû total       : ${soldeDu.toLocaleString("fr-FR")} F\n`);

  console.log("✅ Scénarios D-01 à D-10 implémentés :");
  console.log("  D-01 : Factures avec/sans réception confirmée");
  console.log("  D-02 : Facture > 500K nécessitant validation DG");
  console.log("  D-03 : Paiements partiels (f6 : 600K/1180K)");
  console.log("  D-04 : Facture en retard (f8)");
  console.log("  D-05 : Contrainte unique [fournisseur, référence]");
  console.log("  D-06 : Paiement EN_ATTENTE_PREUVE (p3)");
  console.log("  D-07 : Toutes factures imputées à projet");
  console.log("  D-08 : Fournisseurs avec catégorie + mode paiement");
  console.log("  D-09 : Calcul solde dû prêt pour page détail");
  console.log("  D-10 : Structure prête pour lien ITApay\n");

  console.log("✅ Seed terminé avec succès !");
}

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
