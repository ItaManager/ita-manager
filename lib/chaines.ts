/**
 * Distinction chaîne hiérarchique / chaîne fonctionnelle — Décision A-08 bis
 *
 * La chaîne hiérarchique (N+1) gère :
 * - Les demandes de congés
 * - Les demandes de ressources
 * - L'évaluation annuelle
 *
 * La chaîne fonctionnelle (référent projet) gère :
 * - Le visa des relevés d'activité
 * - Le suivi du planning chantier
 * - La validation des heures saisies
 *
 * ⚠️ NE JAMAIS CONFONDRE LES DEUX
 *
 * Un Chef de Chantier peut :
 * - Relever hiérarchiquement du Directeur Technique (congés → DT)
 * - Relever fonctionnellement du Conducteur de Travaux du projet X (relevés → CT)
 *
 * Ces deux fonctions garantissent qu'aucun code ne mélange les deux chaînes.
 */

import { prisma } from "@/lib/db/prisma";

/**
 * Obtenir le supérieur hiérarchique d'un employé.
 *
 * SOURCE : table `affectations`, champ `superieurId`
 * USAGE : demandes de congés, demandes de ressources, évaluations
 *
 * @param employeId L'ID de l'employé
 * @returns L'ID du supérieur hiérarchique, ou null si absent (ex: DG)
 * @throws Si l'employé n'a aucune affectation active
 */
export async function obtenirSuperieurHierarchique(
  employeId: string
): Promise<string | null> {
  const affectation = await prisma.affectation.findFirst({
    where: {
      employeId,
      OR: [
        { dateFin: null }, // Affectation ouverte
        { dateFin: { gte: new Date() } }, // Ou se termine dans le futur
      ],
    },
    orderBy: { dateDebut: "desc" },
    select: { superieurId: true },
  });

  if (!affectation) {
    throw new Error(
      `Employé ${employeId} : aucune affectation active trouvée. Impossible de déterminer le supérieur hiérarchique.`
    );
  }

  return affectation.superieurId;
}

/**
 * Obtenir le référent fonctionnel d'un employé sur un projet donné.
 *
 * SOURCE : table `affectations_chantier`, rôle CONDUCTEUR ou CHARGE_ETUDES
 * USAGE : visa des relevés d'activité, suivi du planning
 *
 * Le référent fonctionnel est le CONDUCTEUR du projet OU le CHARGE_ETUDES
 * (décision A-08 bis). Il vise les relevés d'activité de tous les employés
 * affectés au chantier, quelle que soit leur position hiérarchique.
 *
 * @param employeId L'ID de l'employé
 * @param projetId L'ID du projet
 * @returns L'ID du conducteur ou chargé d'études du projet, ou null si absent
 * @throws Si l'employé n'est pas affecté au projet
 */
export async function obtenirReferentFonctionnel(
  employeId: string,
  projetId: string
): Promise<string | null> {
  // Vérifier que l'employé est bien affecté au projet
  const affectationEmploye = await prisma.affectationChantier.findFirst({
    where: {
      employeId,
      projetId,
      OR: [
        { dateFin: null },
        { dateFin: { gte: new Date() } },
      ],
    },
  });

  if (!affectationEmploye) {
    throw new Error(
      `Employé ${employeId} : non affecté au projet ${projetId}. Impossible de déterminer le référent fonctionnel.`
    );
  }

  // Trouver le conducteur OU le chargé d'études du projet (par ordre de priorité)
  const referent = await prisma.affectationChantier.findFirst({
    where: {
      projetId,
      roleFonctionnel: { in: ["CONDUCTEUR", "CHARGE_ETUDES"] },
      OR: [
        { dateFin: null },
        { dateFin: { gte: new Date() } },
      ],
    },
    orderBy: { dateDebut: "desc" },
    select: { employeId: true },
  });

  return referent?.employeId || null;
}

/**
 * Lister les employés dont je suis le supérieur hiérarchique.
 *
 * USAGE : écran "À valider" pour les demandes de congés
 *
 * @param superieurId L'ID du supérieur
 * @returns Liste des IDs des employés sous ma responsabilité hiérarchique
 */
export async function listerSubordonnesHierarchiques(
  superieurId: string
): Promise<string[]> {
  const affectations = await prisma.affectation.findMany({
    where: {
      superieurId,
      OR: [
        { dateFin: null },
        { dateFin: { gte: new Date() } },
      ],
    },
    select: { employeId: true },
  });

  return affectations.map((a) => a.employeId);
}

/**
 * Lister les employés du projet dont je suis le référent fonctionnel.
 *
 * USAGE : visa des relevés d'activité
 *
 * @param referentId L'ID du conducteur ou chargé d'études
 * @param projetId L'ID du projet
 * @returns Liste des IDs des employés affectés au projet
 */
export async function listerEquipeFonctionnelle(
  referentId: string,
  projetId: string
): Promise<string[]> {
  // Vérifier que je suis bien conducteur OU chargé d'études du projet
  const monRoleReferent = await prisma.affectationChantier.findFirst({
    where: {
      employeId: referentId,
      projetId,
      roleFonctionnel: { in: ["CONDUCTEUR", "CHARGE_ETUDES"] },
      OR: [
        { dateFin: null },
        { dateFin: { gte: new Date() } },
      ],
    },
  });

  if (!monRoleReferent) {
    throw new Error(
      `Employé ${referentId} : non référent fonctionnel du projet ${projetId}. Impossible de lister l'équipe fonctionnelle.`
    );
  }

  // Lister tous les employés affectés au projet
  const affectations = await prisma.affectationChantier.findMany({
    where: {
      projetId,
      OR: [
        { dateFin: null },
        { dateFin: { gte: new Date() } },
      ],
    },
    select: { employeId: true },
  });

  return affectations.map((a) => a.employeId);
}
