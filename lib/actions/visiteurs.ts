"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { MotifVisite } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * M16 L1.3 — Enregistrer l'arrivée d'un visiteur
 */
export const enregistrerArrivee = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (
    session,
    data: {
      nomVisiteur: string;
      societe?: string;
      telephone?: string;
      visiteId: string;
      motif: MotifVisite;
      pieceDeposee: boolean;
    }
  ) => {
    const visite = await prisma.visite.create({
      data: {
        nomVisiteur: data.nomVisiteur,
        societe: data.societe,
        telephone: data.telephone,
        visiteId: data.visiteId,
        motif: data.motif,
        pieceDeposee: data.pieceDeposee,
        saisieParId: session.userId,
      },
      include: {
        visite: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Visite",
        entiteId: visite.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          nomVisiteur: data.nomVisiteur,
          societe: data.societe,
          visite: `${visite.visite.prenom} ${visite.visite.nom}`,
        },
        commentaire: "Arrivée enregistrée",
      },
    });

    revalidatePath("/assistanat/visiteurs");
    return { success: true, visite };
  }
);

/**
 * M16 L1.4 — Enregistrer la sortie d'un visiteur (un clic)
 */
export const enregistrerSortie = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session, visiteId: string) => {
    const visite = await prisma.visite.update({
      where: { id: visiteId },
      data: {
        sortieLe: new Date(),
      },
      include: {
        visite: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Visite",
        entiteId: visite.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          nomVisiteur: visite.nomVisiteur,
          sortieLe: visite.sortieLe,
        },
        commentaire: "Sortie enregistrée",
      },
    });

    revalidatePath("/assistanat/visiteurs");
    return { success: true, visite };
  }
);

/**
 * M16 L1.3 — Lister les visites du jour
 */
export const listerVisitesJour = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session) => {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const visites = await prisma.visite.findMany({
      where: {
        arriveeLe: {
          gte: aujourdhui,
        },
      },
      include: {
        visite: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: {
        arriveeLe: "desc",
      },
    });

    // Compter les présents (sortieLe = null)
    const presentsCount = visites.filter((v) => !v.sortieLe).length;

    return { visites, presentsCount };
  }
);

/**
 * M16 L1.3 — Rechercher un habitué (suggestions)
 *
 * Retourne les dernières visites d'une personne pour pré-remplir le formulaire
 */
export const rechercherHabitue = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session, nom: string) => {
    if (nom.length < 3) {
      return { suggestions: [] };
    }

    const suggestions = await prisma.visite.findMany({
      where: {
        nomVisiteur: {
          contains: nom,
          mode: "insensitive",
        },
      },
      select: {
        nomVisiteur: true,
        societe: true,
        pieceDeposee: true,
      },
      distinct: ["nomVisiteur"],
      orderBy: {
        arriveeLe: "desc",
      },
      take: 5,
    });

    return { suggestions };
  }
);

/**
 * M16 L1.3 — Lister les sociétés pour autocomplétation
 */
export const listerSocietes = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session) => {
    const societes = await prisma.visite.findMany({
      where: {
        societe: {
          not: null,
        },
      },
      select: {
        societe: true,
      },
      distinct: ["societe"],
      orderBy: {
        societe: "asc",
      },
    });

    return { societes: societes.map((s) => s.societe).filter((s): s is string => s !== null) };
  }
);

/**
 * M16 L1.3 — Lister les employés pour autocomplétation "personne visitée"
 */
export const listerEmployesPourVisite = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session) => {
    const employes = await prisma.employe.findMany({
      where: {
        archiveLe: null,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return { employes };
  }
);

/**
 * M16 — Lister l'historique des visites (avec pagination)
 */
export const listerHistoriqueVisites = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session, page: number = 1, limit: number = 25) => {
    const skip = (page - 1) * limit;

    const [visites, total] = await Promise.all([
      prisma.visite.findMany({
        include: {
          visite: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
        orderBy: {
          arriveeLe: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.visite.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { visites, total, totalPages, currentPage: page };
  }
);

/**
 * M16 L1.4 — Détecter les visites non closes (anomalies)
 *
 * Visites avec arriveeLe avant aujourd'hui et sortieLe = null
 */
export const detecterVisitesNonCloses = actionProtegee(
  PERMISSIONS["visiteur:enregistrer"].code,
  async (session) => {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const visitesNonCloses = await prisma.visite.findMany({
      where: {
        arriveeLe: {
          lt: aujourdhui,
        },
        sortieLe: null,
      },
      include: {
        visite: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: {
        arriveeLe: "desc",
      },
    });

    return { visitesNonCloses };
  }
);
