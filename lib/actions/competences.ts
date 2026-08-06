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

// =====================================================================
// ACTIONS SERVEUR — DIRECTION RH
// =====================================================================

interface AssignerCompetenceParams {
  employeId: string;
  competenceId: string;
  dateEffet: Date;
  motif?: string; // Requis si changement
}

/**
 * La compétence d'un agent à une date donnée
 * Code exact de M17-COMPETENCES.md § 3.4
 */
export async function competenceALaDate(employeId: string, date: Date) {
  return await prisma.affectationCompetence.findFirst({
    where: {
      employeId,
      dateEffet: { lte: date },
      OR: [{ dateFin: null }, { dateFin: { gte: date } }],
    },
    include: { competence: true },
  });
}

/**
 * Le montant d'un jour pointé — DEUX lectures historisées
 * Code exact de M17-COMPETENCES.md § 3.4
 *
 * C'EST LE CRITÈRE DE RECETTE LE PLUS IMPORTANT DE M17
 */
export async function montantDuJour(employeId: string, jour: Date): Promise<number | null> {
  const aff = await competenceALaDate(employeId, jour);
  if (!aff) return null; // pas de compétence ce jour-là

  const taux = await prisma.tauxJournalier.findFirst({
    where: { competenceId: aff.competenceId, dateEffet: { lte: jour } },
    orderBy: { dateEffet: "desc" },
  });

  return taux?.montant ? parseFloat(taux.montant.toString()) : null;
}

/**
 * Assigne une compétence à un employé
 * Clôt l'affectation précédente si elle existe
 */
export const assignerCompetence = actionProtegee(
  PERMISSIONS["competence:assigner"].code,
  async (session, params: AssignerCompetenceParams) => {
    // Vérifier l'employé
    const employe = await prisma.employe.findUnique({
      where: { id: params.employeId },
      select: { nom: true, prenom: true, typeMainOeuvre: true },
    });

    if (!employe) {
      return { success: false, error: "Employé introuvable" };
    }

    // Vérifier la compétence
    const competence = await prisma.competence.findUnique({
      where: { id: params.competenceId },
      include: {
        taux: {
          where: { dateEffet: { lte: params.dateEffet } },
          orderBy: { dateEffet: "desc" },
          take: 1,
        },
      },
    });

    if (!competence) {
      return { success: false, error: "Compétence introuvable" };
    }

    if (!competence.actif) {
      return { success: false, error: "Cette compétence est archivée" };
    }

    // Contrôle bloquant : une compétence sans taux ne s'assigne pas
    if (competence.taux.length === 0) {
      return {
        success: false,
        error:
          "Impossible d'assigner cette compétence : aucun taux journalier n'a été fixé. La Direction Financière doit d'abord fixer un taux.",
      };
    }

    // Vérifier affectation actuelle
    const affectationActuelle = await prisma.affectationCompetence.findFirst({
      where: {
        employeId: params.employeId,
        dateFin: null,
      },
      include: {
        competence: true,
      },
    });

    const estChangement = affectationActuelle !== null;

    // Vérifier motif si changement
    if (estChangement && !params.motif) {
      return {
        success: false,
        error:
          "Un motif est requis pour changer la compétence d'un agent (minimum 15 caractères)",
      };
    }

    if (estChangement && params.motif && params.motif.length < 15) {
      return {
        success: false,
        error: "Le motif doit comporter au moins 15 caractères",
      };
    }

    // Transaction : clôturer l'ancienne et créer la nouvelle
    const result = await prisma.$transaction(async (tx) => {
      // Clôturer l'affectation précédente
      if (affectationActuelle) {
        const veille = new Date(params.dateEffet);
        veille.setDate(veille.getDate() - 1);

        await tx.affectationCompetence.update({
          where: { id: affectationActuelle.id },
          data: { dateFin: veille },
        });
      }

      // Créer la nouvelle affectation
      const nouvelleAffectation = await tx.affectationCompetence.create({
        data: {
          employeId: params.employeId,
          competenceId: params.competenceId,
          dateEffet: params.dateEffet,
          motif: params.motif,
          assigneeParId: session.userId,
        },
      });

      return nouvelleAffectation;
    });

    // Calculer variation de taux si changement
    let variationTaux: number | null = null;
    if (estChangement && affectationActuelle) {
      const ancienTaux = await tauxEnVigueur(
        affectationActuelle.competenceId,
        params.dateEffet
      );
      const nouveauTaux = competence.taux[0];

      if (ancienTaux && nouveauTaux) {
        const ancienMontant = parseFloat(ancienTaux.montant.toString());
        const nouveauMontant = parseFloat(nouveauTaux.montant.toString());
        variationTaux = ((nouveauMontant - ancienMontant) / ancienMontant) * 100;
      }
    }

    // Journaliser
    const commentaire = estChangement
      ? `Changement de compétence pour ${employe.prenom} ${employe.nom} : "${affectationActuelle!.competence.libelle}" → "${competence.libelle}"${variationTaux !== null ? ` (${variationTaux > 0 ? "+" : ""}${variationTaux.toFixed(1)} %)` : ""}. Motif : ${params.motif}`
      : `Assignation de compétence "${competence.libelle}" à ${employe.prenom} ${employe.nom}`;

    await prisma.journalEvenement.create({
      data: {
        entite: "AffectationCompetence",
        entiteId: result.id,
        action: estChangement ? "MODIFICATION" : "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire,
      },
    });

    return {
      success: true,
      data: result,
      message: estChangement
        ? "Compétence modifiée avec succès"
        : "Compétence assignée avec succès",
    };
  }
);

/**
 * Liste les agents sans compétence (journaliers uniquement)
 */
export const listerAgentsSansCompetence = actionProtegee(
  PERMISSIONS["competence:lire"].code,
  async (session) => {
    const agents = await prisma.employe.findMany({
      where: {
        typeMainOeuvre: "JOURNALIER",
        archiveLe: null,
        competences: {
          none: {
            dateFin: null,
          },
        },
      },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        creeLe: true,
      },
      orderBy: { creeLe: "desc" },
    });

    return {
      success: true,
      data: agents,
      count: agents.length,
    };
  }
);

/**
 * Calcule les statistiques pour les 4 indicateurs
 */
export const statistiquesCompetences = actionProtegee(
  PERMISSIONS["competence:lire"].code,
  async (session) => {
    // 1. Compétences actives
    const competencesActives = await prisma.competence.count({
      where: { actif: true },
    });

    // 2. En attente de taux (actives sans aucun TauxJournalier)
    const competencesSansTaux = await prisma.competence.findMany({
      where: {
        actif: true,
        taux: {
          none: {},
        },
      },
    });

    // 3. Sans compétence (agents journaliers sans affectation ouverte)
    const agentsSansCompetence = await prisma.employe.count({
      where: {
        typeMainOeuvre: "JOURNALIER",
        archiveLe: null,
        competences: {
          none: {
            dateFin: null,
          },
        },
      },
    });

    // 4. Coût journalier (somme des taux des agents affectés)
    const affectationsOuvertes = await prisma.affectationCompetence.findMany({
      where: {
        dateFin: null,
        employe: {
          typeMainOeuvre: "JOURNALIER",
          archiveLe: null,
        },
      },
      include: {
        competence: {
          include: {
            taux: {
              orderBy: { dateEffet: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    let coutJournalierTotal = 0;
    for (const aff of affectationsOuvertes) {
      const tauxCourant = aff.competence.taux[0];
      if (tauxCourant) {
        coutJournalierTotal += parseFloat(tauxCourant.montant.toString());
      }
    }

    return {
      competencesActives,
      enAttenteDeTaux: competencesSansTaux.length,
      agentsSansCompetence,
      coutJournalier: coutJournalierTotal,
    };
  }
);

/**
 * Liste tous les agents journaliers avec leurs compétences actuelles
 */
export const listerAgentsAvecCompetences = actionProtegee(
  PERMISSIONS["competence:lire"].code,
  async (session, filtres?: { sansCompetence?: boolean; surChantier?: boolean }) => {
    const agents = await prisma.employe.findMany({
      where: {
        typeMainOeuvre: "JOURNALIER",
        archiveLe: null,
      },
      include: {
        competences: {
          where: {
            dateFin: null,
          },
          include: {
            competence: {
              include: {
                taux: {
                  orderBy: { dateEffet: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        affectationsChantier: {
          where: {
            dateFin: null,
          },
          include: {
            projet: {
              select: {
                code: true,
                nom: true,
              },
            },
          },
        },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    // Filtrer si nécessaire
    let resultats = agents;

    if (filtres?.sansCompetence) {
      resultats = agents.filter((a) => a.competences.length === 0);
    }

    if (filtres?.surChantier) {
      resultats = agents.filter((a) => a.affectationsChantier.length > 0);
    }

    // Mapper pour simplifier
    const items = resultats.map((agent) => {
      const competenceActuelle = agent.competences[0];
      const tauxActuel = competenceActuelle?.competence.taux[0];
      const projetActuel = agent.affectationsChantier[0];

      return {
        id: agent.id,
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        competence: competenceActuelle
          ? {
              id: competenceActuelle.competence.id,
              libelle: competenceActuelle.competence.libelle,
              categorie: competenceActuelle.competence.categorie,
              dateEffet: competenceActuelle.dateEffet,
            }
          : null,
        taux: tauxActuel
          ? {
              montant: tauxActuel.montant.toString(),
              dateEffet: tauxActuel.dateEffet,
            }
          : null,
        projet: projetActuel
          ? {
              code: projetActuel.projet.code,
              nom: projetActuel.projet.nom,
            }
          : null,
      };
    });

    return {
      success: true,
      data: items,
      total: items.length,
    };
  }
);
