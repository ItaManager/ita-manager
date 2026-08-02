"use server";

/**
 * M13 L2 — Server Actions : Réceptions fournisseurs
 *
 * Fonctionnalités :
 * - Créer une réception de livraison
 * - Contrôler les quantités reçues vs commandées
 * - Valider ou refuser une réception
 * - Générer les mouvements de stock en cas de conformité
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { Decimal } from "@prisma/client/runtime/library";
import type { IssueReception } from "@prisma/client";

// ========== Types ==========

type ReceptionInput = {
  commandeId?: string;
  fournisseurId?: string;
  fournisseurNom: string;
  dateReception: Date;
  photoId?: string;
};

type LigneReceptionInput = {
  articleStockId: string;
  quantiteCommandee: number;
  quantiteLivree: number;
  conforme: boolean;
  observation?: string;
};

// ========== Réceptions ==========

/**
 * Créer une nouvelle réception de livraison
 */
export const creerReception = actionProtegee(
  PERMISSIONS["reception:controler"].code,
  async (session, input: ReceptionInput, lignes: LigneReceptionInput[]) => {
    if (lignes.length === 0) {
      return {
        success: false,
        error: "Une réception doit contenir au moins une ligne",
      };
    }

    // Générer une référence unique
    const count = await prisma.reception.count();
    const reference = `RCP-${String(count + 1).padStart(5, "0")}`;

    // Déterminer l'issue de la réception
    const toutesConformes = lignes.every((l) => l.conforme);
    const toutesNonConformes = lignes.every((l) => !l.conforme);
    const issue: IssueReception = toutesConformes
      ? "CONFORME"
      : toutesNonConformes
      ? "NON_CONFORME"
      : "AVEC_RESERVE";

    // Créer la réception
    const reception = await prisma.reception.create({
      data: {
        reference,
        commandeId: input.commandeId,
        fournisseurId: input.fournisseurId,
        fournisseurNom: input.fournisseurNom,
        dateReception: input.dateReception,
        receptionneParId: session.userId,
        receptionneParNom: session.email,
        issue,
        photoId: input.photoId,
      },
    });

    // Créer les lignes de réception
    for (const ligne of lignes) {
      const quantiteCommandee = new Decimal(ligne.quantiteCommandee);
      const quantiteLivree = new Decimal(ligne.quantiteLivree);
      const ecart = quantiteLivree.sub(quantiteCommandee);

      await prisma.ligneReception.create({
        data: {
          receptionId: reception.id,
          articleStockId: ligne.articleStockId,
          quantiteCommandee,
          quantiteLivree,
          ecart,
          conforme: ligne.conforme,
          observation: ligne.observation,
        },
      });
    }

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Reception",
        entiteId: reception.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference,
          fournisseur: input.fournisseurNom,
          issue,
          lignes: lignes.length,
        },
        commentaire: `Réception ${reference} créée (${issue})`,
      },
    });

    return { success: true, receptionId: reception.id, reference };
  },
);

/**
 * Valider une réception et générer les mouvements de stock
 */
export const validerReception = actionProtegee(
  PERMISSIONS["reception:controler"].code,
  async (session, receptionId: string, lieuStockageId: string) => {
    const reception = await prisma.reception.findUnique({
      where: { id: receptionId },
      include: {
        lignes: {
          include: {
            articleStock: {
              select: { reference: true, designation: true },
            },
          },
        },
      },
    });

    if (!reception) {
      return { success: false, error: "Réception non trouvée" };
    }

    if (reception.valideParId) {
      return { success: false, error: "Cette réception a déjà été validée" };
    }

    // Générer un mouvement d'entrée pour chaque ligne conforme
    let mouvementsGeneres = 0;
    for (const ligne of reception.lignes) {
      if (ligne.conforme && !ligne.quantiteLivree.isZero()) {
        await prisma.mouvementStock.create({
          data: {
            articleStockId: ligne.articleStockId,
            sens: "ENTREE",
            quantite: ligne.quantiteLivree,
            lieuStockageId,
            motif: `Réception ${reception.reference} — ${reception.fournisseurNom}`,
            dateMouvement: reception.dateReception,
          },
        });
        mouvementsGeneres++;
      }
    }

    // Marquer la réception comme validée
    await prisma.reception.update({
      where: { id: receptionId },
      data: {
        valideParId: session.userId,
        valideLe: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Reception",
        entiteId: receptionId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: reception.reference,
          mouvementsGeneres,
        },
        commentaire: `Réception ${reception.reference} validée (${mouvementsGeneres} mouvements créés)`,
      },
    });

    return { success: true, mouvementsGeneres };
  },
);

/**
 * Refuser une réception avec motif
 */
export const refuserReception = actionProtegee(
  PERMISSIONS["reception:controler"].code,
  async (session, receptionId: string, motifRefus: string) => {
    const reception = await prisma.reception.findUnique({
      where: { id: receptionId },
    });

    if (!reception) {
      return { success: false, error: "Réception non trouvée" };
    }

    if (reception.valideParId) {
      return { success: false, error: "Cette réception a déjà été validée" };
    }

    // Marquer la réception comme refusée
    await prisma.reception.update({
      where: { id: receptionId },
      data: {
        issue: "NON_CONFORME",
        motifRefus,
        valideParId: session.userId,
        valideLe: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Reception",
        entiteId: receptionId,
        action: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: reception.reference,
          motifRefus,
        },
        commentaire: `Réception ${reception.reference} refusée : ${motifRefus}`,
      },
    });

    return { success: true };
  },
);

/**
 * Consulter une réception avec ses lignes
 */
export const consulterReception = actionProtegee(
  PERMISSIONS["stock:lire"].code,
  async (_session, receptionId: string) => {
    const reception = await prisma.reception.findUnique({
      where: { id: receptionId },
      include: {
        lignes: {
          include: {
            articleStock: {
              select: {
                reference: true,
                designation: true,
                unite: true,
              },
            },
          },
        },
      },
    });

    if (!reception) {
      return { success: false, error: "Réception non trouvée" };
    }

    return { success: true, reception };
  },
);

/**
 * Lister les réceptions avec pagination
 */
export const listerReceptions = actionProtegee(
  PERMISSIONS["stock:lire"].code,
  async (
    _session,
    page: number = 1,
    commandeId?: string,
    fournisseurId?: string,
    issue?: IssueReception,
    validee?: boolean,
  ) => {
    const limite = 25;
    const offset = (page - 1) * limite;

    const where = {
      ...(commandeId && { commandeId }),
      ...(fournisseurId && { fournisseurId }),
      ...(issue && { issue }),
      ...(validee !== undefined && {
        valideParId: validee ? { not: null } : null,
      }),
    };

    const [receptions, total] = await Promise.all([
      prisma.reception.findMany({
        where,
        include: {
          lignes: {
            select: {
              articleStockId: true,
              quantiteLivree: true,
            },
          },
        },
        orderBy: { dateReception: "desc" },
        skip: offset,
        take: limite,
      }),
      prisma.reception.count({ where }),
    ]);

    return {
      receptions,
      total,
      pages: Math.ceil(total / limite),
      page,
    };
  },
);
