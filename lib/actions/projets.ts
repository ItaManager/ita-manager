"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutProjet, CyclePaie, Projet, TypeValidateur, RoleFonctionnel, StatutJalon } from "@prisma/client";

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
 * Générer le prochain code projet selon le format configuré
 *
 * Format par défaut : CH-{YYYY}-{NNN}
 * - {YYYY} : année en cours sur 4 chiffres
 * - {NNN} : numéro séquentiel sur N chiffres (rempli de zéros à gauche)
 */
export const genererCodeProjet = actionProtegee(
  "projet:creer",
  async () => {
    // Lire le format depuis les paramètres
    const paramFormat = await prisma.parametre.findUnique({
      where: { cle: "format.code_projet" },
    });

    const format = paramFormat?.valeur || "CH-{YYYY}-{NNN}";
    const annee = new Date().getFullYear();

    // Remplacer l'année
    let pattern = format.replace("{YYYY}", annee.toString());

    // Extraire le préfixe (tout ce qui précède {NNN})
    const prefix = pattern.split("{NNN}")[0];

    // Trouver le dernier projet avec ce préfixe
    const dernierProjet = await prisma.projet.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: "desc",
      },
    });

    // Calculer le prochain numéro
    let numero = 1;
    if (dernierProjet) {
      // Extraire le numéro du dernier code
      const match = dernierProjet.code.match(/(\d+)$/);
      if (match) {
        numero = parseInt(match[1], 10) + 1;
      }
    }

    // Compter le nombre de N dans le format pour déterminer le padding
    const nCount = (format.match(/N/g) || []).length;
    const numeroFormate = numero.toString().padStart(nCount, "0");

    // Remplacer {NNN} par le numéro formaté
    const codeGenere = pattern.replace("{NNN}", numeroFormate);

    return codeGenere;
  }
);

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
      localisation?: string;
      montantMarche?: number;
      dateDebut?: Date;
      dateFin?: Date;
      cyclePaie?: CyclePaie;
    }
  ) => {
    // Créer le projet ET son lieu de livraison en une seule transaction
    const projet = await prisma.projet.create({
      data: {
        code: donnees.code,
        nom: donnees.nom,
        description: donnees.description,
        maitreOuvrage: donnees.maitreOuvrage,
        montantMarche: donnees.montantMarche
          ? donnees.montantMarche
          : null,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
        cyclePaie: donnees.cyclePaie,
        statut: "BROUILLON",
        creePar: session.userId,
        // Création automatique du lieu de livraison (M5 §5.2)
        lieuLivraison: {
          create: {
            libelle: `Chantier ${donnees.nom}`,
            adresse: donnees.localisation || "",
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
 * Modifier un projet
 *
 * Permet la modification des informations de base du projet
 * SÉCURITÉ : Bloque la modification des projets clôturés
 */
export const modifierProjet = actionProtegee(
  "projet:modifier",
  async (
    session,
    projetId: string,
    donnees: {
      nom?: string;
      description?: string;
      maitreOuvrage?: string;
      localisation?: string;
      montantMarche?: number | null;
      dateDebut?: Date | null;
      dateFin?: Date | null;
      cyclePaie?: CyclePaie;
      conducteurId?: string | null;
      statut?: StatutProjet;
    }
  ) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
      include: { lieuLivraison: true, conducteur: true },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    // SÉCURITÉ : Bloquer la modification des projets clôturés et suspendus
    // Exception : on peut changer le statut d'un projet suspendu (pour le reprendre)
    const modifieAutreQueStatut = Object.keys(donnees).some(key => key !== 'statut');

    if (projet.statut === "CLOTURE") {
      throw new Error("Impossible de modifier un projet clôturé");
    }

    if (projet.statut === "SUSPENDU" && modifieAutreQueStatut) {
      throw new Error("Impossible de modifier un projet suspendu. Reprenez d'abord le projet pour le modifier.");
    }

    // Construire les données de mise à jour + traçabilité
    const updateData: any = {};
    const modifications: string[] = [];

    if (donnees.nom !== undefined && donnees.nom !== projet.nom) {
      updateData.nom = donnees.nom;
      modifications.push(`Nom: "${projet.nom}" → "${donnees.nom}"`);
    }
    if (donnees.description !== undefined && donnees.description !== projet.description) {
      updateData.description = donnees.description;
      modifications.push(`Description modifiée`);
    }
    if (donnees.maitreOuvrage !== undefined && donnees.maitreOuvrage !== projet.maitreOuvrage) {
      updateData.maitreOuvrage = donnees.maitreOuvrage;
      modifications.push(`Maître d'ouvrage: "${projet.maitreOuvrage || 'Non défini'}" → "${donnees.maitreOuvrage || 'Non défini'}"`);
    }
    if (donnees.montantMarche !== undefined && donnees.montantMarche !== Number(projet.montantMarche)) {
      updateData.montantMarche = donnees.montantMarche;
      modifications.push(`Montant: ${Number(projet.montantMarche)?.toLocaleString() || 'Non défini'} → ${donnees.montantMarche?.toLocaleString() || 'Non défini'} FCFA`);
    }
    if (donnees.dateDebut !== undefined) {
      const ancienne = projet.dateDebut ? new Date(projet.dateDebut).toISOString().split('T')[0] : null;
      const nouvelle = donnees.dateDebut ? new Date(donnees.dateDebut).toISOString().split('T')[0] : null;
      if (ancienne !== nouvelle) {
        updateData.dateDebut = donnees.dateDebut;
        modifications.push(`Date début: ${ancienne || '—'} → ${nouvelle || '—'}`);
      }
    }
    if (donnees.dateFin !== undefined) {
      const ancienne = projet.dateFin ? new Date(projet.dateFin).toISOString().split('T')[0] : null;
      const nouvelle = donnees.dateFin ? new Date(donnees.dateFin).toISOString().split('T')[0] : null;
      if (ancienne !== nouvelle) {
        updateData.dateFin = donnees.dateFin;
        modifications.push(`Date fin: ${ancienne || '—'} → ${nouvelle || '—'}`);
      }
    }
    if (donnees.cyclePaie !== undefined && donnees.cyclePaie !== projet.cyclePaie) {
      updateData.cyclePaie = donnees.cyclePaie;
      modifications.push(`Cycle de paie: ${projet.cyclePaie} → ${donnees.cyclePaie}`);
    }
    if (donnees.conducteurId !== undefined && donnees.conducteurId !== projet.conducteurId) {
      updateData.conducteurId = donnees.conducteurId;
      const ancienNom = projet.conducteur ? `${projet.conducteur.prenom} ${projet.conducteur.nom}` : 'Non assigné';
      modifications.push(`Conducteur: ${ancienNom} → ${donnees.conducteurId ? 'Modifié' : 'Non assigné'}`);
    }
    if (donnees.statut !== undefined && donnees.statut !== projet.statut) {
      updateData.statut = donnees.statut;
      const STATUT_LABELS: Record<StatutProjet, string> = {
        BROUILLON: "Brouillon",
        OUVERT: "Ouvert",
        EN_COURS: "En cours",
        SUSPENDU: "Suspendu",
        CLOTURE: "Clôturé",
      };
      modifications.push(`Statut: ${STATUT_LABELS[projet.statut]} → ${STATUT_LABELS[donnees.statut]}`);
    }

    // Si aucune modification, ne rien faire
    if (Object.keys(updateData).length === 0 && !donnees.localisation) {
      return serializeProjet(projet);
    }

    const projetMisAJour = await prisma.projet.update({
      where: { id: projetId },
      data: updateData,
      include: {
        lieuLivraison: true,
      },
    });

    // Mettre à jour le lieu de livraison si localisation change
    if (donnees.localisation !== undefined && projet.lieuLivraison) {
      const ancienne = projet.lieuLivraison.adresse;
      if (ancienne !== donnees.localisation) {
        await prisma.lieuLivraison.update({
          where: { id: projet.lieuLivraison.id },
          data: {
            adresse: donnees.localisation,
          },
        });
        modifications.push(`Localisation: "${ancienne || 'Non défini'}" → "${donnees.localisation || 'Non défini'}"`);
      }
    }

    // Journalisation détaillée
    await prisma.journalEvenement.create({
      data: {
        entite: "Projet",
        entiteId: projetId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `${projet.code} : ${modifications.join(' | ')}`,
      },
    });

    revalidatePath("/projets");
    revalidatePath(`/projets/${projetId}`);
    return serializeProjet(projetMisAJour);
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

    // Vérifier que tous les journaliers ont une compétence assignée
    if (employeIds && employeIds.length > 0) {
      const employes = await prisma.employe.findMany({
        where: { id: { in: employeIds } },
        include: {
          competences: {
            where: { dateFin: null },
            take: 1,
          },
        },
      });

      const journaliersSansCompetence = employes.filter(
        (emp) => emp.typeMainOeuvre === "JOURNALIER" && emp.competences.length === 0
      );

      if (journaliersSansCompetence.length > 0) {
        const noms = journaliersSansCompetence
          .map((emp) => `${emp.prenom} ${emp.nom}`)
          .join(", ");
        throw new Error(
          `Impossible d'affecter des journaliers sans compétence : ${noms}. Veuillez d'abord leur assigner une compétence.`
        );
      }
    }

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
 * Lister les tâches d'un projet (pour sélection de prédécesseur)
 */
export const listerTachesProjet = actionProtegee(
  "planning:modifier",
  async (session, projetId: string) => {
    const taches = await prisma.tache.findMany({
      where: { projetId },
      select: {
        id: true,
        libelle: true,
      },
      orderBy: { dateDebut: "asc" },
    });

    return taches;
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
      // Vérifier que tous les journaliers ont une compétence assignée
      if (employeIds.length > 0) {
        const employes = await prisma.employe.findMany({
          where: { id: { in: employeIds } },
          include: {
            competences: {
              where: { dateFin: null },
              take: 1,
            },
          },
        });

        const journaliersSansCompetence = employes.filter(
          (emp) => emp.typeMainOeuvre === "JOURNALIER" && emp.competences.length === 0
        );

        if (journaliersSansCompetence.length > 0) {
          const noms = journaliersSansCompetence
            .map((emp) => `${emp.prenom} ${emp.nom}`)
            .join(", ");
          throw new Error(
            `Impossible d'affecter des journaliers sans compétence : ${noms}. Veuillez d'abord leur assigner une compétence.`
          );
        }
      }

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
      statut?: StatutJalon;
    }
  ) => {
    const jalonExistant = await prisma.jalon.findUnique({
      where: { id: jalonId },
      select: { projetId: true, libelle: true, statut: true },
    });

    if (!jalonExistant) {
      throw new Error("Jalon introuvable");
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
// DOCUMENTS DE JALONS
// =====================================================================

/**
 * Enregistrer un document uploadé pour un jalon.
 *
 * Règles :
 * - Fichier déjà uploadé dans Supabase Storage (bucket jalons-documents)
 * - Enregistrer seulement la référence en base
 * - Un seul document par jalon
 */
export const ajouterDocumentJalon = actionProtegee(
  "projet:modifier",
  async (
    session,
    input: {
      jalonId: string;
      nomFichier: string;
      cheminStorage: string;
      taille: number;
      typeMime: string;
    }
  ) => {
    const jalon = await prisma.jalon.findUnique({
      where: { id: input.jalonId },
      include: { document: true, projet: true },
    });

    if (!jalon) {
      throw new Error("Jalon introuvable");
    }

    // Un seul document par jalon
    if (jalon.document) {
      throw new Error("Ce jalon a déjà un document attaché. Supprimez-le d'abord.");
    }

    // Générer un UUID pour pieceId
    const pieceId = crypto.randomUUID();

    const document = await prisma.$transaction(async (tx) => {
      // Mettre à jour le jalon avec le pieceId
      await tx.jalon.update({
        where: { id: input.jalonId },
        data: { pieceId },
      });

      // Créer le document
      const nouveauDoc = await tx.documentJalon.create({
        data: {
          id: pieceId,
          jalonId: pieceId,
          nomFichier: input.nomFichier,
          cheminStorage: input.cheminStorage,
          taille: input.taille,
          typeMime: input.typeMime,
          deposeParId: session.userId,
        },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "DocumentJalon",
          entiteId: nouveauDoc.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Document ajouté au jalon : ${jalon.libelle}`,
        },
      });

      return nouveauDoc;
    });

    revalidatePath(`/projets/${jalon.projetId}`);
    return document;
  }
);

/**
 * Télécharger un document de jalon (génère URL signée temporaire)
 */
export const telechargerDocumentJalon = actionProtegee(
  "projet:modifier",
  async (session, documentId: string) => {
    const document = await prisma.documentJalon.findUnique({
      where: { id: documentId },
      include: { jalon: { include: { projet: true } } },
    });

    if (!document) {
      throw new Error("Document introuvable");
    }

    // Générer URL signée (60 secondes)
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from("jalons-documents")
      .createSignedUrl(document.cheminStorage, 60);

    if (error || !data?.signedUrl) {
      throw new Error("Impossible de générer le lien de téléchargement.");
    }

    // Journaliser la consultation
    await prisma.journalEvenement.create({
      data: {
        entite: "DocumentJalon",
        entiteId: documentId,
        action: "CONSULTATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Document téléchargé — Jalon : ${document.jalon.libelle}`,
      },
    });

    return data.signedUrl;
  }
);

/**
 * Supprimer un document de jalon
 */
export const supprimerDocumentJalon = actionProtegee(
  "projet:modifier",
  async (session, documentId: string) => {
    const document = await prisma.documentJalon.findUnique({
      where: { id: documentId },
      include: { jalon: { include: { projet: true } } },
    });

    if (!document) {
      throw new Error("Document introuvable");
    }

    const projetId = document.jalon.projetId;
    const jalonLibelle = document.jalon.libelle;

    // 1. Supprimer le fichier de Supabase Storage
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      await supabase.storage.from("jalons-documents").remove([document.cheminStorage]);
    } catch (error) {
      console.error("Erreur suppression Storage:", error);
      // Ne pas bloquer la suppression si le fichier n'existe plus
    }

    // 2. Supprimer la référence en base dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer le document
      await tx.documentJalon.delete({
        where: { id: documentId },
      });

      // Mettre à jour le jalon (enlever pieceId)
      await tx.jalon.update({
        where: { id: document.jalon.id },
        data: { pieceId: null },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "DocumentJalon",
          entiteId: documentId,
          action: "SUPPRESSION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Document supprimé — Jalon : ${jalonLibelle}`,
        },
      });
    });

    revalidatePath(`/projets/${projetId}`);
  }
);

/**
 * Valider un jalon rapidement (passage ATTENTE → VALIDÉ)
 */
export const validerJalonRapide = actionProtegee(
  "projet:modifier",
  async (session, jalonId: string) => {
    const jalon = await prisma.jalon.findUnique({
      where: { id: jalonId },
      include: {
        projet: true,
      },
    });

    if (!jalon) {
      throw new Error("Jalon introuvable");
    }

    if (jalon.statut !== "ATTENTE") {
      throw new Error(`Ce jalon est déjà ${jalon.statut === "VALIDE" ? "validé" : "abandonné"}`);
    }

    // Mise à jour du statut
    const jalonValide = await prisma.jalon.update({
      where: { id: jalonId },
      data: {
        statut: "VALIDE",
        valideLe: new Date(),
        validePar: session.userId,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Jalon",
        entiteId: jalonId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Jalon validé : ${jalon.libelle}`,
      },
    });

    revalidatePath(`/projets/${jalon.projetId}`);
    return jalonValide;
  }
);

// =====================================================================
// DOCUMENTS PROJET
// =====================================================================

/**
 * Ajouter un document à un projet
 */
export const ajouterDocumentProjet = actionProtegee(
  "projet:modifier",
  async (session, input: {
    projetId: string;
    categorie: string;
    nomFichier: string;
    cheminStorage: string;
    taille: number;
    typeMime: string;
  }) => {
    const projet = await prisma.projet.findUnique({
      where: { id: input.projetId },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    const documentId = crypto.randomUUID();

    const document = await prisma.$transaction(async (tx) => {
      const nouveauDoc = await tx.documentProjet.create({
        data: {
          id: documentId,
          projetId: input.projetId,
          categorie: input.categorie as any,
          nomFichier: input.nomFichier,
          cheminStorage: input.cheminStorage,
          taille: input.taille,
          typeMime: input.typeMime,
          deposeParId: session.userId,
        },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "DocumentProjet",
          entiteId: nouveauDoc.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Document ajouté au projet ${projet.code} : ${input.nomFichier}`,
        },
      });

      return nouveauDoc;
    });

    revalidatePath(`/projets/${input.projetId}`);
    return document;
  }
);

/**
 * Télécharger un document projet (génère URL signée 60s)
 */
export const telechargerDocumentProjet = actionProtegee(
  "projet:modifier",
  async (session, documentId: string) => {
    const document = await prisma.documentProjet.findUnique({
      where: { id: documentId },
      include: {
        projet: true,
      },
    });

    if (!document) {
      throw new Error("Document introuvable");
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from("projets-documents")
      .createSignedUrl(document.cheminStorage, 60);

    if (error || !data?.signedUrl) {
      throw new Error("Impossible de générer le lien de téléchargement.");
    }

    await prisma.journalEvenement.create({
      data: {
        entite: "DocumentProjet",
        entiteId: documentId,
        action: "CONSULTATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Document téléchargé — Projet ${document.projet.code} : ${document.nomFichier}`,
      },
    });

    return data.signedUrl;
  }
);

/**
 * Supprimer un document projet
 */
export const supprimerDocumentProjet = actionProtegee(
  "projet:modifier",
  async (session, documentId: string) => {
    const document = await prisma.documentProjet.findUnique({
      where: { id: documentId },
      include: {
        projet: true,
      },
    });

    if (!document) {
      throw new Error("Document introuvable");
    }

    const projetId = document.projetId;
    const projetCode = document.projet.code;
    const nomFichier = document.nomFichier;

    // 1. Supprimer de Supabase Storage
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.storage.from("projets-documents").remove([document.cheminStorage]);
    } catch (error) {
      console.error("Erreur suppression Storage:", error);
    }

    // 2. Transaction database
    await prisma.$transaction(async (tx) => {
      await tx.documentProjet.delete({ where: { id: documentId } });

      await tx.journalEvenement.create({
        data: {
          entite: "DocumentProjet",
          entiteId: documentId,
          action: "SUPPRESSION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Document supprimé — Projet ${projetCode} : ${nomFichier}`,
        },
      });
    });

    revalidatePath(`/projets/${projetId}`);
  }
);

// =====================================================================
// RISQUES ET INCIDENTS
// =====================================================================

/**
 * Créer un risque ou incident
 */
export const creerRisqueIncident = actionProtegee(
  "projet:modifier",
  async (
    session,
    input: {
      projetId: string;
      type: "RISQUE" | "INCIDENT";
      gravite: "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE";
      titre: string;
      description?: string;
      mesures?: string;
      responsableId?: string;
    }
  ) => {
    const projet = await prisma.projet.findUnique({
      where: { id: input.projetId },
      select: { code: true },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    const risque = await prisma.$transaction(async (tx) => {
      const nouveau = await tx.risqueIncident.create({
        data: {
          projetId: input.projetId,
          type: input.type,
          gravite: input.gravite,
          titre: input.titre,
          description: input.description,
          mesures: input.mesures,
          responsableId: input.responsableId,
          creePar: session.userId,
        },
        include: {
          responsable: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "RisqueIncident",
          entiteId: nouveau.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `${input.type === "RISQUE" ? "Risque" : "Incident"} créé — Projet ${projet.code} : ${input.titre}`,
        },
      });

      return nouveau;
    });

    revalidatePath(`/projets/${input.projetId}`);
    return risque;
  }
);

/**
 * Modifier un risque ou incident
 */
export const modifierRisqueIncident = actionProtegee(
  "projet:modifier",
  async (
    session,
    risqueId: string,
    input: {
      gravite?: "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE";
      titre?: string;
      description?: string;
      mesures?: string;
      responsableId?: string;
    }
  ) => {
    const risque = await prisma.risqueIncident.findUnique({
      where: { id: risqueId },
      include: { projet: true },
    });

    if (!risque) {
      throw new Error("Risque/incident introuvable");
    }

    const risqueMaj = await prisma.$transaction(async (tx) => {
      const maj = await tx.risqueIncident.update({
        where: { id: risqueId },
        data: input,
        include: {
          responsable: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "RisqueIncident",
          entiteId: risqueId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `${risque.type === "RISQUE" ? "Risque" : "Incident"} modifié — Projet ${risque.projet.code} : ${risque.titre}`,
        },
      });

      return maj;
    });

    revalidatePath(`/projets/${risque.projetId}`);
    return risqueMaj;
  }
);

/**
 * Changer le statut d'un risque/incident
 */
export const changerStatutRisqueIncident = actionProtegee(
  "projet:modifier",
  async (
    session,
    risqueId: string,
    nouveauStatut: "OUVERT" | "EN_TRAITEMENT" | "RESOLU" | "CLOTURE"
  ) => {
    const risque = await prisma.risqueIncident.findUnique({
      where: { id: risqueId },
      include: { projet: true },
    });

    if (!risque) {
      throw new Error("Risque/incident introuvable");
    }

    const risqueMaj = await prisma.$transaction(async (tx) => {
      const maj = await tx.risqueIncident.update({
        where: { id: risqueId },
        data: {
          statut: nouveauStatut,
          dateResolution:
            nouveauStatut === "RESOLU" || nouveauStatut === "CLOTURE"
              ? new Date()
              : null,
        },
        include: {
          responsable: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      });

      const statutsLabels = {
        OUVERT: "ouvert",
        EN_TRAITEMENT: "en traitement",
        RESOLU: "résolu",
        CLOTURE: "clôturé",
      };

      await tx.journalEvenement.create({
        data: {
          entite: "RisqueIncident",
          entiteId: risqueId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `${risque.type === "RISQUE" ? "Risque" : "Incident"} passé à "${statutsLabels[nouveauStatut]}" — Projet ${risque.projet.code} : ${risque.titre}`,
        },
      });

      return maj;
    });

    revalidatePath(`/projets/${risque.projetId}`);
    return risqueMaj;
  }
);

/**
 * Supprimer un risque ou incident
 */
export const supprimerRisqueIncident = actionProtegee(
  "projet:modifier",
  async (session, risqueId: string) => {
    const risque = await prisma.risqueIncident.findUnique({
      where: { id: risqueId },
      include: { projet: true },
    });

    if (!risque) {
      throw new Error("Risque/incident introuvable");
    }

    const projetId = risque.projetId;
    const projetCode = risque.projet.code;
    const titre = risque.titre;
    const type = risque.type;

    await prisma.$transaction(async (tx) => {
      await tx.risqueIncident.delete({
        where: { id: risqueId },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "RisqueIncident",
          entiteId: risqueId,
          action: "SUPPRESSION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `${type === "RISQUE" ? "Risque" : "Incident"} supprimé — Projet ${projetCode} : ${titre}`,
        },
      });
    });

    revalidatePath(`/projets/${projetId}`);
  }
);

// =====================================================================
// NOTES ET OBSERVATIONS
// =====================================================================

/**
 * Créer une note sur un projet
 */
export const creerNoteProjet = actionProtegee(
  "projet:modifier",
  async (
    session,
    input: {
      projetId: string;
      type: "GENERALE" | "TECHNIQUE" | "QUALITE" | "SECURITE" | "ADMINISTRATIVE" | "REUNION";
      titre?: string;
      contenu: string;
      epinglee?: boolean;
    }
  ) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      select: { employeId: true },
    });

    if (!profil?.employeId) {
      throw new Error("Profil employé introuvable");
    }

    const employeId = profil.employeId;

    const projet = await prisma.projet.findUnique({
      where: { id: input.projetId },
      select: { code: true },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    const note = await prisma.$transaction(async (tx) => {
      const nouvelle = await tx.noteProjet.create({
        data: {
          projetId: input.projetId,
          type: input.type,
          titre: input.titre,
          contenu: input.contenu,
          epinglee: input.epinglee || false,
          auteurId: employeId,
        },
        include: {
          auteur: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "NoteProjet",
          entiteId: nouvelle.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Note ${input.type} créée — Projet ${projet.code}${input.titre ? ` : ${input.titre}` : ""}`,
        },
      });

      return nouvelle;
    });

    revalidatePath(`/projets/${input.projetId}`);
    return note;
  }
);

/**
 * Modifier une note de projet
 */
export const modifierNoteProjet = actionProtegee(
  "projet:modifier",
  async (
    session,
    noteId: string,
    input: {
      titre?: string;
      contenu?: string;
      type?: "GENERALE" | "TECHNIQUE" | "QUALITE" | "SECURITE" | "ADMINISTRATIVE" | "REUNION";
    }
  ) => {
    const note = await prisma.noteProjet.findUnique({
      where: { id: noteId },
      include: { projet: true },
    });

    if (!note) {
      throw new Error("Note introuvable");
    }

    const noteMaj = await prisma.$transaction(async (tx) => {
      const maj = await tx.noteProjet.update({
        where: { id: noteId },
        data: input,
        include: {
          auteur: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "NoteProjet",
          entiteId: noteId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Note modifiée — Projet ${note.projet.code}`,
        },
      });

      return maj;
    });

    revalidatePath(`/projets/${note.projetId}`);
    return noteMaj;
  }
);

/**
 * Épingler ou désépingler une note
 */
export const epinglerNoteProjet = actionProtegee(
  "projet:modifier",
  async (session, noteId: string, epinglee: boolean) => {
    const note = await prisma.noteProjet.findUnique({
      where: { id: noteId },
      include: { projet: true },
    });

    if (!note) {
      throw new Error("Note introuvable");
    }

    const noteMaj = await prisma.noteProjet.update({
      where: { id: noteId },
      data: { epinglee },
    });

    revalidatePath(`/projets/${note.projetId}`);
    return noteMaj;
  }
);

/**
 * Supprimer une note de projet
 */
export const supprimerNoteProjet = actionProtegee(
  "projet:modifier",
  async (session, noteId: string) => {
    const note = await prisma.noteProjet.findUnique({
      where: { id: noteId },
      include: { projet: true },
    });

    if (!note) {
      throw new Error("Note introuvable");
    }

    const projetId = note.projetId;
    const projetCode = note.projet.code;

    await prisma.$transaction(async (tx) => {
      await tx.noteProjet.delete({
        where: { id: noteId },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "NoteProjet",
          entiteId: noteId,
          action: "SUPPRESSION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Note supprimée — Projet ${projetCode}`,
        },
      });
    });

    revalidatePath(`/projets/${projetId}`);
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
        client: true,
        jalons: {
          orderBy: { datePrevisionnelle: "asc" },
          include: {
            document: true,
          },
        },
        documents: {
          orderBy: { deposeLe: "desc" },
        },
        risquesIncidents: {
          orderBy: { dateIdentification: "desc" },
          include: {
            responsable: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        notes: {
          orderBy: [
            { epinglee: "desc" },
            { creeLe: "desc" },
          ],
          include: {
            auteur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        taches: {
          orderBy: { dateDebut: "asc" },
          include: {
            predecesseur: {
              select: {
                id: true,
                libelle: true,
              },
            },
            responsable: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
            affectations: {
              include: {
                employe: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                  },
                },
              },
            },
          },
        },
        affectations: {
          orderBy: {
            dateDebut: "desc",
          },
          include: {
            employe: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                matricule: true,
              },
            },
          },
        },
        affectationsMateriel: {
          orderBy: {
            dateDebut: "desc",
          },
          include: {
            materiel: {
              select: {
                id: true,
                codeIta: true,
                designation: true,
                type: true,
                marque: true,
                modele: true,
                immatriculation: true,
                statut: true,
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

// =====================================================================
// TÂCHES ET NOTIFICATIONS
// =====================================================================

export interface TacheProjet {
  id: string;
  type: 'brouillon' | 'taches-en-cours' | 'validation' | 'retard' | 'alerte';
  titre: string;
  description: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  lien?: string;
  count?: number;
  date?: Date;
}

/**
 * Récupère les tâches en attente selon le rôle de l'utilisateur
 */
export const obtenirTachesProjets = actionProtegee(
  "projet:creer",
  async (session) => {
    // Récupérer les rôles de l'utilisateur
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

    if (!profil) {
      return { success: true, data: [] };
    }

    const roles = profil.roles.map((pr) => pr.role.code);
    const taches: TacheProjet[] = [];
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    // ALERTES CRITIQUES (priorité haute)

    // 1. Tâches en retard
    const tachesEnRetard = await prisma.tache.findMany({
      where: {
        dateFin: { lt: aujourdhui },
        OR: [
          { avancementConstate: { lt: 100 } },
          { avancementConstate: null },
        ],
        projet: {
          statut: { in: ["EN_COURS", "OUVERT"] },
        },
      },
      include: {
        projet: {
          select: { id: true, code: true, nom: true },
        },
      },
    });

    if (tachesEnRetard.length > 0) {
      const projetsAffectes = new Set(tachesEnRetard.map(t => t.projet.id)).size;
      taches.push({
        id: "taches-retard",
        type: "alerte",
        titre: `${tachesEnRetard.length} tâche${tachesEnRetard.length > 1 ? 's' : ''} en retard`,
        description: `Sur ${projetsAffectes} projet${projetsAffectes > 1 ? 's' : ''}`,
        priorite: "haute",
        lien: "/projets?statut=EN_COURS",
        count: tachesEnRetard.length,
      });
    }

    // 2. Jalons en retard
    const jalonsEnRetard = await prisma.jalon.findMany({
      where: {
        datePrevisionnelle: { lt: aujourdhui },
        statut: { not: "VALIDE" },
        projet: {
          statut: { in: ["EN_COURS", "OUVERT"] },
        },
      },
      include: {
        projet: {
          select: { id: true, code: true, nom: true },
        },
      },
    });

    if (jalonsEnRetard.length > 0) {
      const projetsAffectes = new Set(jalonsEnRetard.map(j => j.projet.id)).size;
      taches.push({
        id: "jalons-retard",
        type: "alerte",
        titre: `${jalonsEnRetard.length} jalon${jalonsEnRetard.length > 1 ? 's' : ''} en retard`,
        description: `Sur ${projetsAffectes} projet${projetsAffectes > 1 ? 's' : ''}`,
        priorite: "haute",
        lien: "/projets?statut=EN_COURS",
        count: jalonsEnRetard.length,
      });
    }

    // 3. Jalons à valider (proches de la date prévisionnelle)
    const dans7Jours = new Date(aujourdhui);
    dans7Jours.setDate(dans7Jours.getDate() + 7);

    const jalonsAValider = await prisma.jalon.count({
      where: {
        statut: "ATTENTE",
        datePrevisionnelle: {
          gte: aujourdhui,
          lte: dans7Jours,
        },
        projet: {
          statut: { in: ["EN_COURS", "OUVERT"] },
        },
      },
    });

    if (jalonsAValider > 0) {
      taches.push({
        id: "jalons-a-valider",
        type: "validation",
        titre: `${jalonsAValider} jalon${jalonsAValider > 1 ? 's' : ''} à valider`,
        description: "Dans les 7 prochains jours",
        priorite: "moyenne",
        lien: "/projets?statut=EN_COURS",
        count: jalonsAValider,
      });
    }

    // TÂCHES NORMALES

    // Projets brouillons à compléter
    const projetsBrouillons = await prisma.projet.count({
      where: { statut: "BROUILLON" },
    });

    if (projetsBrouillons > 0) {
      taches.push({
        id: "brouillons",
        type: "brouillon",
        titre: `${projetsBrouillons} projet${projetsBrouillons > 1 ? 's' : ''} en brouillon`,
        description: "Projets créés mais non finalisés",
        priorite: "moyenne",
        lien: "/projets?statut=BROUILLON",
        count: projetsBrouillons,
      });
    }

    // Projets en cours avec tâches incomplètes
    const projetsAvecTaches = await prisma.projet.findMany({
      where: {
        statut: "EN_COURS",
        taches: {
          some: {
            OR: [
              { avancementConstate: { lt: 100 } },
              { avancementConstate: null },
            ],
          },
        },
      },
      include: {
        taches: {
          where: {
            OR: [
              { avancementConstate: { lt: 100 } },
              { avancementConstate: null },
            ],
          },
        },
      },
    });

    const totalTaches = projetsAvecTaches.reduce((sum, p) => sum + p.taches.length, 0);

    if (totalTaches > 0) {
      taches.push({
        id: "taches-en-cours",
        type: "taches-en-cours",
        titre: `${totalTaches} tâche${totalTaches > 1 ? 's' : ''} en cours`,
        description: `Sur ${projetsAvecTaches.length} projet${projetsAvecTaches.length > 1 ? 's' : ''}`,
        priorite: "haute",
        lien: "/projets?statut=EN_COURS",
        count: totalTaches,
      });
    }

    // Projets suspendus à reprendre (si admin/DG)
    if (roles.includes("ADMIN") || roles.includes("DG")) {
      const projetsSuspendus = await prisma.projet.count({
        where: { statut: "SUSPENDU" },
      });

      if (projetsSuspendus > 0) {
        taches.push({
          id: "suspendus",
          type: "validation",
          titre: `${projetsSuspendus} projet${projetsSuspendus > 1 ? 's' : ''} suspendu${projetsSuspendus > 1 ? 's' : ''}`,
          description: "Projets en attente de reprise",
          priorite: "basse",
          lien: "/projets?statut=SUSPENDU",
          count: projetsSuspendus,
        });
      }
    }

    // Trier par priorité
    const prioriteOrdre = { haute: 0, moyenne: 1, basse: 2 };
    taches.sort((a, b) => prioriteOrdre[a.priorite] - prioriteOrdre[b.priorite]);

    return {
      success: true,
      data: taches,
      total: taches.length,
    };
  }
);

/**
 * Récupère la liste des journaliers avec leur compétence et disponibilité
 */
export const obtenirJournaliersAvecCompetence = actionProtegee(
  "planning:modifier",
  async (session, projetId: string) => {
    const journaliers = await prisma.employe.findMany({
      where: {
        typeMainOeuvre: "JOURNALIER",
      },
      include: {
        competences: {
          where: {
            dateFin: null,
          },
          include: {
            competence: {
              select: {
                libelle: true,
              },
            },
          },
          take: 1,
          orderBy: {
            dateEffet: "desc",
          },
        },
        affectationsTaches: {
          where: {
            tache: {
              projetId: projetId,
              // Tâches non terminées
              dateFin: {
                gte: new Date(),
              },
            },
          },
          select: {
            tacheId: true,
            tache: {
              select: {
                libelle: true,
              },
            },
          },
        },
      },
    });

    return journaliers.map((j) => ({
      id: j.id,
      nom: j.nom,
      prenom: j.prenom,
      matricule: j.matricule,
      competence: j.competences[0]?.competence.libelle || null,
      affectationsActives: j.affectationsTaches.length,
      disponible: j.affectationsTaches.length === 0,
    }));
  }
);
