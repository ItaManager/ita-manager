#!/usr/bin/env tsx
/**
 * Test de non-régression — Décision A-08 bis
 *
 * Vérifie que la chaîne hiérarchique et la chaîne fonctionnelle sont bien
 * distinctes et que le code ne les confond jamais.
 *
 * Scénario :
 * - Chef Chantier affecté au projet X
 * - Supérieur hiérarchique : Directeur Technique (congés)
 * - Référent fonctionnel : Conducteur de Travaux du projet X (relevés)
 *
 * ATTENDU : Les deux chaînes retournent des employés différents.
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-chaines-distinctes.ts
 */

import { PrismaClient } from "@prisma/client";
import {
  obtenirSuperieurHierarchique,
  obtenirReferentFonctionnel,
} from "../lib/chaines";

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DIRECT_URL ou DATABASE_URL manquant dans .env.dev");
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log("🧪 Test — Chaînes hiérarchique et fonctionnelle distinctes\n");

  const timestamp = Date.now();

  // Créer un employé Directeur Technique
  const dt = await prisma.employe.create({
    data: {
      matricule: `DT-TEST-${timestamp}`,
      nom: "Dupont",
      prenom: "Jean",
      typeMainOeuvre: "PERMANENT",
      telephone: "+225 00 00 00 00",
    },
  });

  // Créer un employé Conducteur de Travaux
  const ct = await prisma.employe.create({
    data: {
      matricule: `CT-TEST-${timestamp}`,
      nom: "Martin",
      prenom: "Pierre",
      typeMainOeuvre: "PERMANENT",
      telephone: "+225 00 00 00 01",
    },
  });

  // Créer un employé Chef de Chantier
  const cc = await prisma.employe.create({
    data: {
      matricule: `CC-TEST-${timestamp}`,
      nom: "Durand",
      prenom: "Paul",
      typeMainOeuvre: "PERMANENT",
      telephone: "+225 00 00 00 02",
    },
  });

  // Créer un service et un poste temporaires pour le test
  const direction = await prisma.direction.findFirstOrThrow();
  const service = await prisma.service.findFirstOrThrow();

  const posteTest = await prisma.poste.create({
    data: {
      code: `TEST-CC-${timestamp}`,
      libelle: "Chef de Chantier (Test)",
      directionId: direction.id,
      serviceId: service.id,
      niveau: "OPERATIONNEL",
    },
  });

  // Affectation hiérarchique : Chef Chantier → Directeur Technique
  await prisma.affectation.create({
    data: {
      employeId: cc.id,
      posteId: posteTest.id,
      superieurId: dt.id, // Chaîne hiérarchique
      dateDebut: new Date(),
    },
  });

  // Créer un projet
  const projet = await prisma.projet.create({
    data: {
      code: "CH-2026-TEST",
      nom: "Chantier Test",
      statut: "EN_COURS",
      creePar: "00000000-0000-0000-0000-000000000000",
    },
  });

  // Affectation fonctionnelle : Conducteur de Travaux est le référent
  await prisma.affectationChantier.create({
    data: {
      projetId: projet.id,
      employeId: ct.id,
      roleFonctionnel: "CONDUCTEUR", // Chaîne fonctionnelle
      dateDebut: new Date(),
      creePar: "00000000-0000-0000-0000-000000000000",
    },
  });

  // Affectation fonctionnelle : Chef Chantier affecté au projet
  await prisma.affectationChantier.create({
    data: {
      projetId: projet.id,
      employeId: cc.id,
      roleFonctionnel: "CHEF_CHANTIER",
      dateDebut: new Date(),
      creePar: "00000000-0000-0000-0000-000000000000",
    },
  });

  // TEST 1 : Supérieur hiérarchique
  console.log("📋 Test 1 : Supérieur hiérarchique du Chef de Chantier");
  const superieurHierarchique = await obtenirSuperieurHierarchique(cc.id);
  console.log(`   Attendu : ${dt.id} (Directeur Technique)`);
  console.log(`   Obtenu  : ${superieurHierarchique}`);

  if (superieurHierarchique !== dt.id) {
    throw new Error(
      "❌ ÉCHEC : Le supérieur hiérarchique devrait être le Directeur Technique"
    );
  }
  console.log("   ✅ OK\n");

  // TEST 2 : Référent fonctionnel
  console.log("📋 Test 2 : Référent fonctionnel du Chef de Chantier sur le projet");
  const referentFonctionnel = await obtenirReferentFonctionnel(cc.id, projet.id);
  console.log(`   Attendu : ${ct.id} (Conducteur de Travaux)`);
  console.log(`   Obtenu  : ${referentFonctionnel}`);

  if (referentFonctionnel !== ct.id) {
    throw new Error(
      "❌ ÉCHEC : Le référent fonctionnel devrait être le Conducteur de Travaux"
    );
  }
  console.log("   ✅ OK\n");

  // TEST 3 : Les deux sont différents
  console.log("📋 Test 3 : Les deux chaînes sont distinctes");
  console.log(`   Supérieur hiérarchique : ${superieurHierarchique}`);
  console.log(`   Référent fonctionnel   : ${referentFonctionnel}`);

  if (superieurHierarchique === referentFonctionnel) {
    throw new Error(
      "❌ ÉCHEC : Les deux chaînes ne doivent PAS retourner la même personne"
    );
  }
  console.log("   ✅ OK — Les deux chaînes sont bien distinctes\n");

  // Nettoyage
  await prisma.affectationChantier.deleteMany({ where: { projetId: projet.id } });
  await prisma.projet.delete({ where: { id: projet.id } });
  await prisma.affectation.deleteMany({ where: { employeId: cc.id } });
  await prisma.poste.delete({ where: { id: posteTest.id } });
  await prisma.employe.deleteMany({
    where: {
      id: { in: [dt.id, ct.id, cc.id] },
    },
  });

  console.log("✅ Test réussi — Décision A-08 bis respectée");
  console.log("   La chaîne hiérarchique et la chaîne fonctionnelle sont distinctes.\n");
}

main()
  .catch((e) => {
    console.error("❌ Test échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
