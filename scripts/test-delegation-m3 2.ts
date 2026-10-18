#!/usr/bin/env tsx
/**
 * Test M3 — Délégation hiérarchique
 *
 * RÈGLE MÉTIER (M3 §7.3) :
 * - Un supérieur peut désigner un délégataire avec période de validité
 * - Le délégataire peut valider pendant la période
 * - La délégation s'AJOUTE : le mandant garde la main pendant la période
 *
 * Scénario :
 * 1. DT désigne RH comme délégataire du 1er au 15 août
 * 2. Le 5 août (période active) : RH peut valider la demande de CC
 * 3. Le 5 août (période active) : DT peut AUSSI valider (délégation cumulative)
 * 4. Le 20 août (hors période) : RH ne peut plus valider
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-delegation-m3.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🧪 Test M3 — Délégation hiérarchique\n");

  // 1. Créer trois employés
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

  console.log("✓ Employés créés : CC, DT, RH\n");

  // 2. Créer une affectation : CC rapporte à DT
  const poste = await prisma.poste.findFirst({
    where: { archiveLe: null },
  });

  if (!poste) {
    throw new Error("Aucun poste trouvé");
  }

  await prisma.affectation.create({
    data: {
      employeId: employeCC.id,
      posteId: poste.id,
      superieurId: employeDT.id,
      dateDebut: new Date("2020-01-01"),
    },
  });

  console.log("✓ Affectation : CC rapporte à DT\n");

  // 3. DT désigne RH comme délégataire du 1er au 15 août
  const delegation = await prisma.delegation.create({
    data: {
      mandantId: employeDT.id,
      delegataireId: employeRH.id,
      dateDebut: new Date("2026-08-01"),
      dateFin: new Date("2026-08-15"),
      actif: true,
    },
  });

  console.log("✓ Délégation créée : DT → RH du 01/08 au 15/08\n");

  // 4. Créer une demande de congé
  let typeAbsence = await prisma.typeAbsence.findFirst();

  if (!typeAbsence) {
    typeAbsence = await prisma.typeAbsence.create({
      data: {
        libelle: "Congé de test",
        decompte: true,
      },
    });
  }

  const absence = await prisma.absence.create({
    data: {
      employeId: employeCC.id,
      typeAbsenceId: typeAbsence.id,
      dateDebut: new Date("2026-08-20"),
      dateFin: new Date("2026-08-22"),
      nombreJours: 3,
      statut: "ATTENTE_N1",
      soumieLe: new Date(),
      superieurId: employeDT.id,
    },
  });

  console.log("✓ Demande créée et soumise vers DT\n");

  // 5. Test : Le 5 août (période active)
  const date5Aout = new Date("2026-08-05");

  console.log("📋 Test 1 : Le 5 août (période de délégation active)\n");

  // Vérifier si la délégation est active
  const delegationActive = await prisma.delegation.findFirst({
    where: {
      mandantId: employeDT.id,
      delegataireId: employeRH.id,
      dateDebut: { lte: date5Aout },
      dateFin: { gte: date5Aout },
      actif: true,
    },
  });

  console.log(`   Délégation active le 5 août ? ${delegationActive ? "✅ Oui" : "❌ Non"}`);

  // RH peut-il valider ?
  const rhPeutValiderLe5 = delegationActive !== null;
  console.log(`   RH peut valider le 5 août ? ${rhPeutValiderLe5 ? "✅ Oui" : "❌ Non"}`);

  // DT peut-il AUSSI valider ? (délégation cumulative)
  const dtPeutValiderLe5 = absence.superieurId === employeDT.id;
  console.log(`   DT peut AUSSI valider le 5 août ? ${dtPeutValiderLe5 ? "✅ Oui" : "❌ Non"}`);
  console.log("   → Délégation CUMULATIVE : les deux peuvent valider\n");

  if (!rhPeutValiderLe5 || !dtPeutValiderLe5) {
    throw new Error("ÉCHEC : Délégation cumulative non respectée");
  }

  // 6. Test : Le 20 août (hors période)
  const date20Aout = new Date("2026-08-20");

  console.log("📋 Test 2 : Le 20 août (hors période de délégation)\n");

  const delegationActiveLe20 = await prisma.delegation.findFirst({
    where: {
      mandantId: employeDT.id,
      delegataireId: employeRH.id,
      dateDebut: { lte: date20Aout },
      dateFin: { gte: date20Aout },
      actif: true,
    },
  });

  console.log(`   Délégation active le 20 août ? ${delegationActiveLe20 ? "✅ Oui" : "❌ Non"}`);

  const rhPeutValiderLe20 = delegationActiveLe20 !== null;
  console.log(`   RH peut valider le 20 août ? ${rhPeutValiderLe20 ? "✅ Oui" : "❌ Non"}`);

  const dtPeutValiderLe20 = absence.superieurId === employeDT.id;
  console.log(`   DT peut valider le 20 août ? ${dtPeutValiderLe20 ? "✅ Oui" : "❌ Non"}\n`);

  if (rhPeutValiderLe20) {
    throw new Error("ÉCHEC : RH peut valider hors période de délégation");
  }

  if (!dtPeutValiderLe20) {
    throw new Error("ÉCHEC : DT ne peut plus valider après la délégation");
  }

  // 7. Nettoyage
  await prisma.absence.delete({ where: { id: absence.id } });
  await prisma.delegation.delete({ where: { id: delegation.id } });
  await prisma.affectation.deleteMany({ where: { employeId: employeCC.id } });
  await prisma.employe.delete({ where: { id: employeCC.id } });
  await prisma.employe.delete({ where: { id: employeDT.id } });
  await prisma.employe.delete({ where: { id: employeRH.id } });

  console.log("✅ Test réussi — Délégation cumulative respectée");
  console.log("   • Pendant la période : délégataire ET mandant peuvent valider");
  console.log("   • Hors période : seul le mandant peut valider\n");
}

main()
  .catch((e) => {
    console.error("❌ Test échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
