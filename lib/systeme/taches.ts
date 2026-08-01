/**
 * Fonctions système — Tâches planifiées
 *
 * ⚠️ SANS CONTRÔLE DE PERMISSION
 *
 * Ces fonctions écrivent en base sans vérification d'autorisation.
 * Appelables UNIQUEMENT depuis /api/cron/.
 * Ne jamais importer depuis app/ ou lib/actions/.
 *
 * Toute exécution est journalisée dans JournalEvenement avec auteurId=null
 * et auteurNom="Système (...)".
 */

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

// ====================================================================
// M9 — APPELS D'OFFRES
// ====================================================================

/**
 * [SYSTÈME] Abandonner les dossiers AO dépassés
 *
 * RÈGLE MÉTIER (M9 §5) : Un dossier non soumis dont la date limite est
 * dépassée passe automatiquement en statut ABANDONNE.
 *
 * Exécution : quotidienne via cron (6h UTC)
 */
export async function abandonnerDossiersDepassesSysteme() {
  const aujourdhui = new Date();

  // Trouver tous les AO en VEILLE, GO ou CONSTITUTION dont la date limite est dépassée
  const dossiersDepasses = await prisma.appelOffres.findMany({
    where: {
      statut: { in: ["VEILLE", "GO", "CONSTITUTION"] },
      dateLimiteDepot: { lt: aujourdhui },
    },
  });

  const abandonnes = [];

  for (const ao of dossiersDepasses) {
    await prisma.appelOffres.update({
      where: { id: ao.id },
      data: { statut: "ABANDONNE" },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: "ABANDON_AUTO",
        auteurId: null, // Action système
        auteurNom: "Système (abandon automatique)",
        commentaire: `Dossier abandonné automatiquement : ${ao.reference} — date limite dépassée (${ao.dateLimiteDepot.toLocaleDateString()})`,
      },
    });

    abandonnes.push({
      id: ao.id,
      code: ao.reference,
      dateLimite: ao.dateLimiteDepot,
    });
  }

  if (abandonnes.length > 0) {
    revalidatePath("/appels-offres");
  }

  return { abandonnes };
}

/**
 * [SYSTÈME] Vérifier les alertes sur les dossiers proches de leur date limite
 *
 * RÈGLE MÉTIER (M9 §6) : Alerte à J−15 et J−7 EXACT pour les dossiers non soumis.
 *
 * Retourne les dossiers nécessitant une alerte (à traiter par le système de
 * notifications M10).
 *
 * Exécution : quotidienne via cron (6h UTC)
 */
export async function verifierAlertesEcheanceSysteme() {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0); // Minuit pour comparaison à la journée

  const dans15jours = new Date(aujourdhui);
  dans15jours.setDate(aujourdhui.getDate() + 15);

  const dans7jours = new Date(aujourdhui);
  dans7jours.setDate(aujourdhui.getDate() + 7);

  const lendemain15 = new Date(dans15jours);
  lendemain15.setDate(dans15jours.getDate() + 1);

  const lendemain7 = new Date(dans7jours);
  lendemain7.setDate(dans7jours.getDate() + 1);

  // Dossiers à J-15 EXACT (date limite = aujourd'hui + 15 jours)
  const J15 = await prisma.appelOffres.findMany({
    where: {
      statut: { in: ["GO", "CONSTITUTION"] },
      dateLimiteDepot: {
        gte: dans15jours,
        lt: lendemain15,
      },
    },
    select: {
      id: true,
      reference: true,
      objet: true,
      dateLimiteDepot: true,
      statut: true,
    },
  });

  // Dossiers à J-7 EXACT (date limite = aujourd'hui + 7 jours)
  const J7 = await prisma.appelOffres.findMany({
    where: {
      statut: { in: ["GO", "CONSTITUTION"] },
      dateLimiteDepot: {
        gte: dans7jours,
        lt: lendemain7,
      },
    },
    select: {
      id: true,
      reference: true,
      objet: true,
      dateLimiteDepot: true,
      statut: true,
    },
  });

  return { J15, J7 };
}

// ====================================================================
// M2 — CONTRATS
// ====================================================================

/**
 * [SYSTÈME] Vérifier les contrats arrivant à échéance
 *
 * RÈGLE MÉTIER (M2 §7.4) : Alertes à J−60 et J−30 pour les contrats permanents
 * arrivant à terme.
 *
 * TODO M2 : À implémenter
 */
export async function verifierEcheancesContratsSysteme() {
  // TODO M2
  return { J60: [], J30: [] };
}

// ====================================================================
// M3 — CONGÉS
// ====================================================================

/**
 * [SYSTÈME] Relancer les validateurs absents
 *
 * RÈGLE MÉTIER (M3, décision B-06) : Relances à 24h, 3j, 5j selon l'urgence
 * de la demande.
 *
 * TODO M3 : À implémenter
 */
export async function verifierRelancesAbsencesSysteme() {
  // TODO M3
  return { relances24h: [], relances3j: [], relances5j: [] };
}

/**
 * [SYSTÈME] Rappeler les soldes de congés en fin d'année
 *
 * RÈGLE MÉTIER (M3 §7.8) : Rappel mensuel en fin d'année pour informer les
 * employés de leur solde de congés restant.
 *
 * TODO M3 : À implémenter
 */
export async function rappelsSoldeCongesSysteme() {
  // TODO M3
  return { rappels: [] };
}
