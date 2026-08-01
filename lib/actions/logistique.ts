"use server";

/**
 * Server Actions — Logistique (M13)
 *
 * M13 §3 : Registre matériel avec pagination serveur
 * E-01 : Pagination serveur, 25 lignes, état dans l'URL
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, verifierPermission, PERMISSIONS } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

// =====================================================================
// M13 L1 — REGISTRE MATÉRIEL
// =====================================================================

import type { TypeMateriel, StatutMateriel } from "@prisma/client";

export type MaterielRegistreItem = {
  id: string;
  codeIta: string;
  numeroParcAncien: string | null;
  codeLong: string | null;
  designation: string;
  famille: {
    code: string;
    libelle: string;
  };
  type: TypeMateriel;
  statut: StatutMateriel;
  lieuBase: {
    libelle: string;
  } | null;
  // Coûts masqués si pas la permission
  coutAcquisition: number | null;
};

export type ResultatListeMateriel = {
  items: MaterielRegistreItem[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
};

/**
 * Lister le registre matériel avec pagination et recherche
 *
 * M13 L1 — Registre matériel (étape 3)
 * - Pagination serveur 25 lignes
 * - Recherche sur les trois codes
 * - Coûts masqués sans materiel:coutsAdministratifs
 */
export const listerMaterielM13 = actionProtegee(
  "materiel:lire",
  async (
    session,
    params: {
      page?: number;
      recherche?: string; // Recherche sur les 3 codes
    } = {}
  ): Promise<ResultatListeMateriel> => {
    const page = params.page || 1;
    const perPage = 25; // E-01 : 25 lignes
    const skip = (page - 1) * perPage;

    // Vérifier permission pour les coûts
    const peutVoirCouts = await verifierPermission(
      session.userId,
      "materiel:coutsAdministratifs"
    );

    // Construire le where pour la recherche
    const where: any = {};
    if (params.recherche && params.recherche.trim()) {
      const rechercheTrimmed = params.recherche.trim();
      where.OR = [
        { codeIta: { contains: rechercheTrimmed, mode: "insensitive" } },
        {
          numeroParcAncien: {
            contains: rechercheTrimmed,
            mode: "insensitive",
          },
        },
        { codeLong: { contains: rechercheTrimmed, mode: "insensitive" } },
      ];
    }

    // Compter le total
    const total = await prisma.materiel.count({ where });

    // Récupérer les items
    const materiel = await prisma.materiel.findMany({
      where,
      select: {
        id: true,
        codeIta: true,
        numeroParcAncien: true,
        codeLong: true,
        designation: true,
        famille: {
          select: {
            code: true,
            libelle: true,
          },
        },
        type: true,
        statut: true,
        lieuBase: {
          select: {
            libelle: true,
          },
        },
        coutAcquisition: peutVoirCouts,
      },
      orderBy: [{ codeIta: "asc" }],
      skip,
      take: perPage,
    });

    const items: MaterielRegistreItem[] = materiel.map((m) => ({
      id: m.id,
      codeIta: m.codeIta,
      numeroParcAncien: m.numeroParcAncien,
      codeLong: m.codeLong,
      designation: m.designation,
      famille: m.famille,
      type: m.type,
      statut: m.statut,
      lieuBase: m.lieuBase,
      coutAcquisition: peutVoirCouts && m.coutAcquisition ? m.coutAcquisition.toNumber() : null,
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
