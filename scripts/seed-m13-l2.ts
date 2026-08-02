/**
 * Seed M13 L2 — Stocks, Inspections, Réceptions
 *
 * Données de référence :
 * - 4 permissions M13 L2
 * - Points d'inspection (3 grilles : PHYSIQUE, DOCUMENT, EQUIPEMENT)
 * - Articles de stock (fournitures, consommables, pièces mécaniques)
 */

import { prisma } from "@/lib/db/prisma";

async function main() {
  console.log("🌱 Seed M13 L2 — Stocks, Inspections, Réceptions");

  // ========== PERMISSIONS M13 L2 ==========

  const permissionsL2 = [
    {
      code: "stock:lire",
      libelle: "Consulter les stocks et mouvements",
      domaine: "TECHNIQUE",
    },
    {
      code: "stock:mouvementer",
      libelle: "Créer un bon de mouvement de stock",
      domaine: "TECHNIQUE",
    },
    {
      code: "materiel:inspecter",
      libelle: "Créer et consulter des inspections matériel",
      domaine: "TECHNIQUE",
    },
    {
      code: "reception:controler",
      libelle: "Réceptionner et contrôler une livraison",
      domaine: "TECHNIQUE",
    },
  ];

  for (const perm of permissionsL2) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: perm,
    });
  }
  console.log(`✅ ${permissionsL2.length} permissions M13 L2 créées/mises à jour`);

  // ========== POINTS D'INSPECTION ==========

  // Grille PHYSIQUE — État du véhicule/matériel
  const pointsPhysiques = [
    "Carrosserie (chocs, rayures, déformations)",
    "Pare-brise et vitres (fissures, propreté)",
    "Rétroviseurs (état, fixation)",
    "Pneumatiques (usure, pression, roue de secours)",
    "Feux avant et arrière (fonctionnement)",
    "Clignotants et feux de détresse",
    "Essuie-glaces et lave-glace",
    "Klaxon",
    "Ceintures de sécurité",
    "État de la cabine (propreté, sièges)",
    "Niveaux (huile, liquide de refroidissement, frein)",
    "Batterie (fixation, corrosion)",
  ];

  // Grille DOCUMENT — Pièces administratives
  const pointsDocuments = [
    "Carte grise (présence, validité)",
    "Assurance (présence, validité, vignette)",
    "Contrôle technique (présence, validité)",
    "Visite technique (présence, validité pour poids lourds)",
    "Certificat de transport (pour camions)",
    "Carnet d'entretien (présence, à jour)",
  ];

  // Grille EQUIPEMENT — Équipements de sécurité et outils
  const pointsEquipement = [
    "Triangle de signalisation",
    "Gilet de sécurité",
    "Extincteur (présence, validité)",
    "Trousse de premiers secours",
    "Roue de secours (état, gonflage)",
    "Cric et clé à roue",
    "Câbles de démarrage",
    "Cales de roue (pour poids lourds)",
  ];

  let ordre = 0;
  for (const libelle of pointsPhysiques) {
    await prisma.pointInspection.upsert({
      where: { libelle },
      create: {
        libelle,
        grille: "PHYSIQUE",
        typesMateriel: JSON.stringify(["VEHICULE", "ENGIN"]),
        ordre: ordre++,
        actif: true,
      },
      update: {
        grille: "PHYSIQUE",
        typesMateriel: JSON.stringify(["VEHICULE", "ENGIN"]),
        ordre: ordre - 1,
      },
    });
  }

  for (const libelle of pointsDocuments) {
    await prisma.pointInspection.upsert({
      where: { libelle },
      create: {
        libelle,
        grille: "DOCUMENT",
        typesMateriel: JSON.stringify(["VEHICULE", "ENGIN"]),
        ordre: ordre++,
        actif: true,
      },
      update: {
        grille: "DOCUMENT",
        typesMateriel: JSON.stringify(["VEHICULE", "ENGIN"]),
        ordre: ordre - 1,
      },
    });
  }

  for (const libelle of pointsEquipement) {
    await prisma.pointInspection.upsert({
      where: { libelle },
      create: {
        libelle,
        grille: "EQUIPEMENT",
        typesMateriel: JSON.stringify(["VEHICULE", "ENGIN"]),
        ordre: ordre++,
        actif: true,
      },
      update: {
        grille: "EQUIPEMENT",
        typesMateriel: JSON.stringify(["VEHICULE", "ENGIN"]),
        ordre: ordre - 1,
      },
    });
  }

  const totalPoints = pointsPhysiques.length + pointsDocuments.length + pointsEquipement.length;
  console.log(`✅ ${totalPoints} points d'inspection créés/mis à jour`);

  // ========== ARTICLES DE STOCK ==========

  const articles = [
    // Fournitures de bureau
    { reference: "FOU-001", designation: "Ramette papier A4 80g", unite: "ramette", famille: "Fournitures" },
    { reference: "FOU-002", designation: "Stylo bille bleu", unite: "pièce", famille: "Fournitures" },
    { reference: "FOU-003", designation: "Cahier 96 pages", unite: "pièce", famille: "Fournitures" },
    { reference: "FOU-004", designation: "Agrafeuse professionnelle", unite: "pièce", famille: "Fournitures" },
    { reference: "FOU-005", designation: "Agrafs 24/6", unite: "boîte", famille: "Fournitures" },

    // Consommables mécaniques
    { reference: "CONS-001", designation: "Huile moteur 5W30", unite: "litre", famille: "Consommables", seuilAlerte: 20 },
    { reference: "CONS-002", designation: "Liquide de refroidissement", unite: "litre", famille: "Consommables", seuilAlerte: 15 },
    { reference: "CONS-003", designation: "Liquide de frein DOT4", unite: "litre", famille: "Consommables", seuilAlerte: 10 },
    { reference: "CONS-004", designation: "Graisse multifonction", unite: "kg", famille: "Consommables", seuilAlerte: 5 },

    // Pièces mécaniques courantes
    { reference: "PIECE-001", designation: "Filtre à huile", unite: "pièce", famille: "Mécanique", seuilAlerte: 10 },
    { reference: "PIECE-002", designation: "Filtre à air", unite: "pièce", famille: "Mécanique", seuilAlerte: 10 },
    { reference: "PIECE-003", designation: "Filtre à carburant", unite: "pièce", famille: "Mécanique", seuilAlerte: 8 },
    { reference: "PIECE-004", designation: "Plaquettes de frein avant", unite: "jeu", famille: "Mécanique", seuilAlerte: 5 },
    { reference: "PIECE-005", designation: "Plaquettes de frein arrière", unite: "jeu", famille: "Mécanique", seuilAlerte: 5 },
    { reference: "PIECE-006", designation: "Courroie de distribution", unite: "pièce", famille: "Mécanique", seuilAlerte: 3 },
    { reference: "PIECE-007", designation: "Batterie 12V 70Ah", unite: "pièce", famille: "Mécanique", seuilAlerte: 2 },

    // EPI et sécurité
    { reference: "EPI-001", designation: "Casque de chantier", unite: "pièce", famille: "Sécurité", seuilAlerte: 20 },
    { reference: "EPI-002", designation: "Gants de protection", unite: "paire", famille: "Sécurité", seuilAlerte: 30 },
    { reference: "EPI-003", designation: "Gilet haute visibilité", unite: "pièce", famille: "Sécurité", seuilAlerte: 25 },
    { reference: "EPI-004", designation: "Lunettes de protection", unite: "pièce", famille: "Sécurité", seuilAlerte: 15 },
    { reference: "EPI-005", designation: "Chaussures de sécurité S3", unite: "paire", famille: "Sécurité", seuilAlerte: 10 },

    // Outillage
    { reference: "OUT-001", designation: "Marteau", unite: "pièce", famille: "Outillage" },
    { reference: "OUT-002", designation: "Tournevis cruciforme", unite: "pièce", famille: "Outillage" },
    { reference: "OUT-003", designation: "Pince multiprise", unite: "pièce", famille: "Outillage" },
    { reference: "OUT-004", designation: "Clé à molette 250mm", unite: "pièce", famille: "Outillage" },
  ];

  for (const article of articles) {
    await prisma.articleStock.upsert({
      where: { reference: article.reference },
      create: {
        ...article,
        seuilAlerte: article.seuilAlerte,
        actif: true,
      },
      update: {
        designation: article.designation,
        unite: article.unite,
        famille: article.famille,
        seuilAlerte: article.seuilAlerte,
      },
    });
  }
  console.log(`✅ ${articles.length} articles de stock créés/mis à jour`);

  console.log("✅ Seed M13 L2 terminé");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
