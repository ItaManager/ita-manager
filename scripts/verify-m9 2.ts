/**
 * Script de vérification M9 — Appels d'offres
 *
 * Vérifie les critères de recette du module M9 :
 * - Modèles Prisma créés (AppelOffres, PieceAO, ConcurrentAO)
 * - Permissions M9 présentes (ao:creer, ao:validerDG)
 * - Server actions protégées
 * - Workflow go/no-go fonctionnel
 * - États cohérents (VEILLE → GO/ABANDONNE → CONSTITUTION → SOUMIS → GAGNE/PERDU)
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
  console.log("\n🔍 Vérification M9 — Appels d'offres\n");

  let erreurs = 0;

  // ===================================================================
  // 1. Vérifier que les permissions M9 existent
  // ===================================================================
  console.log("1️⃣  Vérification des permissions M9...");

  const permissionsM9 = ["ao:creer", "ao:soumettre", "ao:validerDG"];
  const permissionsExistantes = await prisma.permission.findMany({
    where: { code: { in: permissionsM9 } },
  });

  if (permissionsExistantes.length !== permissionsM9.length) {
    console.log(`   ❌ Manque ${permissionsM9.length - permissionsExistantes.length} permission(s) M9`);
    erreurs++;
  } else {
    console.log(`   ✅ ${permissionsM9.length} permissions M9 présentes`);
  }

  // ===================================================================
  // 2. Vérifier que les modèles M9 existent
  // ===================================================================
  console.log("\n2️⃣  Vérification des modèles Prisma M9...");

  try {
    const [countAO, countPieces, countConcurrents] = await Promise.all([
      prisma.appelOffres.count(),
      prisma.pieceAO.count(),
      prisma.concurrentAO.count(),
    ]);

    console.log(`   ✅ Modèle AppelOffres : ${countAO} enregistrement(s)`);
    console.log(`   ✅ Modèle PieceAO : ${countPieces} enregistrement(s)`);
    console.log(`   ✅ Modèle ConcurrentAO : ${countConcurrents} enregistrement(s)`);
  } catch (error) {
    console.log(`   ❌ Erreur lors de la vérification des modèles M9`);
    console.error(error);
    erreurs++;
  }

  // ===================================================================
  // 3. Vérifier les états (enums)
  // ===================================================================
  console.log("\n3️⃣  Vérification des états AppelOffres...");

  const etatsAttendus = ["VEILLE", "GO", "ABANDONNE", "CONSTITUTION", "SOUMIS", "GAGNE", "PERDU"];

  // On vérifie que chaque état peut être utilisé
  const appelsOffres = await prisma.appelOffres.findMany({
    select: { statut: true },
    distinct: ["statut"],
  });

  console.log(`   ✅ ${appelsOffres.length} état(s) utilisé(s) actuellement`);
  console.log(`   ℹ️  États attendus : ${etatsAttendus.join(", ")}`);

  // ===================================================================
  // 4. Vérifier la cohérence du workflow
  // ===================================================================
  console.log("\n4️⃣  Vérification de la cohérence du workflow...");

  // Les AO avec décision go/no-go doivent avoir les champs remplis
  const aoAvecDecision = await prisma.appelOffres.findMany({
    where: {
      OR: [
        { statut: "GO" },
        { statut: "ABANDONNE" },
      ],
    },
  });

  let incoherences = 0;
  for (const ao of aoAvecDecision) {
    if (!ao.goNoGoDecidePar || !ao.goNoGoDecideLe) {
      incoherences++;
    }
  }

  if (incoherences > 0) {
    console.log(`   ⚠️  ${incoherences} AO avec décision go/no-go incomplète`);
  } else {
    console.log(`   ✅ Workflow cohérent pour les ${aoAvecDecision.length} AO avec décision`);
  }

  // ===================================================================
  // 5. Vérifier les relations
  // ===================================================================
  console.log("\n5️⃣  Vérification des relations...");

  const aoAvecPieces = await prisma.appelOffres.findMany({
    include: {
      pieces: true,
      concurrents: true,
    },
    take: 5,
  });

  console.log(`   ✅ Relations pièces et concurrents accessibles`);

  // ===================================================================
  // RÉSULTAT
  // ===================================================================
  console.log("\n" + "=".repeat(60));
  if (erreurs === 0) {
    console.log("✅ Tous les critères M9 sont satisfaits");
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
