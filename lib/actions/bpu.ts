"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

// ============================================================================
// CRÉATION ET IMPORT DE BPU
// ============================================================================

interface LigneBPUImport {
  numero: string;
  type?: string;
  description: string;
  unite: string;
  prixUnitaireHT: number;
  ordre: number;
}

interface SerieBPUImport {
  code: string;
  titre: string;
  sousTitre?: string;
  ordre: number;
  lignes: LigneBPUImport[];
}

interface LotBPUImport {
  numero: string;
  titre: string;
  categorie?: string;
  ordre: number;
  series: SerieBPUImport[];
}

interface BPUImportData {
  nom: string;
  description?: string;
  fichierSource?: string;
  lots: LotBPUImport[];
}

/**
 * Importer un BPU pour un projet
 */
export const importerBPU = actionProtegee(
  "projet:modifier",
  async (session, projetId: string, data: BPUImportData) => {
    // Créer le BPU
    const bpu = await prisma.bordereauPrixUnitaire.create({
      data: {
        projetId,
        nom: data.nom,
        description: data.description,
        fichierSource: data.fichierSource,
        lots: {
          create: data.lots.map((lot) => ({
            numero: lot.numero,
            titre: lot.titre,
            categorie: lot.categorie,
            ordre: lot.ordre,
            series: {
              create: lot.series.map((serie) => ({
                code: serie.code,
                titre: serie.titre,
                sousTitre: serie.sousTitre,
                ordre: serie.ordre,
                lignes: {
                  create: serie.lignes.map((ligne) => ({
                    numero: ligne.numero,
                    type: ligne.type,
                    description: ligne.description,
                    unite: ligne.unite,
                    prixUnitaireHT: ligne.prixUnitaireHT,
                    ordre: ligne.ordre,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        lots: {
          include: {
            series: {
              include: {
                lignes: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/achats/bpu-projets");
    return bpu;
  }
);

// ============================================================================
// LECTURE ET CONSULTATION
// ============================================================================

/**
 * Lister tous les BPU
 */
// @ts-ignore - Permission projet:lire à ajouter
export const listerBPU = actionProtegee("projet:lire", async (session) => {
  return await prisma.bordereauPrixUnitaire.findMany({
    include: {
      projet: {
        select: {
          id: true,
          code: true,
          nom: true,
        },
      },
      _count: {
        select: {
          lots: true,
        },
      },
    },
    orderBy: { dateImport: "desc" },
  });
});

/**
 * Obtenir un BPU complet avec toute sa hiérarchie
 */
// @ts-ignore - Permission projet:lire à ajouter
export const obtenirBPU = actionProtegee(
  "projet:lire",
  async (session, bpuId: string) => {
    return await prisma.bordereauPrixUnitaire.findUnique({
      where: { id: bpuId },
      include: {
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        lots: {
          include: {
            series: {
              include: {
                lignes: {
                  orderBy: { ordre: "asc" },
                },
              },
              orderBy: { ordre: "asc" },
            },
          },
          orderBy: { ordre: "asc" },
        },
      },
    });
  }
);

/**
 * Lister les BPU d'un projet
 */
// @ts-ignore - Permission projet:lire à ajouter
export const listerBPUProjet = actionProtegee(
  "projet:lire",
  async (session, projetId: string) => {
    return await prisma.bordereauPrixUnitaire.findMany({
      where: { projetId },
      include: {
        _count: {
          select: {
            lots: true,
          },
        },
      },
      orderBy: { dateImport: "desc" },
    });
  }
);

// ============================================================================
// SUPPRESSION
// ============================================================================

/**
 * Supprimer un BPU (cascade sur lots, séries, lignes)
 */
export const supprimerBPU = actionProtegee(
  "projet:modifier",
  async (session, bpuId: string) => {
    await prisma.bordereauPrixUnitaire.delete({
      where: { id: bpuId },
    });

    revalidatePath("/achats/bpu-projets");
  }
);
