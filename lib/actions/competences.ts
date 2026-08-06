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

// =====================================================================
// ACTIONS SERVEUR — DIRECTION FINANCIÈRE
// =====================================================================

interface FixerTauxParams {
  competenceId: string;
  montant: number; // XOF entier
  dateEffet: Date;
  motif?: string; // Requis si un taux existe déjà
}

/**
 * Renvoie le taux en vigueur à une date donnée
 * Code exact de M17-COMPETENCES.md § 3.4
 */
export async function tauxEnVigueur(competenceId: string, date: Date) {
  return await prisma.tauxJournalier.findFirst({
    where: { competenceId, dateEffet: { lte: date } },
    orderBy: { dateEffet: "desc" },
  });
}

/**
 * Fixe ou révise le taux d'une compétence
 * Crée une NOUVELLE ligne — aucun UPDATE sur TauxJournalier
 */
export const fixerTaux = actionProtegee(
  PERMISSIONS["taux:definir"].code,
  async (session, params: FixerTauxParams) => {
    // Vérifier que la compétence existe
    const competence = await prisma.competence.findUnique({
      where: { id: params.competenceId },
      include: {
        taux: {
          orderBy: { dateEffet: "desc" },
        },
        affectations: {
          where: { dateFin: null },
        },
      },
    });

    if (!competence) {
      return { success: false, error: "Compétence introuvable" };
    }

    // Contrôle : un taux existe déjà à cette date ?
    const tauxExistant = await prisma.tauxJournalier.findUnique({
      where: {
        competenceId_dateEffet: {
          competenceId: params.competenceId,
          dateEffet: params.dateEffet,
        },
      },
    });

    if (tauxExistant) {
      return {
        success: false,
        error:
          "Un taux existe déjà à cette date d'effet. Choisissez une autre date, ou corrigez le taux existant.",
      };
    }

    // Vérifier motif si révision
    const estRevision = competence.taux.length > 0;
    if (estRevision && !params.motif) {
      return {
        success: false,
        error: "Un motif est requis pour réviser un taux (minimum 20 caractères)",
      };
    }

    if (estRevision && params.motif && params.motif.length < 20) {
      return {
        success: false,
        error: "Le motif doit comporter au moins 20 caractères",
      };
    }

    // Créer le nouveau taux (INSERT, jamais UPDATE)
    const nouveauTaux = await prisma.tauxJournalier.create({
      data: {
        competenceId: params.competenceId,
        montant: params.montant,
        dateEffet: params.dateEffet,
        motif: params.motif,
        definiParId: session.userId,
      },
    });

    // Calculer la variation si révision
    let variation: number | null = null;
    let ancienMontant: number | null = null;
    if (estRevision && competence.taux[0]) {
      ancienMontant = parseFloat(competence.taux[0].montant.toString());
      variation = ((params.montant - ancienMontant) / ancienMontant) * 100;
    }

    // Journaliser
    const commentaire = estRevision
      ? `Révision du taux de "${competence.libelle}" : ${ancienMontant} F → ${params.montant} F (${variation! > 0 ? "+" : ""}${variation!.toFixed(1)} %). ${competence.affectations.length} agent(s) concerné(s). Motif : ${params.motif}`
      : `Première fixation du taux de "${competence.libelle}" : ${params.montant} F/jour`;

    await prisma.journalEvenement.create({
      data: {
        entite: "TauxJournalier",
        entiteId: nouveauTaux.id,
        action: estRevision ? "MODIFICATION" : "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire,
        details: estRevision
          ? {
              ancienMontant,
              nouveauMontant: params.montant,
              variation: variation!.toFixed(1) + "%",
              agentsConcernes: competence.affectations.length,
            }
          : undefined,
      },
    });

    return {
      success: true,
      data: {
        taux: nouveauTaux,
        estRevision,
        variation,
        agentsConcernes: competence.affectations.length,
      },
      message: estRevision
        ? `Taux révisé avec succès (${variation! > 0 ? "+" : ""}${variation!.toFixed(1)} %)`
        : "Taux fixé avec succès",
    };
  }
);

/**
 * Renvoie l'historique complet des taux d'une compétence
 * Triés du plus récent au plus ancien
 */
export const historiqueTaux = actionProtegee(
  PERMISSIONS["competence:lire"].code,
  async (session, competenceId: string) => {
    const taux = await prisma.tauxJournalier.findMany({
      where: { competenceId },
      orderBy: { dateEffet: "desc" },
      include: {
        competence: {
          select: { libelle: true },
        },
      },
    });

    if (taux.length === 0) {
      return { success: true, data: [], message: "Aucun taux enregistré" };
    }

    // Calculer le taux en vigueur (le plus récent dont dateEffet <= aujourd'hui)
    const maintenant = new Date();
    const tauxEnVigueur = taux.find((t) => t.dateEffet <= maintenant);

    // Calculer les variations
    const tauxAvecVariations = taux.map((t, index) => {
      const suivant = taux[index + 1];
      let variation: number | null = null;

      if (suivant) {
        const montantActuel = parseFloat(t.montant.toString());
        const montantPrecedent = parseFloat(suivant.montant.toString());
        variation = ((montantActuel - montantPrecedent) / montantPrecedent) * 100;
      }

      return {
        id: t.id,
        montant: parseFloat(t.montant.toString()),
        dateEffet: t.dateEffet,
        motif: t.motif,
        definiLe: t.definiLe,
        estEnVigueur: tauxEnVigueur?.id === t.id,
        variation,
      };
    });

    return {
      success: true,
      data: {
        competence: taux[0].competence.libelle,
        taux: tauxAvecVariations,
      },
    };
  }
);
