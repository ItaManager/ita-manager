"use server";

/**
 * Server Actions — Relevés d'activité (M6)
 *
 * M6 §3 : Module le plus risqué - pointage par exception, hors ligne d'abord
 * M6 §6 : Contrôle par lien de données (conducteur du chantier)
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutReleve, EtatPointage } from "@prisma/client";

// =====================================================================
// M6 — RELEVÉS D'ACTIVITÉ
// =====================================================================

/**
 * Ouvrir un nouveau relevé
 *
 * M6 §7 : Préremplissage automatique
 * - Agents affectés au chantier
 * - Heures théoriques du jour
 * - Matériel et tâches en cours
 */
export const ouvrirReleve = actionProtegee(
  "releve:saisir",
  async (
    session,
    donnees: {
      projetId: string;
      date: Date;
    }
  ) => {
    // Vérifier qu'il n'existe pas déjà (M6 §8.1 : contrainte d'unicité)
    const existant = await prisma.releveActivite.findUnique({
      where: {
        projetId_date: {
          projetId: donnees.projetId,
          date: donnees.date,
        },
      },
    });

    if (existant) {
      throw new Error("Un relevé existe déjà pour ce chantier à cette date");
    }

    // Récupérer l'employé du profil
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Profil employé introuvable");
    }

    // Créer le relevé (M6 §3.2 : pointage par exception sera fait côté client)
    const releve = await prisma.releveActivite.create({
      data: {
        projetId: donnees.projetId,
        date: donnees.date,
        chefChantierId: profil.employe.id,
        statut: "BROUILLON",
      },
      include: {
        projet: true,
      },
    });

    revalidatePath("/releves");
    return releve;
  }
);

/**
 * Enregistrer brouillon (M6 §3.3 : local d'abord, synchronisation différée)
 *
 * NOTE: La vraie implémentation nécessite IndexedDB côté client
 * Ceci est une version simplifiée pour la structure de base
 */
export const enregistrerBrouillon = actionProtegee(
  "releve:saisir",
  async (session, releveId: string) => {
    // Vérifier propriété
    const releve = await prisma.releveActivite.findUnique({
      where: { id: releveId },
      include: {
        chefChantier: { include: { profil: true } },
      },
    });

    if (!releve) {
      throw new Error("Relevé introuvable");
    }

    if (releve.chefChantier.profil?.id !== session.userId) {
      throw new Error("Vous n'êtes pas autorisé à modifier ce relevé");
    }

    if (releve.statut !== "BROUILLON") {
      throw new Error("Ce relevé n'est plus modifiable");
    }

    // Mise à jour syncEnAttente (sera géré par IndexedDB)
    await prisma.releveActivite.update({
      where: { id: releveId },
      data: {
        derniereSync: new Date(),
        syncEnAttente: false,
      },
    });

    revalidatePath("/releves");
    return { success: true };
  }
);

/**
 * Soumettre pour visa
 *
 * M6 §5.1 : BROUILLON → SOUMIS
 */
export const soumettreReleve = actionProtegee(
  "releve:saisir",
  async (session, releveId: string) => {
    const releve = await prisma.releveActivite.findUnique({
      where: { id: releveId },
      include: {
        chefChantier: { include: { profil: true } },
        pointages: true,
      },
    });

    if (!releve) {
      throw new Error("Relevé introuvable");
    }

    if (releve.chefChantier.profil?.id !== session.userId) {
      throw new Error("Non autorisé");
    }

    if (releve.statut !== "BROUILLON") {
      throw new Error("Ce relevé ne peut pas être soumis");
    }

    // Vérifier qu'il y a au moins un pointage
    if (releve.pointages.length === 0) {
      throw new Error("Le pointage est obligatoire");
    }

    await prisma.releveActivite.update({
      where: { id: releveId },
      data: { statut: "SOUMIS" },
    });

    revalidatePath("/releves");
    revalidatePath("/releves/a-viser");
    return { success: true };
  }
);

/**
 * Viser un relevé
 *
 * M6 §6 : Contrôle par lien de données (conducteur du chantier)
 * M6 §8.2 : Le visa ne modifie pas
 */
export const viserReleve = actionProtegee(
  "releve:viser",
  async (session, releveId: string) => {
    const releve = await prisma.releveActivite.findUnique({
      where: { id: releveId },
    });

    if (!releve) {
      throw new Error("Relevé introuvable");
    }

    if (releve.statut !== "SOUMIS") {
      throw new Error("Ce relevé ne peut pas être visé");
    }

    // M6 §6 : Vérifier rôle DT ou ADMIN (simplifié)
    // La vraie implémentation vérifiera le lien conducteur ⇄ chantier
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: { include: { role: true } },
      },
    });

    const rolesCodes = profil?.roles.map((r) => r.role.code) || [];
    const autorise = rolesCodes.some((r) => ["DT", "CT", "ADMIN"].includes(r));

    if (!autorise) {
      throw new Error("Vous n'êtes pas autorisé à viser ce relevé");
    }

    await prisma.releveActivite.update({
      where: { id: releveId },
      data: {
        statut: "VISE",
        conducteurId: session.userId,
        viseLe: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "ReleveActivite",
        entiteId: releveId,
        action: "VISA",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Relevé visé`,
      },
    });

    revalidatePath("/releves/a-viser");
    return { success: true };
  }
);

/**
 * Refuser un relevé (M6 §1.3 : refus avec motif obligatoire)
 *
 * M6 §5.1 : SOUMIS → REFUSE → BROUILLON
 */
export const refuserReleve = actionProtegee(
  "releve:viser",
  async (
    session,
    donnees: {
      releveId: string;
      motif: string;
    }
  ) => {
    if (!donnees.motif || donnees.motif.trim().length < 10) {
      throw new Error("Le motif de refus doit faire au moins 10 caractères");
    }

    const releve = await prisma.releveActivite.findUnique({
      where: { id: donnees.releveId },
      include: {
        projet: {
          include: {
            affectations: {
              where: {
                roleFonctionnel: "CONDUCTEUR",
                dateFin: null,
              },
              include: {
                employe: { include: { profil: true } },
              },
            },
          },
        },
      },
    });

    if (!releve) {
      throw new Error("Relevé introuvable");
    }

    // Vérifier autorisation
    const estConducteur = releve.projet.affectations.some(
      (aff) => aff.employe.profil?.id === session.userId
    );

    // Charger les rôles de l'utilisateur
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    const roles = profil?.roles.map((pr) => pr.role.code) ?? [];

    if (!estConducteur && !roles.includes("DT") && !roles.includes("ADMIN")) {
      throw new Error("Non autorisé");
    }

    await prisma.releveActivite.update({
      where: { id: donnees.releveId },
      data: {
        statut: "REFUSE",
        motifRefus: donnees.motif,
        conducteurId: session.userId,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "ReleveActivite",
        entiteId: donnees.releveId,
        action: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { motif: donnees.motif },
        commentaire: `Relevé refusé : ${donnees.motif.substring(0, 50)}...`,
      },
    });

    revalidatePath("/releves/a-viser");
    return { success: true };
  }
);

// =====================================================================
// CONSULTATION
// =====================================================================

export type ReleveListItem = {
  id: string;
  date: Date;
  statut: StatutReleve;
  projet: {
    id: string;
    code: string;
    nom: string;
  };
  chefChantier: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  nbPointages: number;
  nbTravaux: number;
  nbIncidents: number;
};

/**
 * Lister les relevés d'activité
 */
export async function listerReleves(): Promise<ReleveListItem[]> {
  const releves = await prisma.releveActivite.findMany({
    select: {
      id: true,
      date: true,
      statut: true,
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
          matricule: true,
          nom: true,
          prenom: true,
        },
      },
      _count: {
        select: {
          pointages: true,
          travauxRealises: true,
          incidents: true,
        },
      },
    },
    orderBy: [
      { date: 'desc' },
      { creeLe: 'desc' },
    ],
    take: 50, // Limiter aux 50 derniers
  });

  return releves.map((r) => ({
    id: r.id,
    date: r.date,
    statut: r.statut,
    projet: r.projet,
    chefChantier: r.chefChantier,
    nbPointages: r._count.pointages,
    nbTravaux: r._count.travauxRealises,
    nbIncidents: r._count.incidents,
  }));
}
