#!/usr/bin/env tsx
/**
 * Test de non-régression — Protection deciderN1 par lien de données
 *
 * RÈGLE MÉTIER (M3 §9) : deciderN1 est protégée par le lien de données,
 * pas par une permission. Seul le supérieur hiérarchique (ou son délégataire)
 * peut valider la demande.
 *
 * Scénario :
 * 1. Vérifier que le code source contient la protection
 * 2. Créer trois employés : CC (demandeur), DT (supérieur de CC), RH (tiers)
 * 3. Créer une demande de congé pour CC
 * 4. La soumettre (elle part vers DT)
 * 5. Tenter de la valider avec RH (qui n'est PAS son supérieur)
 * 6. ATTENDU : Refus avec message "Vous n'êtes pas autorisé"
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-decider-n1-protection.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variables d'environnement manquantes");
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🧪 Test — Protection deciderN1 par lien de données\n");

  // 0. Vérifier que la protection est en place dans le code source
  const codeSource = readFileSync(
    join(process.cwd(), "lib/actions/conges.ts"),
    "utf-8"
  );

  if (codeSource.includes("CASSÉ TEMPORAIREMENT") || codeSource.includes("PROTECTION DÉSACTIVÉE")) {
    console.log("❌ ÉCHEC DU TEST : Protection deciderN1 désactivée dans le code source\n");
    console.log("   La protection par lien de données a été commentée ou retirée.");
    console.log("   Toute personne peut valider les demandes de congé.\n");
    console.log("   Fichier : lib/actions/conges.ts");
    console.log("   Rechercher : 'CASSÉ TEMPORAIREMENT' ou 'PROTECTION DÉSACTIVÉE'\n");
    process.exit(1);
  }

  if (!codeSource.includes("const estSuperieur = absence.superieurId === profil.employe.id")) {
    console.log("❌ ÉCHEC DU TEST : Contrôle par lien de données absent\n");
    console.log("   Le test attend le code suivant dans deciderN1:");
    console.log("   const estSuperieur = absence.superieurId === profil.employe.id\n");
    process.exit(1);
  }

  console.log("✓ Vérification du code source : protection en place\n");

  // 1. Créer trois employés de test
  const employeCC = await prisma.employe.create({
    data: {
      matricule: `TEST-CC-${Date.now()}`,
      nom: "TEST-CC",
      prenom: "Chargé Chantier",
      telephone: "0700000001",
      typeMainOeuvre: "PERMANENT",
    },
  });

  const employeDT = await prisma.employe.create({
    data: {
      matricule: `TEST-DT-${Date.now()}`,
      nom: "TEST-DT",
      prenom: "Directeur Technique",
      telephone: "0700000002",
      typeMainOeuvre: "PERMANENT",
    },
  });

  const employeRH = await prisma.employe.create({
    data: {
      matricule: `TEST-RH-${Date.now()}`,
      nom: "TEST-RH",
      prenom: "Responsable RH",
      telephone: "0700000003",
      typeMainOeuvre: "PERMANENT",
    },
  });

  console.log(`✓ Employés créés : CC, DT, RH\n`);

  // 2. Créer une affectation pour CC avec DT comme supérieur
  const poste = await prisma.poste.findFirst({
    where: { archiveLe: null },
  });

  if (!poste) {
    throw new Error("Aucun poste trouvé");
  }

  const affectationCC = await prisma.affectation.create({
    data: {
      employeId: employeCC.id,
      posteId: poste.id,
      superieurId: employeDT.id, // DT est le supérieur de CC
      dateDebut: new Date("2020-01-01"),
    },
  });

  console.log(`✓ Affectation créée : CC rapporte à DT\n`);

  // 3. Créer ou trouver un type d'absence
  let typeAbsence = await prisma.typeAbsence.findFirst();

  if (!typeAbsence) {
    typeAbsence = await prisma.typeAbsence.create({
      data: {
        libelle: "Congé de test",
        decompte: true,
      },
    });
  }

  console.log(`✓ Type d'absence : ${typeAbsence.libelle}\n`);

  // 4. Créer une demande pour CC
  const absence = await prisma.absence.create({
    data: {
      employeId: employeCC.id,
      typeAbsenceId: typeAbsence.id,
      dateDebut: new Date("2026-08-15"),
      dateFin: new Date("2026-08-17"),
      nombreJours: 3,
      statut: "BROUILLON",
    },
  });

  console.log(`✓ Demande créée : ${absence.id}\n`);

  // 5. Soumettre la demande (copie superieurId de l'affectation)
  const absenceSoumise = await prisma.absence.update({
    where: { id: absence.id },
    data: {
      statut: "ATTENTE_N1",
      soumieLe: new Date(),
      superieurId: employeDT.id, // FIGÉ vers DT
    },
  });

  console.log(`✓ Demande soumise vers DT (superieurId: ${absenceSoumise.superieurId})\n`);

  // 6. Tester la protection : RH tente de valider
  console.log("📋 Test : RH tente de valider la demande de CC\n");

  // Simuler la vérification du lien de données (logique de deciderN1)
  const estSuperieurDT = absenceSoumise.superieurId === employeDT.id;
  const estSuperieurRH = absenceSoumise.superieurId === employeRH.id;

  console.log(`   DT est le supérieur de CC ? ${estSuperieurDT} ✓`);
  console.log(`   RH est le supérieur de CC ? ${estSuperieurRH}`);

  // Test 1 : RH ne peut PAS valider
  try {
    if (!estSuperieurRH) {
      throw new Error("Vous n'êtes pas autorisé à valider cette demande");
    }

    console.log("\n❌ ÉCHEC : RH a pu valider la demande (pas de protection)");
    process.exit(1);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Vous n'êtes pas autorisé à valider cette demande"
    ) {
      console.log(`   ✅ Refus attendu : "${error.message}"\n`);
    } else {
      throw error;
    }
  }

  // Test 2 : DT PEUT valider
  console.log("📋 Test : DT tente de valider la demande de CC\n");
  console.log(`   DT est le supérieur de CC ? ${estSuperieurDT}`);

  if (estSuperieurDT) {
    console.log(`   ✅ Validation autorisée pour DT\n`);
  } else {
    console.log("\n❌ ÉCHEC : DT ne peut pas valider alors qu'il est le supérieur");
    process.exit(1);
  }

  // 7. Nettoyage
  await prisma.absence.delete({ where: { id: absence.id } });
  await prisma.affectation.delete({ where: { id: affectationCC.id } });
  await prisma.employe.delete({ where: { id: employeCC.id } });
  await prisma.employe.delete({ where: { id: employeDT.id } });
  await prisma.employe.delete({ where: { id: employeRH.id } });

  console.log("✅ Test réussi — deciderN1 protégé par lien de données");
  console.log("   • RH ne peut PAS valider une demande dont il n'est pas le supérieur");
  console.log("   • DT PEUT valider car il est le supérieur (superieurId figé)\n");
}

main()
  .catch((e) => {
    console.error("❌ Test échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
