/**
 * Script de vérification M4 — Rémunération
 *
 * Vérifie les critères de recette du module M4 (version simplifiée) :
 * - Modèles Prisma créés (GrilleSalariale, EchelonGrille)
 * - DerogationSalariale existe (créé dans M2)
 * - Server actions présentes
 * - Pages créées
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
  console.log("\n🔍 Vérification M4 — Rémunération\n");

  let erreurs = 0;

  // ===================================================================
  // 1. Vérifier que les modèles M4 existent
  // ===================================================================
  console.log("1️⃣  Vérification des modèles Prisma M4...");

  try {
    const [countGrilles, countEchelons, countDerogations] = await Promise.all([
      prisma.grilleSalariale.count(),
      prisma.echelonGrille.count(),
      prisma.derogationSalariale.count(),
    ]);

    console.log(`   ✅ Modèle GrilleSalariale : ${countGrilles} enregistrement(s)`);
    console.log(`   ✅ Modèle EchelonGrille : ${countEchelons} enregistrement(s)`);
    console.log(
      `   ✅ Modèle DerogationSalariale (M2) : ${countDerogations} enregistrement(s)`
    );
  } catch (error) {
    console.log(`   ❌ Erreur lors de la vérification des modèles M4`);
    console.error(error);
    erreurs++;
  }

  // ===================================================================
  // 2. Vérifier que les pages M4 existent
  // ===================================================================
  console.log("\n2️⃣  Vérification des pages M4...");

  const fs = await import("fs");
  const path = await import("path");

  const pagesM4 = [
    "app/(app)/remuneration/grille/page.tsx",
    "app/(app)/remuneration/derogations/page.tsx",
  ];

  let pagesManquantes = 0;
  for (const page of pagesM4) {
    const cheminComplet = path.join(process.cwd(), page);
    if (!fs.existsSync(cheminComplet)) {
      console.log(`   ❌ Page manquante : ${page}`);
      pagesManquantes++;
    }
  }

  if (pagesManquantes === 0) {
    console.log(`   ✅ ${pagesM4.length} pages M4 présentes`);
  } else {
    erreurs++;
  }

  // ===================================================================
  // 3. Vérifier que les server actions M4 existent
  // ===================================================================
  console.log("\n3️⃣  Vérification des server actions M4...");

  const actionsM4 = path.join(process.cwd(), "lib/actions/remuneration.ts");
  if (!fs.existsSync(actionsM4)) {
    console.log("   ❌ Fichier lib/actions/remuneration.ts manquant");
    erreurs++;
  } else {
    const contenu = fs.readFileSync(actionsM4, "utf-8");
    const actionsCles = [
      "creerBrouillonGrille",
      "publierGrille",
      "listerGrilles",
      "obtenirGrillePubliee",
      "supprimerBrouillonGrille",
      "verifierConformiteGrille",
      "listerDerogations",
      "statuerDerogation",
    ];

    let actionsManquantes = 0;
    for (const action of actionsCles) {
      if (
        !contenu.includes(`export const ${action}`) &&
        !contenu.includes(`export async function ${action}`)
      ) {
        console.log(`   ❌ Action manquante : ${action}`);
        actionsManquantes++;
      }
    }

    if (actionsManquantes === 0) {
      console.log(`   ✅ ${actionsCles.length} server actions M4 présentes`);
    } else {
      erreurs++;
    }
  }

  // ===================================================================
  // RÉSULTAT
  // ===================================================================
  console.log("\n" + "=".repeat(60));
  if (erreurs === 0) {
    console.log("✅ Tous les critères M4 sont satisfaits (version simplifiée)");
    console.log(
      "\n📌 Note : Les valeurs de fourchettes sont des hypothèses par défaut."
    );
    console.log(
      "   La DFC peut créer et publier des versions de grille via l'interface.\\n"
    );
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
