"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutProjet, CyclePaie, Projet } from "@prisma/client";

// =====================================================================
// M5 — PROJETS ET PLANNING
// =====================================================================

/**
 * Convertir les champs Decimal d'un projet en numbers pour la sérialisation client
 */
function serializeProjet<T extends Projet | null>(
  projet: T
): T extends null ? null : Omit<Projet, "montantMarche"> & { montantMarche: number | null } {
  if (!projet) return null as any;
  return {
    ...projet,
    montantMarche: projet.montantMarche ? Number(projet.montantMarche) : null,
  } as any;
}

/**
 * Créer un projet
 *
 * RÈGLE MÉTIER (M5 §5.2) : Création automatique du LieuLivraison
 */
export const creerProjet = actionProtegee(
  "projet:creer",
  async (
    session,
    donnees: {
      code: string;
      nom: string;
      description?: string;
      maitreOuvrage?: string;
      montantMarche?: number;
      dateDebut?: Date;
      dateFin?: Date;
      cyclePaie?: CyclePaie;
    }
  ) => {
    // Créer le projet ET son lieu de livraison en une seule transaction
    const projet = await prisma.projet.create({
      data: {
        ...donnees,
        montantMarche: donnees.montantMarche
          ? donnees.montantMarche
          : null,
        statut: "BROUILLON",
        creePar: session.userId,
        // Création automatique du lieu de livraison (M5 §5.2)
        lieuLivraison: {
          create: {
            libelle: `Chantier ${donnees.nom}`,
            adresse: "",
            creePar: session.userId,
          },
        },
      },
      include: {
        lieuLivraison: true,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projet.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Projet créé : ${projet.code}`,
      },
    });

    revalidatePath("/projets");
    return serializeProjet(projet);
  }
);

/**
 * Ouvrir un projet — BROUILLON → OUVERT
 *
 * RÈGLE MÉTIER (M5 §8.1) : Cycle de vie du projet
 */
export const ouvrirProjet = actionProtegee(
  "projet:creer",
  async (session, projetId: string) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    if (projet.statut !== "BROUILLON") {
      throw new Error(
        `Impossible d'ouvrir un projet au statut ${projet.statut}`
      );
    }

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: {
        statut: "OUVERT",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "OUVERTURE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Projet ouvert : ${projet.code}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
  }
);

/**
 * Démarrer un projet — OUVERT → EN_COURS
 */
export const demarrerProjet = actionProtegee(
  "projet:creer",
  async (session, projetId: string) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    if (projet.statut !== "OUVERT") {
      throw new Error(
        `Impossible de démarrer un projet au statut ${projet.statut}`
      );
    }

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: {
        statut: "EN_COURS",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "DEMARRAGE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Projet démarré : ${projet.code}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
  }
);

/**
 * Suspendre un projet — EN_COURS → SUSPENDU
 *
 * RÈGLE MÉTIER (M5 §8.1) : Un chantier peut être suspendu (intempéries, litige)
 */
export const suspendreProjet = actionProtegee(
  "projet:creer",
  async (session, projetId: string, motif: string) => {
    if (!motif || motif.trim().length < 20) {
      throw new Error(
        "Un motif substantiel (minimum 20 caractères) est requis pour suspendre un projet"
      );
    }

    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    if (projet.statut !== "EN_COURS") {
      throw new Error(
        `Impossible de suspendre un projet au statut ${projet.statut}`
      );
    }

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: {
        statut: "SUSPENDU",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "SUSPENSION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { motif },
        commentaire: `Projet suspendu : ${projet.code} — Motif : ${motif}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
  }
);

/**
 * Reprendre un projet suspendu — SUSPENDU → EN_COURS
 *
 * RÈGLE MÉTIER (M5 §8.1) : SUSPENDU ⇄ EN_COURS
 */
export const reprendreProjet = actionProtegee(
  "projet:creer",
  async (session, projetId: string) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    if (projet.statut !== "SUSPENDU") {
      throw new Error(
        `Impossible de reprendre un projet au statut ${projet.statut}`
      );
    }

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: {
        statut: "EN_COURS",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "REPRISE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Projet repris : ${projet.code}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
  }
);

/**
 * Clôturer un projet — EN_COURS ou SUSPENDU → CLOTURE
 *
 * RÈGLE MÉTIER (M5 §8.2) : Conditions de clôture
 * - Tous les relevés d'activité sont visés
 * - Aucune période de paie n'est ouverte
 * - Tous les jalons sont soldés ou explicitement abandonnés
 */
export const cloturerProjet = actionProtegee(
  "projet:creer",
  async (session, projetId: string) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
      include: {
        jalons: true,
      },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    if (projet.statut !== "EN_COURS" && projet.statut !== "SUSPENDU") {
      throw new Error(
        `Impossible de clôturer un projet au statut ${projet.statut}`
      );
    }

    // Vérifier que tous les jalons sont soldés ou abandonnés
    const jalonsEnAttente = projet.jalons.filter((j) => j.statut === "ATTENTE");
    if (jalonsEnAttente.length > 0) {
      throw new Error(
        `Impossible de clôturer : ${jalonsEnAttente.length} jalon(s) en attente. Tous les jalons doivent être validés ou abandonnés.`
      );
    }

    // TODO M6 : Vérifier que tous les relevés d'activité sont visés
    // TODO M7 : Vérifier qu'aucune période de paie n'est ouverte

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: {
        statut: "CLOTURE",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "CLOTURE",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Projet clôturé : ${projet.code}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
  }
);

/**
 * Rouvrir un projet clôturé — CLOTURE → EN_COURS
 *
 * RÈGLE MÉTIER (M5 §8.1) : La réouverture est journalisée
 */
export const rouvrirProjet = actionProtegee(
  "projet:creer",
  async (session, projetId: string, motif: string) => {
    if (!motif || motif.trim().length < 20) {
      throw new Error(
        "Un motif substantiel (minimum 20 caractères) est requis pour rouvrir un projet clôturé"
      );
    }

    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    if (projet.statut !== "CLOTURE") {
      throw new Error(
        `Seul un projet clôturé peut être rouvert (statut actuel : ${projet.statut})`
      );
    }

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: {
        statut: "EN_COURS",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "REOUVERTURE",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { motif },
        commentaire: `Projet rouvert : ${projet.code} — Motif : ${motif}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
  }
);

/**
 * Détecter les dépendances circulaires dans un graphe de tâches
 *
 * RÈGLE MÉTIER (M5 §8.3) : Contrôle de cohérence des dépendances
 */
async function detecterCycleDependances(
  tacheId: string,
  predecesseurId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const stack = [predecesseurId];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === tacheId) {
      // Cycle détecté : on revient à la tâche de départ
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Trouver le prédécesseur du nœud courant
    const tache = await prisma.tache.findUnique({
      where: { id: current },
      select: { predecesseurId: true },
    });

    if (tache?.predecesseurId) {
      stack.push(tache.predecesseurId);
    }
  }

  return false;
}

/**
 * Créer une tâche avec contrôle de dépendance circulaire
 *
 * RÈGLE MÉTIER (M5 §8.3) : Une tâche ne peut pas précéder son prédécesseur
 */
export const creerTache = actionProtegee(
  "planning:modifier",
  async (
    session,
    donnees: {
      projetId: string;
      libelle: string;
      description?: string;
      dateDebut: Date;
      dateFin: Date;
      avancementPlanifie?: number;
      predecesseurId?: string;
    }
  ) => {
    // Si un prédécesseur est spécifié, détecter les cycles
    if (donnees.predecesseurId) {
      const cycleDetecte = await detecterCycleDependances(
        "", // Nouvelle tâche, pas encore d'ID
        donnees.predecesseurId
      );

      if (cycleDetecte) {
        throw new Error(
          "Dépendance circulaire détectée : cette tâche ne peut pas dépendre de son successeur"
        );
      }
    }

    const tache = await prisma.tache.create({
      data: {
        ...donnees,
        avancementPlanifie: donnees.avancementPlanifie || 0,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Tache",
        entiteId: tache.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Tâche créée : ${tache.libelle}`,
      },
    });

    revalidatePath(`/projets/${donnees.projetId}/planning`);
    return tache;
  }
);

// =====================================================================
// CONSULTATION
// =====================================================================

export type ProjetListItem = {
  id: string;
  code: string;
  nom: string;
  statut: StatutProjet;
  maitreOuvrage: string | null;
  montantMarche: number | null;
  dateDebut: Date | null;
  dateFin: Date | null;
  creeLe: Date;
};

/**
 * Lister les projets
 */
export async function listerProjets(): Promise<ProjetListItem[]> {
  const projets = await prisma.projet.findMany({
    select: {
      id: true,
      code: true,
      nom: true,
      statut: true,
      maitreOuvrage: true,
      montantMarche: true,
      dateDebut: true,
      dateFin: true,
      creeLe: true,
    },
    orderBy: [
      { statut: 'asc' }, // BROUILLON, OUVERT, EN_COURS en premier
      { creeLe: 'desc' },
    ],
  });

  return projets.map((p) => ({
    ...p,
    montantMarche: p.montantMarche ? Number(p.montantMarche) : null,
  }));
}

/**
 * Obtenir un projet avec ses relations
 */
export async function obtenirProjet(projetId: string) {
  const projet = await prisma.projet.findUnique({
    where: { id: projetId },
    include: {
      lieuLivraison: true,
      jalons: {
        orderBy: { datePrevisionnelle: 'asc' },
      },
      taches: {
        orderBy: { dateDebut: 'asc' },
        take: 10, // Limiter pour la page de détail
      },
      affectations: {
        where: { dateFin: null },
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
      },
    },
  });

  if (!projet) {
    return null;
  }

  return {
    ...projet,
    montantMarche: projet.montantMarche ? Number(projet.montantMarche) : null,
  };
}
