/**
 * M17 — Test du critère de recette CRITIQUE : montantDuJour()
 *
 * Vérifie que le calcul lit BIEN la compétence ET le taux
 * à la date du jour pointé, pas à la date du calcul.
 *
 * Scénario : TRAORÉ Moussa
 *   - Manœuvre du 01/01/2025 au 31/05/2025
 *   - Maçon depuis le 01/06/2025
 *
 * Taux Manœuvre :
 *   - 4 500 F depuis 01/01/2025
 *   - 5 000 F depuis 01/01/2026
 *
 * Taux Maçon :
 *   - 7 000 F depuis 01/03/2025
 *   - 7 500 F depuis 01/01/2026
 *
 * Tests :
 *   1. montantDuJour(moussa, 15/03/2025) → 4 500 F
 *      manœuvre à cette date, taux de janvier 2025
 *
 *   2. montantDuJour(moussa, 15/06/2025) → 7 000 F
 *      maçon depuis juin, taux de mars 2025
 *
 *   3. montantDuJour(moussa, 15/03/2026) → 7 500 F
 *      maçon, taux de janvier 2026
 *
 *   4. montantDuJour(moussa, 15/12/2024) → null
 *      aucune affectation à cette date
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";
import { montantDuJour } from "../lib/actions/competences";

async function main() {
  console.log("🧪 Test du critère de recette CRITIQUE : montantDuJour()\\n");

  // 1. Créer les compétences
  console.log("1️⃣  Création des compétences...");

  const manoeuvre = await prisma.competence.create({
    data: {
      libelle: "Manœuvre",
      libelleNormalise: "manoeuvre",
      categorie: "BASE",
      actif: true,
      creeParId: "test-system",
    },
  });

  const macon = await prisma.competence.create({
    data: {
      libelle: "Maçon",
      libelleNormalise: "macon",
      categorie: "QUALIFIE",
      actif: true,
      creeParId: "test-system",
    },
  });

  console.log(`   ✓ Manœuvre créé (${manoeuvre.id})`);
  console.log(`   ✓ Maçon créé (${macon.id})`);

  // 2. Créer les taux
  console.log("\\n2️⃣  Création des taux historisés...");

  // Manœuvre : 4 500 F depuis 01/01/2025, 5 000 F depuis 01/01/2026
  await prisma.tauxJournalier.createMany({
    data: [
      {
        competenceId: manoeuvre.id,
        montant: 4500,
        dateEffet: new Date("2025-01-01"),
        definiParId: "test-system",
      },
      {
        competenceId: manoeuvre.id,
        montant: 5000,
        dateEffet: new Date("2026-01-01"),
        definiParId: "test-system",
      },
    ],
  });

  // Maçon : 7 000 F depuis 01/03/2025, 7 500 F depuis 01/01/2026
  await prisma.tauxJournalier.createMany({
    data: [
      {
        competenceId: macon.id,
        montant: 7000,
        dateEffet: new Date("2025-03-01"),
        definiParId: "test-system",
      },
      {
        competenceId: macon.id,
        montant: 7500,
        dateEffet: new Date("2026-01-01"),
        definiParId: "test-system",
      },
    ],
  });

  console.log("   ✓ Manœuvre : 4 500 F (01/01/2025), 5 000 F (01/01/2026)");
  console.log("   ✓ Maçon : 7 000 F (01/03/2025), 7 500 F (01/01/2026)");

  // 3. Créer l'employé TRAORÉ Moussa
  console.log("\\n3️⃣  Création de TRAORÉ Moussa...");

  const moussa = await prisma.employe.create({
    data: {
      matricule: "ITA-TEST-MOUSSA",
      typeMainOeuvre: "JOURNALIER",
      nom: "TRAORÉ",
      prenom: "Moussa",
      telephone: "+225 00 00 00 00",
    },
  });

  console.log(`   ✓ TRAORÉ Moussa créé (${moussa.id})`);

  // 4. Créer les affectations
  console.log("\\n4️⃣  Affectations de compétences...");

  // Manœuvre du 01/01/2025 au 31/05/2025
  await prisma.affectationCompetence.create({
    data: {
      employeId: moussa.id,
      competenceId: manoeuvre.id,
      dateEffet: new Date("2025-01-01"),
      dateFin: new Date("2025-05-31"),
      assigneeParId: "test-system",
    },
  });

  // Maçon depuis le 01/06/2025 (pas de fin)
  await prisma.affectationCompetence.create({
    data: {
      employeId: moussa.id,
      competenceId: macon.id,
      dateEffet: new Date("2025-06-01"),
      assigneeParId: "test-system",
    },
  });

  console.log("   ✓ Manœuvre : 01/01/2025 → 31/05/2025");
  console.log("   ✓ Maçon : depuis 01/06/2025");

  // 5. Tests
  console.log("\\n5️⃣  Tests montantDuJour()...\\n");

  let testsPasses = 0;
  let testsEchoues = 0;

  // Test 1 : 15/03/2025 → 4 500 F (manœuvre, taux de janvier 2025)
  const test1 = await montantDuJour(moussa.id, new Date("2025-03-15"));
  if (test1 === 4500) {
    console.log("   ✅ Test 1 : 15/03/2025 → 4 500 F (manœuvre, taux jan 2025)");
    testsPasses++;
  } else {
    console.log(`   ❌ Test 1 ÉCHOUÉ : attendu 4 500, reçu ${test1}`);
    testsEchoues++;
  }

  // Test 2 : 15/06/2025 → 7 000 F (maçon depuis juin, taux de mars 2025)
  const test2 = await montantDuJour(moussa.id, new Date("2025-06-15"));
  if (test2 === 7000) {
    console.log("   ✅ Test 2 : 15/06/2025 → 7 000 F (maçon, taux mars 2025)");
    testsPasses++;
  } else {
    console.log(`   ❌ Test 2 ÉCHOUÉ : attendu 7 000, reçu ${test2}`);
    testsEchoues++;
  }

  // Test 3 : 15/03/2026 → 7 500 F (maçon, taux de janvier 2026)
  const test3 = await montantDuJour(moussa.id, new Date("2026-03-15"));
  if (test3 === 7500) {
    console.log("   ✅ Test 3 : 15/03/2026 → 7 500 F (maçon, taux jan 2026)");
    testsPasses++;
  } else {
    console.log(`   ❌ Test 3 ÉCHOUÉ : attendu 7 500, reçu ${test3}`);
    testsEchoues++;
  }

  // Test 4 : 15/12/2024 → null (aucune affectation)
  const test4 = await montantDuJour(moussa.id, new Date("2024-12-15"));
  if (test4 === null) {
    console.log("   ✅ Test 4 : 15/12/2024 → null (aucune affectation)");
    testsPasses++;
  } else {
    console.log(`   ❌ Test 4 ÉCHOUÉ : attendu null, reçu ${test4}`);
    testsEchoues++;
  }

  // Résultat
  console.log(`\\n📊 Résultat : ${testsPasses}/4 tests passés`);

  // Nettoyage
  console.log("\\n🧹 Nettoyage...");
  await prisma.affectationCompetence.deleteMany({
    where: { employeId: moussa.id },
  });
  await prisma.employe.delete({ where: { id: moussa.id } });
  await prisma.tauxJournalier.deleteMany({
    where: { competenceId: { in: [manoeuvre.id, macon.id] } },
  });
  await prisma.competence.deleteMany({
    where: { id: { in: [manoeuvre.id, macon.id] } },
  });
  console.log("   ✓ Données de test supprimées");

  if (testsEchoues > 0) {
    console.log("\\n❌ ÉCHEC : montantDuJour() ne lit pas à la bonne date\\n");
    process.exit(1);
  }

  console.log("\\n✅ SUCCÈS : montantDuJour() fonctionne correctement\\n");
  process.exit(0);
}

main()
  .catch((e) => {
    console.error("\\n💥 Erreur fatale :", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
