"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutProjet, CyclePaie, Projet, TypeValidateur, RoleFonctionnel } from "@prisma/client";

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
  "projet:modifier",
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
      responsableId?: string;
      employeIds?: string[];
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

    const { employeIds, ...tacheDonnees } = donnees;

    const tache = await prisma.tache.create({
      data: {
        ...tacheDonnees,
        avancementPlanifie: donnees.avancementPlanifie || 0,
        // Créer les affectations en une seule transaction
        ...(employeIds && employeIds.length > 0
          ? {
              affectations: {
                create: employeIds.map((employeId) => ({
                  employeId,
                })),
              },
            }
          : {}),
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
    revalidatePath(`/projets/${donnees.projetId}`);
    return tache;
  }
);

/**
 * Modifier une tâche existante
 */
export const modifierTache = actionProtegee(
  "planning:modifier",
  async (
    session,
    tacheId: string,
    donnees: {
      libelle?: string;
      description?: string;
      dateDebut?: Date;
      dateFin?: Date;
      avancementPlanifie?: number;
      predecesseurId?: string | null;
      responsableId?: string | null;
      employeIds?: string[];
    }
  ) => {
    const tacheExistante = await prisma.tache.findUnique({
      where: { id: tacheId },
      select: { projetId: true, libelle: true },
    });

    if (!tacheExistante) {
      throw new Error("Tâche introuvable");
    }

    // Si un nouveau prédécesseur est spécifié, détecter les cycles
    if (donnees.predecesseurId) {
      const cycleDetecte = await detecterCycleDependances(
        tacheId,
        donnees.predecesseurId
      );

      if (cycleDetecte) {
        throw new Error(
          "Dépendance circulaire détectée : cette tâche ne peut pas dépendre de son successeur"
        );
      }
    }

    const { employeIds, ...tacheDonnees } = donnees;

    // Si employeIds est fourni, mettre à jour les affectations
    if (employeIds !== undefined) {
      // Supprimer toutes les affectations existantes
      await prisma.affectationTache.deleteMany({
        where: { tacheId },
      });

      // Recréer les affectations
      if (employeIds.length > 0) {
        await prisma.affectationTache.createMany({
          data: employeIds.map((employeId) => ({
            tacheId,
            employeId,
          })),
        });
      }
    }

    const tache = await prisma.tache.update({
      where: { id: tacheId },
      data: tacheDonnees,
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Tache",
        entiteId: tache.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Tâche modifiée : ${tache.libelle}`,
      },
    });

    revalidatePath(`/projets/${tacheExistante.projetId}/planning`);
    revalidatePath(`/projets/${tacheExistante.projetId}`);
    revalidatePath(`/projets`);
    return tache;
  }
);

/**
 * Supprimer une tâche
 */
export const supprimerTache = actionProtegee(
  "planning:modifier",
  async (session, tacheId: string) => {
    const tacheExistante = await prisma.tache.findUnique({
      where: { id: tacheId },
      select: { projetId: true, libelle: true },
    });

    if (!tacheExistante) {
      throw new Error("Tâche introuvable");
    }

    // Supprimer les dépendances vers cette tâche
    await prisma.tache.updateMany({
      where: { predecesseurId: tacheId },
      data: { predecesseurId: null },
    });

    await prisma.tache.delete({
      where: { id: tacheId },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Tache",
        entiteId: tacheId,
        action: "SUPPRESSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Tâche supprimée : ${tacheExistante.libelle}`,
      },
    });

    revalidatePath(`/projets/${tacheExistante.projetId}/planning`);
    revalidatePath(`/projets`);
  }
);

// =====================================================================
// JALONS
// =====================================================================

/**
 * Créer un jalon
 *
 * RÈGLE MÉTIER (M5) : Les jalons permettent de suivre les événements clés du projet
 */
export const creerJalon = actionProtegee(
  "projet:modifier",
  async (
    session,
    donnees: {
      projetId: string;
      libelle: string;
      description?: string;
      datePrevisionnelle: Date;
      typeValidateur: TypeValidateur;
      validateurExterne?: string;
    }
  ) => {
    const jalon = await prisma.jalon.create({
      data: {
        ...donnees,
        statut: "ATTENTE",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Jalon",
        entiteId: jalon.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Jalon créé : ${jalon.libelle}`,
      },
    });

    revalidatePath(`/projets/${donnees.projetId}`);
    return jalon;
  }
);

/**
 * Marquer un jalon comme atteint (valider)
 *
 * RÈGLE MÉTIER (M5) : Un jalon validé passe au statut VALIDE
 */
export const marquerJalonAtteint = actionProtegee(
  "projet:modifier",
  async (session, jalonId: string) => {
    const jalon = await prisma.jalon.findUnique({
      where: { id: jalonId },
      include: { projet: true },
    });

    if (!jalon) {
      throw new Error("Jalon introuvable");
    }

    if (jalon.statut !== "ATTENTE") {
      throw new Error(
        `Impossible de valider un jalon au statut ${jalon.statut}`
      );
    }

    const jalonMisAJour = await prisma.jalon.update({
      where: { id: jalonId },
      data: {
        statut: "VALIDE",
        valideLe: new Date(),
        validePar: session.userId,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Jalon",
        entiteId: jalonId,
        action: "JALON_ATTEINT",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Jalon validé : ${jalon.libelle}`,
      },
    });

    revalidatePath(`/projets/${jalon.projetId}`);
    return jalonMisAJour;
  }
);

/**
 * Modifier un jalon existant
 */
export const modifierJalon = actionProtegee(
  "projet:modifier",
  async (
    session,
    jalonId: string,
    donnees: {
      libelle?: string;
      description?: string;
      datePrevisionnelle?: Date;
      typeValidateur?: TypeValidateur;
      validateurExterne?: string;
    }
  ) => {
    const jalonExistant = await prisma.jalon.findUnique({
      where: { id: jalonId },
      select: { projetId: true, libelle: true, statut: true },
    });

    if (!jalonExistant) {
      throw new Error("Jalon introuvable");
    }

    // Empêcher la modification d'un jalon déjà validé
    if (jalonExistant.statut === "VALIDE") {
      throw new Error("Impossible de modifier un jalon déjà validé");
    }

    const jalon = await prisma.jalon.update({
      where: { id: jalonId },
      data: donnees,
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Jalon",
        entiteId: jalon.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Jalon modifié : ${jalon.libelle}`,
      },
    });

    revalidatePath(`/projets/${jalonExistant.projetId}`);
    revalidatePath(`/projets`);
    return jalon;
  }
);

/**
 * Supprimer un jalon
 */
export const supprimerJalon = actionProtegee(
  "projet:modifier",
  async (session, jalonId: string) => {
    const jalonExistant = await prisma.jalon.findUnique({
      where: { id: jalonId },
      select: { projetId: true, libelle: true, statut: true },
    });

    if (!jalonExistant) {
      throw new Error("Jalon introuvable");
    }

    // Empêcher la suppression d'un jalon validé
    if (jalonExistant.statut === "VALIDE") {
      throw new Error("Impossible de supprimer un jalon déjà validé");
    }

    await prisma.jalon.delete({
      where: { id: jalonId },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Jalon",
        entiteId: jalonId,
        action: "SUPPRESSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Jalon supprimé : ${jalonExistant.libelle}`,
      },
    });

    revalidatePath(`/projets/${jalonExistant.projetId}`);
    revalidatePath(`/projets`);
  }
);

// =====================================================================
// AFFECTATIONS CHANTIER
// =====================================================================

/**
 * Affecter un employé à un chantier
 *
 * RÈGLE MÉTIER (M5) : Vérifier qu'il n'y a pas de chevauchement de dates
 */
export const affecterEmployeChantier = actionProtegee(
  "chantier:affecter",
  async (
    session,
    donnees: {
      projetId: string;
      employeId: string;
      roleFonctionnel: RoleFonctionnel;
      dateDebut: Date;
      dateFin?: Date;
    }
  ) => {
    // Vérifier les chevauchements de dates pour cet employé
    const affectationsExistantes = await prisma.affectationChantier.findMany({
      where: {
        employeId: donnees.employeId,
        OR: [
          {
            // Affectations en cours (sans date de fin)
            dateFin: null,
          },
          {
            // Affectations avec chevauchement de dates
            AND: [
              { dateDebut: { lte: donnees.dateFin || new Date("2099-12-31") } },
              { dateFin: { gte: donnees.dateDebut } },
            ],
          },
        ],
      },
    });

    if (affectationsExistantes.length > 0) {
      throw new Error(
        "Impossible d'affecter : chevauchement avec une affectation existante"
      );
    }

    const affectation = await prisma.affectationChantier.create({
      data: {
        projetId: donnees.projetId,
        employeId: donnees.employeId,
        roleFonctionnel: donnees.roleFonctionnel,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
        creePar: session.userId,
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
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AffectationChantier",
        entiteId: affectation.id,
        action: "AFFECTATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `${affectation.employe.prenom} ${affectation.employe.nom} affecté(e) au projet ${affectation.projet.code}`,
      },
    });

    revalidatePath(`/projets/${donnees.projetId}`);
    revalidatePath(`/employes/${donnees.employeId}`);
    return affectation;
  }
);

/**
 * Modifier une affectation existante sur un chantier
 */
export const modifierAffectationChantier = actionProtegee(
  "chantier:affecter",
  async (
    session,
    donnees: {
      affectationId: string;
      employeId?: string; // Optionnel : permet de changer l'employé (cas de force majeure)
      roleFonctionnel: RoleFonctionnel;
      dateDebut: Date;
      dateFin?: Date;
    }
  ) => {
    // Récupérer l'affectation existante
    const affectationExistante = await prisma.affectationChantier.findUnique({
      where: { id: donnees.affectationId },
      include: {
        employe: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
      },
    });

    if (!affectationExistante) {
      throw new Error("Affectation introuvable");
    }

    // Déterminer l'employé final (nouveau ou existant)
    const employeIdFinal = donnees.employeId || affectationExistante.employeId;
    const changementEmploye = employeIdFinal !== affectationExistante.employeId;

    // Vérifier les chevauchements de dates avec d'autres affectations de l'employé
    const affectationsAutres = await prisma.affectationChantier.findMany({
      where: {
        employeId: employeIdFinal,
        id: { not: donnees.affectationId }, // Exclure l'affectation en cours de modification
        OR: [
          {
            // Affectations en cours (sans date de fin)
            dateFin: null,
          },
          {
            // Affectations avec chevauchement de dates
            AND: [
              { dateDebut: { lte: donnees.dateFin || new Date("2099-12-31") } },
              { dateFin: { gte: donnees.dateDebut } },
            ],
          },
        ],
      },
    });

    if (affectationsAutres.length > 0) {
      throw new Error(
        "Impossible de modifier : chevauchement avec une autre affectation"
      );
    }

    const affectation = await prisma.affectationChantier.update({
      where: { id: donnees.affectationId },
      data: {
        employeId: employeIdFinal,
        roleFonctionnel: donnees.roleFonctionnel,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
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
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AffectationChantier",
        entiteId: affectation.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: changementEmploye
          ? `Remplacement employé ${affectationExistante.employe.prenom} ${affectationExistante.employe.nom} → ${affectation.employe.prenom} ${affectation.employe.nom} sur ${affectation.projet.code}`
          : `Modification affectation ${affectation.employe.prenom} ${affectation.employe.nom} sur ${affectation.projet.code}`,
      },
    });

    revalidatePath(`/projets/${affectation.projetId}`);
    revalidatePath(`/employes/${affectation.employeId}`);
    // Revalider aussi l'ancien employé si changement
    if (changementEmploye) {
      revalidatePath(`/employes/${affectationExistante.employeId}`);
    }
    return affectation;
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
  localisation: string | null;
  conducteur: { nom: string; prenom: string } | null;
  montantMarche: number | null;
  montantEngage: number | null;
  dateDebut: Date | null;
  dateFin: Date | null;
  avancementPlanifie: number;
  avancementConstate: number | null;
  creeLe: Date;
};

/**
 * Lister les projets
 */
export const listerProjets = actionProtegee(
  "projet:modifier",
  async (): Promise<ProjetListItem[]> => {
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
        lieuLivraison: {
          select: {
            libelle: true,
          },
        },
        affectations: {
          where: {
            roleFonctionnel: "CONDUCTEUR",
            dateFin: null,
          },
          select: {
            employe: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
          take: 1,
        },
        taches: {
          select: {
            avancementPlanifie: true,
            avancementConstate: true,
          },
        },
      },
      orderBy: [
        { statut: "asc" }, // BROUILLON, OUVERT, EN_COURS en premier
        { creeLe: "desc" },
      ],
    });

    return projets.map((p) => {
      // Calculer l'avancement moyen planifié
      const avancementPlanifie =
        p.taches.length > 0
          ? Math.round(
              p.taches.reduce((sum, t) => sum + t.avancementPlanifie, 0) /
                p.taches.length
            )
          : 0;

      // Calculer l'avancement moyen constaté (uniquement sur les tâches avec constaté non null)
      const tachesAvecConstate = p.taches.filter(
        (t) => t.avancementConstate !== null
      );
      const avancementConstate =
        tachesAvecConstate.length > 0
          ? Math.round(
              tachesAvecConstate.reduce(
                (sum, t) => sum + (t.avancementConstate || 0),
                0
              ) / tachesAvecConstate.length
            )
          : null;

      return {
        id: p.id,
        code: p.code,
        nom: p.nom,
        statut: p.statut,
        maitreOuvrage: p.maitreOuvrage,
        localisation: p.lieuLivraison?.libelle || null,
        conducteur:
          p.affectations.length > 0
            ? {
                nom: p.affectations[0].employe.nom,
                prenom: p.affectations[0].employe.prenom,
              }
            : null,
        montantMarche: p.montantMarche ? Number(p.montantMarche) : null,
        montantEngage: null, // À implémenter avec le module achats
        dateDebut: p.dateDebut,
        dateFin: p.dateFin,
        avancementPlanifie,
        avancementConstate,
        creeLe: p.creeLe,
      };
    });
  }
);

/**
 * Obtenir un projet avec ses relations
 */
export const obtenirProjet = actionProtegee(
  "projet:modifier",
  async (session, projetId: string) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
      include: {
        lieuLivraison: true,
        jalons: {
          orderBy: { datePrevisionnelle: "asc" },
        },
        taches: {
          orderBy: { dateDebut: "asc" },
        },
        affectations: {
          where: {
            dateFin: null,
          },
          include: {
            employe: {
              select: {
                nom: true,
                prenom: true,
                matricule: true,
              },
            },
          },
        },
      },
    });

    if (!projet) {
      return null;
    }

    // Calculer l'avancement moyen des tâches
    const avancementPlanifie =
      projet.taches.length > 0
        ? Math.round(
            projet.taches.reduce((sum, t) => sum + t.avancementPlanifie, 0) /
              projet.taches.length
          )
        : 0;

    const tachesAvecConstate = projet.taches.filter(
      (t) => t.avancementConstate !== null
    );
    const avancementConstate =
      tachesAvecConstate.length > 0
        ? Math.round(
            tachesAvecConstate.reduce(
              (sum, t) => sum + (t.avancementConstate || 0),
              0
            ) / tachesAvecConstate.length
          )
        : null;

    return {
      ...projet,
      montantMarche: projet.montantMarche ? Number(projet.montantMarche) : null,
      localisation: projet.lieuLivraison?.libelle || null,
      conducteur:
        projet.affectations.length > 0
          ? {
              nom: projet.affectations[0].employe.nom,
              prenom: projet.affectations[0].employe.prenom,
            }
          : null,
      avancementPlanifie,
      avancementConstate,
    };
  }
);
