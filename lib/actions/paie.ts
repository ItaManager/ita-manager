"use server";

/**
 * Server Actions — Paie chantier (M7)
 *
 * M7 §3 : Circuit de validation à 3 niveaux (RH → DT → DFC)
 * M7 §8.6 : Auto-approbation interdite (décision B-05)
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { TypeEvenementPeriodePaie } from "@prisma/client";

// =====================================================================
// M7 — PAIE CHANTIER
// =====================================================================

/**
 * Ouvrir une nouvelle période de paie
 *
 * M7 §8.5 : Pas de chevauchement de périodes sur même chantier
 */
export const ouvrirPeriode = actionProtegee(
  "paie:ouvrirPeriode",
  async (
    session,
    donnees: {
      projetId: string;
      dateDebut: Date;
      dateFin: Date;
    }
  ) => {
    // M7 §8.5 : Vérifier chevauchement (version simplifiée)
    const periodesExistantes = await prisma.periodePaie.findMany({
      where: {
        projetId: donnees.projetId,
        OR: [
          {
            AND: [
              { dateDebut: { lte: donnees.dateDebut } },
              { dateFin: { gte: donnees.dateDebut } },
            ],
          },
          {
            AND: [
              { dateDebut: { lte: donnees.dateFin } },
              { dateFin: { gte: donnees.dateFin } },
            ],
          },
        ],
      },
    });

    if (periodesExistantes.length > 0) {
      throw new Error(
        "Une période de paie chevauche déjà ces dates sur ce chantier"
      );
    }

    // Créer la période
    const periode = await prisma.periodePaie.create({
      data: {
        projetId: donnees.projetId,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
        ouvertParId: session.userId,
        evenements: {
          create: {
            type: "OUVERTURE",
            auteurId: session.userId,
            auteurNom: session.email,
          },
        },
      },
      include: {
        projet: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PeriodePaie",
        entiteId: periode.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Période de paie ouverte : ${donnees.dateDebut.toISOString().split("T")[0]} → ${donnees.dateFin.toISOString().split("T")[0]}`,
      },
    });

    revalidatePath("/paie/periodes");
    return periode;
  }
);

/**
 * Calculer les lignes de paie depuis les relevés visés
 *
 * M7 §8.1 : Seuls les relevés VISÉ entrent dans le calcul
 * M7 §8.2 : Dérogation non validée = exclusion
 *
 * NOTE: Version simplifiée — la vraie implémentation agrège les pointages,
 * applique les heures sup, les retenues, etc.
 */
export const calculerPeriode = actionProtegee(
  "paie:ouvrirPeriode",
  async (session, periodeId: string) => {
    const periode = await prisma.periodePaie.findUnique({
      where: { id: periodeId },
      include: {
        projet: true,
        evenements: { orderBy: { creeLe: "desc" }, take: 1 },
      },
    });

    if (!periode) {
      throw new Error("Période introuvable");
    }

    // Vérifier que c'est l'auteur de l'ouverture
    if (periode.ouvertParId !== session.userId) {
      throw new Error("Seul l'auteur de l'ouverture peut calculer la période");
    }

    // Vérifier l'état (dernier événement doit être OUVERTURE)
    const dernierEvenement = periode.evenements[0];
    if (!dernierEvenement || dernierEvenement.type !== "OUVERTURE") {
      throw new Error("La période n'est pas dans l'état OUVERTURE");
    }

    // M7 §8.1 : Charger les relevés VISÉ uniquement
    const relevesVises = await prisma.releveActivite.findMany({
      where: {
        projetId: periode.projetId,
        statut: "VISE",
        date: {
          gte: periode.dateDebut,
          lte: periode.dateFin,
        },
      },
      include: {
        pointages: {
          include: {
            employe: {
              include: {
                affectations: {
                  where: { dateFin: null },
                  include: { poste: true },
                },
                contrats: {
                  where: { dateFin: null },
                  orderBy: { dateDebut: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Placeholder : créer une ligne fictive pour chaque employé pointé
    // La vraie implémentation agrègerait les pointages par employé
    console.log(`Relevés visés trouvés : ${relevesVises.length}`);

    revalidatePath(`/paie/periodes/${periodeId}`);
    return { success: true, nbReleves: relevesVises.length };
  }
);

/**
 * Valider la période (étape RH)
 *
 * M7 §3 : RH vérifie les pointages et les anomalies
 */
export const validerRH = actionProtegee(
  "paie:ouvrirPeriode",
  async (session, periodeId: string) => {
    const periode = await prisma.periodePaie.findUnique({
      where: { id: periodeId },
      include: {
        evenements: { orderBy: { creeLe: "desc" }, take: 1 },
        lignes: true,
      },
    });

    if (!periode) {
      throw new Error("Période introuvable");
    }

    const dernierEvenement = periode.evenements[0];
    if (!dernierEvenement || dernierEvenement.type !== "OUVERTURE") {
      throw new Error("La période n'est pas dans l'état OUVERTURE");
    }

    if (periode.lignes.length === 0) {
      throw new Error("Aucune ligne de paie calculée");
    }

    // Créer l'événement de validation RH
    await prisma.evenementPeriodePaie.create({
      data: {
        periodeId,
        type: "VALIDATION_RH",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PeriodePaie",
        entiteId: periodeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Validation RH",
      },
    });

    revalidatePath(`/paie/periodes/${periodeId}`);
    return { success: true };
  }
);

/**
 * Valider la période (étape DT)
 *
 * M7 §3 : DT vérifie la conformité technique
 * M7 §8.6 : Auto-approbation interdite
 */
export const validerDT = actionProtegee(
  "paie:validerDT",
  async (session, periodeId: string) => {
    const periode = await prisma.periodePaie.findUnique({
      where: { id: periodeId },
      include: {
        evenements: { orderBy: { creeLe: "desc" }, take: 1 },
      },
    });

    if (!periode) {
      throw new Error("Période introuvable");
    }

    // M7 §8.6 : Vérifier auto-approbation
    if (periode.ouvertParId === session.userId) {
      throw new Error(
        "Vous ne pouvez pas valider une période que vous avez ouverte (auto-approbation interdite)"
      );
    }

    const dernierEvenement = periode.evenements[0];
    if (!dernierEvenement || dernierEvenement.type !== "VALIDATION_RH") {
      throw new Error("La période n'est pas dans l'état VALIDATION_RH");
    }

    // Créer l'événement de validation DT
    await prisma.evenementPeriodePaie.create({
      data: {
        periodeId,
        type: "VALIDATION_DT",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PeriodePaie",
        entiteId: periodeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Validation DT",
      },
    });

    revalidatePath(`/paie/periodes/${periodeId}`);
    return { success: true };
  }
);

/**
 * Valider la période (étape DFC)
 *
 * M7 §3 : DFC vérifie l'engagement financier
 * M7 §8.6 : Auto-approbation interdite
 */
export const validerDFC = actionProtegee(
  "paie:validerDFC",
  async (session, periodeId: string) => {
    const periode = await prisma.periodePaie.findUnique({
      where: { id: periodeId },
      include: {
        evenements: { orderBy: { creeLe: "desc" }, take: 1 },
      },
    });

    if (!periode) {
      throw new Error("Période introuvable");
    }

    // M7 §8.6 : Vérifier auto-approbation
    if (periode.ouvertParId === session.userId) {
      throw new Error(
        "Vous ne pouvez pas valider une période que vous avez ouverte (auto-approbation interdite)"
      );
    }

    const dernierEvenement = periode.evenements[0];
    if (!dernierEvenement || dernierEvenement.type !== "VALIDATION_DT") {
      throw new Error("La période n'est pas dans l'état VALIDATION_DT");
    }

    // Créer l'événement de validation DFC
    await prisma.evenementPeriodePaie.create({
      data: {
        periodeId,
        type: "VALIDATION_DFC",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PeriodePaie",
        entiteId: periodeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Validation DFC",
      },
    });

    revalidatePath(`/paie/periodes/${periodeId}`);
    return { success: true };
  }
);

/**
 * Refuser une période avec motif obligatoire
 *
 * M7 §7 : Motif obligatoire, retour à l'étape précédente
 */
export const refuserPeriode = actionProtegee(
  "paie:validerDT",
  async (
    session,
    donnees: {
      periodeId: string;
      motif: string;
    }
  ) => {
    if (!donnees.motif || donnees.motif.trim().length < 10) {
      throw new Error("Le motif de refus doit faire au moins 10 caractères");
    }

    const periode = await prisma.periodePaie.findUnique({
      where: { id: donnees.periodeId },
    });

    if (!periode) {
      throw new Error("Période introuvable");
    }

    // Créer l'événement de refus
    await prisma.evenementPeriodePaie.create({
      data: {
        periodeId: donnees.periodeId,
        type: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        motifRefus: donnees.motif,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PeriodePaie",
        entiteId: donnees.periodeId,
        action: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Période refusée : ${donnees.motif.substring(0, 50)}...`,
      },
    });

    revalidatePath(`/paie/periodes/${donnees.periodeId}`);
    return { success: true };
  }
);

/**
 * Clôturer une période
 *
 * M7 §8.4 : Clôturée = immuable
 */
export const cloturerPeriode = actionProtegee(
  "paie:exporter",
  async (session, periodeId: string) => {
    const periode = await prisma.periodePaie.findUnique({
      where: { id: periodeId },
      include: {
        evenements: { orderBy: { creeLe: "desc" }, take: 1 },
        exports: true,
      },
    });

    if (!periode) {
      throw new Error("Période introuvable");
    }

    const dernierEvenement = periode.evenements[0];
    if (!dernierEvenement || dernierEvenement.type !== "VALIDATION_DFC") {
      throw new Error("La période n'est pas validée DFC");
    }

    if (periode.exports.length === 0) {
      throw new Error("Aucun export généré pour cette période");
    }

    // Créer l'événement de clôture
    await prisma.evenementPeriodePaie.create({
      data: {
        periodeId,
        type: "CLOTURE",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PeriodePaie",
        entiteId: periodeId,
        action: "CLOTURE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Période clôturée",
      },
    });

    revalidatePath(`/paie/periodes/${periodeId}`);
    return { success: true };
  }
);

// =====================================================================
// CONSULTATION
// =====================================================================

export type PeriodePaieListItem = {
  id: string;
  dateDebut: Date;
  dateFin: Date;
  projet: {
    id: string;
    code: string;
    nom: string;
  };
  statut: string;
  nbLignes: number;
};

/**
 * Lister les périodes de paie
 *
 * M7 §5.1 : Le statut est déduit du dernier événement
 */
export async function listerPeriodesPaie(): Promise<PeriodePaieListItem[]> {
  const periodes = await prisma.periodePaie.findMany({
    select: {
      id: true,
      dateDebut: true,
      dateFin: true,
      projet: {
        select: {
          id: true,
          code: true,
          nom: true,
        },
      },
      evenements: {
        select: {
          type: true,
          creeLe: true,
        },
        orderBy: {
          creeLe: 'desc',
        },
        take: 1,
      },
      _count: {
        select: {
          lignes: true,
        },
      },
    },
    orderBy: [
      { dateDebut: 'desc' },
    ],
    take: 50,
  });

  return periodes.map((p) => {
    // Déduire le statut du dernier événement
    const dernierEvenement = p.evenements[0];
    let statut = 'OUVERTE';

    if (dernierEvenement) {
      switch (dernierEvenement.type) {
        case 'OUVERTURE':
          statut = 'OUVERTE';
          break;
        case 'VALIDATION_RH':
          statut = 'VALIDEE_RH';
          break;
        case 'VALIDATION_DT':
          statut = 'VALIDEE_DT';
          break;
        case 'VALIDATION_DFC':
          statut = 'VALIDEE_DFC';
          break;
        case 'REFUS':
          statut = 'REFUSEE';
          break;
        case 'CLOTURE':
          statut = 'CLOTUREE';
          break;
        case 'ANNULATION':
          statut = 'ANNULEE';
          break;
        default:
          statut = 'OUVERTE';
      }
    }

    return {
      id: p.id,
      dateDebut: p.dateDebut,
      dateFin: p.dateFin,
      projet: p.projet,
      statut,
      nbLignes: p._count.lignes,
    };
  });
}
