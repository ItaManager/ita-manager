"use server";

/**
 * Server Actions — Journal d'audit
 *
 * Pagination par curseur (E-01) : ne jamais utiliser OFFSET/LIMIT,
 * toujours paginer par `id` (CUID chronologique).
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

const LIMITE_PAR_PAGE = 50;

export const listerEvenements = actionProtegee(
  "admin:journal" as const,
  async (
    session,
    params?: {
      curseur?: string; // Dernier ID vu (pagination)
      entite?: string;
      entiteId?: string;
      action?: string;
      auteurId?: string;
    }
  ) => {
    const where = {
      ...(params?.entite && { entite: params.entite }),
      ...(params?.entiteId && { entiteId: params.entiteId }),
      ...(params?.action && { action: params.action }),
      ...(params?.auteurId && { auteurId: params.auteurId }),
      // Pagination par curseur : events APRÈS le curseur
      ...(params?.curseur && {
        id: { lt: params.curseur },
      }),
    };

    const evenements = await prisma.journalEvenement.findMany({
      where,
      orderBy: { id: "desc" }, // Plus récents d'abord (CUID décroissant)
      take: LIMITE_PAR_PAGE + 1, // +1 pour savoir s'il y a une page suivante
      include: {
        auteur: {
          select: {
            email: true,
            roles: {
              include: {
                role: {
                  select: {
                    code: true,
                    libelle: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const aPageSuivante = evenements.length > LIMITE_PAR_PAGE;
    const resultats = aPageSuivante
      ? evenements.slice(0, LIMITE_PAR_PAGE)
      : evenements;

    const prochainCurseur = aPageSuivante
      ? resultats[resultats.length - 1]?.id
      : null;

    return {
      evenements: resultats,
      prochainCurseur,
      aPageSuivante,
    };
  }
);

export const obtenirStatistiquesAudit = actionProtegee(
  "admin:journal" as const,
  async (session) => {
    const [total, parAction, derniers7jours] = await Promise.all([
      // Total événements
      prisma.journalEvenement.count(),

      // Répartition par action
      prisma.journalEvenement.groupBy({
        by: ["action"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // Activité des 7 derniers jours
      prisma.journalEvenement.count({
        where: {
          survenuLe: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      parAction,
      derniers7jours,
    };
  }
);
