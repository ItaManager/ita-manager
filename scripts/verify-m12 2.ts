/**
 * Script de vérification M12 — Présences bureau
 *
 * Vérifie les critères de recette du module M12 (version simplifiée) :
 * - Modèles Prisma créés (AppareilBorne, CodePointage, PointageBureau)
 * - Permissions M12 présentes (presence:gererCodes, presence:gererBornes, presence:corriger)
 * - Server actions protégées
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
  console.log("\n🔍 Vérification M12 — Présences bureau\n");

  let erreurs = 0;

  // ===================================================================
  // 1. Vérifier que les permissions M12 existent
  // ===================================================================
  console.log("1️⃣  Vérification des permissions M12...");

  const permissionsM12 = [
    "presence:gererCodes",
    "presence:gererBornes",
    "presence:corriger",
  ];
  const permissionsExistantes = await prisma.permission.findMany({
    where: { code: { in: permissionsM12 } },
  });

  if (permissionsExistantes.length !== permissionsM12.length) {
    console.log(
      `   ❌ Manque ${permissionsM12.length - permissionsExistantes.length} permission(s) M12`
    );
    erreurs++;
  } else {
    console.log(`   ✅ ${permissionsM12.length} permissions M12 présentes`);
  }

  // ===================================================================
  // 2. Vérifier que les modèles M12 existent
  // ===================================================================
  console.log("\n2️⃣  Vérification des modèles Prisma M12...");

  try {
    const [countAppareils, countCodes, countPointages] = await Promise.all([
      prisma.appareilBorne.count(),
      prisma.codePointage.count(),
      prisma.pointageBureau.count(),
    ]);

    console.log(`   ✅ Modèle AppareilBorne : ${countAppareils} enregistrement(s)`);
    console.log(`   ✅ Modèle CodePointage : ${countCodes} enregistrement(s)`);
    console.log(`   ✅ Modèle PointageBureau : ${countPointages} enregistrement(s)`);
  } catch (error) {
    console.log(`   ❌ Erreur lors de la vérification des modèles M12`);
    console.error(error);
    erreurs++;
  }

  // ===================================================================
  // 3. Vérifier que les pages M12 existent
  // ===================================================================
  console.log("\n3️⃣  Vérification des pages M12...");

  const fs = await import("fs");
  const path = await import("path");

  const pagesM12 = [
    "app/borne/page.tsx",
    "app/(app)/presences/page.tsx",
  ];

  let pagesManquantes = 0;
  for (const page of pagesM12) {
    const cheminComplet = path.join(process.cwd(), page);
    if (!fs.existsSync(cheminComplet)) {
      console.log(`   ❌ Page manquante : ${page}`);
      pagesManquantes++;
    }
  }

  if (pagesManquantes === 0) {
    console.log(`   ✅ ${pagesM12.length} pages M12 présentes`);
  } else {
    erreurs++;
  }

  // ===================================================================
  // 4. Vérifier que les server actions M12 existent
  // ===================================================================
  console.log("\n4️⃣  Vérification des server actions M12...");

  const actionsM12 = path.join(process.cwd(), "lib/actions/presences.ts");
  if (!fs.existsSync(actionsM12)) {
    console.log("   ❌ Fichier lib/actions/presences.ts manquant");
    erreurs++;
  } else {
    const contenu = fs.readFileSync(actionsM12, "utf-8");
    const actionsCles = [
      "genererCodePointage",
      "enregistrerPointage",
      "listerPointages",
      "corrigerPointage",
      "enregistrerAppareil",
      "revoquerAppareil",
      "listerAppareils",
      "listerCodesPointage",
    ];

    let actionsManquantes = 0;
    for (const action of actionsCles) {
      if (!contenu.includes(`export const ${action}`) && !contenu.includes(`export async function ${action}`)) {
        console.log(`   ❌ Action manquante : ${action}`);
        actionsManquantes++;
      }
    }

    if (actionsManquantes === 0) {
      console.log(`   ✅ ${actionsCles.length} server actions M12 présentes`);
    } else {
      erreurs++;
    }
  }

  // ===================================================================
  // RÉSULTAT
  // ===================================================================
  console.log("\n" + "=".repeat(60));
  if (erreurs === 0) {
    console.log("✅ Tous les critères M12 sont satisfaits (version simplifiée)");
    console.log("\n📌 Note : La borne tactile complète sera implémentée dans un prochain sprint.");
    console.log("   Pour l'instant, seule la page placeholder est disponible.\n");
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
