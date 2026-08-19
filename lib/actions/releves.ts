"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

/**
 * Lister les relevés d'activité avec filtres
 */
export const listerReleves = actionProtegee(
  "releve:saisir",
  async (session, params?: {
    page?: number;
    limit?: number;
    projetId?: string;
    statut?: "BROUILLON" | "SOUMIS" | "VISE" | "REFUSE";
    dateDebut?: Date;
    dateFin?: Date;
  }) => {

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params?.projetId) {
    where.projetId = params.projetId;
  }

  if (params?.statut) {
    where.statut = params.statut;
  }

  if (params?.dateDebut || params?.dateFin) {
    where.date = {};
    if (params.dateDebut) {
      where.date.gte = params.dateDebut;
    }
    if (params.dateFin) {
      where.date.lte = params.dateFin;
    }
  }

  const [items, total] = await Promise.all([
    prisma.releveActivite.findMany({
      where,
      include: {
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        chefChantier: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            matricule: true,
          },
        },
        pointages: {
          select: {
            id: true,
            etat: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { creeLe: "desc" }],
      skip,
      take: limit,
    }),
    prisma.releveActivite.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
  }
);

/**
 * Obtenir un relevé par ID
 */
export const obtenirReleve = actionProtegee(
  "releve:saisir",
  async (session, id: string) => {
  const releve = await prisma.releveActivite.findUnique({
    where: { id },
    include: {
      projet: {
        select: {
          id: true,
          code: true,
          nom: true,
        },
      },
      chefChantier: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          matricule: true,
        },
      },
      pointages: {
        include: {
          employe: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              matricule: true,
            },
          },
        },
      },
      travauxRealises: true,
      utilisationsMateriel: true,
      consommations: true,
      incidents: true,
    },
  });

  if (!releve) {
    throw new Error("Relevé non trouvé");
  }

  return releve;
  }
);

/**
 * Créer un nouveau relevé (brouillon)
 */
export const creerReleve = actionProtegee(
  "releve:saisir",
  async (session, data: {
    projetId: string;
    date: Date;
  }) => {
  const profil = await prisma.profil.findUnique({
    where: { id: session.userId },
    include: { employe: true },
  });

  if (!profil?.employe) {
    throw new Error("Aucun employé associé à ce compte");
  }

  // Vérifier qu'il n'existe pas déjà un relevé pour ce projet et cette date
  const existant = await prisma.releveActivite.findUnique({
    where: {
      projetId_date: {
        projetId: data.projetId,
        date: data.date,
      },
    },
  });

  if (existant) {
    throw new Error("Un relevé existe déjà pour ce projet et cette date");
  }

  const releve = await prisma.releveActivite.create({
    data: {
      projetId: data.projetId,
      date: data.date,
      chefChantierId: profil.employe.id,
      statut: "BROUILLON",
    },
    include: {
      projet: {
        select: {
          code: true,
          nom: true,
        },
      },
    },
  });

  revalidatePath("/releves");
  return releve;
  }
);

/**
 * Soumettre un relevé pour validation
 */
export const soumettreReleve = actionProtegee(
  "releve:saisir",
  async (session, id: string) => {
  const profil = await prisma.profil.findUnique({
    where: { id: session.userId },
    include: { employe: true },
  });

  if (!profil?.employe) {
    throw new Error("Aucun employé associé à ce compte");
  }

  const releve = await prisma.releveActivite.findUnique({
    where: { id },
  });

  if (!releve) {
    throw new Error("Relevé non trouvé");
  }

  if (releve.chefChantierId !== profil.employe.id) {
    throw new Error("Vous n'êtes pas autorisé à modifier ce relevé");
  }

  if (releve.statut !== "BROUILLON") {
    throw new Error("Seul un relevé en brouillon peut être soumis");
  }

  const updated = await prisma.releveActivite.update({
    where: { id },
    data: {
      statut: "SOUMIS",
    },
  });

  revalidatePath("/releves");
  revalidatePath(`/releves/${id}`);
  return updated;
  }
);

/**
 * Viser un relevé (conducteur)
 */
export const viserReleve = actionProtegee(
  "releve:viser",
  async (session, id: string) => {
  const profil = await prisma.profil.findUnique({
    where: { id: session.userId },
    include: { employe: true },
  });

  if (!profil?.employe) {
    throw new Error("Aucun employé associé à ce compte");
  }

  const releve = await prisma.releveActivite.findUnique({
    where: { id },
  });

  if (!releve) {
    throw new Error("Relevé non trouvé");
  }

  if (releve.statut !== "SOUMIS") {
    throw new Error("Seul un relevé soumis peut être visé");
  }

  const updated = await prisma.releveActivite.update({
    where: { id },
    data: {
      statut: "VISE",
      conducteurId: profil.employe.id,
      viseLe: new Date(),
    },
  });

  revalidatePath("/releves");
  revalidatePath(`/releves/${id}`);
  return updated;
  }
);

/**
 * Refuser un relevé (conducteur)
 */
export const refuserReleve = actionProtegee(
  "releve:viser",
  async (session, id: string, motifRefus: string) => {
  const profil = await prisma.profil.findUnique({
    where: { id: session.userId },
    include: { employe: true },
  });

  if (!profil?.employe) {
    throw new Error("Aucun employé associé à ce compte");
  }

  if (!motifRefus || motifRefus.trim().length === 0) {
    throw new Error("Le motif de refus est obligatoire");
  }

  const releve = await prisma.releveActivite.findUnique({
    where: { id },
  });

  if (!releve) {
    throw new Error("Relevé non trouvé");
  }

  if (releve.statut !== "SOUMIS") {
    throw new Error("Seul un relevé soumis peut être refusé");
  }

  const updated = await prisma.releveActivite.update({
    where: { id },
    data: {
      statut: "REFUSE",
      conducteurId: profil.employe.id,
      viseLe: new Date(),
      motifRefus,
    },
  });

  revalidatePath("/releves");
  revalidatePath(`/releves/${id}`);
  return updated;
  }
);

/**
 * Supprimer un relevé (brouillon uniquement)
 */
export const supprimerReleve = actionProtegee(
  "releve:saisir",
  async (session, id: string) => {
  const profil = await prisma.profil.findUnique({
    where: { id: session.userId },
    include: { employe: true },
  });

  if (!profil?.employe) {
    throw new Error("Aucun employé associé à ce compte");
  }

  const releve = await prisma.releveActivite.findUnique({
    where: { id },
  });

  if (!releve) {
    throw new Error("Relevé non trouvé");
  }

  if (releve.chefChantierId !== profil.employe.id) {
    throw new Error("Vous n'êtes pas autorisé à supprimer ce relevé");
  }

  if (releve.statut !== "BROUILLON") {
    throw new Error("Seul un relevé en brouillon peut être supprimé");
  }

  await prisma.releveActivite.delete({
    where: { id },
  });

  revalidatePath("/releves");
  return { success: true };
  }
);

// =====================================================================
// GESTION DES POINTAGES
// =====================================================================

/**
 * Lister les employés disponibles pour pointage
 */
export const listerEmployesPourPointage = actionProtegee(
  "releve:saisir",
  async (session, releveId: string) => {
    const releve = await prisma.releveActivite.findUnique({
      where: { id: releveId },
      include: {
        pointages: {
          select: { employeId: true },
        },
      },
    });

    if (!releve) {
      throw new Error("Relevé non trouvé");
    }

    // IDs des employés déjà pointés
    const employesDejPointes = releve.pointages.map((p) => p.employeId);

    // Lister tous les employés actifs (non archivés) non encore pointés
    const employes = await prisma.employe.findMany({
      where: {
        archiveLe: null,
        id: {
          notIn: employesDejPointes,
        },
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        matricule: true,
        typeMainOeuvre: true,
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return employes;
  }
);

/**
 * Ajouter un pointage
 */
export const ajouterPointage = actionProtegee(
  "releve:saisir",
  async (
    session,
    data: {
      releveId: string;
      employeId: string;
      heuresTheoretiques?: number;
    }
  ) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    const releve = await prisma.releveActivite.findUnique({
      where: { id: data.releveId },
    });

    if (!releve) {
      throw new Error("Relevé non trouvé");
    }

    if (releve.chefChantierId !== profil.employe.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier ce relevé");
    }

    if (releve.statut !== "BROUILLON") {
      throw new Error("Seul un relevé en brouillon peut être modifié");
    }

    // Vérifier que l'employé existe
    const employe = await prisma.employe.findUnique({
      where: { id: data.employeId },
    });

    if (!employe) {
      throw new Error("Employé non trouvé");
    }

    // Vérifier qu'il n'est pas déjà pointé
    const existant = await prisma.pointage.findUnique({
      where: {
        releveId_employeId: {
          releveId: data.releveId,
          employeId: data.employeId,
        },
      },
    });

    if (existant) {
      throw new Error("Cet employé est déjà pointé sur ce relevé");
    }

    // Heures par défaut : 8h
    const heures = data.heuresTheoretiques ?? 8.0;

    const pointage = await prisma.pointage.create({
      data: {
        releveId: data.releveId,
        employeId: data.employeId,
        etat: "PRESENT",
        heuresTheoretiques: heures,
        heuresReelles: heures,
        heuresSup: 0,
      },
      include: {
        employe: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            matricule: true,
          },
        },
      },
    });

    revalidatePath(`/releves/${data.releveId}`);

    // Convertir les Decimal en nombres pour le client
    return {
      ...pointage,
      heuresTheoretiques: Number(pointage.heuresTheoretiques),
      heuresReelles: Number(pointage.heuresReelles),
      heuresSup: Number(pointage.heuresSup),
    };
  }
);

/**
 * Modifier un pointage
 */
export const modifierPointage = actionProtegee(
  "releve:saisir",
  async (
    session,
    data: {
      pointageId: string;
      etat?: "PRESENT" | "ABSENT_JUSTIFIE" | "ABSENT_NON_JUSTIFIE" | "RETARD" | "REPOS";
      heuresReelles?: number;
      heuresSup?: number;
      observation?: string;
    }
  ) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    const pointage = await prisma.pointage.findUnique({
      where: { id: data.pointageId },
      include: {
        releve: true,
      },
    });

    if (!pointage) {
      throw new Error("Pointage non trouvé");
    }

    if (pointage.releve.chefChantierId !== profil.employe.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier ce pointage");
    }

    if (pointage.releve.statut !== "BROUILLON") {
      throw new Error("Seul un relevé en brouillon peut être modifié");
    }

    const updateData: any = {};

    if (data.etat !== undefined) {
      updateData.etat = data.etat;
    }

    if (data.heuresReelles !== undefined) {
      updateData.heuresReelles = data.heuresReelles;
    }

    if (data.heuresSup !== undefined) {
      updateData.heuresSup = data.heuresSup;
    }

    if (data.observation !== undefined) {
      updateData.observation = data.observation;
    }

    const updated = await prisma.pointage.update({
      where: { id: data.pointageId },
      data: updateData,
      include: {
        employe: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            matricule: true,
          },
        },
      },
    });

    revalidatePath(`/releves/${pointage.releveId}`);

    // Convertir les Decimal en nombres pour le client
    return {
      ...updated,
      heuresTheoretiques: Number(updated.heuresTheoretiques),
      heuresReelles: Number(updated.heuresReelles),
      heuresSup: Number(updated.heuresSup),
    };
  }
);

/**
 * Retirer un pointage
 */
export const retirerPointage = actionProtegee(
  "releve:saisir",
  async (session, pointageId: string) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    const pointage = await prisma.pointage.findUnique({
      where: { id: pointageId },
      include: {
        releve: true,
      },
    });

    if (!pointage) {
      throw new Error("Pointage non trouvé");
    }

    if (pointage.releve.chefChantierId !== profil.employe.id) {
      throw new Error("Vous n'êtes pas autorisé à supprimer ce pointage");
    }

    if (pointage.releve.statut !== "BROUILLON") {
      throw new Error("Seul un relevé en brouillon peut être modifié");
    }

    await prisma.pointage.delete({
      where: { id: pointageId },
    });

    revalidatePath(`/releves/${pointage.releveId}`);
    return { success: true };
  }
);
