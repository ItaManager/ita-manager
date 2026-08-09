"use server";

/**
 * Server Actions — Module M3 Congés et Permissions
 *
 * Phase 2 : Actions de base (CRUD) sans calcul de solde ni circuit complet.
 * Le circuit de validation viendra en Phase 3.
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { StatutAbsence } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// =====================================================================
// TYPES
// =====================================================================

export type Absence = {
  id: string;
  employeId: string;
  typeAbsenceId: string;
  typeAbsence: {
    id: string;
    libelle: string;
    decompte: boolean;
    pieceRequise: boolean;
    pieceClassification: boolean;
  };
  dateDebut: Date;
  dateFin: Date;
  nombreJours: Decimal;
  statut: StatutAbsence;
  motif: string | null;
  superieurId: string | null;
  pieceId: string | null;
  creeLe: Date;
  soumieLe: Date | null;
};

export type AbsenceListItem = {
  id: string;
  typeAbsence: string;
  dateDebut: Date;
  dateFin: Date;
  nombreJours: Decimal;
  statut: StatutAbsence;
  creeLe: Date;
  soumieLe: Date | null;
};

export type TypeAbsence = {
  id: string;
  libelle: string;
  decompte: boolean;
  pieceRequise: boolean;
  pieceClassification: boolean;
  actif: boolean;
};

// =====================================================================
// LISTER MES ABSENCES
// =====================================================================

export const listerMesAbsences = actionProtegee(
  "absence:demander",
  async (session) => {
    // Récupérer l'employé lié au profil
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    const absences = await prisma.absence.findMany({
      where: { employeId: profil.employe.id },
      include: {
        typeAbsence: {
          select: {
            id: true,
            libelle: true,
            decompte: true,
            pieceRequise: true,
            pieceClassification: true,
          },
        },
      },
      orderBy: [
        { soumieLe: "desc" },
        { creeLe: "desc" },
      ],
    });

    return absences.map((a): AbsenceListItem => ({
      id: a.id,
      typeAbsence: a.typeAbsence.libelle,
      dateDebut: a.dateDebut,
      dateFin: a.dateFin,
      nombreJours: a.nombreJours,
      statut: a.statut,
      creeLe: a.creeLe,
      soumieLe: a.soumieLe,
    }));
  }
);

// =====================================================================
// LISTER LES TYPES D'ABSENCE
// =====================================================================

export const listerTypesAbsence = actionProtegee(
  "absence:demander",
  async () => {
    const types = await prisma.typeAbsence.findMany({
      where: { actif: true },
      orderBy: { libelle: "asc" },
    });

    return types;
  }
);

// =====================================================================
// CRÉER UNE ABSENCE (brouillon)
// =====================================================================

export type CreerAbsenceInput = {
  typeAbsenceId: string;
  dateDebut: Date;
  dateFin: Date;
  motif?: string;
};

export const creerAbsence = actionProtegee(
  "absence:demander",
  async (session, input: CreerAbsenceInput) => {
    // Récupérer l'employé lié au profil
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // RÈGLE MÉTIER (M3 §7.1, décision A-13) : Les journaliers ne bénéficient pas de congés payés
    if (profil.employe.typeMainOeuvre === "JOURNALIER") {
      throw new Error(
        "Un journalier n'ouvre aucun compteur de congés. Un jour non pointé " +
        "est un jour non payé — décision A-13."
      );
    }

    // Vérifier que le type d'absence existe
    const typeAbsence = await prisma.typeAbsence.findUnique({
      where: { id: input.typeAbsenceId },
    });

    if (!typeAbsence || !typeAbsence.actif) {
      throw new Error("Type d'absence invalide");
    }

    // Vérifier que dateDebut <= dateFin
    if (input.dateDebut > input.dateFin) {
      throw new Error("La date de début doit être antérieure ou égale à la date de fin");
    }

    // Phase 6 : Calculer le nombre de jours ouvrables en excluant fériés
    // M3 §6.2 : Le nombre de jours est CALCULÉ, jamais saisi
    const nombreJours = await calculerJoursOuvrables(input.dateDebut, input.dateFin);

    const absence = await prisma.absence.create({
      data: {
        employeId: profil.employe.id,
        typeAbsenceId: input.typeAbsenceId,
        dateDebut: input.dateDebut,
        dateFin: input.dateFin,
        nombreJours,
        statut: "BROUILLON",
        motif: input.motif || null,
      },
      include: {
        typeAbsence: {
          select: {
            id: true,
            libelle: true,
            decompte: true,
            pieceRequise: true,
            pieceClassification: true,
          },
        },
      },
    });

    return absence;
  }
);

// =====================================================================
// MODIFIER UNE ABSENCE (uniquement si BROUILLON)
// =====================================================================

export type ModifierAbsenceInput = {
  id: string;
  typeAbsenceId?: string;
  dateDebut?: Date;
  dateFin?: Date;
  motif?: string;
};

export const modifierAbsence = actionProtegee(
  "absence:demander",
  async (session, input: ModifierAbsenceInput) => {
    // Récupérer l'absence
    const absence = await prisma.absence.findUnique({
      where: { id: input.id },
      include: { employe: { include: { profil: true } } },
    });

    if (!absence) {
      throw new Error("Absence introuvable");
    }

    // Vérifier que l'utilisateur est bien le demandeur
    if (absence.employe.profil?.id !== session.userId) {
      throw new Error("Vous ne pouvez modifier que vos propres demandes");
    }

    // Vérifier que l'absence est en brouillon
    if (absence.statut !== "BROUILLON") {
      throw new Error("Seules les demandes en brouillon peuvent être modifiées");
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (input.typeAbsenceId) {
      const typeAbsence = await prisma.typeAbsence.findUnique({
        where: { id: input.typeAbsenceId },
      });
      if (!typeAbsence || !typeAbsence.actif) {
        throw new Error("Type d'absence invalide");
      }
      updateData.typeAbsenceId = input.typeAbsenceId;
    }

    if (input.dateDebut) updateData.dateDebut = input.dateDebut;
    if (input.dateFin) updateData.dateFin = input.dateFin;
    if (input.motif !== undefined) updateData.motif = input.motif || null;

    // Recalculer nombreJours si les dates changent
    const newDateDebut = input.dateDebut || absence.dateDebut;
    const newDateFin = input.dateFin || absence.dateFin;

    if (newDateDebut > newDateFin) {
      throw new Error("La date de début doit être antérieure ou égale à la date de fin");
    }

    // Phase 6 : Recalculer en jours ouvrables si dates modifiées
    if (input.dateDebut || input.dateFin) {
      updateData.nombreJours = await calculerJoursOuvrables(newDateDebut, newDateFin);
    }

    const absenceModifiee = await prisma.absence.update({
      where: { id: input.id },
      data: updateData,
      include: {
        typeAbsence: {
          select: {
            id: true,
            libelle: true,
            decompte: true,
            pieceRequise: true,
            pieceClassification: true,
          },
        },
      },
    });

    return absenceModifiee;
  }
);

// =====================================================================
// SUPPRIMER UNE ABSENCE (uniquement si BROUILLON)
// =====================================================================

export const supprimerAbsence = actionProtegee(
  "absence:demander",
  async (session, absenceId: string) => {
    // Récupérer l'absence
    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
      include: { employe: { include: { profil: true } } },
    });

    if (!absence) {
      throw new Error("Absence introuvable");
    }

    // Vérifier que l'utilisateur est bien le demandeur
    if (absence.employe.profil?.id !== session.userId) {
      throw new Error("Vous ne pouvez supprimer que vos propres demandes");
    }

    // Vérifier que l'absence est en brouillon
    if (absence.statut !== "BROUILLON") {
      throw new Error("Seules les demandes en brouillon peuvent être supprimées");
    }

    await prisma.absence.delete({
      where: { id: absenceId },
    });

    return { success: true };
  }
);

// =====================================================================
// SOUMETTRE UNE ABSENCE (passer de BROUILLON à ATTENTE_N1)
// =====================================================================

export const soumettreAbsence = actionProtegee(
  "absence:demander",
  async (session, absenceId: string) => {
    // Récupérer l'absence avec l'affectation actuelle de l'employé
    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employe: {
          include: {
            profil: true,
            affectations: {
              where: {
                OR: [
                  { dateFin: null },
                  { dateFin: { gte: new Date() } },
                ],
              },
              orderBy: { dateDebut: "desc" },
              take: 1,
            },
          },
        },
        typeAbsence: true,
      },
    });

    if (!absence) {
      throw new Error("Absence introuvable");
    }

    // Vérifier que l'utilisateur est bien le demandeur
    if (absence.employe.profil?.id !== session.userId) {
      throw new Error("Vous ne pouvez soumettre que vos propres demandes");
    }

    // Vérifier que l'absence est en brouillon
    if (absence.statut !== "BROUILLON") {
      throw new Error("Seules les demandes en brouillon peuvent être soumises");
    }

    // Vérifier que l'employé a une affectation active avec supérieur
    const affectationActive = absence.employe.affectations[0];
    if (!affectationActive) {
      throw new Error("Aucune affectation active trouvée pour cet employé");
    }

    if (!affectationActive.superieurId) {
      throw new Error(
        "Impossible de soumettre : aucun supérieur hiérarchique défini. Contactez la Direction RH."
      );
    }

    // RÈGLE MÉTIER (M3 §7.5) : Vérifier pièce justificative si requise
    if (absence.typeAbsence.pieceRequise && !absence.pieceId) {
      throw new Error(
        "Une pièce justificative est requise pour ce type d'absence. Ajoutez-la avant de soumettre."
      );
    }

    // Figer le superieurId à la soumission (M3 §7.2)
    const absenceSoumise = await prisma.absence.update({
      where: { id: absenceId },
      data: {
        statut: "ATTENTE_N1",
        soumieLe: new Date(),
        superieurId: affectationActive.superieurId,
      },
      include: {
        typeAbsence: {
          select: {
            id: true,
            libelle: true,
            decompte: true,
            pieceRequise: true,
            pieceClassification: true,
          },
        },
      },
    });

    // Journaliser la soumission
    await prisma.journalEvenement.create({
      data: {
        entite: "Absence",
        entiteId: absenceId,
        action: "SOUMISSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande soumise au supérieur ${affectationActive.superieurId}`,
      },
    });

    // Phase 10 : Notification au supérieur

    return absenceSoumise;
  }
);

// =====================================================================
// HELPER — Vérifier délégation active
// =====================================================================

async function delegationActive(
  mandantId: string,
  delegataireId: string,
  date: Date
): Promise<boolean> {
  const delegation = await prisma.delegation.findFirst({
    where: {
      mandantId,
      delegataireId,
      actif: true,
      dateDebut: { lte: date },
      dateFin: { gte: date },
    },
  });

  return !!delegation;
}

// =====================================================================
// DÉCISION N+1 (Supérieur hiérarchique)
// =====================================================================
// Protection par lien de données (M3 §9), pas par permission

export type DeciderN1Input = {
  absenceId: string;
  decision: "VALIDER" | "REFUSER";
  motif?: string;
};

export const deciderN1 = actionProtegee(
  "absence:demander", // Toute personne authentifiée
  async (session, input: DeciderN1Input) => {
    const { absenceId, decision, motif } = input;

    // Récupérer l'absence
    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        typeAbsence: {
          select: {
            libelle: true,
          },
        },
      },
    });

    if (!absence) {
      throw new Error("Demande introuvable");
    }

    if (absence.statut !== "ATTENTE_N1") {
      throw new Error("Cette demande n'est pas en attente de validation hiérarchique");
    }

    // Vérifier que l'utilisateur a le droit de décider (M3 §9)
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Autorisation par lien de données : être le supérieur OU délégataire actif
    const estSuperieur = absence.superieurId === profil.employe.id;
    const estDelegataire = await delegationActive(
      absence.superieurId!,
      profil.employe.id,
      new Date()
    );

    if (!estSuperieur && !estDelegataire) {
      // Journaliser le refus
      await prisma.journalEvenement.create({
        data: {
          entite: "Absence",
          entiteId: absenceId,
          action: "REFUS_ACCES",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Tentative de validation d'une demande sans lien hiérarchique`,
        },
      });
      throw new Error("Vous n'êtes pas autorisé à valider cette demande");
    }

    // Validation : motif obligatoire pour refus
    if (decision === "REFUSER" && !motif) {
      throw new Error("Le motif du refus est obligatoire");
    }

    // Préparer la mise à jour
    const updateData: any = {
      decisionN1: decision,
      decisionN1Le: new Date(),
      decisionN1ParId: session.userId,
    };

    if (decision === "VALIDER") {
      updateData.statut = "ATTENTE_RH";
    } else {
      // Refus N+1 = refus définitif (M3 §3)
      updateData.statut = "REFUSEE";
      updateData.motifRefusN1 = motif;
    }

    const absenceUpdated = await prisma.absence.update({
      where: { id: absenceId },
      data: updateData,
      include: {
        typeAbsence: {
          select: {
            libelle: true,
          },
        },
      },
    });

    // Journaliser la décision
    await prisma.journalEvenement.create({
      data: {
        entite: "Absence",
        entiteId: absenceId,
        action: decision === "VALIDER" ? "VALIDATION_N1" : "REFUS_N1",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: decision === "VALIDER"
          ? `Demande validée par le supérieur, transmission à la RH`
          : `Demande refusée par le supérieur : ${motif}`,
      },
    });

    // Phase 10 : Notification au demandeur (et RH si validé)

    return absenceUpdated;
  }
);

// =====================================================================
// DÉCISION RH (Direction RH)
// =====================================================================
// Protection par permission

export type DeciderRHInput = {
  absenceId: string;
  decision: "VALIDER" | "REFUSER";
  motif?: string;
};

export const deciderRH = actionProtegee(
  "absence:valider",
  async (session, input: DeciderRHInput) => {
    const { absenceId, decision, motif } = input;

    // Récupérer l'absence
    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        typeAbsence: {
          select: {
            libelle: true,
            decompte: true,
          },
        },
      },
    });

    if (!absence) {
      throw new Error("Demande introuvable");
    }

    if (absence.statut !== "ATTENTE_RH") {
      throw new Error("Cette demande n'est pas en attente de contrôle RH");
    }

    // Validation : motif obligatoire pour refus
    if (decision === "REFUSER" && !motif) {
      throw new Error("Le motif du refus est obligatoire");
    }

    // Préparer la mise à jour
    const updateData: any = {
      decisionRH: decision,
      decisionRHLe: new Date(),
      decisionRHParId: session.userId,
      statut: decision === "VALIDER" ? "VALIDEE" : "REFUSEE",
    };

    if (decision === "REFUSER") {
      updateData.motifRefusRH = motif;
    }

    const absenceUpdated = await prisma.absence.update({
      where: { id: absenceId },
      data: updateData,
      include: {
        typeAbsence: {
          select: {
            libelle: true,
            decompte: true,
          },
        },
      },
    });

    // Journaliser la décision
    await prisma.journalEvenement.create({
      data: {
        entite: "Absence",
        entiteId: absenceId,
        action: decision === "VALIDER" ? "VALIDATION_RH" : "REFUS_RH",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: decision === "VALIDER"
          ? `Absence validée par la RH`
          : `Absence refusée par la RH : ${motif}`,
      },
    });

    // Phase 6 : Créer mouvement de solde si validée et décomptée
    // if (decision === "VALIDER" && absence.typeAbsence.decompte) {
    //   await prisma.soldeConge.create({
    //     data: {
    //       employeId: absence.employeId,
    //       exercice: new Date().getFullYear(),
    //       typeMouvement: "CONSOMMATION",
    //       jours: -absence.nombreJours,
    //       absenceId: absence.id,
    //       enregistreParId: session.userId,
    //     },
    //   });
    // }

    // Phase 10 : Notification au demandeur

    return absenceUpdated;
  }
);

// =====================================================================
// LISTER DEMANDES À VALIDER (pour supérieur)
// =====================================================================

export const listerDemandesAValider = actionProtegee(
  "absence:demander", // Toute personne authentifiée
  async (session) => {
    // Récupérer l'employé associé
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      return []; // Pas d'employé = pas de demandes à valider
    }

    const employeId = profil.employe.id;

    // Récupérer les délégations actives où je suis délégataire
    const delegationsActives = await prisma.delegation.findMany({
      where: {
        delegataireId: employeId,
        actif: true,
        dateDebut: { lte: new Date() },
        dateFin: { gte: new Date() },
      },
      select: { mandantId: true },
    });

    const mandantIds = delegationsActives.map((d) => d.mandantId);

    // Demandes où je suis supérieur OU où je suis délégataire
    const demandes = await prisma.absence.findMany({
      where: {
        statut: "ATTENTE_N1",
        superieurId: {
          in: [employeId, ...mandantIds],
        },
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
        typeAbsence: {
          select: {
            libelle: true,
            decompte: true,
          },
        },
      },
      orderBy: { soumieLe: "desc" },
    });

    return demandes.map((d) => ({
      id: d.id,
      employe: {
        matricule: d.employe.matricule,
        nom: d.employe.nom,
        prenom: d.employe.prenom,
      },
      typeAbsence: d.typeAbsence.libelle,
      dateDebut: d.dateDebut,
      dateFin: d.dateFin,
      nombreJours: d.nombreJours,
      motif: d.motif,
      soumieLe: d.soumieLe!,
      decompte: d.typeAbsence.decompte,
    }));
  }
);

// =====================================================================
// LISTER DEMANDES À CONTRÔLER (pour RH)
// =====================================================================

export const listerDemandesRH = actionProtegee(
  "absence:valider",
  async () => {
    const demandes = await prisma.absence.findMany({
      where: {
        statut: "ATTENTE_RH",
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
        typeAbsence: {
          select: {
            libelle: true,
            decompte: true,
          },
        },
      },
      orderBy: { decisionN1Le: "desc" },
    });

    return demandes.map((d) => ({
      id: d.id,
      employe: {
        matricule: d.employe.matricule,
        nom: d.employe.nom,
        prenom: d.employe.prenom,
      },
      typeAbsence: d.typeAbsence.libelle,
      dateDebut: d.dateDebut,
      dateFin: d.dateFin,
      nombreJours: d.nombreJours,
      motif: d.motif,
      soumieLe: d.soumieLe!,
      decisionN1Le: d.decisionN1Le!,
      decompte: d.typeAbsence.decompte,
    }));
  }
);

// =====================================================================
// GESTION DES DÉLÉGATIONS
// =====================================================================

export type CreerDelegationInput = {
  delegataireId: string;
  dateDebut: Date;
  dateFin: Date;
};

/**
 * Créer ou modifier une délégation (M3 §7.3)
 * Un responsable désigne son délégataire à l'avance, pour une période.
 * La délégation s'ajoute, ne se substitue pas.
 */
export const definirDelegation = actionProtegee(
  "absence:demander", // Tout utilisateur connecté
  async (session, input: CreerDelegationInput) => {
    const { delegataireId, dateDebut, dateFin } = input;

    // Récupérer l'employé du profil connecté
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    const mandantId = profil.employe.id;

    // Validation : ne peut pas se déléguer à soi-même
    if (mandantId === delegataireId) {
      throw new Error("Vous ne pouvez pas vous déléguer à vous-même");
    }

    // Validation : dateDebut <= dateFin
    if (dateDebut > dateFin) {
      throw new Error("La date de début doit être antérieure ou égale à la date de fin");
    }

    // Vérifier que le délégataire existe et est un employé actif
    const delegataire = await prisma.employe.findUnique({
      where: { id: delegataireId },
    });

    if (!delegataire || delegataire.archiveLe) {
      throw new Error("Le délégataire sélectionné n'existe pas ou est archivé");
    }

    // Désactiver les délégations existantes qui chevauchent la période
    await prisma.delegation.updateMany({
      where: {
        mandantId,
        actif: true,
        OR: [
          {
            dateDebut: { lte: dateFin },
            dateFin: { gte: dateDebut },
          },
        ],
      },
      data: { actif: false },
    });

    // Créer la nouvelle délégation
    const delegation = await prisma.delegation.create({
      data: {
        mandantId,
        delegataireId,
        dateDebut,
        dateFin,
        actif: true,
      },
      include: {
        delegataire: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Delegation",
        entiteId: delegation.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Délégation à ${delegation.delegataire.prenom} ${delegation.delegataire.nom} du ${format(dateDebut, "d MMM yyyy", { locale: fr })} au ${format(dateFin, "d MMM yyyy", { locale: fr })}`,
      },
    });

    return delegation;
  }
);

/**
 * Lister mes délégations actives
 */
export const listerMesDelegations = actionProtegee(
  "absence:demander",
  async (session) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      return [];
    }

    const delegations = await prisma.delegation.findMany({
      where: {
        mandantId: profil.employe.id,
        actif: true,
        dateFin: { gte: new Date() }, // Seulement les futures ou en cours
      },
      include: {
        delegataire: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { dateDebut: "desc" },
    });

    return delegations.map((d) => ({
      id: d.id,
      delegataire: {
        id: d.delegataire.id,
        matricule: d.delegataire.matricule,
        nom: d.delegataire.nom,
        prenom: d.delegataire.prenom,
      },
      dateDebut: d.dateDebut,
      dateFin: d.dateFin,
      actif: d.actif,
    }));
  }
);

/**
 * Révoquer une délégation
 */
export const revoquerDelegation = actionProtegee(
  "absence:demander",
  async (session, delegationId: string) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Vérifier que la délégation existe et appartient à l'utilisateur
    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) {
      throw new Error("Délégation introuvable");
    }

    if (delegation.mandantId !== profil.employe.id) {
      throw new Error("Vous ne pouvez révoquer que vos propres délégations");
    }

    // Désactiver la délégation
    const delegationRevoquee = await prisma.delegation.update({
      where: { id: delegationId },
      data: { actif: false },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Delegation",
        entiteId: delegationId,
        action: "REVOCATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Délégation révoquée",
      },
    });

    return delegationRevoquee;
  }
);

// =====================================================================
// ANNULATION DE DEMANDES
// =====================================================================

/**
 * Annuler une demande d'absence (M3 §7.6)
 *
 * Règles :
 * - ATTENTE_N1 ou ATTENTE_RH : le demandeur peut annuler (retrait simple)
 * - VALIDEE, congé non commencé : le demandeur peut annuler avec accord RH
 * - VALIDEE, congé commencé : Direction RH seule
 */
export const annulerAbsence = actionProtegee(
  "absence:demander",
  async (session, absenceId: string, motif?: string) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Récupérer l'absence
    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employe: { include: { profil: true } },
        typeAbsence: { select: { libelle: true } },
      },
    });

    if (!absence) {
      throw new Error("Demande introuvable");
    }

    // Vérifier que l'utilisateur est bien le demandeur
    if (absence.employe.profil?.id !== session.userId) {
      throw new Error("Vous ne pouvez annuler que vos propres demandes");
    }

    // Vérifier le statut
    if (!["ATTENTE_N1", "ATTENTE_RH"].includes(absence.statut)) {
      throw new Error(
        "Seules les demandes en attente de validation peuvent être annulées. Pour annuler une absence validée, contactez la Direction RH."
      );
    }

    // Annuler la demande
    const absenceAnnulee = await prisma.absence.update({
      where: { id: absenceId },
      data: {
        statut: "ANNULEE",
        annuleeLe: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Absence",
        entiteId: absenceId,
        action: "ANNULATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: motif
          ? `Demande annulée par le demandeur : ${motif}`
          : "Demande annulée par le demandeur",
      },
    });

    return absenceAnnulee;
  }
);

/**
 * Annuler une absence validée (Direction RH uniquement)
 * Peut annuler même si le congé a commencé
 */
export const annulerAbsenceValideeRH = actionProtegee(
  "absence:valider",
  async (session, absenceId: string, motif: string) => {
    if (!motif || !motif.trim()) {
      throw new Error("Le motif de l'annulation est obligatoire");
    }

    // Récupérer l'absence
    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employe: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        typeAbsence: {
          select: {
            libelle: true,
            decompte: true,
          },
        },
      },
    });

    if (!absence) {
      throw new Error("Absence introuvable");
    }

    if (absence.statut !== "VALIDEE") {
      throw new Error("Seules les absences validées peuvent être annulées par la RH");
    }

    // Annuler l'absence
    const absenceAnnulee = await prisma.absence.update({
      where: { id: absenceId },
      data: {
        statut: "ANNULEE",
        annuleeLe: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Absence",
        entiteId: absenceId,
        action: "ANNULATION_RH",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Annulation RH : ${motif}`,
      },
    });

    // Phase 6 : Recréditer le solde si décompté
    // const dateDebut = new Date(absence.dateDebut);
    // const aujourdhui = new Date();
    // const congeCommence = dateDebut <= aujourdhui;

    // if (absence.typeAbsence.decompte) {
    //   if (congeCommence) {
    //     // Calcul au prorata
    //     const joursRestants = calculerJoursRestants(absence.dateDebut, absence.dateFin);
    //     if (joursRestants > 0) {
    //       await recrediterSolde(absence.employeId, joursRestants, absenceId, session.userId);
    //     }
    //   } else {
    //     // Recrédit total
    //     await recrediterSolde(absence.employeId, absence.nombreJours, absenceId, session.userId);
    //   }
    // }

    return absenceAnnulee;
  }
);

// =====================================================================
// PHASE 6 : CALCUL SOLDE ET JOURS OUVRABLES
// =====================================================================

/**
 * Calcule le nombre de jours ouvrables entre deux dates (bornes incluses)
 * en excluant les jours fériés et les jours non ouvrables (samedi/dimanche).
 *
 * M3 §6.2 : Le nombre de jours est CALCULÉ, jamais saisi.
 * M3 §10 : Un congé du lundi au vendredi compte 5 jours, non 7.
 */
async function calculerJoursOuvrables(
  dateDebut: Date,
  dateFin: Date
): Promise<number> {
  // Récupérer les règles de décompte
  const modeDecompte = await prisma.regleConge.findUnique({
    where: { cle: "decompte.mode" },
  });

  const samediOuvrable = await prisma.regleConge.findUnique({
    where: { cle: "samedi.ouvrable" },
  });

  // Si mode CALENDAIRES, retourner le nombre de jours calendaires
  if (modeDecompte?.valeur === "CALENDAIRES") {
    return (
      Math.ceil(
        (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  }

  // Mode OUVRABLES (par défaut)
  const estSamediOuvrable = samediOuvrable?.valeur === "true";

  // Récupérer tous les jours fériés dans la plage
  const feries = await prisma.jourFerie.findMany({
    where: {
      date: {
        gte: dateDebut,
        lte: dateFin,
      },
    },
  });

  const joursFeriesSet = new Set(
    feries.map((f) => f.date.toISOString().split("T")[0])
  );

  // Compter les jours ouvrables
  let joursOuvrables = 0;
  const current = new Date(dateDebut);

  while (current <= dateFin) {
    const dayOfWeek = current.getDay(); // 0 = dimanche, 6 = samedi
    const dateStr = current.toISOString().split("T")[0];
    const estFerie = joursFeriesSet.has(dateStr);

    // Dimanche toujours non ouvrable
    if (dayOfWeek === 0) {
      // Ne pas compter
    }
    // Samedi selon paramètre
    else if (dayOfWeek === 6 && !estSamediOuvrable) {
      // Ne pas compter
    }
    // Jour férié
    else if (estFerie) {
      // Ne pas compter
    }
    // Jour ouvrable
    else {
      joursOuvrables++;
    }

    current.setDate(current.getDate() + 1);
  }

  return joursOuvrables;
}

/**
 * Calcule l'ancienneté d'un employé en années complètes.
 * L'ancienneté est calculée à partir de la date de début du premier contrat.
 */
async function calculerAnciennete(employeId: string): Promise<number> {
  const premierContrat = await prisma.contrat.findFirst({
    where: { employeId },
    orderBy: { dateDebut: "asc" },
  });

  if (!premierContrat) {
    return 0;
  }

  const dateEmbauche = new Date(premierContrat.dateDebut);
  const aujourdhui = new Date();

  let annees = aujourdhui.getFullYear() - dateEmbauche.getFullYear();
  const mois = aujourdhui.getMonth() - dateEmbauche.getMonth();
  const jours = aujourdhui.getDate() - dateEmbauche.getDate();

  // Ajuster si l'anniversaire n'est pas encore passé cette année
  if (mois < 0 || (mois === 0 && jours < 0)) {
    annees--;
  }

  return annees;
}

/**
 * Calcule le solde de congés d'un employé pour un exercice donné.
 *
 * M3 §6.1 : Le solde ne se stocke pas, il se calcule.
 * Le calcul est la seule source fiable.
 *
 * Formule :
 * - Dotation acquise (au prorata des mois travaillés)
 * + Majoration d'ancienneté (selon table paramétrable)
 * + Report N-1 (plafonné)
 * - Consommation (absences validées)
 * = Solde disponible
 */
export const calculerSolde = actionProtegee(
  "employe:lire",
  async (session, employeId: string, exercice: number) => {
    // Récupérer l'employé
    const employe = await prisma.employe.findUnique({
      where: { id: employeId },
    });

    if (!employe) {
      throw new Error("Employé introuvable");
    }

    // Journalier exclu du module (M3 §7.1)
    if (employe.typeMainOeuvre === "JOURNALIER") {
      return null;
    }

    // Récupérer les mouvements de solde pour l'exercice
    const mouvements = await prisma.soldeConge.findMany({
      where: {
        employeId,
        exercice,
      },
      orderBy: { enregistreLe: "asc" },
    });

    // Calculer le total des mouvements
    let solde = 0;
    for (const mouvement of mouvements) {
      solde += Number(mouvement.jours);
    }

    // Calculer l'ancienneté
    const anciennete = await calculerAnciennete(employeId);

    // Récupérer les règles de majoration d'ancienneté
    let majorationAnciennete = 0;

    if (anciennete >= 25) {
      const regle = await prisma.regleConge.findUnique({
        where: { cle: "anciennete.25ans" },
      });
      majorationAnciennete = regle ? Number(regle.valeur) : 0;
    } else if (anciennete >= 20) {
      const regle = await prisma.regleConge.findUnique({
        where: { cle: "anciennete.20ans" },
      });
      majorationAnciennete = regle ? Number(regle.valeur) : 0;
    } else if (anciennete >= 15) {
      const regle = await prisma.regleConge.findUnique({
        where: { cle: "anciennete.15ans" },
      });
      majorationAnciennete = regle ? Number(regle.valeur) : 0;
    } else if (anciennete >= 10) {
      const regle = await prisma.regleConge.findUnique({
        where: { cle: "anciennete.10ans" },
      });
      majorationAnciennete = regle ? Number(regle.valeur) : 0;
    } else if (anciennete >= 5) {
      const regle = await prisma.regleConge.findUnique({
        where: { cle: "anciennete.5ans" },
      });
      majorationAnciennete = regle ? Number(regle.valeur) : 0;
    }

    return {
      exercice,
      soldeTotal: solde,
      anciennete,
      majorationAnciennete,
      mouvements: mouvements.map((m) => ({
        id: m.id,
        typeMouvement: m.typeMouvement,
        jours: Number(m.jours),
        commentaire: m.commentaire,
        enregistreLe: m.enregistreLe,
      })),
    };
  }
);

// =====================================================================
// PHASE 5 : CALENDRIER DES ABSENCES
// =====================================================================

/**
 * Lister les absences validées pour affichage calendrier.
 * Permet au supérieur de voir la charge d'absences sur une période.
 *
 * M3 §5.4 : Vue mensuelle par service ou par chantier.
 */
export const listerAbsencesCalendrier = actionProtegee(
  "employe:lire",
  async (
    session,
    params: {
      dateDebut: Date;
      dateFin: Date;
      serviceId?: string;
    }
  ) => {
    // Note: serviceId filter would require a join on Affectation
    // For now, return all validated absences in the period
    // TODO: Add service filter when needed
    const absences = await prisma.absence.findMany({
      where: {
        statut: "VALIDEE",
        dateDebut: { lte: params.dateFin },
        dateFin: { gte: params.dateDebut },
      },
      include: {
        employe: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        typeAbsence: {
          select: {
            libelle: true,
          },
        },
      },
      orderBy: [{ dateDebut: "asc" }, { creeLe: "asc" }],
    });

    return absences.map((a) => ({
      id: a.id,
      employe: {
        matricule: a.employe.matricule,
        nom: a.employe.nom,
        prenom: a.employe.prenom,
      },
      typeAbsence: a.typeAbsence.libelle,
      dateDebut: a.dateDebut,
      dateFin: a.dateFin,
      nombreJours: Number(a.nombreJours),
    }));
  }
);

// =====================================================================
// COMPTEURS POUR BADGES DE NAVIGATION
// =====================================================================

/**
 * Charge les compteurs de badges pour le module Congés
 * Utilisé par la barre latérale pour afficher les badges de notification
 *
 * Note : Cette fonction ne nécessite pas la permission "absence:demander" pour s'exécuter
 * Elle retourne des compteurs vides si l'utilisateur n'a pas les permissions appropriées
 */
export async function chargerCompteursConges() {
  try {
    const supabase = await (await import("@/lib/supabase/server")).createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { aValiderN1: 0, controleRH: 0 };
    }

    const profil = await prisma.profil.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
        employe: true,
      },
    });

    const permissions =
      profil?.roles.flatMap((pr) =>
        pr.role.permissions.map((rp) => rp.permission.code)
      ) ?? [];

    const compteurs = {
      aValiderN1: 0,
      controleRH: 0,
    };

    // Pour "À valider (N+1)" : compter les demandes de subordonnés directs avec statut SOUMISE
    if (permissions.includes("absence:valider") && profil?.employe) {
      const affectationsSubordonnes = await prisma.affectation.findMany({
        where: {
          superieurId: profil.employe.id,
          dateFin: null,
        },
        select: { employeId: true },
      });

      const subordinesIds = affectationsSubordonnes.map((a) => a.employeId);

      if (subordinesIds.length > 0) {
        compteurs.aValiderN1 = await prisma.absence.count({
          where: {
            employeId: { in: subordinesIds },
            statut: "ATTENTE_N1",
          },
        });
      }
    }

    // Pour "Contrôle RH" : compter les demandes validées N+1, en attente d'autorisation RH
    if (permissions.includes("absence:valider")) {
      compteurs.controleRH = await prisma.absence.count({
        where: {
          statut: "ATTENTE_RH",
        },
      });
    }

    return compteurs;
  } catch (error) {
    console.error("Erreur lors du chargement des compteurs congés:", error);
    return { aValiderN1: 0, controleRH: 0 };
  }
}
// =====================================================================
// NOUVELLES ACTIONS — PAGE UNIFIÉE CONGÉS ET PERMISSIONS
// =====================================================================

/**
 * Lister tous les employés avec leurs soldes de congés
 * Pour la vue d'équipe / RH
 */
export const listerEmployesSoldes = actionProtegee(
  "employe:lire",
  async (session, params?: {
    page?: number;
    limit?: number;
    recherche?: string;
    filtre?: string;
  }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const recherche = params?.recherche || "";
    const filtre = params?.filtre || "tous";

    const exerciceActuel = new Date().getFullYear();

    // Récupérer tous les employés permanents non archivés
    const employes = await prisma.employe.findMany({
      where: {
        archiveLe: null,
        typeMainOeuvre: {
          not: "JOURNALIER", // Journaliers exclus du module congés (M3 §7.1)
        },
      },
      include: {
        // Affectation actuelle pour direction/service
        affectations: {
          where: {
            OR: [
              { dateFin: null },
              { dateFin: { gte: new Date() } },
            ],
          },
          orderBy: { dateDebut: "desc" },
          take: 1,
          include: {
            poste: {
              select: {
                libelle: true,
                service: true,
                direction: true,
              },
            },
          },
        },
        // Soldes de l'exercice en cours
        soldeCongés: {
          where: { exercice: exerciceActuel },
        },
        // Demandes en attente de validation
        absences: {
          where: {
            statut: {
              in: ["ATTENTE_N1", "ATTENTE_RH"],
            },
          },
          select: {
            id: true,
            creeLe: true,
            statut: true,
            typeAbsence: {
              select: {
                libelle: true,
              },
            },
          },
        },
        // Premier contrat pour calculer l'éligibilité (12 mois)
        contrats: {
          orderBy: { dateDebut: "asc" },
          take: 1,
          select: {
            dateDebut: true,
          },
        },
      },
    }) as any; // Type assertion nécessaire car Prisma a des problèmes avec les includes complexes

    // Calculer le solde pour chaque employé et appliquer les filtres
    let employesAvecSolde = employes.map((employe: any) => {
      // Calculer le solde total des mouvements
      const soldeTotal = employe.soldeCongés.reduce((sum: number, mouvement: any) => {
        return sum + Number(mouvement.jours);
      }, 0);

      // Déterminer l'affectation actuelle
      const affectationActuelle = employe.affectations[0];
      const direction = affectationActuelle?.poste?.direction?.nom || "Non affecté";
      const service = affectationActuelle?.poste?.service?.nom || "Non affecté";

      // Compter les demandes en attente
      const demandesEnAttente = employe.absences.length;

      // Détecter les nouvelles demandes (créées dans les dernières 48h)
      const maintenant = new Date();
      const seuil48h = new Date(maintenant.getTime() - 48 * 60 * 60 * 1000);
      const nouvellesDemandes = employe.absences.filter((absence: any) => {
        const dateCreation = new Date(absence.creeLe);
        return dateCreation >= seuil48h;
      }).length;

      // Trouver la date et le type de la dernière demande
      let dateDerniereDemande: Date | null = null;
      let typeDerniereDemande: string | null = null;
      let estRecent = false;
      if (employe.absences.length > 0) {
        // Trier par date de création (plus récent en premier)
        const demandesTries = [...employe.absences].sort((a: any, b: any) => {
          return new Date(b.creeLe).getTime() - new Date(a.creeLe).getTime();
        });
        dateDerniereDemande = new Date(demandesTries[0].creeLe);
        typeDerniereDemande = demandesTries[0].typeAbsence.libelle;
        estRecent = dateDerniereDemande >= seuil48h;
      }

      // Calculer l'éligibilité (12 mois après la date d'embauche)
      let eligible = false;
      let moisDepuisEmbauche = 0;

      if (employe.contrats[0]) {
        const dateEmbauche = new Date(employe.contrats[0].dateDebut);
        const maintenant = new Date();
        const diffMs = maintenant.getTime() - dateEmbauche.getTime();
        moisDepuisEmbauche = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // ~30.44 jours par mois
        eligible = moisDepuisEmbauche >= 12;
      }

      return {
        id: employe.id,
        matricule: employe.matricule,
        nom: employe.nom,
        prenom: employe.prenom,
        direction,
        service,
        soldeTotal,
        demandesEnAttente,
        nouvellesDemandes,
        dateDerniereDemande,
        typeDerniereDemande,
        estRecent,
        eligible,
        moisDepuisEmbauche,
      };
    });

    // Calculer les counts AVANT filtrage (pour les badges)
    const counts = {
      eligibles: employesAvecSolde.filter((e: any) => e.eligible).length,
      nonEligibles: employesAvecSolde.filter((e: any) => !e.eligible).length,
      avecDemandes: employesAvecSolde.filter((e: any) => e.demandesEnAttente > 0).length,
      tous: employesAvecSolde.length,
    };

    // Appliquer le filtre badge-based
    if (filtre === "eligibles") {
      employesAvecSolde = employesAvecSolde.filter((e: any) => e.eligible);
    } else if (filtre === "non-eligibles") {
      employesAvecSolde = employesAvecSolde.filter((e: any) => !e.eligible);
    } else if (filtre === "avec-demandes") {
      employesAvecSolde = employesAvecSolde.filter((e: any) => e.demandesEnAttente > 0);
    }
    // "tous" : pas de filtre

    // Appliquer la recherche
    if (recherche) {
      const rechercheNormalisee = recherche.toLowerCase();
      employesAvecSolde = employesAvecSolde.filter((e: any) =>
        e.matricule.toLowerCase().includes(rechercheNormalisee) ||
        e.nom.toLowerCase().includes(rechercheNormalisee) ||
        e.prenom.toLowerCase().includes(rechercheNormalisee)
      );
    }

    // Tri : demandes en attente en premier, puis par nom
    employesAvecSolde.sort((a: any, b: any) => {
      // D'abord par présence de demandes (avec demandes en premier)
      if (a.demandesEnAttente > 0 && b.demandesEnAttente === 0) return -1;
      if (a.demandesEnAttente === 0 && b.demandesEnAttente > 0) return 1;

      // Ensuite par nom alphabétique
      return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
    });

    const total = employesAvecSolde.length;

    // Appliquer la pagination
    const debut = (page - 1) * limit;
    const fin = debut + limit;
    const employesPagines = employesAvecSolde.slice(debut, fin);

    return {
      employes: employesPagines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts,
    };
  }
);

/**
 * Obtenir les statistiques pour les indicateurs
 */
export async function obtenirStatistiquesConges(vue: string) {
  try {
    // TODO: Implémenter avec vraies données
    // Pour l'instant : données mockées

    // Vue équipe : indicateurs manager
    if (vue === "equipe") {
      return {
        success: true,
        data: {
          employesEligibles: 18,
          enAttente: 3,
          aValider: 5,
          tauxUtilisation: 27, // 8j/30j en moyenne
        },
      };
    }

    // Vue personnelle
    return {
      success: true,
      data: {
        soldeDisponible: 22,
        enAttente: 3,
        validesAnnee: 8,
        aValider: vue !== "mes-demandes" ? 5 : 0,
      },
    };
  } catch (error) {
    console.error("Erreur obtenirStatistiquesConges:", error);
    return {
      success: false,
      data: {
        soldeDisponible: 0,
        enAttente: 0,
        validesAnnee: 0,
        aValider: 0,
      },
    };
  }
}

/**
 * Lister les demandes de congés avec filtres
 */
type DemandeConge = {
  id: string;
  employeNom: string;
  employePrenom: string;
  employeMatricule: string;
  typeLibelle: string;
  dateDebut: string;
  dateFin: string;
  dureeJours: number;
  statut: "EN_ATTENTE" | "APPROUVE_N1" | "VALIDE_RH" | "REFUSE";
};

export async function listerDemandesConges(filtres: {
  page: number;
  recherche?: string;
  statut?: "EN_ATTENTE" | "APPROUVE_N1" | "VALIDE_RH" | "REFUSE";
  type?: "CONGE_ANNUEL" | "CONGE_MALADIE" | "PERMISSION" | "CONGE_SANS_SOLDE";
  dateDebut?: string;
  dateFin?: string;
  vue: "mes-demandes" | "a-valider" | "controle-rh" | "equipe";
}) {
  try {
    // TODO: Implémenter avec vraies données depuis Prisma
    // Pour l'instant : données mockées
    const demandes: DemandeConge[] = [
      {
        id: "1",
        employeNom: "Koné",
        employePrenom: "Aya",
        employeMatricule: "ITA-2024-0012",
        typeLibelle: "Congé annuel",
        dateDebut: "15/08/2026",
        dateFin: "29/08/2026",
        dureeJours: 10,
        statut: "EN_ATTENTE",
      },
      {
        id: "2",
        employeNom: "Touré",
        employePrenom: "Ibrahim",
        employeMatricule: "ITA-2023-0045",
        typeLibelle: "Permission",
        dateDebut: "12/08/2026",
        dateFin: "12/08/2026",
        dureeJours: 1,
        statut: "APPROUVE_N1",
      },
      {
        id: "3",
        employeNom: "Bamba",
        employePrenom: "Fatou",
        employeMatricule: "ITA-2025-0089",
        typeLibelle: "Congé maladie",
        dateDebut: "10/08/2026",
        dateFin: "11/08/2026",
        dureeJours: 2,
        statut: "VALIDE_RH",
      },
    ];

    return {
      items: demandes,
      total: demandes.length,
      pages: 1,
    };
  } catch (error) {
    console.error("Erreur listerDemandesConges:", error);
    return {
      items: [],
      total: 0,
      pages: 0,
    };
  }
}

/**
 * Obtenir les tâches urgentes liées aux congés
 */
export async function obtenirTachesConges() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: [] };
    }

    // Récupérer le profil avec les permissions
    const profil = await prisma.profil.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employe: {
          include: {
            // Subordonnés (pour managers) - affectations où cet employé est le supérieur
            subordonnesEmploye: {
              where: {
                OR: [
                  { dateFin: null },
                  { dateFin: { gte: new Date() } },
                ],
              },
              select: {
                employeId: true,
              },
            },
          },
        },
      },
    });

    if (!profil) {
      return { success: true, data: [] };
    }

    // Collecter toutes les permissions de tous les rôles
    const permissions = profil.roles.flatMap((pr) =>
      pr.role.permissions.map((p) => p.permission.code)
    );
    const taches: Array<{
      id: string;
      type: "A_VALIDER_N1" | "CONTROLE_RH" | "DOSSIER_INCOMPLET";
      titre: string;
      description: string;
      lien: string;
      priorite: "HAUTE" | "NORMALE" | "BASSE";
    }> = [];

    // TÂCHE 1 : Demandes à valider N+1 (managers)
    if (permissions.includes("absence:valider-n1") && profil.employe) {
      const idsSubordonnes = profil.employe.subordonnesEmploye.map((s) => s.employeId);

      if (idsSubordonnes.length > 0) {
        const countN1 = await prisma.absence.count({
          where: {
            employeId: { in: idsSubordonnes },
            statut: "ATTENTE_N1",
          },
        });

        if (countN1 > 0) {
          taches.push({
            id: "a-valider-n1",
            type: "A_VALIDER_N1",
            titre: `${countN1} demande${countN1 > 1 ? "s" : ""} de congé à valider`,
            description: "Demandes de votre équipe en attente de validation",
            lien: "/conges-permissions?vue=a-valider",
            priorite: "HAUTE",
          });
        }
      }
    }

    // TÂCHE 2 : Demandes à contrôler RH
    if (permissions.includes("absence:valider-rh")) {
      const countRH = await prisma.absence.count({
        where: {
          statut: "ATTENTE_RH",
        },
      });

      if (countRH > 0) {
        taches.push({
          id: "controle-rh",
          type: "CONTROLE_RH",
          titre: `${countRH} demande${countRH > 1 ? "s" : ""} en contrôle RH`,
          description: "Demandes validées N+1 à contrôler",
          lien: "/conges-permissions?vue=controle-rh",
          priorite: "NORMALE",
        });
      }
    }

    return {
      success: true,
      data: taches,
    };
  } catch (error) {
    console.error("Erreur obtenirTachesConges:", error);
    return {
      success: false,
      data: [],
    };
  }
}
