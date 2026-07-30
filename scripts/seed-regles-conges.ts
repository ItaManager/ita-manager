/**
 * Seed des règles de congés et jours fériés (M3 Phase 8)
 *
 * IMPORTANT : Les valeurs ci-dessous sont des HYPOTHÈSES DE TRAVAIL (M3 §1)
 * à valider par la Direction RH et vérifier contre le Code du travail ivoirien
 * et la convention collective du BTP.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ID du Super Admin pour les créations
const SUPER_ADMIN_ID = "00000000-0000-0000-0000-000000000000";

// Règles de congés (M3 §1.1 - HYPOTHÈSES)
const REGLES_CONGES = [
  {
    cle: "dotation.joursParMois",
    valeur: "2.2",
    description: "Nombre de jours de congé acquis par mois de service effectif",
  },
  {
    cle: "dotation.joursAnnuels",
    valeur: "26",
    description: "Dotation annuelle pour une année complète (2,2 × 12)",
  },
  {
    cle: "anciennete.5ans",
    valeur: "1",
    description: "Majoration pour 5 ans d'ancienneté (en jours)",
  },
  {
    cle: "anciennete.10ans",
    valeur: "2",
    description: "Majoration pour 10 ans d'ancienneté (en jours)",
  },
  {
    cle: "anciennete.15ans",
    valeur: "3",
    description: "Majoration pour 15 ans d'ancienneté (en jours)",
  },
  {
    cle: "anciennete.20ans",
    valeur: "5",
    description: "Majoration pour 20 ans d'ancienneté (en jours)",
  },
  {
    cle: "anciennete.25ans",
    valeur: "7",
    description: "Majoration pour 25 ans d'ancienneté (en jours)",
  },
  {
    cle: "report.plafond",
    valeur: "10",
    description: "Plafond de report du solde N-1 vers N (en jours)",
  },
  {
    cle: "report.dateLimite",
    valeur: "03-31",
    description: "Date limite de consommation du report (MM-DD)",
  },
  {
    cle: "decompte.mode",
    valeur: "OUVRABLES",
    description: "Mode de décompte : OUVRABLES ou CALENDAIRES",
  },
  {
    cle: "samedi.ouvrable",
    valeur: "false",
    description: "Le samedi est-il un jour ouvrable chez ITA ?",
  },
];

// Jours fériés fixes ivoiriens (M3 §1.3 - HYPOTHÈSES)
const FERIES_FIXES_2026 = [
  { date: "2026-01-01", libelle: "Jour de l'An", mobile: false },
  { date: "2026-05-01", libelle: "Fête du Travail", mobile: false },
  { date: "2026-08-07", libelle: "Fête de l'Indépendance", mobile: false },
  { date: "2026-08-15", libelle: "Assomption", mobile: false },
  { date: "2026-11-01", libelle: "Toussaint", mobile: false },
  { date: "2026-11-15", libelle: "Journée nationale de la Paix", mobile: false },
  { date: "2026-12-25", libelle: "Noël", mobile: false },
];

// Jours fériés mobiles 2026 (M3 §1.3 - HYPOTHÈSES, à saisir manuellement chaque année)
const FERIES_MOBILES_2026 = [
  { date: "2026-04-06", libelle: "Lundi de Pâques", mobile: true },
  { date: "2026-05-14", libelle: "Ascension", mobile: true },
  { date: "2026-05-25", libelle: "Lundi de Pentecôte", mobile: true },
  // Fêtes musulmanes (dates par décret annuel)
  { date: "2026-03-20", libelle: "Aïd el-Fitr", mobile: true },
  { date: "2026-05-27", libelle: "Aïd el-Kébir", mobile: true },
  { date: "2026-09-15", libelle: "Maouloud", mobile: true },
];

async function main() {
  console.log("🌱 Seed des règles de congés et jours fériés...");

  // 1. Nettoyer les données existantes
  console.log("\n📋 Nettoyage des règles et fériés existants...");
  await prisma.jourFerie.deleteMany({});
  await prisma.regleConge.deleteMany({});

  // 2. Insérer les règles
  console.log("\n⚙️  Création des règles de congés...");
  for (const regle of REGLES_CONGES) {
    await prisma.regleConge.create({
      data: {
        ...regle,
        modifieParId: SUPER_ADMIN_ID,
      },
    });
  }
  console.log(`   ✓ ${REGLES_CONGES.length} règles créées`);

  // 3. Insérer les jours fériés fixes 2026
  console.log("\n📅 Création des jours fériés fixes 2026...");
  for (const ferie of FERIES_FIXES_2026) {
    await prisma.jourFerie.create({
      data: {
        date: new Date(ferie.date),
        libelle: ferie.libelle,
        mobile: ferie.mobile,
      },
    });
  }
  console.log(`   ✓ ${FERIES_FIXES_2026.length} jours fériés fixes créés`);

  // 4. Insérer les jours fériés mobiles 2026
  console.log("\n📅 Création des jours fériés mobiles 2026...");
  for (const ferie of FERIES_MOBILES_2026) {
    await prisma.jourFerie.create({
      data: {
        date: new Date(ferie.date),
        libelle: ferie.libelle,
        mobile: ferie.mobile,
      },
    });
  }
  console.log(`   ✓ ${FERIES_MOBILES_2026.length} jours fériés mobiles créés`);

  console.log("\n✅ Seed des règles de congés et jours fériés terminé !");
  console.log("\n⚠️  RAPPEL : Ces valeurs sont des HYPOTHÈSES DE TRAVAIL");
  console.log("   À valider par la Direction RH et vérifier contre :");
  console.log("   - Code du travail ivoirien");
  console.log("   - Convention collective du BTP");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
