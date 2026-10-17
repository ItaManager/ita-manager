"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

// ============================================================================
// CRUD BORDEREAU DE PRIX SIMPLE
// ============================================================================

interface LigneBordereauInput {
  lotNumero: string;
  numero: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  ordre?: number;
}

/**
 * Lister toutes les lignes du bordereau
 */
export const listerLignesBordereau = actionProtegee(
  "achat:demander",
  async (session) => {
    return await prisma.ligneBordereauPrix.findMany({
      orderBy: [{ lotNumero: "asc" }, { ordre: "asc" }],
    });
  }
);

/**
 * Créer une ligne de bordereau
 */
export const creerLigneBordereau = actionProtegee(
  "achat:instruire",
  async (session, data: LigneBordereauInput) => {
    const ligne = await prisma.ligneBordereauPrix.create({
      data: {
        ...data,
        creePar: session.userId,
      },
    });

    revalidatePath("/achats/bordereau-prix-simple");
    return ligne;
  }
);

/**
 * Modifier une ligne de bordereau
 */
export const modifierLigneBordereau = actionProtegee(
  "achat:instruire",
  async (session, id: string, data: LigneBordereauInput) => {
    const ligne = await prisma.ligneBordereauPrix.update({
      where: { id },
      data,
    });

    revalidatePath("/achats/bordereau-prix-simple");
    return ligne;
  }
);

/**
 * Supprimer une ligne de bordereau
 */
export const supprimerLigneBordereau = actionProtegee(
  "achat:instruire",
  async (session, id: string) => {
    await prisma.ligneBordereauPrix.delete({
      where: { id },
    });

    revalidatePath("/achats/bordereau-prix-simple");
  }
);
