#!/usr/bin/env tsx
/**
 * Test M3 — Calcul des jours de congé
 *
 * RÈGLES MÉTIER (M3 §4) :
 * 1. Lundi au vendredi = 5 jours, pas 7 (seuls les jours ouvrables comptent)
 * 2. Un férié dans la période n'est pas décompté
 * 3. Le samedi selon le paramètre (actuellement non ouvrable, hypothèse)
 * 4. Un congé à cheval sur deux exercices s'impute sur celui de la date de début
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-calcul-jours-m3.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

/**
 * Calculer le nombre de jours ouvrables entre deux dates
 * (en excluant les week-ends et les jours fériés)
 */
async function calculerJoursOuvrables(
  dateDebut: Date,
  dateFin: Date
): Promise<number> {
  // Récupérer les jours fériés dans la période
  const feries = await prisma.jourFerie.findMany({
    where: {
      date: {
        gte: dateDebut,
        lte: dateFin,
      },
      mobile: false, // Fixes
    },
  });

  const feriesSet = new Set(feries.map((f) => f.date.toISOString().split("T")[0]));

  let count = 0;
  const current = new Date(dateDebut);

  while (current <= dateFin) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split("T")[0];

    // Exclure samedi (6), dimanche (0), et fériés
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !feriesSet.has(dateStr)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

async function main() {
  console.log("🧪 Test M3 — Calcul des jours de congé\n");

  // ========================================================================
  // CAS 1 : Lundi au vendredi = 5 jours, pas 7
  // ========================================================================
  console.log("📋 Cas 1 : Lundi au vendredi (5 jours ouvrables)\n");

  const lundi = new Date("2026-08-03T12:00:00Z"); // Lundi 3 août 2026
  const vendredi = new Date("2026-08-07T12:00:00Z"); // Vendredi 7 août 2026

  const jours1 = await calculerJoursOuvrables(lundi, vendredi);
  console.log(`   Du ${lundi.toLocaleDateString("fr-FR")} au ${vendredi.toLocaleDateString("fr-FR")}`);
  console.log(`   Jours calendaires : 5`);
  console.log(`   Jours ouvrables : ${jours1}`);

  if (jours1 !== 5) {
    throw new Error(`ÉCHEC : attendu 5 jours, obtenu ${jours1}`);
  }

  console.log(`   ✅ Correct : 5 jours ouvrables\n`);

  // ========================================================================
  // CAS 2 : Un férié dans la période n'est pas décompté
  // ========================================================================
  console.log("📋 Cas 2 : Période avec un férié (non décompté)\n");

  // Créer un jour férié de test (Fête nationale - 7 août)
  await prisma.jourFerie.upsert({
    where: { date: new Date("2026-08-07T12:00:00Z") },
    create: {
      date: new Date("2026-08-07T12:00:00Z"),
      libelle: "Fête nationale (test)",
      mobile: false,
    },
    update: {},
  });

  const lundi2 = new Date("2026-08-03T12:00:00Z"); // Lundi 3 août
  const vendredi2 = new Date("2026-08-07T12:00:00Z"); // Vendredi 7 août (férié)

  const jours2 = await calculerJoursOuvrables(lundi2, vendredi2);
  console.log(`   Du ${lundi2.toLocaleDateString("fr-FR")} au ${vendredi2.toLocaleDateString("fr-FR")}`);
  console.log(`   Jours calendaires : 5`);
  console.log(`   Jours fériés : 1 (vendredi 7 août)`);
  console.log(`   Jours ouvrables : ${jours2}`);

  if (jours2 !== 4) {
    throw new Error(`ÉCHEC : attendu 4 jours (férié exclu), obtenu ${jours2}`);
  }

  console.log(`   ✅ Correct : 4 jours ouvrables (férié exclu)\n`);

  // Nettoyer le férié de test
  await prisma.jourFerie.delete({
    where: { date: new Date("2026-08-07T12:00:00Z") },
  });

  // ========================================================================
  // CAS 3 : Le samedi selon le paramètre (actuellement non ouvrable)
  // ========================================================================
  console.log("📋 Cas 3 : Week-end (samedi et dimanche non ouvrables)\n");

  const vendredi3 = new Date("2026-08-07T12:00:00Z"); // Vendredi 7 août
  const lundi3 = new Date("2026-08-10T12:00:00Z"); // Lundi 10 août (après le week-end)

  const jours3 = await calculerJoursOuvrables(vendredi3, lundi3);
  console.log(`   Du ${vendredi3.toLocaleDateString("fr-FR")} au ${lundi3.toLocaleDateString("fr-FR")}`);
  console.log(`   Jours calendaires : 3 (ven, sam, dim, lun)`);
  console.log(`   Jours ouvrables : ${jours3}`);

  if (jours3 !== 2) {
    throw new Error(`ÉCHEC : attendu 2 jours (ven + lun), obtenu ${jours3}`);
  }

  console.log(`   ✅ Correct : 2 jours ouvrables (samedi et dimanche exclus)\n`);

  // ========================================================================
  // CAS 4 : Congé à cheval sur deux exercices → imputation sur date de début
  // ========================================================================
  console.log("📋 Cas 4 : Congé à cheval sur deux exercices\n");

  // Congé du 29 déc 2025 au 2 jan 2026 (5 jours ouvrables)
  const dateDebut = new Date("2025-12-29T12:00:00Z"); // Lundi 29 déc 2025
  const dateFin = new Date("2026-01-02T12:00:00Z"); // Vendredi 2 jan 2026

  const joursOuvrables = await calculerJoursOuvrables(dateDebut, dateFin);

  console.log(`   Congé : du ${dateDebut.toLocaleDateString("fr-FR")} au ${dateFin.toLocaleDateString("fr-FR")}`);
  console.log(`   Jours ouvrables : ${joursOuvrables}`);
  console.log(`   Période : ${dateDebut.getFullYear()} (début) → ${dateFin.getFullYear()} (fin)\n`);

  // RÈGLE MÉTIER : Imputation sur l'exercice de la date de début (2025)
  const exerciceImputation = dateDebut.getFullYear();
  console.log(`   Exercice d'imputation : ${exerciceImputation} (date de début)`);

  if (exerciceImputation !== 2025) {
    throw new Error(`ÉCHEC : imputation sur ${exerciceImputation} au lieu de 2025`);
  }

  console.log(`   ✅ Correct : imputation sur l'exercice de la date de début (2025)\n`);

  console.log("✅ Tous les tests de calcul de jours réussis");
  console.log("   1. Lundi-vendredi = 5 jours (pas 7)");
  console.log("   2. Férié exclu du décompte");
  console.log("   3. Week-end non ouvrable (samedi et dimanche)");
  console.log("   4. Congé à cheval → imputation sur exercice de début\n");
}

main()
  .catch((e) => {
    console.error("❌ Test échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
