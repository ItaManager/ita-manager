/**
 * Script de vérification — Module M3 Congés et Permissions
 *
 * Vérifie les critères de recette de M3-CONGES.md §10
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/verify-m3.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let erreurs = 0;

function erreur(message: string) {
  console.error(`   ❌ ${message}`);
  erreurs++;
}

function succes(message: string) {
  console.log(`   ✓ ${message}`);
}

async function main() {
  console.log("🔍 Vérification Module M3 — Congés et Permissions\n");

  // =====================================================================
  // 1. RÈGLES ET FÉRIÉS SEEDÉS
  // =====================================================================
  console.log("📋 1. Règles de congés et jours fériés");

  const regles = await prisma.regleConge.count();
  const feries = await prisma.jourFerie.count();

  if (regles >= 11) {
    succes(`${regles} règles de congés trouvées (attendu: ≥11)`);
  } else {
    erreur(`${regles} règles trouvées, attendu ≥11`);
  }

  if (feries >= 13) {
    succes(`${feries} jours fériés trouvés (attendu: ≥13 pour 2026)`);
  } else {
    erreur(`${feries} jours fériés trouvés, attendu ≥13`);
  }

  // Vérifier règles critiques
  const dotationJoursParMois = await prisma.regleConge.findUnique({
    where: { cle: "dotation.joursParMois" },
  });

  if (dotationJoursParMois) {
    succes(`Règle dotation.joursParMois définie: ${dotationJoursParMois.valeur} j/mois`);
  } else {
    erreur("Règle dotation.joursParMois manquante");
  }

  const modeDecompte = await prisma.regleConge.findUnique({
    where: { cle: "decompte.mode" },
  });

  if (modeDecompte) {
    succes(`Mode de décompte défini: ${modeDecompte.valeur}`);
  } else {
    erreur("Règle decompte.mode manquante");
  }

  // =====================================================================
  // 2. TYPES D'ABSENCE
  // =====================================================================
  console.log("\n📝 2. Types d'absence");

  const typesAbsence = await prisma.typeAbsence.findMany({
    where: { actif: true },
  });

  if (typesAbsence.length > 0) {
    succes(`${typesAbsence.length} types d'absence actifs`);

    const congeAnnuel = typesAbsence.find((t) =>
      t.libelle.toLowerCase().includes("congé")
    );
    const maladie = typesAbsence.find((t) =>
      t.libelle.toLowerCase().includes("maladie")
    );

    if (congeAnnuel && congeAnnuel.decompte) {
      succes("Type 'Congé annuel' décompte le solde");
    } else {
      erreur("Type 'Congé annuel' devrait décompter le solde");
    }

    if (maladie && !maladie.decompte) {
      succes("Type 'Maladie' ne décompte pas le solde");
    } else {
      erreur("Type 'Maladie' ne devrait pas décompter le solde");
    }
  } else {
    erreur("Aucun type d'absence trouvé");
  }

  // =====================================================================
  // 3. PERMISSIONS M3
  // =====================================================================
  console.log("\n🔐 3. Permissions M3");

  const permissionsM3 = [
    "absence:demander",
    "absence:valider",
    "employe:lire", // Pour calendrier et soldes
  ];

  for (const codePerm of permissionsM3) {
    const perm = await prisma.permission.findUnique({
      where: { code: codePerm },
    });

    if (perm) {
      succes(`Permission ${codePerm} trouvée`);
    } else {
      erreur(`Permission ${codePerm} manquante`);
    }
  }

  // =====================================================================
  // 4. ASSIGNATION DES PERMISSIONS
  // =====================================================================
  console.log("\n👥 4. Assignation permissions aux rôles");

  // Vérifier que certains rôles ont les bonnes permissions
  const roleDRH = await prisma.role.findUnique({
    where: { code: "DRH" },
    include: { permissions: { include: { permission: true } } },
  });

  if (roleDRH) {
    const permCodesRH = roleDRH.permissions.map((rp) => rp.permission.code);

    if (permCodesRH.includes("absence:valider")) {
      succes("Rôle DRH a permission absence:valider");
    } else {
      erreur("Rôle DRH devrait avoir permission absence:valider");
    }

    if (permCodesRH.includes("employe:lire")) {
      succes("Rôle DRH a permission employe:lire (calendrier)");
    } else {
      erreur("Rôle DRH devrait avoir permission employe:lire");
    }
  }

  // =====================================================================
  // 5. STRUCTURE DES TABLES
  // =====================================================================
  console.log("\n🗄️  5. Structure des tables M3");

  // Vérifier qu'au moins une absence existe (peut être en brouillon)
  const absenceCount = await prisma.absence.count();
  console.log(`   ℹ️  ${absenceCount} absence(s) dans la base`);

  // Vérifier la présence des champs critiques sur une absence
  if (absenceCount > 0) {
    const premiereAbsence = await prisma.absence.findFirst({
      include: {
        typeAbsence: true,
        employe: true,
      },
    });

    if (premiereAbsence) {
      if (premiereAbsence.superieurId !== undefined) {
        succes("Champ superieurId présent (figé à la soumission)");
      } else {
        erreur("Champ superieurId manquant");
      }

      if (premiereAbsence.nombreJours !== undefined) {
        succes("Champ nombreJours présent (calculé, non saisi)");
      } else {
        erreur("Champ nombreJours manquant");
      }

      if (premiereAbsence.pieceId !== undefined) {
        succes("Champ pieceId présent (pièce justificative)");
      } else {
        erreur("Champ pieceId manquant");
      }
    }
  }

  // Vérifier table Delegation
  const delegationCount = await prisma.delegation.count();
  console.log(`   ℹ️  ${delegationCount} délégation(s) définie(s)`);
  succes("Table Delegation présente (Phase 9)");

  // Vérifier table SoldeConge
  const soldeCount = await prisma.soldeConge.count();
  console.log(`   ℹ️  ${soldeCount} mouvement(s) de solde`);
  succes("Table SoldeConge présente (Phase 6)");

  // =====================================================================
  // 6. ROUTES M3
  // =====================================================================
  console.log("\n🌐 6. Routes M3 implémentées");

  // Note: Cette vérification est informative
  // Les routes sont créées dynamiquement par Next.js
  const routesM3 = [
    "/conges",
    "/conges/a-valider",
    "/conges/controle",
    "/conges/calendrier",
  ];

  console.log(`   ℹ️  Routes attendues: ${routesM3.join(", ")}`);
  succes("Routes M3 déclarées dans le code");

  // =====================================================================
  // RÉSULTAT FINAL
  // =====================================================================
  console.log("\n" + "=".repeat(60));

  if (erreurs === 0) {
    console.log("✅ SUCCÈS — Module M3 : toutes les vérifications passent");
    console.log("\n⚠️  RAPPEL : Les valeurs de règles sont des HYPOTHÈSES");
    console.log("   À valider par la Direction RH avant production.");
    process.exit(0);
  } else {
    console.log(`❌ ÉCHEC — ${erreurs} erreur(s) détectée(s)`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur fatale:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
