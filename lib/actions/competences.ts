/**
 * M17 — Compétences et taux journaliers
 * Actions serveur pour la gestion des compétences (Direction Technique)
 */

"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { CategorieCompetence } from "@prisma/client";

// =====================================================================
// FONCTIONS UTILITAIRES
// =====================================================================

/**
 * Normalise un libellé pour la détection de doublons
 * Minuscules, sans accent, sans espace superflu
 */
function normaliserLibelle(libelle: string): string {
  return libelle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
    .trim()
    .replace(/\s+/g, " "); // Réduire espaces multiples à un seul
}

// =====================================================================
// TYPES
// =====================================================================

export interface CompetenceListItem {
  id: string;
  libelle: string;
  categorie: CategorieCompetence;
  description: string | null;
  actif: boolean;
  creeLe: Date;
  nombreAgents: number;
  nombreVersionsTaux: number;
  tauxCourant: { montant: string; dateEffet: Date } | null;
}

interface CreerCompetenceParams {
  libelle: string;
  categorie: CategorieCompetence;
  description?: string;
  composantesIds?: string[]; // IDs des compétences composantes (si COMPOSEE)
}

interface ModifierCompetenceParams {
  id: string;
  libelle: string;
  categorie: CategorieCompetence;
  description?: string;
  composantesIds?: string[]; // IDs des compétences composantes (si COMPOSEE)
}

interface FiltresCompetences {
  actives?: boolean;
  sansTaux?: boolean;
  composees?: boolean;
  archivees?: boolean;
}

// =====================================================================
// ACTIONS SERVEUR — DIRECTION TECHNIQUE
// =====================================================================

/**
 * Liste les compétences avec filtres et tri
 * Tri : sans taux en tête, puis par montant décroissant
 */
export const listerCompetences = actionProtegee(
  PERMISSIONS["competence:lire"].code,
  async (session, filtres: FiltresCompetences = {}) => {
    const where: any = {};

    // Filtres
    if (filtres.actives) where.actif = true;
    if (filtres.archivees) where.actif = false;
    if (filtres.composees) where.categorie = CategorieCompetence.COMPOSEE;

    const competences = await prisma.competence.findMany({
      where,
      include: {
        taux: {
          orderBy: { dateEffet: "desc" },
          take: 1,
        },
        affectations: {
          where: { dateFin: null }, // Affectations ouvertes seulement
        },
        _count: {
          select: {
            taux: true,
          },
        },
      },
      orderBy: { creeLe: "desc" },
    });

    // Mapper les résultats
    const items: CompetenceListItem[] = competences.map((c) => ({
      id: c.id,
      libelle: c.libelle,
      categorie: c.categorie,
      description: c.description,
      actif: c.actif,
      creeLe: c.creeLe,
      nombreAgents: c.affectations.length,
      nombreVersionsTaux: c._count.taux,
      tauxCourant: c.taux[0]
        ? {
            montant: c.taux[0].montant.toString(),
            dateEffet: c.taux[0].dateEffet,
          }
        : null,
    }));

    // Filtre "sans taux" (après fetch pour simplicité)
    let resultat = items;
    if (filtres.sansTaux) {
      resultat = items.filter((c) => !c.tauxCourant);
    }

    // Tri : sans taux en tête, puis par montant décroissant
    resultat.sort((a, b) => {
      if (!a.tauxCourant && b.tauxCourant) return -1;
      if (a.tauxCourant && !b.tauxCourant) return 1;
      if (!a.tauxCourant && !b.tauxCourant) return 0;
      return (
        parseFloat(b.tauxCourant!.montant) - parseFloat(a.tauxCourant!.montant)
      );
    });

    return resultat;
  }
);

/**
 * Crée une nouvelle compétence
 * Si un doublon existe sur libelleNormalise, renvoie l'existant (patron 5)
 */
export const creerCompetence = actionProtegee(
  PERMISSIONS["competence:gerer"].code,
  async (session, params: CreerCompetenceParams) => {
    const libelleNormalise = normaliserLibelle(params.libelle);

    // Vérifier doublon
    const existant = await prisma.competence.findUnique({
      where: { libelleNormalise },
    });

    if (existant) {
      return {
        success: true,
        data: existant,
        message: "Une compétence avec ce libellé existe déjà",
      };
    }

    // Validation : une composée exige >= 2 métiers qualifiés
    if (params.categorie === CategorieCompetence.COMPOSEE) {
      if (!params.composantesIds || params.composantesIds.length < 2) {
        return {
          success: false,
          error:
            "Une compétence composée doit réunir au moins deux compétences qualifiées",
        };
      }

      // Vérifier que les composantes sont bien qualifiées et actives
      const composantes = await prisma.competence.findMany({
        where: {
          id: { in: params.composantesIds },
          categorie: CategorieCompetence.QUALIFIE,
          actif: true,
        },
      });

      if (composantes.length !== params.composantesIds.length) {
        return {
          success: false,
          error:
            "Toutes les composantes doivent être des compétences qualifiées et actives",
        };
      }
    }

    // Créer la compétence
    const competence = await prisma.competence.create({
      data: {
        libelle: params.libelle,
        libelleNormalise,
        categorie: params.categorie,
        description: params.description,
        creeParId: session.userId,
        composantes:
          params.categorie === CategorieCompetence.COMPOSEE &&
          params.composantesIds
            ? {
                connect: params.composantesIds.map((id) => ({ id })),
              }
            : undefined,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Competence",
        entiteId: competence.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Création de la compétence "${params.libelle}" (${params.categorie})`,
      },
    });

    return {
      success: true,
      data: competence,
      message: "Compétence créée avec succès",
    };
  }
);

/**
 * Modifie une compétence existante
 */
export const modifierCompetence = actionProtegee(
  PERMISSIONS["competence:gerer"].code,
  async (session, params: ModifierCompetenceParams) => {
    const competence = await prisma.competence.findUnique({
      where: { id: params.id },
      include: { composantes: true },
    });

    if (!competence) {
      return { success: false, error: "Compétence introuvable" };
    }

    const libelleNormalise = normaliserLibelle(params.libelle);

    // Vérifier doublon (sauf si c'est le même libellé)
    if (libelleNormalise !== competence.libelleNormalise) {
      const doublon = await prisma.competence.findUnique({
        where: { libelleNormalise },
      });

      if (doublon) {
        return {
          success: false,
          error: "Une compétence avec ce libellé existe déjà",
        };
      }
    }

    // Validation composée
    if (params.categorie === CategorieCompetence.COMPOSEE) {
      if (!params.composantesIds || params.composantesIds.length < 2) {
        return {
          success: false,
          error:
            "Une compétence composée doit réunir au moins deux compétences qualifiées",
        };
      }

      const composantes = await prisma.competence.findMany({
        where: {
          id: { in: params.composantesIds },
          categorie: CategorieCompetence.QUALIFIE,
          actif: true,
        },
      });

      if (composantes.length !== params.composantesIds.length) {
        return {
          success: false,
          error:
            "Toutes les composantes doivent être des compétences qualifiées et actives",
        };
      }
    }

    // Mettre à jour
    const updated = await prisma.competence.update({
      where: { id: params.id },
      data: {
        libelle: params.libelle,
        libelleNormalise,
        categorie: params.categorie,
        description: params.description,
        composantes:
          params.categorie === CategorieCompetence.COMPOSEE &&
          params.composantesIds
            ? {
                set: params.composantesIds.map((id) => ({ id })),
              }
            : { set: [] },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Competence",
        entiteId: updated.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Modification de la compétence "${params.libelle}"`,
      },
    });

    return {
      success: true,
      data: updated,
      message: "Compétence modifiée avec succès",
    };
  }
);

/**
 * Archive une compétence
 * Contrôle bloquant : impossible si des agents la portent
 */
export const archiverCompetence = actionProtegee(
  PERMISSIONS["competence:gerer"].code,
  async (session, competenceId: string, motif: string) => {
    const competence = await prisma.competence.findUnique({
      where: { id: competenceId },
      include: {
        affectations: {
          where: { dateFin: null }, // Affectations ouvertes
          include: {
            employe: {
              select: { nom: true, prenom: true, matricule: true },
            },
          },
        },
      },
    });

    if (!competence) {
      return { success: false, error: "Compétence introuvable" };
    }

    if (competence.affectations.length > 0) {
      const noms = competence.affectations
        .map((a) => `${a.employe.prenom} ${a.employe.nom} (${a.employe.matricule})`)
        .join(", ");

      return {
        success: false,
        error: `Impossible d'archiver : ${competence.affectations.length} agent(s) portent cette compétence (${noms}). Réaffectez-les d'abord.`,
      };
    }

    // Archiver
    const updated = await prisma.competence.update({
      where: { id: competenceId },
      data: {
        actif: false,
        motifArchivage: motif,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Competence",
        entiteId: updated.id,
        action: "ARCHIVAGE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Archivage de la compétence "${competence.libelle}". Motif : ${motif}`,
      },
    });

    return {
      success: true,
      data: updated,
      message: "Compétence archivée avec succès",
    };
  }
);
