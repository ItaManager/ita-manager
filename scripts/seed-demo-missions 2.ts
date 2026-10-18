/**
 * Seed de démonstration M19 — Missions et frais de mission
 *
 * Crée 4 missions couvrant tous les états de la livraison 1 :
 * - Mission en attente de visa N+1
 * - Mission en attente validation RH (avec chevauchement congé)
 * - Mission en attente de rapport (pour tester le blocage)
 * - Mission clôturée
 *
 * Idempotent : nettoie puis recrée.
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
  console.log("\n=== Seed démo M19 — Missions ===\n");

  // Nettoyer les missions de démo existantes
  await prisma.mission.deleteMany({
    where: {
      reference: { startsWith: "MIS-DEMO-" },
    },
  });
  console.log("✓ Nettoyage missions de démo précédentes\n");

  // Trouver l'employé lié au compte armelgnakpa7@gmail.com
  const profil = await prisma.profil.findUnique({
    where: { email: "armelgnakpa7@gmail.com" },
    include: {
      employe: {
        select: { id: true, prenom: true, nom: true },
      },
    },
  });

  if (!profil?.employe) {
    console.error("❌ Aucun employé lié au compte armelgnakpa7@gmail.com");
    console.error("   Créez d'abord le lien dans le seed principal");
    process.exit(1);
  }

  const employe = profil.employe;

  // Trouver Declann ARMEL comme supérieur
  const superieur = await prisma.employe.findFirst({
    where: {
      matricule: "DEC2025",
    },
    select: { id: true, prenom: true, nom: true },
  });

  if (!superieur) {
    console.error("❌ Employé Declann ARMEL (DEC2025) introuvable");
    console.error("   Lancez d'abord scripts/seed-comptes-m19.ts");
    process.exit(1);
  }

  console.log(`Employé demandeur : ${employe.prenom} ${employe.nom}`);
  console.log(`Supérieur (N+1) : ${superieur.prenom} ${superieur.nom}\n`);

  // Créer ou mettre à jour l'affectation avec supérieur
  // D'abord fermer toute affectation en cours pour cet employé
  await prisma.affectation.updateMany({
    where: {
      employeId: employe.id,
      dateFin: null,
    },
    data: {
      dateFin: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
    },
  });

  // Créer une affectation avec le supérieur
  const poste = await prisma.poste.findFirst();

  if (!poste) {
    console.error("❌ Aucun poste trouvé. Lancez le seed principal");
    process.exit(1);
  }

  await prisma.affectation.create({
    data: {
      employeId: employe.id,
      posteId: poste.id,
      superieurId: superieur.id,
      dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Il y a 30 jours
      // dateFin: null = affectation en cours
    },
  });

  console.log(`✓ Affectation créée avec lien hiérarchique\n`);

  // Dates de référence
  const aujourdhui = new Date();
  aujourdhui.setUTCHours(0, 0, 0, 0);

  const hierMatin = new Date(aujourdhui);
  hierMatin.setDate(hierMatin.getDate() - 1);

  const il_y_a_5_jours = new Date(aujourdhui);
  il_y_a_5_jours.setDate(il_y_a_5_jours.getDate() - 5);

  const il_y_a_8_jours = new Date(aujourdhui);
  il_y_a_8_jours.setDate(il_y_a_8_jours.getDate() - 8);

  const il_y_a_15_jours = new Date(aujourdhui);
  il_y_a_15_jours.setDate(il_y_a_15_jours.getDate() - 15);

  const il_y_a_18_jours = new Date(aujourdhui);
  il_y_a_18_jours.setDate(il_y_a_18_jours.getDate() - 18);

  const demain = new Date(aujourdhui);
  demain.setDate(demain.getDate() + 1);

  const dans_3_jours = new Date(aujourdhui);
  dans_3_jours.setDate(dans_3_jours.getDate() + 3);

  const dans_7_jours = new Date(aujourdhui);
  dans_7_jours.setDate(dans_7_jours.getDate() + 7);

  const dans_10_jours = new Date(aujourdhui);
  dans_10_jours.setDate(dans_10_jours.getDate() + 10);

  // ════════════════════════════════════════════════════════════════════
  // MISSION 1 : EN ATTENTE DE VISA N+1
  // ════════════════════════════════════════════════════════════════════
  const mission1 = await prisma.mission.create({
    data: {
      reference: "MIS-DEMO-001",
      demandeurId: employe.id,
      objet: "Supervision chantier Yamoussoukro",
      destination: "Yamoussoukro",
      moyenTransport: "VEHICULE_ITA",
      dateDepart: dans_3_jours,
      dateRetour: dans_7_jours,
      fraisEstimes: 150000,
      soumiseLe: new Date(),
      lignesFrais: {
        create: [
          {
            moment: "ESTIMATION",
            categorie: "CARBURANT",
            libelle: "Carburant A/R Abidjan-Yamoussoukro",
            montant: 80000,
          },
          {
            moment: "ESTIMATION",
            categorie: "RESTAURATION",
            libelle: "Restauration 4 jours",
            montant: 40000,
          },
          {
            moment: "ESTIMATION",
            categorie: "HEBERGEMENT",
            libelle: "Hébergement 3 nuits",
            montant: 30000,
          },
        ],
      },
    },
  });

  console.log(`✓ Mission 1 créée : ${mission1.reference}`);
  console.log(`  Statut : EN ATTENTE VISA N+1`);
  console.log(`  Départ : ${mission1.dateDepart.toISOString().split("T")[0]}\n`);

  // ════════════════════════════════════════════════════════════════════
  // MISSION 2 : EN ATTENTE VALIDATION RH (avec chevauchement congé)
  // ════════════════════════════════════════════════════════════════════

  // Créer d'abord un congé validé qui chevauche
  const typeConge = await prisma.typeAbsence.findFirst({
    where: { libelle: { contains: "Congé" } },
  });

  if (typeConge) {
    await prisma.absence.create({
      data: {
        employeId: employe.id,
        typeAbsenceId: typeConge.id,
        dateDebut: dans_7_jours,
        dateFin: dans_10_jours,
        nombreJours: 3,
        statut: "VALIDEE",
        motif: "Congé annuel planifié",
        superieurId: superieur.id,
        decisionN1: "VALIDE",
        decisionN1Le: new Date(),
        decisionRH: "VALIDE",
        decisionRHLe: new Date(),
        soumieLe: new Date(),
      },
    });
    console.log(`✓ Congé validé créé (${dans_7_jours.toISOString().split("T")[0]} → ${dans_10_jours.toISOString().split("T")[0]})\n`);
  }

  const mission2 = await prisma.mission.create({
    data: {
      reference: "MIS-DEMO-002",
      demandeurId: employe.id,
      objet: "Formation continue sécurité chantier",
      destination: "Bouaké",
      moyenTransport: "TRANSPORT_COMMUN",
      dateDepart: dans_7_jours,
      dateRetour: dans_10_jours,
      fraisEstimes: 85000,
      soumiseLe: hierMatin,
      viseeN1Le: new Date(),
      lignesFrais: {
        create: [
          {
            moment: "ESTIMATION",
            categorie: "TRANSPORT",
            libelle: "Transport A/R Abidjan-Bouaké",
            montant: 25000,
          },
          {
            moment: "ESTIMATION",
            categorie: "HEBERGEMENT",
            libelle: "Hébergement 2 nuits",
            montant: 40000,
          },
          {
            moment: "ESTIMATION",
            categorie: "RESTAURATION",
            libelle: "Restauration 3 jours",
            montant: 20000,
          },
        ],
      },
    },
  });

  console.log(`✓ Mission 2 créée : ${mission2.reference}`);
  console.log(`  Statut : EN ATTENTE VALIDATION RH`);
  console.log(`  ⚠️  Chevauche un congé validé !`);
  console.log(`  Départ : ${mission2.dateDepart.toISOString().split("T")[0]}\n`);

  // ════════════════════════════════════════════════════════════════════
  // MISSION 3 : EN ATTENTE DE RAPPORT (bloque nouvelle demande)
  // ════════════════════════════════════════════════════════════════════
  const mission3 = await prisma.mission.create({
    data: {
      reference: "MIS-DEMO-003",
      demandeurId: employe.id,
      objet: "Réunion coordination projet BTP",
      destination: "San-Pédro",
      moyenTransport: "VEHICULE_PERSONNEL",
      dateDepart: il_y_a_8_jours,
      dateRetour: il_y_a_5_jours,
      fraisEstimes: 120000,
      soumiseLe: il_y_a_15_jours,
      viseeN1Le: il_y_a_15_jours,
      valideeRhLe: il_y_a_15_jours,
      // PAS de rapportDeposeLe → BLOQUE nouvelle demande
      lignesFrais: {
        create: [
          {
            moment: "ESTIMATION",
            categorie: "CARBURANT",
            libelle: "Carburant véhicule personnel",
            montant: 60000,
          },
          {
            moment: "ESTIMATION",
            categorie: "HEBERGEMENT",
            libelle: "Hébergement 2 nuits",
            montant: 40000,
          },
          {
            moment: "ESTIMATION",
            categorie: "RESTAURATION",
            libelle: "Restauration",
            montant: 20000,
          },
        ],
      },
    },
  });

  console.log(`✓ Mission 3 créée : ${mission3.reference}`);
  console.log(`  Statut : VALIDÉE RH, EN ATTENTE RAPPORT`);
  console.log(`  Retour : ${mission3.dateRetour.toISOString().split("T")[0]}`);
  console.log(`  ⚠️  BLOQUE toute nouvelle demande pour cet employé !\n`);

  // ════════════════════════════════════════════════════════════════════
  // MISSION 4 : CLÔTURÉE (avec rapport déposé)
  // ════════════════════════════════════════════════════════════════════
  const mission4 = await prisma.mission.create({
    data: {
      reference: "MIS-DEMO-004",
      demandeurId: employe.id,
      objet: "Inspection qualité béton chantier",
      destination: "Korhogo",
      moyenTransport: "AVION",
      dateDepart: il_y_a_18_jours,
      dateRetour: il_y_a_15_jours,
      fraisEstimes: 250000,
      soumiseLe: new Date(il_y_a_18_jours.getTime() - 7 * 24 * 60 * 60 * 1000),
      viseeN1Le: new Date(il_y_a_18_jours.getTime() - 6 * 24 * 60 * 60 * 1000),
      valideeRhLe: new Date(il_y_a_18_jours.getTime() - 5 * 24 * 60 * 60 * 1000),
      rapportDeposeLe: new Date(il_y_a_15_jours.getTime() + 2 * 24 * 60 * 60 * 1000),
      clotureeLe: new Date(il_y_a_15_jours.getTime() + 3 * 24 * 60 * 60 * 1000),
      lignesFrais: {
        create: [
          {
            moment: "ESTIMATION",
            categorie: "TRANSPORT",
            libelle: "Vol A/R Abidjan-Korhogo",
            montant: 180000,
          },
          {
            moment: "ESTIMATION",
            categorie: "HEBERGEMENT",
            libelle: "Hébergement 2 nuits",
            montant: 50000,
          },
          {
            moment: "ESTIMATION",
            categorie: "RESTAURATION",
            libelle: "Restauration",
            montant: 20000,
          },
        ],
      },
      rapport: {
        create: {
          objetRealise:
            "Inspection de conformité des éprouvettes de béton réalisée sur le chantier de Korhogo selon les normes en vigueur.",
          resultats:
            "Les tests de résistance montrent une conformité à 95%. Deux non-conformités mineures détectées et corrigées sur place. Rapport technique transmis au maître d'ouvrage.",
        },
      },
    },
  });

  console.log(`✓ Mission 4 créée : ${mission4.reference}`);
  console.log(`  Statut : CLÔTURÉE`);
  console.log(`  Rapport déposé : ${mission4.rapportDeposeLe?.toISOString().split("T")[0]}`);
  console.log(`  Clôturée : ${mission4.clotureeLe?.toISOString().split("T")[0]}\n`);

  // ════════════════════════════════════════════════════════════════════
  // RÉSUMÉ
  // ════════════════════════════════════════════════════════════════════
  console.log("════════════════════════════════════════════════════════");
  console.log("RÉSUMÉ DES MISSIONS DE DÉMO");
  console.log("════════════════════════════════════════════════════════\n");

  console.log(`Employé demandeur : ${employe.prenom} ${employe.nom} (${employe.id})`);
  console.log(`Supérieur (N+1) : ${superieur.prenom} ${superieur.nom} (${superieur.id})\n`);

  console.log("MIS-DEMO-001 : EN ATTENTE VISA N+1");
  console.log("  → Tester le visa N+1 avec le compte du supérieur\n");

  console.log("MIS-DEMO-002 : EN ATTENTE VALIDATION RH");
  console.log("  → Tester la validation RH");
  console.log("  → Voir l'alerte de chevauchement congé\n");

  console.log("MIS-DEMO-003 : EN ATTENTE DE RAPPORT");
  console.log("  → Tester le dépôt de rapport");
  console.log("  → Vérifier que l'employé est bloqué pour créer une nouvelle mission\n");

  console.log("MIS-DEMO-004 : CLÔTURÉE");
  console.log("  → Exemple de mission terminée avec rapport\n");

  console.log("✅ Seed démo M19 terminé\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed démo M19:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
