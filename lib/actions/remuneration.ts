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
import { revalidatePath } from "next/cache";
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
 * [INTERNE] Décompter les employés hors grille
 * Fonction interne appelée par decompterEmployesHorsGrille et publierGrille
 */
async function decompterEmployesHorsGrilleInterne(grilleId: string) {
  const grille = await prisma.grilleSalariale.findUnique({
    where: { id: grilleId },
    include: { echelons: true },
  });

  if (!grille) {
    throw new Error("Grille introuvable");
  }

  // Récupérer tous les employés permanents avec leur affectation et contrat actif
  const employes = await prisma.employe.findMany({
    where: {
      typeMainOeuvre: "PERMANENT",
      archiveLe: null,
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      affectations: {
        where: {
          OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
        },
        include: {
          poste: {
            select: { niveau: true },
          },
        },
        orderBy: { dateDebut: "desc" },
        take: 1,
      },
      contrats: {
        where: {
          dateDebut: { lte: new Date() },
          OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
        },
        orderBy: { dateDebut: "desc" },
        take: 1,
      },
    },
  });

  const horsGrille = [];

  for (const emp of employes) {
    if (emp.affectations.length === 0 || emp.contrats.length === 0) {
      continue;
    }

    const affectation = emp.affectations[0];
    const contrat = emp.contrats[0];
    const niveau = affectation.poste.niveau;

    // Trouver l'échelon correspondant dans la nouvelle grille
    const echelon = grille.echelons.find((e) => e.niveau === niveau);

    if (!echelon) {
      continue;
    }

    const salaire = Number(contrat.salaire);
    const min = Number(echelon.min);
    const max = Number(echelon.max);

    // Vérifier si le salaire sort de la fourchette
    if (salaire < min || salaire > max) {
      horsGrille.push({
        employeId: emp.id,
        matricule: emp.matricule,
        nom: emp.nom,
        prenom: emp.prenom,
        niveau,
        salaireActuel: salaire,
        min,
        max,
        ecart: salaire < min ? salaire - min : salaire - max,
      });
    }
  }

  return {
    total: horsGrille.length,
    employes: horsGrille,
  };
}

/**
 * Décompter les employés hors nouvelle grille
 *
 * RÈGLE MÉTIER (M4 §7) : Décompte avant publication pour éviter de mettre
 * quinze personnes en dérogation sans que personne l'ait vu
 */
export const decompterEmployesHorsGrille = actionProtegee(
  "grille:modifier",
  async (session, grilleId: string) => {
    return decompterEmployesHorsGrilleInterne(grilleId);
  }
);

/**
 * Publier une grille brouillon
 * Passe statut BROUILLON → PUBLIEE, archive l'ancienne version
 *
 * RÈGLE MÉTIER (M4 §7) : Le décompte doit être présenté avant publication
 */
export const publierGrille = actionProtegee(
  "grille:modifier",
  async (
    session,
    grilleId: string,
    dateEffet: Date,
    confirmation: {
      employesHorsGrilleCompris: boolean;
      nombreEmployesHorsGrille: number;
    }
  ) => {
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

    if (!confirmation.employesHorsGrilleCompris) {
      throw new Error(
        "La publication nécessite une confirmation explicite après avoir vu le décompte des employés hors grille"
      );
    }

    // Vérifier que le décompte fourni correspond à la réalité
    const decompte = await decompterEmployesHorsGrilleInterne(grilleId);

    if (decompte.total !== confirmation.nombreEmployesHorsGrille) {
      throw new Error(
        `Le décompte a changé : ${decompte.total} employés hors grille actuellement, mais ${confirmation.nombreEmployesHorsGrille} attendus. Veuillez revoir le décompte.`
      );
    }

    // Archiver la version actuelle publiée
    await prisma.grilleSalariale.updateMany({
      where: { statut: "PUBLIEE" },
      data: { statut: "ARCHIVEE" },
    });

    // Publier la nouvelle version
    const grillePubliee = await prisma.grilleSalariale.update({
      where: { id: grilleId },
      data: {
        statut: "PUBLIEE",
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
      where: { statut: "PUBLIEE" },
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
      where: { statut: "PUBLIEE" },
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

/**
 * Réévaluer une dérogation salariale suite à un changement de poste
 *
 * RÈGLE MÉTIER (M4 §8.3) : Lorsqu'un employé change de poste, le système
 * vérifie automatiquement si sa dérogation salariale est toujours pertinente.
 *
 * Cas 1 : Le salaire rentre maintenant dans la fourchette du nouveau niveau
 *         → Clôture la dérogation comme SANS_OBJET
 *
 * Cas 2 : Le salaire reste hors fourchette du nouveau niveau
 *         → Crée une nouvelle dérogation EN_ATTENTE pour le nouveau niveau
 *
 * Cette fonction est appelée automatiquement lors d'un changement d'affectation.
 *
 * @param employeId ID de l'employé qui change de poste
 * @param nouveauNiveau Nouveau niveau hiérarchique du poste
 * @param auteurId ID de l'auteur du changement de poste
 * @param auteurNom Nom de l'auteur (pour journalisation)
 */
export async function reevaluerDerogationChangementPoste(
  employeId: string,
  nouveauNiveau: "DIRECTION" | "CADRE" | "SUPPORT" | "OPERATIONNEL",
  auteurId: string,
  auteurNom: string
): Promise<void> {
  // Trouver la dérogation active (EN_ATTENTE ou VALIDEE)
  const derogationActive = await prisma.derogationSalariale.findFirst({
    where: {
      employeId,
      statut: { in: ["EN_ATTENTE", "VALIDEE"] },
    },
    include: {
      employe: {
        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,
          contrats: {
            where: {
              dateDebut: { lte: new Date() },
              OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
            },
            orderBy: { dateDebut: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Pas de dérogation active → rien à faire
  if (
    !derogationActive ||
    derogationActive.employe.contrats.length === 0
  ) {
    return;
  }

  const contratActif = derogationActive.employe.contrats[0];
  const salaire = Number(contratActif.salaire);

  // Récupérer la grille publiée
  const grillePubliee = await prisma.grilleSalariale.findFirst({
    where: { statut: "PUBLIEE" },
    include: { echelons: true },
  });

  if (!grillePubliee) {
    return; // Pas de grille publiée → impossible de réévaluer
  }

  // Trouver l'échelon du nouveau niveau
  const echelon = grillePubliee.echelons.find((e) => e.niveau === nouveauNiveau);

  if (!echelon) {
    return; // Niveau introuvable → impossible de réévaluer
  }

  const min = Number(echelon.min);
  const max = Number(echelon.max);

  const salaireConforme = salaire >= min && salaire <= max;

  if (salaireConforme) {
    // CAS 1 : Le salaire rentre dans la fourchette → Clôture comme SANS_OBJET
    await prisma.derogationSalariale.update({
      where: { id: derogationActive.id },
      data: {
        statut: "SANS_OBJET",
        commentaire: `Dérogation devenue sans objet suite au changement de poste vers niveau ${nouveauNiveau}. Le salaire est maintenant dans la fourchette.`,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DerogationSalariale",
        entiteId: derogationActive.id,
        action: "CLOTURE_AUTO",
        auteurId,
        auteurNom,
        details: {
          ancienneDerogationId: derogationActive.id,
          nouveauNiveau,
          salaire,
          fourchette: { min, max },
        },
        commentaire: `Dérogation ${derogationActive.id} clôturée automatiquement (salaire conforme après changement de poste vers ${nouveauNiveau})`,
      },
    });
  } else {
    // CAS 2 : Le salaire reste hors fourchette → Nouvelle dérogation EN_ATTENTE
    const nouvelleDerogation = await prisma.derogationSalariale.create({
      data: {
        employeId,
        montant: salaire,
        niveauMin: min,
        niveauMax: max,
        motif: `Réévaluation automatique suite au changement de poste vers niveau ${nouveauNiveau}. Salaire hors fourchette (${min} - ${max} FCFA).`,
        statut: "EN_ATTENTE",
        demandeLe: new Date(),
        demandeParId: auteurId,
      },
    });

    // Clôturer l'ancienne dérogation
    await prisma.derogationSalariale.update({
      where: { id: derogationActive.id },
      data: {
        statut: "SANS_OBJET",
        commentaire: `Remplacée par dérogation ${nouvelleDerogation.id} après changement de poste`,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DerogationSalariale",
        entiteId: nouvelleDerogation.id,
        action: "REEVALUATION_AUTO",
        auteurId,
        auteurNom,
        details: {
          ancienneDerogationId: derogationActive.id,
          nouveauNiveau,
          salaire,
          fourchette: { min, max },
          ecart: salaire < min ? salaire - min : salaire - max,
        },
        commentaire: `Nouvelle dérogation créée automatiquement après changement de poste vers ${nouveauNiveau} (salaire hors fourchette)`,
      },
    });
  }
}

/**
 * Archiver une grille publiée
 * Change le statut de PUBLIEE à ARCHIVEE
 */
export const archiverGrille = actionProtegee(
  "grille:modifier",
  async (session, grilleId: string) => {
    const grille = await prisma.grilleSalariale.findUnique({
      where: { id: grilleId },
    });

    if (!grille) {
      throw new Error("Grille introuvable");
    }

    if (grille.statut === "BROUILLON") {
      throw new Error("Un brouillon doit être supprimé, pas archivé");
    }

    if (grille.statut === "ARCHIVEE") {
      throw new Error("Cette grille est déjà archivée");
    }

    const grilleArchivee = await prisma.grilleSalariale.update({
      where: { id: grilleId },
      data: { statut: "ARCHIVEE" },
      include: { echelons: true },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "GrilleSalariale",
        entiteId: grilleId,
        action: "ARCHIVAGE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Grille version ${grille.version} archivée`,
      },
    });

    revalidatePath("/remuneration");
    return grilleArchivee;
  }
);

/**
 * Lister les dérogations en attente de validation
 * Filtre automatique sur statut EN_ATTENTE avec pagination
 */
export const listerDerogationsPendantes = actionProtegee(
  "derogation:valider",
  async (session, page: number = 1) => {
    const limit = 25;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.derogationSalariale.findMany({
        where: { statut: "EN_ATTENTE" },
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
        orderBy: { demandeLe: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.derogationSalariale.count({
        where: { statut: "EN_ATTENTE" },
      }),
    ]);

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }
);

/**
 * Créer une dérogation salariale
 * Appelée lors d'un recrutement ou d'un changement de salaire hors grille
 */
export const creerDerogation = actionProtegee(
  "employe:modifier",
  async (
    session,
    data: {
      employeId: string;
      montant: number;
      motif: string;
    }
  ) => {
    const employe = await prisma.employe.findUnique({
      where: { id: data.employeId },
      include: {
        affectations: {
          where: {
            OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
          },
          include: {
            poste: {
              select: { niveau: true },
            },
          },
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
      },
    });

    if (!employe) {
      throw new Error("Employé introuvable");
    }

    if (employe.affectations.length === 0) {
      throw new Error("L'employé n'a pas d'affectation active");
    }

    const niveau = employe.affectations[0].poste.niveau;

    const grillePubliee = await prisma.grilleSalariale.findFirst({
      where: { statut: "PUBLIEE" },
      include: { echelons: true },
    });

    if (!grillePubliee) {
      throw new Error("Aucune grille salariale publiée");
    }

    const echelon = grillePubliee.echelons.find((e) => e.niveau === niveau);

    if (!echelon) {
      throw new Error(`Niveau ${niveau} introuvable dans la grille`);
    }

    const min = Number(echelon.min);
    const max = Number(echelon.max);

    if (data.montant >= min && data.montant <= max) {
      throw new Error(
        `Le salaire ${data.montant} FCFA est dans la fourchette ${min}-${max} FCFA. Aucune dérogation nécessaire.`
      );
    }

    const derogation = await prisma.derogationSalariale.create({
      data: {
        employeId: data.employeId,
        montant: data.montant,
        niveauMin: min,
        niveauMax: max,
        motif: data.motif,
        statut: "EN_ATTENTE",
        demandeLe: new Date(),
        demandeParId: session.userId,
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
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DerogationSalariale",
        entiteId: derogation.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          employeMatricule: employe.matricule,
          montant: data.montant,
          fourchette: { min, max },
          niveau,
        },
        commentaire: `Demande de dérogation pour ${employe.prenom} ${employe.nom} (${data.montant} FCFA hors fourchette ${min}-${max} FCFA)`,
      },
    });

    revalidatePath("/remuneration/derogations");
    return derogation;
  }
);
