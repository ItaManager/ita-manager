"use server";

/**
 * M13 L3 — Server Actions : Lieux de stockage
 *
 * Fonctionnalités :
 * - CRUD lieux de stockage (entrepôt, garage, chantier)
 * - Lister les lieux actifs pour les sélecteurs
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import type { NatureLieu } from "@prisma/client";

// ========== Types ==========

type LieuInput = {
  libelle: string;
  nature: NatureLieu;
  projetId?: string;
};

// ========== Lieux de stockage ==========

/**
 * Créer un nouveau lieu de stockage
 */
export const creerLieu = actionProtegee(
  PERMISSIONS["referentiel:creer"].code,
  async (session, input: LieuInput) => {
    // Vérifier unicité du libellé
    const existant = await prisma.lieuStockage.findUnique({
      where: { libelle: input.libelle },
    });

    if (existant) {
      return {
        success: false,
        error: `Un lieu "${input.libelle}" existe déjà`,
      };
    }

    const lieu = await prisma.lieuStockage.create({
      data: {
        libelle: input.libelle,
        nature: input.nature,
        projetId: input.projetId,
        actif: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "LieuStockage",
        entiteId: lieu.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { libelle: lieu.libelle, nature: lieu.nature },
        commentaire: `Lieu de stockage "${lieu.libelle}" créé`,
      },
    });

    return { success: true, lieuId: lieu.id };
  },
);

/**
 * Modifier un lieu de stockage
 */
export const modifierLieu = actionProtegee(
  PERMISSIONS["referentiel:creer"].code,
  async (session, lieuId: string, input: Partial<LieuInput>) => {
    const avant = await prisma.lieuStockage.findUnique({
      where: { id: lieuId },
    });

    if (!avant) {
      return { success: false, error: "Lieu non trouvé" };
    }

    // Vérifier unicité si changement de libellé
    if (input.libelle && input.libelle !== avant.libelle) {
      const existant = await prisma.lieuStockage.findUnique({
        where: { libelle: input.libelle },
      });

      if (existant) {
        return {
          success: false,
          error: `Un lieu "${input.libelle}" existe déjà`,
        };
      }
    }

    const apres = await prisma.lieuStockage.update({
      where: { id: lieuId },
      data: {
        libelle: input.libelle ?? avant.libelle,
        nature: input.nature ?? avant.nature,
        projetId: input.projetId !== undefined ? input.projetId : avant.projetId,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "LieuStockage",
        entiteId: lieuId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { avant, apres },
        commentaire: `Lieu "${avant.libelle}" modifié`,
      },
    });

    return { success: true };
  },
);

/**
 * Désactiver un lieu de stockage
 */
export const desactiverLieu = actionProtegee(
  PERMISSIONS["referentiel:creer"].code,
  async (session, lieuId: string) => {
    const lieu = await prisma.lieuStockage.update({
      where: { id: lieuId },
      data: { actif: false },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "LieuStockage",
        entiteId: lieuId,
        action: "DESACTIVATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Lieu "${lieu.libelle}" désactivé`,
      },
    });

    return { success: true };
  },
);

/**
 * Lister les lieux de stockage avec pagination
 */
export const listerLieux = actionProtegee(
  PERMISSIONS["materiel:lire"].code,
  async (_session, page: number = 1, nature?: NatureLieu) => {
    const limite = 25;
    const offset = (page - 1) * limite;

    const where = nature ? { nature } : {};

    const [lieux, total] = await Promise.all([
      prisma.lieuStockage.findMany({
        where,
        include: {
          projet: {
            select: { code: true, nom: true },
          },
        },
        orderBy: { libelle: "asc" },
        skip: offset,
        take: limite,
      }),
      prisma.lieuStockage.count({ where }),
    ]);

    return {
      lieux,
      total,
      pages: Math.ceil(total / limite),
      page,
    };
  },
);

/**
 * Lister les lieux actifs (pour sélecteurs)
 */
export const listerLieuxActifs = actionProtegee(
  PERMISSIONS["materiel:lire"].code,
  async (_session) => {
    const lieux = await prisma.lieuStockage.findMany({
      where: { actif: true },
      select: { id: true, libelle: true, nature: true },
      orderBy: { libelle: "asc" },
    });

    return { lieux };
  },
);
