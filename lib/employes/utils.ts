/**
 * lib/employes/utils.ts — M2 Gestion des employés
 *
 * Fonctions utilitaires pour les employés.
 * NE SONT PAS des Server Actions — utilisées en interne et dans les écrans Server Components.
 *
 * IMPORTANT : Pas de "use server" ici.
 */

import { prisma } from "@/lib/db/prisma";

/**
 * Récupère toutes les données de référence pour les formulaires employé.
 * Utilisée pour peupler les sélecteurs (nationalités, directions, services, postes, etc.)
 */
export async function obtenirDonneesReferenceEmploye() {
  const [nationalites, directions, services, postes, employes, projets] = await Promise.all([
    prisma.nationalite.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
      },
    }),

    prisma.direction.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
      },
    }),

    prisma.service.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
        directionId: true,
      },
    }),

    prisma.poste.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
        code: true,
        serviceId: true,
        directionId: true,
      },
    }),

    // Liste des employés permanents pour sélection du supérieur hiérarchique
    prisma.employe.findMany({
      where: {
        typeMainOeuvre: "PERMANENT",
        archiveLe: null,
      },
      orderBy: [
        { nom: "asc" },
        { prenom: "asc" },
      ],
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
      },
    }),

    // Liste des projets/chantiers actifs pour affectation
    prisma.projet.findMany({
      where: {
        statut: {
          in: ["OUVERT", "EN_COURS"],
        },
      },
      orderBy: {
        code: "desc",
      },
      select: {
        id: true,
        code: true,
        nom: true,
      },
    }),
  ]);

  return {
    nationalites,
    directions,
    services,
    postes,
    employes,
    projets,
  };
}
