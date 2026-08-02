"use server";

/**
 * Server Actions — Entretien (M13 L3)
 *
 * M13 L3 : Planification et gestion de l'entretien du matériel
 * - Plans d'entretien (planification récurrente)
 * - Entretiens réalisés (historique)
 * - Calcul du Total Cost of Ownership (TCO)
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { Prisma, type TypeEntretien } from "@prisma/client";

// =====================================================================
// M13 L3 — PLANS D'ENTRETIEN
// =====================================================================

export type PlanEntretienItem = {
  id: string;
  materiel: {
    id: string;
    codeIta: string;
    designation: string;
  };
  type: TypeEntretien;
  description: string;
  periodiciteJours: number | null;
  seuilCompteur: number | null;
  actif: boolean;
};

/**
 * Créer un plan d'entretien
 *
 * M13 L3 — Planification récurrente de l'entretien
 * Permission: entretien:planifier
 */
export const creerPlanEntretien = actionProtegee(
  "entretien:planifier",
  async (
    session,
    donnees: {
      materielId: string;
      type: TypeEntretien;
      description: string;
      periodiciteJours?: number;
      seuilCompteur?: number;
    }
  ): Promise<{ id: string }> => {
    // Créer le plan d'entretien
    const plan = await prisma.planEntretien.create({
      data: {
        materielId: donnees.materielId,
        type: donnees.type,
        description: donnees.description,
        periodiciteJours: donnees.periodiciteJours,
        seuilCompteur: donnees.seuilCompteur,
        actif: true,
      },
      select: {
        id: true,
        materiel: {
          select: {
            codeIta: true,
            designation: true,
          },
        },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PlanEntretien",
        entiteId: plan.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Plan d'entretien créé pour ${plan.materiel.codeIta} - ${plan.materiel.designation}`,
      },
    });

    revalidatePath("/ressources/entretien");

    return { id: plan.id };
  }
);

/**
 * Lister les plans d'entretien
 *
 * M13 L3 — Liste des plans avec filtres
 * Permission: entretien:planifier
 */
export const listerPlansEntretien = actionProtegee(
  "entretien:planifier",
  async (
    session,
    params: {
      materielId?: string;
      type?: TypeEntretien;
      actif?: boolean;
    } = {}
  ): Promise<PlanEntretienItem[]> => {
    // Construire le where pour les filtres
    const where: Prisma.PlanEntretienWhereInput = {};

    if (params.materielId) {
      where.materielId = params.materielId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.actif !== undefined) {
      where.actif = params.actif;
    }

    // Récupérer les plans
    const plans = await prisma.planEntretien.findMany({
      where,
      select: {
        id: true,
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        type: true,
        description: true,
        periodiciteJours: true,
        seuilCompteur: true,
        actif: true,
      },
      orderBy: {
        materiel: {
          designation: "asc",
        },
      },
    });

    return plans;
  }
);

// =====================================================================
// M13 L3 — ENTRETIENS RÉALISÉS
// =====================================================================

export type EntretienItem = {
  id: string;
  materiel: {
    id: string;
    codeIta: string;
    designation: string;
  };
  plan: {
    id: string;
    description: string;
  } | null;
  type: TypeEntretien;
  dateDebut: Date;
  dateFin: Date | null;
  compteur: number | null;
  cout: number | null;
  technicien: string | null;
  description: string | null;
  observations: string | null;
};

/**
 * Créer un entretien
 *
 * M13 L3 — Enregistrement d'un entretien réalisé
 * Permission: entretien:planifier
 */
export const creerEntretien = actionProtegee(
  "entretien:planifier",
  async (
    session,
    donnees: {
      materielId: string;
      planId?: string;
      type: TypeEntretien;
      dateDebut: Date;
      compteur?: number;
      cout?: number;
      technicien: string;
      description?: string;
    }
  ): Promise<{ id: string }> => {
    // Créer l'entretien
    const entretien = await prisma.entretien.create({
      data: {
        materielId: donnees.materielId,
        planId: donnees.planId,
        type: donnees.type,
        dateDebut: donnees.dateDebut,
        compteur: donnees.compteur,
        cout: donnees.cout ? new Prisma.Decimal(donnees.cout) : undefined,
        technicien: donnees.technicien || null,
        description: donnees.description || "",
      },
      select: {
        id: true,
        materiel: {
          select: {
            codeIta: true,
            designation: true,
          },
        },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Entretien",
        entiteId: entretien.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Entretien créé pour ${entretien.materiel.codeIta} - ${entretien.materiel.designation}`,
      },
    });

    revalidatePath("/ressources/entretien");

    return { id: entretien.id };
  }
);

/**
 * Lister les entretiens avec pagination
 *
 * M13 L3 — Historique des entretiens
 * Permission: entretien:planifier
 */
export const listerEntretiens = actionProtegee(
  "entretien:planifier",
  async (
    session,
    params: {
      page?: number;
      materielId?: string;
      type?: TypeEntretien;
      dateDebut?: Date;
      dateFin?: Date;
    } = {}
  ): Promise<{
    items: EntretienItem[];
    total: number;
    page: number;
    totalPages: number;
    perPage: number;
  }> => {
    const page = params.page || 1;
    const perPage = 25;
    const skip = (page - 1) * perPage;

    // Construire le where pour les filtres
    const where: Prisma.EntretienWhereInput = {};

    if (params.materielId) {
      where.materielId = params.materielId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.dateDebut || params.dateFin) {
      where.dateDebut = {};
      if (params.dateDebut) {
        where.dateDebut.gte = params.dateDebut;
      }
      if (params.dateFin) {
        where.dateDebut.lte = params.dateFin;
      }
    }

    // Compter le total
    const total = await prisma.entretien.count({ where });

    // Récupérer les items
    const entretiens = await prisma.entretien.findMany({
      where,
      select: {
        id: true,
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        plan: {
          select: {
            id: true,
            description: true,
          },
        },
        type: true,
        dateDebut: true,
        dateFin: true,
        compteur: true,
        cout: true,
        technicien: true,
        description: true,
        observations: true,
      },
      orderBy: {
        dateDebut: "desc",
      },
      skip,
      take: perPage,
    });

    const items: EntretienItem[] = entretiens.map((e) => ({
      id: e.id,
      materiel: e.materiel,
      plan: e.plan,
      type: e.type,
      dateDebut: e.dateDebut,
      dateFin: e.dateFin,
      compteur: e.compteur,
      cout: e.cout ? e.cout.toNumber() : null,
      technicien: e.technicien,
      description: e.description,
      observations: e.observations,
    }));

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      perPage,
    };
  }
);

/**
 * Obtenir le détail d'un entretien
 *
 * M13 L3 — Détail complet d'un entretien
 * Permission: entretien:planifier
 */
export const obtenirEntretien = actionProtegee(
  "entretien:planifier",
  async (session, entretienId: string): Promise<EntretienItem> => {
    const entretien = await prisma.entretien.findUnique({
      where: { id: entretienId },
      select: {
        id: true,
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        plan: {
          select: {
            id: true,
            description: true,
          },
        },
        type: true,
        dateDebut: true,
        dateFin: true,
        compteur: true,
        cout: true,
        technicien: true,
        description: true,
        observations: true,
      },
    });

    if (!entretien) {
      throw new Error("Entretien introuvable");
    }

    return {
      id: entretien.id,
      materiel: entretien.materiel,
      plan: entretien.plan,
      type: entretien.type,
      dateDebut: entretien.dateDebut,
      dateFin: entretien.dateFin,
      compteur: entretien.compteur,
      cout: entretien.cout ? entretien.cout.toNumber() : null,
      technicien: entretien.technicien,
      description: entretien.description,
      observations: entretien.observations,
    };
  }
);

/**
 * Terminer un entretien
 *
 * M13 L3 — Enregistrement de la fin d'un entretien
 * Permission: entretien:planifier
 */
export const terminerEntretien = actionProtegee(
  "entretien:planifier",
  async (
    session,
    entretienId: string,
    donnees: {
      dateFin: Date;
      observations?: string;
    }
  ): Promise<void> => {
    // Vérifier que l'entretien existe
    const entretien = await prisma.entretien.findUnique({
      where: { id: entretienId },
      select: {
        id: true,
        materiel: {
          select: {
            codeIta: true,
            designation: true,
          },
        },
      },
    });

    if (!entretien) {
      throw new Error("Entretien introuvable");
    }

    // Mettre à jour l'entretien
    await prisma.entretien.update({
      where: { id: entretienId },
      data: {
        dateFin: donnees.dateFin,
        observations: donnees.observations,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Entretien",
        entiteId: entretienId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Entretien terminé pour ${entretien.materiel.codeIta} - ${entretien.materiel.designation}`,
      },
    });

    revalidatePath("/ressources/entretien");
  }
);

// =====================================================================
// M13 L3 — TOTAL COST OF OWNERSHIP (TCO)
// =====================================================================

export type ResultatTCO = {
  coutAcquisition: number;
  coutEntretiens: number;
  coutPieces: number;
  total: number;
};

/**
 * Calculer le Total Cost of Ownership (TCO) d'un matériel
 *
 * M13 L3 — Calcul du coût total de possession
 * Permission: entretien:planifier
 *
 * Somme :
 * - Coût d'acquisition du matériel
 * - Coûts de tous les entretiens
 * - Montants de toutes les pièces administratives valides
 */
export const calculerTCO = actionProtegee(
  "entretien:planifier",
  async (session, materielId: string): Promise<ResultatTCO> => {
    // Récupérer le matériel
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
      select: {
        coutAcquisition: true,
      },
    });

    if (!materiel) {
      throw new Error("Matériel introuvable");
    }

    // Somme des coûts d'entretien
    const totalEntretiens = await prisma.entretien.aggregate({
      where: {
        materielId,
        cout: {
          not: null,
        },
      },
      _sum: {
        cout: true,
      },
    });

    // Somme des montants des pièces administratives valides
    const totalPieces = await prisma.pieceAdministrative.aggregate({
      where: {
        materielId,
        montant: {
          not: null,
        },
        dateExpiration: {
          gte: new Date(), // Seulement les pièces valides
        },
      },
      _sum: {
        montant: true,
      },
    });

    const coutAcquisition = materiel.coutAcquisition
      ? materiel.coutAcquisition.toNumber()
      : 0;
    const coutEntretiens = totalEntretiens._sum.cout
      ? totalEntretiens._sum.cout.toNumber()
      : 0;
    const coutPieces = totalPieces._sum.montant
      ? totalPieces._sum.montant.toNumber()
      : 0;

    return {
      coutAcquisition,
      coutEntretiens,
      coutPieces,
      total: coutAcquisition + coutEntretiens + coutPieces,
    };
  }
);
