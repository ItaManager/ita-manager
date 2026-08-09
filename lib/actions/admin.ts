/**
 * Server Actions — Administration système (M11)
 *
 * Statistiques, monitoring, gestion système
 * Accessible uniquement aux Super Admin
 */

"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

// =============================================================================
// STATISTIQUES SYSTÈME
// =============================================================================

/**
 * Récupérer les statistiques globales du système
 */
export const obtenirStatistiquesSysteme = actionProtegee(
  "admin:parametres",
  async (session) => {
    const [
      nbUtilisateurs,
      nbUtilisateursActifs,
      nbEmployes,
      nbContrats,
      nbContratsActifs,
      nbRoles,
      nbPermissions,
      nbEvenementsAujourdhui,
      derniereConnexion,
    ] = await Promise.all([
      // Nombre total d'utilisateurs
      prisma.profil.count(),

      // Nombre d'utilisateurs actifs
      prisma.profil.count({
        where: { actif: true },
      }),

      // Nombre total d'employés
      prisma.employe.count(),

      // Nombre total de contrats
      prisma.contrat.count(),

      // Nombre de contrats actifs
      prisma.contrat.count({
        where: {
          OR: [
            { dateFin: null }, // CDI
            { dateFin: { gte: new Date() } }, // CDD non expirés
          ],
        },
      }),

      // Nombre de rôles
      prisma.role.count(),

      // Nombre de permissions
      prisma.permission.count(),

      // Nombre d'événements aujourd'hui
      prisma.journalEvenement.count({
        where: {
          survenuLe: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Dernière connexion (dernier événement CONNEXION)
      prisma.journalEvenement.findFirst({
        where: {
          action: "CONNEXION",
        },
        orderBy: {
          survenuLe: "desc",
        },
        select: {
          survenuLe: true,
          auteurNom: true,
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        utilisateurs: {
          total: nbUtilisateurs,
          actifs: nbUtilisateursActifs,
          inactifs: nbUtilisateurs - nbUtilisateursActifs,
        },
        employes: {
          total: nbEmployes,
        },
        contrats: {
          total: nbContrats,
          actifs: nbContratsActifs,
          expires: nbContrats - nbContratsActifs,
        },
        securite: {
          roles: nbRoles,
          permissions: nbPermissions,
        },
        activite: {
          evenementsAujourdhui: nbEvenementsAujourdhui,
          derniereConnexion: derniereConnexion,
        },
      },
    };
  }
);

/**
 * Récupérer les alertes système (contrats qui expirent, etc.)
 */
export const obtenirAlertesSysteme = actionProtegee(
  "admin:parametres",
  async (session) => {
    const maintenant = new Date();
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);

    const [
      contratsExpirantBientot,
      utilisateursInactifs,
      utilisateursSans2FA,
      erreursRecentes,
    ] = await Promise.all([
      // Contrats CDD expirant dans les 30 jours
      prisma.contrat.count({
        where: {
          dateFin: {
            gte: maintenant,
            lte: dans30Jours,
          },
        },
      }),

      // Utilisateurs inactifs
      prisma.profil.count({
        where: { actif: false },
      }),

      // Utilisateurs sans 2FA activé - basé sur l'absence de codes de secours
      prisma.profil.count({
        where: {
          actif: true,
          codesSecoursMfa: {
            none: {},
          },
        },
      }),

      // Erreurs récentes (dernières 24h)
      prisma.journalEvenement.count({
        where: {
          action: "REFUS",
          survenuLe: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      success: true,
      alertes: {
        contratsExpirantBientot,
        utilisateursInactifs,
        utilisateursSans2FA,
        erreursRecentes,
      },
    };
  }
);

/**
 * Récupérer l'activité récente du système
 */
export const obtenirActiviteRecente = actionProtegee(
  "admin:parametres",
  async (session) => {
    const evenements = await prisma.journalEvenement.findMany({
      take: 20,
      orderBy: {
        survenuLe: "desc",
      },
      select: {
        id: true,
        entite: true,
        action: true,
        auteurNom: true,
        survenuLe: true,
        commentaire: true,
      },
    });

    return {
      success: true,
      evenements,
    };
  }
);

/**
 * Récupérer les statistiques d'utilisation par module
 */
export const obtenirStatistiquesModules = actionProtegee(
  "admin:parametres",
  async (session) => {
    // Statistiques des 7 derniers jours
    const il7Jours = new Date();
    il7Jours.setDate(il7Jours.getDate() - 7);

    const evenementsParEntite = await prisma.journalEvenement.groupBy({
      by: ["entite"],
      where: {
        survenuLe: {
          gte: il7Jours,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    return {
      success: true,
      modules: evenementsParEntite.map((item) => ({
        nom: item.entite,
        activites: item._count.id,
      })),
    };
  }
);
