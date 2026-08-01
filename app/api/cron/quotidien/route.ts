/**
 * Route Vercel Cron — Tâches quotidiennes
 *
 * Exécutée chaque jour à 6h UTC (= 6h à Abidjan).
 *
 * Protégée par CRON_SECRET passé dans l'en-tête Authorization par Vercel.
 *
 * ORDONNANCEMENT :
 * 1. M9 — Abandon des dossiers AO dépassés
 * 2. M9 — Alertes AO J−15 et J−7
 * 3. M2 — Alertes contrats J−60 et J−30
 * 4. M3 — Relances absences validateur (24h, 3j, 5j selon urgence)
 * 5. M3 — Rappels solde congés en fin d'année
 *
 * USAGE :
 * - Production : Vercel Cron appelle automatiquement
 * - Développement : curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/quotidien
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  abandonnerDossiersDepassesSysteme,
  verifierAlertesEcheanceSysteme,
  verifierEcheancesContratsSysteme,
  verifierRelancesAbsencesSysteme,
  rappelsSoldeCongesSysteme,
} from "@/lib/systeme/taches";

export async function GET(request: NextRequest) {
  // Vérification du secret Vercel Cron
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized — CRON_SECRET invalide ou absent" },
      { status: 401 }
    );
  }

  const debut = new Date();
  const resultats: {
    tache: string;
    statut: "success" | "error";
    details?: unknown;
    erreur?: string;
  }[] = [];

  // ====================================================================
  // 1. M9 — Abandon des dossiers AO dépassés
  // ====================================================================
  try {
    const result = await abandonnerDossiersDepassesSysteme();
    resultats.push({
      tache: "M9 — Abandon dossiers AO dépassés",
      statut: "success",
      details: {
        nombreDossiersAbandonnes: result.abandonnes.length,
        dossiers: result.abandonnes.map((d) => d.code),
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Systeme",
        entiteId: "cron-quotidien",
        action: "TACHE_PLANIFIEE",
        auteurId: null,
        auteurNom: "Système (Cron)",
        details: {
          tache: "abandonnerDossiersDepasses",
          nombreDossiersAbandonnes: result.abandonnes.length,
        },
        commentaire: `Abandon automatique de ${result.abandonnes.length} dossier(s) AO dépassé(s)`,
      },
    });
  } catch (error) {
    resultats.push({
      tache: "M9 — Abandon dossiers AO dépassés",
      statut: "error",
      erreur: error instanceof Error ? error.message : "Erreur inconnue",
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Systeme",
        entiteId: "cron-quotidien",
        action: "ERREUR_TACHE_PLANIFIEE",
        auteurId: null,
        auteurNom: "Système (Cron)",
        details: {
          tache: "abandonnerDossiersDepasses",
          erreur: error instanceof Error ? error.message : "Erreur inconnue",
        },
        commentaire: "Échec de l'abandon automatique des dossiers AO",
      },
    });
  }

  // ====================================================================
  // 2. M9 — Alertes AO J−15 et J−7
  // ====================================================================
  try {
    const alertes = await verifierAlertesEcheanceSysteme();
    resultats.push({
      tache: "M9 — Alertes AO J−15 et J−7",
      statut: "success",
      details: {
        J15: alertes.J15.length,
        J7: alertes.J7.length,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Systeme",
        entiteId: "cron-quotidien",
        action: "TACHE_PLANIFIEE",
        auteurId: null,
        auteurNom: "Système (Cron)",
        details: {
          tache: "verifierAlertesEcheance",
          alertesJ15: alertes.J15.length,
          alertesJ7: alertes.J7.length,
        },
        commentaire: `Alertes AO : ${alertes.J15.length} à J−15, ${alertes.J7.length} à J−7`,
      },
    });
  } catch (error) {
    resultats.push({
      tache: "M9 — Alertes AO J−15 et J−7",
      statut: "error",
      erreur: error instanceof Error ? error.message : "Erreur inconnue",
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Systeme",
        entiteId: "cron-quotidien",
        action: "ERREUR_TACHE_PLANIFIEE",
        auteurId: null,
        auteurNom: "Système (Cron)",
        details: {
          tache: "verifierAlertesEcheance",
          erreur: error instanceof Error ? error.message : "Erreur inconnue",
        },
        commentaire: "Échec de la vérification des alertes AO",
      },
    });
  }

  // ====================================================================
  // 3. M2 — Alertes contrats J−60 et J−30
  // ====================================================================
  try {
    const echeances = await verifierEcheancesContratsSysteme();
    resultats.push({
      tache: "M2 — Alertes contrats J−60 et J−30",
      statut: "success",
      details: {
        J60: echeances.J60.length,
        J30: echeances.J30.length,
        message: "TODO M2 — Fonction à implémenter",
      },
    });
  } catch (error) {
    resultats.push({
      tache: "M2 — Alertes contrats J−60 et J−30",
      statut: "error",
      erreur: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }

  // ====================================================================
  // 4. M3 — Relances absences validateur (24h, 3j, 5j)
  // ====================================================================
  try {
    const relances = await verifierRelancesAbsencesSysteme();
    resultats.push({
      tache: "M3 — Relances absences validateur",
      statut: "success",
      details: {
        relances24h: relances.relances24h.length,
        relances3j: relances.relances3j.length,
        relances5j: relances.relances5j.length,
        message: "TODO M3 — Fonction à implémenter selon décision B-06",
      },
    });
  } catch (error) {
    resultats.push({
      tache: "M3 — Relances absences validateur",
      statut: "error",
      erreur: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }

  // ====================================================================
  // 5. M3 — Rappels solde congés en fin d'année
  // ====================================================================
  try {
    const rappels = await rappelsSoldeCongesSysteme();
    resultats.push({
      tache: "M3 — Rappels solde congés fin d'année",
      statut: "success",
      details: {
        rappels: rappels.rappels.length,
        message: "TODO M3 — Fonction à implémenter",
      },
    });
  } catch (error) {
    resultats.push({
      tache: "M3 — Rappels solde congés fin d'année",
      statut: "error",
      erreur: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }

  // ====================================================================
  // Journalisation globale de l'exécution
  // ====================================================================
  const fin = new Date();
  const duree = fin.getTime() - debut.getTime();

  await prisma.journalEvenement.create({
    data: {
      entite: "Systeme",
      entiteId: "cron-quotidien",
      action: "EXECUTION_CRON",
      auteurId: null,
      auteurNom: "Système (Cron)",
      details: JSON.parse(
        JSON.stringify({
          debut: debut.toISOString(),
          fin: fin.toISOString(),
          dureeMs: duree,
          resultats,
        })
      ),
      commentaire: `Exécution cron quotidien terminée en ${duree}ms`,
    },
  });

  return NextResponse.json({
    success: true,
    execution: {
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      dureeMs: duree,
    },
    resultats,
  });
}
