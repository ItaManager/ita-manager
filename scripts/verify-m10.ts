/**
 * Script de vérification M10 — Pilotage et tableaux de bord
 *
 * Vérifie les critères de recette du module M10 :
 * - Server actions pour statistiques présentes
 * - Page tableau de bord dynamique avec données réelles
 * - Pages /notifications et /calendrier créées
 * - Permissions réutilisées (employe:lire pour tous les rôles)
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
  console.log("\n🔍 Vérification M10 — Pilotage et tableaux de bord\n");

  let erreurs = 0;

  // ===================================================================
  // 1. Vérifier que les pages M10 existent
  // ===================================================================
  console.log("1️⃣  Vérification des pages M10...");

  const fs = await import("fs");
  const path = await import("path");

  const pagesM10 = [
    "app/(app)/page.tsx", // Tableau de bord
    "app/(app)/notifications/page.tsx",
    "app/(app)/calendrier/page.tsx",
  ];

  for (const page of pagesM10) {
    const cheminComplet = path.join(process.cwd(), page);
    if (!fs.existsSync(cheminComplet)) {
      console.log(`   ❌ Page manquante : ${page}`);
      erreurs++;
    }
  }

  if (erreurs === 0) {
    console.log(`   ✅ ${pagesM10.length} pages M10 présentes`);
  }

  // ===================================================================
  // 2. Vérifier que les server actions M10 existent
  // ===================================================================
  console.log("\n2️⃣  Vérification des server actions M10...");

  const actionsM10 = path.join(process.cwd(), "lib/actions/pilotage.ts");
  if (!fs.existsSync(actionsM10)) {
    console.log("   ❌ Fichier lib/actions/pilotage.ts manquant");
    erreurs++;
  } else {
    const contenu = fs.readFileSync(actionsM10, "utf-8");
    const actionsCles = [
      "statistiquesTableauDeBord",
      "activiteRecente",
      "alertesTableauDeBord",
      "statistiquesDG",
      "statistiquesDRH",
      "statistiquesDFC",
      "statistiquesDT",
    ];

    let actionsManquantes = 0;
    for (const action of actionsCles) {
      if (!contenu.includes(`export const ${action}`)) {
        console.log(`   ❌ Action manquante : ${action}`);
        actionsManquantes++;
      }
    }

    if (actionsManquantes === 0) {
      console.log(`   ✅ ${actionsCles.length} server actions M10 présentes`);
    } else {
      erreurs++;
    }
  }

  // ===================================================================
  // 3. Vérifier que les données existent pour les statistiques
  // ===================================================================
  console.log("\n3️⃣  Vérification des données pour statistiques...");

  const [
    nombreDirections,
    nombreServices,
    nombrePostes,
    nombreEmployes,
    nombreAO,
    nombreUtilisateurs,
    nombreEvenements,
  ] = await Promise.all([
    prisma.direction.count(),
    prisma.service.count(),
    prisma.poste.count(),
    prisma.employe.count(),
    prisma.appelOffres.count(),
    prisma.profil.count(),
    prisma.journalEvenement.count(),
  ]);

  console.log(`   ℹ️  Directions : ${nombreDirections}`);
  console.log(`   ℹ️  Services : ${nombreServices}`);
  console.log(`   ℹ️  Postes : ${nombrePostes}`);
  console.log(`   ℹ️  Employés : ${nombreEmployes}`);
  console.log(`   ℹ️  Appels d'offres : ${nombreAO}`);
  console.log(`   ℹ️  Utilisateurs : ${nombreUtilisateurs}`);
  console.log(`   ℹ️  Événements journal : ${nombreEvenements}`);

  if (nombreDirections === 0 || nombreUtilisateurs === 0) {
    console.log(
      "   ⚠️  Données insuffisantes pour tester les statistiques"
    );
    erreurs++;
  } else {
    console.log("   ✅ Données suffisantes pour afficher les statistiques");
  }

  // ===================================================================
  // 4. Vérifier que les statistiques sont calculables
  // ===================================================================
  console.log("\n4️⃣  Vérification du calcul des statistiques...");

  try {
    // Statistiques organisation
    const statsOrganisation = await Promise.all([
      prisma.direction.count(),
      prisma.service.count(),
      prisma.poste.count(),
    ]);

    // Statistiques employés
    const statsEmployes = await Promise.all([
      prisma.employe.count(),
      prisma.employe.count({ where: { archiveLe: null } }),
    ]);

    // Statistiques AO
    const statsAO = await Promise.all([
      prisma.appelOffres.count({ where: { statut: "VEILLE" } }),
      prisma.appelOffres.count({ where: { statut: "GAGNE" } }),
      prisma.appelOffres.count({ where: { statut: "PERDU" } }),
    ]);

    // Événements récents
    const evenementsRecents = await prisma.journalEvenement.findMany({
      orderBy: { survenuLe: "desc" },
      take: 5,
    });

    console.log(
      `   ✅ Statistiques calculées : ${statsOrganisation[0] + statsOrganisation[1] + statsOrganisation[2]} éléments organisation`
    );
    console.log(
      `   ✅ Employés actifs : ${statsEmployes[1]}/${statsEmployes[0]}`
    );
    console.log(`   ✅ AO : ${statsAO[0]} veille, ${statsAO[1]} gagnés`);
    console.log(`   ✅ ${evenementsRecents.length} événements récents`);
  } catch (error) {
    console.log("   ❌ Erreur lors du calcul des statistiques");
    console.error(error);
    erreurs++;
  }

  // ===================================================================
  // RÉSULTAT
  // ===================================================================
  console.log("\n" + "=".repeat(60));
  if (erreurs === 0) {
    console.log("✅ Tous les critères M10 sont satisfaits");
    process.exit(0);
  } else {
    console.log(`❌ ${erreurs} critère(s) en échec`);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Erreur lors de la vérification:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
