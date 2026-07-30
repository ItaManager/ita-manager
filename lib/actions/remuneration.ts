/**
 * Server Actions — M4 Rémunération
 *
 * Gestion de la grille salariale versionnée et des dérogations.
 *
 * PERMISSIONS UTILISÉES :
 * - grille:modifier : gérer les versions de grille
 * - derogation:valider : statuer (DFC)
 * - employe:donneesSensibles : consulter salaires
 */

"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import type { Decimal } from "@prisma/client/runtime/library";

// ====================================================================
// GRILLE SALARIALE — CRUD des versions
// ====================================================================

type EchelonInput = {
  niveau: "DIRECTION" | "CADRE" | "SUPPORT" | "OPERATIONNEL";
  min: number;
  med: number;
  max: number;
};

/**
 * Créer un brouillon de nouvelle version de grille
 * La version est calculée automatiquement (max + 1)
 */
export const creerBrouillonGrille = actionProtegee(
  "grille:modifier",
  async (session, echelons: EchelonInput[]) => {
    // Trouver dernière version
    const derniereGrille = await prisma.grilleSalariale.findFirst({
      orderBy: { version: "desc" },
    });

    const nouvelleVersion = derniereGrille ? derniereGrille.version + 1 : 1;

    // Vérifier cohérence fourchettes
    for (const ech of echelons) {
      if (!(ech.min < ech.med && ech.med < ech.max)) {
        throw new Error(
          `Fourchette incohérente pour niveau ${ech.niveau} : min < med < max requis`
        );
      }
    }

    const grille = await prisma.grilleSalariale.create({
      data: {
        version: nouvelleVersion,
        statut: "BROUILLON",
        creePar: session.userId,
        echelons: {
          create: echelons,
        },
      },
      include: { echelons: true },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "GrilleSalariale",
        entiteId: grille.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Brouillon version ${nouvelleVersion} créé`,
      },
    });

    return grille;
  }
);

/**
 * Publier une grille brouillon
 * Passe statut BROUILLON → PUBLIE, archive l'ancienne version
 */
export const publierGrille = actionProtegee(
  "grille:modifier",
  async (session, grilleId: string, dateEffet: Date) => {
    const grille = await prisma.grilleSalariale.findUnique({
      where: { id: grilleId },
      include: { echelons: true },
    });

    if (!grille) {
      throw new Error("Grille introuvable");
    }

    if (grille.statut !== "BROUILLON") {
      throw new Error("Seul un brouillon peut être publié");
    }

    // Archiver la version actuelle publiée
    await prisma.grilleSalariale.updateMany({
      where: { statut: "PUBLIE" },
      data: { statut: "ARCHIVE" },
    });

    // Publier la nouvelle version
    const grillePubliee = await prisma.grilleSalariale.update({
      where: { id: grilleId },
      data: {
        statut: "PUBLIE",
        dateEffet,
        valideLe: new Date(),
        validePar: session.userId,
      },
      include: { echelons: true },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "GrilleSalariale",
        entiteId: grilleId,
        action: "PUBLICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { version: grille.version, dateEffet },
        commentaire: `Grille v${grille.version} publiée avec effet au ${dateEffet.toISOString().split("T")[0]}`,
      },
    });

    return grillePubliee;
  }
);

/**
 * Lister toutes les versions de grille (publiée, brouillons, archives)
 */
export const listerGrilles = actionProtegee(
  "employe:donneesSensibles",
  async () => {
    const grilles = await prisma.grilleSalariale.findMany({
      include: { echelons: true },
      orderBy: { version: "desc" },
    });

    return grilles;
  }
);

/**
 * Récupérer la grille actuellement publiée
 */
export const obtenirGrillePubliee = actionProtegee(
  "employe:donneesSensibles",
  async () => {
    const grille = await prisma.grilleSalariale.findFirst({
      where: { statut: "PUBLIE" },
      include: { echelons: true },
    });

    return grille;
  }
);

/**
 * Supprimer un brouillon (impossible si publié ou archivé)
 */
export const supprimerBrouillonGrille = actionProtegee(
  "grille:modifier",
  async (session, grilleId: string) => {
    const grille = await prisma.grilleSalariale.findUnique({
      where: { id: grilleId },
    });

    if (!grille) {
      throw new Error("Grille introuvable");
    }

    if (grille.statut !== "BROUILLON") {
      throw new Error("Seuls les brouillons peuvent être supprimés");
    }

    await prisma.grilleSalariale.delete({
      where: { id: grilleId },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "GrilleSalariale",
        entiteId: grilleId,
        action: "SUPPRESSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Brouillon version ${grille.version} supprimé`,
      },
    });

    return { success: true };
  }
);

// ====================================================================
// DÉROGATIONS SALARIALES
// ====================================================================

/**
 * Vérifier si un salaire est hors grille pour un niveau hiérarchique donné
 */
export const verifierConformiteGrille = actionProtegee(
  "employe:donneesSensibles",
  async (
    session,
    niveau: "DIRECTION" | "CADRE" | "SUPPORT" | "OPERATIONNEL",
    salaire: number
  ) => {
    const grillePubliee = await prisma.grilleSalariale.findFirst({
      where: { statut: "PUBLIE" },
      include: { echelons: true },
    });

    if (!grillePubliee) {
      return {
        conforme: false,
        raison: "Aucune grille publiée",
        echelon: null,
      };
    }

    const echelon = grillePubliee.echelons.find((e) => e.niveau === niveau);

    if (!echelon) {
      return {
        conforme: false,
        raison: `Niveau ${niveau} introuvable dans la grille`,
        echelon: null,
      };
    }

    const min = Number(echelon.min);
    const max = Number(echelon.max);

    const conforme = salaire >= min && salaire <= max;

    return {
      conforme,
      raison: conforme
        ? "Salaire dans la fourchette"
        : `Salaire hors fourchette (${min} - ${max} FCFA)`,
      echelon: {
        niveau: echelon.niveau,
        min,
        med: Number(echelon.med),
        max,
      },
    };
  }
);

/**
 * Lister les dérogations salariales avec filtres
 */
export const listerDerogations = actionProtegee(
  "derogation:valider",
  async (
    session,
    filtres?: {
      statut?: "EN_ATTENTE" | "VALIDEE" | "REFUSEE";
      employeId?: string;
    }
  ) => {
    const derogations = await prisma.derogationSalariale.findMany({
      where: {
        ...(filtres?.statut && { statut: filtres.statut }),
        ...(filtres?.employeId && { employeId: filtres.employeId }),
      },
      include: {
        employe: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { demandeLe: "desc" },
    });

    return derogations;
  }
);

/**
 * Statuer sur une dérogation (DFC uniquement)
 */
export const statuerDerogation = actionProtegee(
  "derogation:valider",
  async (
    session,
    derogationId: string,
    decision: "VALIDEE" | "REFUSEE",
    commentaire?: string
  ) => {
    const derogation = await prisma.derogationSalariale.findUnique({
      where: { id: derogationId },
      include: { employe: true },
    });

    if (!derogation) {
      throw new Error("Dérogation introuvable");
    }

    if (derogation.statut !== "EN_ATTENTE") {
      throw new Error("Seules les demandes en attente peuvent être statuées");
    }

    const derogationMiseAJour = await prisma.derogationSalariale.update({
      where: { id: derogationId },
      data: {
        statut: decision,
        decideParId: session.userId,
        decideLe: new Date(),
        commentaire,
      },
      include: { employe: true },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DerogationSalariale",
        entiteId: derogationId,
        action: decision,
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          decision,
          employeMatricule: derogation.employe.matricule,
          montant: Number(derogation.montant),
        },
        commentaire: commentaire || `Dérogation ${decision.toLowerCase()}`,
      },
    });

    return derogationMiseAJour;
  }
);
