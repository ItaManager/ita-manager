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
import { genererCode, validerFormat, type ResultatGeneration } from "@/lib/logistique/code";
import { Prisma, type TypeMateriel, type StatutMateriel } from "@prisma/client";

// =====================================================================
// M13 L1 — REGISTRE MATÉRIEL
// =====================================================================

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

/**
 * Vérifier si un code matériel existe déjà
 *
 * M13 L1 — Contrôle 1 décision 1.1
 */
export const verifierCodeExistant = actionProtegee(
  "materiel:creer",
  async (
    session,
    codeIta: string
  ): Promise<{ existe: boolean; materiel?: { designation: string } }> => {
    const materiel = await prisma.materiel.findUnique({
      where: { codeIta },
      select: { designation: true },
    });

    return {
      existe: !!materiel,
      materiel: materiel || undefined,
    };
  }
);

/**
 * Générer un nouveau code pour une famille
 *
 * M13 L1 — Génération code avec format flexible
 */
export const genererCodeMateriel = actionProtegee(
  "materiel:creer",
  async (
    session,
    params: {
      familleId: string;
      dateAcquisition?: Date;
    }
  ): Promise<ResultatGeneration> => {
    const famille = await prisma.familleMateriel.findUnique({
      where: { id: params.familleId },
      select: {
        code: true,
        formatCode: true,
        prochainNumero: true,
      },
    });

    if (!famille) {
      throw new Error("Famille introuvable");
    }

    const annee = params.dateAcquisition
      ? params.dateAcquisition.getFullYear()
      : undefined;

    return genererCode(famille, annee);
  }
);

/**
 * Créer un matériel
 *
 * M13 L1 — Création avec contrôles décision 1.1
 */
export const creerMateriel = actionProtegee(
  "materiel:creer",
  async (
    session,
    donnees: {
      codeIta: string;
      designation: string;
      familleId: string;
      type: TypeMateriel;
      statut: StatutMateriel;
      lieuBaseId?: string;
      numeroParcAncien?: string;
      codeLong?: string;
      numeroSerie?: string;
      marque?: string;
      modele?: string;
      dateAcquisition?: Date;
      coutAcquisition?: number;
    }
  ) => {
    // Contrôle 1 : Code déjà pris
    const existant = await prisma.materiel.findUnique({
      where: { codeIta: donnees.codeIta },
      select: { designation: true },
    });

    if (existant) {
      throw new Error(
        `Le code ${donnees.codeIta} est déjà utilisé par : ${existant.designation}`
      );
    }

    // Contrôle 2 : Format du code (warning seulement)
    const famille = await prisma.familleMateriel.findUnique({
      where: { id: donnees.familleId },
      select: { formatCode: true },
    });

    if (famille && !validerFormat(famille.formatCode)) {
      // Ne pas bloquer, juste logger
      console.warn(
        `Format invalide pour famille ${donnees.familleId}: ${famille.formatCode}`
      );
    }

    // Créer le matériel
    const data: any = {
      codeIta: donnees.codeIta,
      designation: donnees.designation,
      familleId: donnees.familleId,
      type: donnees.type,
      statut: donnees.statut,
      partageable: false, // Par défaut
    };

    // Champs optionnels
    if (donnees.lieuBaseId) data.lieuBaseId = donnees.lieuBaseId;
    if (donnees.numeroParcAncien)
      data.numeroParcAncien = donnees.numeroParcAncien;
    if (donnees.codeLong) data.codeLong = donnees.codeLong;
    if (donnees.numeroSerie) data.numeroSerie = donnees.numeroSerie;
    if (donnees.marque) data.marque = donnees.marque;
    if (donnees.modele) data.modele = donnees.modele;
    if (donnees.dateAcquisition) data.dateAcquisition = donnees.dateAcquisition;
    if (donnees.coutAcquisition)
      data.coutAcquisition = new Prisma.Decimal(donnees.coutAcquisition);

    const materiel = await prisma.materiel.create({
      data,
      include: {
        famille: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Materiel",
        entiteId: materiel.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Matériel créé : ${materiel.codeIta} - ${materiel.designation}`,
      },
    });

    revalidatePath("/ressources");
    return materiel;
  }
);
