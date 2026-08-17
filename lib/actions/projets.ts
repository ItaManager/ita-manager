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
    }
  ) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
      include: { lieuLivraison: true },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    // SÉCURITÉ : Bloquer la modification des projets clôturés
    if (projet.statut === "CLOTURE") {
      throw new Error("Impossible de modifier un projet clôturé");
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
    // NOTE: conducteurId n'existe pas encore dans le schéma Projet
    // if (donnees.conducteurId !== undefined && donnees.conducteurId !== projet.conducteurId) {
    //   updateData.conducteurId = donnees.conducteurId;
    //   modifications.push(`Conducteur modifié`);
    // }

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
