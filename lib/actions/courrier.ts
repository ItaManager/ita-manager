"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { SensCourrier, StatutTraitement } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * M16 L1.5 — Enregistrer un courrier arrivée
 */
export const enregistrerCourrierArrivee = actionProtegee(
  PERMISSIONS["courrier:enregistrer"].code,
  async (
    session,
    data: {
      dateCorrespondance: Date;
      datePassage: Date;
      tiers: string;
      referenceTiers?: string;
      objet: string;
      serviceId?: string;
      directionId?: string;
      fichierId?: string;
    }
  ) => {
    const courrier = await prisma.$transaction(async (tx) => {
      // Générer le numéro: ITA-{ANNEE}-{SEQ:4}
      const annee = new Date().getFullYear();
      const dernier = await tx.courrier.findFirst({
        where: { numero: { startsWith: `ITA-${annee}-` } },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const seq = dernier ? Number(dernier.numero.slice(-4)) + 1 : 1;
      const numero = `ITA-${annee}-${seq.toString().padStart(4, "0")}`;

      return tx.courrier.create({
        data: {
          numero,
          sens: SensCourrier.ARRIVEE,
          dateCorrespondance: data.dateCorrespondance,
          datePassage: data.datePassage,
          tiers: data.tiers,
          referenceTiers: data.referenceTiers,
          objet: data.objet,
          serviceId: data.serviceId,
          directionId: data.directionId,
          fichierId: data.fichierId,
          statutTraitement: StatutTraitement.A_TRAITER,
          saisieParId: session.userId,
        },
        include: {
          service: { select: { libelle: true } },
          direction: { select: { libelle: true } },
        },
      });
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Courrier",
        entiteId: courrier.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          numero: courrier.numero,
          sens: "ARRIVEE",
          tiers: data.tiers,
          objet: data.objet,
        },
        commentaire: "Courrier arrivée enregistré",
      },
    });

    revalidatePath("/assistanat/courrier/arrivee");
    revalidatePath("/assistanat/courrier/a-traiter");
    return { success: true, courrier };
  }
);

/**
 * M16 L1.5 — Enregistrer un courrier départ
 */
export const enregistrerCourrierDepart = actionProtegee(
  PERMISSIONS["courrier:enregistrer"].code,
  async (
    session,
    data: {
      dateCorrespondance: Date;
      datePassage: Date;
      tiers: string;
      referenceTiers?: string;
      objet: string;
      serviceId?: string;
      directionId?: string;
      fichierId?: string;
    }
  ) => {
    const courrier = await prisma.$transaction(async (tx) => {
      // Générer le numéro: ITA-{ANNEE}-{SEQ:4}
      const annee = new Date().getFullYear();
      const dernier = await tx.courrier.findFirst({
        where: { numero: { startsWith: `ITA-${annee}-` } },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });

      const seq = dernier ? Number(dernier.numero.slice(-4)) + 1 : 1;
      const numero = `ITA-${annee}-${seq.toString().padStart(4, "0")}`;

      return tx.courrier.create({
        data: {
          numero,
          sens: SensCourrier.DEPART,
          dateCorrespondance: data.dateCorrespondance,
          datePassage: data.datePassage,
          tiers: data.tiers,
          referenceTiers: data.referenceTiers,
          objet: data.objet,
          serviceId: data.serviceId,
          directionId: data.directionId,
          fichierId: data.fichierId,
          // Pas de statut pour départ
          statutTraitement: StatutTraitement.A_TRAITER, // Par défaut, mais ignoré
          saisieParId: session.userId,
        },
        include: {
          service: { select: { libelle: true } },
          direction: { select: { libelle: true } },
        },
      });
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Courrier",
        entiteId: courrier.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          numero: courrier.numero,
          sens: "DEPART",
          tiers: data.tiers,
          objet: data.objet,
        },
        commentaire: "Courrier départ enregistré",
      },
    });

    revalidatePath("/assistanat/courrier/depart");
    return { success: true, courrier };
  }
);

/**
 * M16 L1.5 — Lister les courriers arrivée
 */
export const listerCourrierArrivee = actionProtegee(
  PERMISSIONS["courrier:enregistrer"].code,
  async (session, page: number = 1, limit: number = 25) => {
    const skip = (page - 1) * limit;

    const [courriers, total] = await Promise.all([
      prisma.courrier.findMany({
        where: {
          sens: SensCourrier.ARRIVEE,
        },
        include: {
          service: { select: { libelle: true } },
          direction: { select: { libelle: true } },
        },
        orderBy: {
          datePassage: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.courrier.count({
        where: {
          sens: SensCourrier.ARRIVEE,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { courriers, total, totalPages, currentPage: page };
  }
);

/**
 * M16 L1.5 — Lister les courriers départ
 */
export const listerCourrierDepart = actionProtegee(
  PERMISSIONS["courrier:enregistrer"].code,
  async (session, page: number = 1, limit: number = 25) => {
    const skip = (page - 1) * limit;

    const [courriers, total] = await Promise.all([
      prisma.courrier.findMany({
        where: {
          sens: SensCourrier.DEPART,
        },
        include: {
          service: { select: { libelle: true } },
          direction: { select: { libelle: true } },
        },
        orderBy: {
          datePassage: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.courrier.count({
        where: {
          sens: SensCourrier.DEPART,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { courriers, total, totalPages, currentPage: page };
  }
);

/**
 * M16 L1.6 — Lister les courriers à traiter (ARRIVEE seulement)
 */
export const listerCourrierATraiter = actionProtegee(
  PERMISSIONS["courrier:traiter"].code,
  async (session, page: number = 1, limit: number = 25) => {
    const skip = (page - 1) * limit;

    const [courriers, total] = await Promise.all([
      prisma.courrier.findMany({
        where: {
          sens: SensCourrier.ARRIVEE,
          statutTraitement: {
            in: [StatutTraitement.A_TRAITER, StatutTraitement.TRAITE],
          },
        },
        include: {
          service: { select: { libelle: true } },
          direction: { select: { libelle: true } },
          traitePar: { select: { email: true } },
        },
        orderBy: [
          { statutTraitement: "asc" }, // A_TRAITER en premier
          { datePassage: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.courrier.count({
        where: {
          sens: SensCourrier.ARRIVEE,
          statutTraitement: StatutTraitement.A_TRAITER,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { courriers, total, totalPages, currentPage: page, aTraiterCount: total };
  }
);

/**
 * M16 L1.6 — Marquer un courrier comme traité
 */
export const marquerTraite = actionProtegee(
  PERMISSIONS["courrier:traiter"].code,
  async (
    session,
    data: {
      courrierId: string;
      commentaireTraitement?: string;
    }
  ) => {
    const courrier = await prisma.courrier.update({
      where: { id: data.courrierId },
      data: {
        statutTraitement: StatutTraitement.TRAITE,
        traiteLe: new Date(),
        traiteParId: session.userId,
        commentaireTraitement: data.commentaireTraitement,
      },
      include: {
        service: { select: { libelle: true } },
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Courrier",
        entiteId: courrier.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          numero: courrier.numero,
          statutTraitement: "TRAITE",
        },
        commentaire: "Courrier marqué traité",
      },
    });

    revalidatePath("/assistanat/courrier/a-traiter");
    return { success: true, courrier };
  }
);

/**
 * M16 L1.6 — Marquer un courrier comme sans suite
 */
export const marquerSansSuite = actionProtegee(
  PERMISSIONS["courrier:traiter"].code,
  async (
    session,
    data: {
      courrierId: string;
      commentaireTraitement: string;
    }
  ) => {
    const courrier = await prisma.courrier.update({
      where: { id: data.courrierId },
      data: {
        statutTraitement: StatutTraitement.SANS_SUITE,
        traiteLe: new Date(),
        traiteParId: session.userId,
        commentaireTraitement: data.commentaireTraitement,
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Courrier",
        entiteId: courrier.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          numero: courrier.numero,
          statutTraitement: "SANS_SUITE",
        },
        commentaire: "Courrier classé sans suite",
      },
    });

    revalidatePath("/assistanat/courrier/a-traiter");
    return { success: true, courrier };
  }
);
