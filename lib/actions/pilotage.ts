"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

// =====================================================================
// M10 — Pilotage et tableaux de bord
// =====================================================================

/**
 * Statistiques pour le tableau de bord - tous rôles
 */
export const statistiquesTableauDeBord = actionProtegee(
  "employe:lire",
  async (session) => {
    // Statistiques organisation (M1)
    const [
      nombreDirections,
      nombreServices,
      nombrePostes,
    ] = await Promise.all([
      prisma.direction.count(),
      prisma.service.count(),
      prisma.poste.count(),
    ]);

    // Statistiques employés (M2) - pour DRH/RH
    const [
      nombreEmployes,
      employesActifs,
    ] = await Promise.all([
      prisma.employe.count(),
      prisma.employe.count({ where: { archiveLe: null } }),
    ]);

    // Statistiques appels d'offres (M9) - pour DG/DT
    const [
      aoEnVeille,
      aoEnGo,
      aoSoumis,
      aoGagnes,
      aoPerdus,
    ] = await Promise.all([
      prisma.appelOffres.count({ where: { statut: "VEILLE" } }),
      prisma.appelOffres.count({ where: { statut: "GO" } }),
      prisma.appelOffres.count({ where: { statut: "SOUMIS" } }),
      prisma.appelOffres.count({ where: { statut: "GAGNE" } }),
      prisma.appelOffres.count({ where: { statut: "PERDU" } }),
    ]);

    const tauxReussite = aoGagnes + aoPerdus > 0
      ? Math.round((aoGagnes / (aoGagnes + aoPerdus)) * 100)
      : 0;

    // Statistiques système
    const [
      nombreUtilisateurs,
      utilisateursActifs,
    ] = await Promise.all([
      prisma.profil.count(),
      prisma.profil.count({ where: { actif: true } }),
    ]);

    return {
      organisation: {
        directions: nombreDirections,
        services: nombreServices,
        postes: nombrePostes,
      },
      employes: {
        total: nombreEmployes,
        actifs: employesActifs,
        inactifs: nombreEmployes - employesActifs,
      },
      appelsOffres: {
        enVeille: aoEnVeille,
        enGo: aoEnGo,
        soumis: aoSoumis,
        gagnes: aoGagnes,
        perdus: aoPerdus,
        tauxReussite,
      },
      systeme: {
        utilisateurs: nombreUtilisateurs,
        utilisateursActifs,
      },
    };
  }
);

/**
 * Activité récente - journal des dernières actions
 */
export const activiteRecente = actionProtegee(
  "employe:lire",
  async (session, limit: number = 10) => {
    const evenements = await prisma.journalEvenement.findMany({
      orderBy: { survenuLe: "desc" },
      take: limit,
      include: {
        auteur: {
          select: {
            email: true,
          },
        },
      },
    });

    return evenements;
  }
);

/**
 * Alertes et éléments nécessitant une action
 */
export const alertesTableauDeBord = actionProtegee(
  "employe:lire",
  async (session) => {
    // AO en veille nécessitant une décision go/no-go
    const aoEnAttente = await prisma.appelOffres.count({
      where: { statut: "VEILLE" },
    });

    // AO avec date limite proche (< 15 jours)
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() + 15);

    const aoProchesEcheance = await prisma.appelOffres.count({
      where: {
        statut: { in: ["GO", "CONSTITUTION"] },
        dateLimiteDepot: {
          lte: dateLimit,
        },
      },
    });

    return {
      aoEnAttenteDecision: aoEnAttente,
      aoProchesEcheance,
    };
  }
);

/**
 * Statistiques spécifiques DG
 */
export const statistiquesDG = actionProtegee(
  "ao:validerDG",
  async (session) => {
    // Montant total soumissionné
    const appelsOffres = await prisma.appelOffres.findMany({
      where: {
        statut: { in: ["SOUMIS", "GAGNE", "PERDU"] },
      },
      select: {
        montantEstime: true,
        montantAttribution: true,
        statut: true,
      },
    });

    const montantSoumissionne = appelsOffres.reduce((acc, ao) => {
      return acc + (ao.montantEstime ? Number(ao.montantEstime) : 0);
    }, 0);

    const montantGagne = appelsOffres
      .filter((ao) => ao.statut === "GAGNE")
      .reduce((acc, ao) => {
        return acc + (ao.montantAttribution ? Number(ao.montantAttribution) : 0);
      }, 0);

    // AO en attente de décision go/no-go
    const aoEnAttenteGoNoGo = await prisma.appelOffres.count({
      where: { statut: "VEILLE" },
    });

    return {
      montantSoumissionne,
      montantGagne,
      aoEnAttenteGoNoGo,
    };
  }
);

/**
 * Statistiques spécifiques DRH/RH
 */
export const statistiquesDRH = actionProtegee(
  "employe:lire",
  async (session) => {
    const effectifTotal = await prisma.employe.count({
      where: { archiveLe: null },
    });

    // Pour l'instant, retourner des valeurs à 0 car ces modules ne sont pas encore implémentés
    return {
      effectifTotal,
      dossiersIncomplets: 0, // Sera calculé quand M2 sera complet
      congesEnAttente: 0, // M3
      contratsAEcheance: 0, // M2
    };
  }
);

/**
 * Statistiques spécifiques DFC
 */
export const statistiquesDFC = actionProtegee(
  "paie:exporter",
  async (session) => {
    // Pour l'instant, retourner des valeurs à 0 car la paie n'est pas encore implémentée
    return {
      masseSalariale: 0, // M7
      periodesAValider: 0, // M7
      derogationsEnAttente: 0, // M4
    };
  }
);

/**
 * Statistiques spécifiques DT
 */
export const statistiquesDT = actionProtegee(
  "projet:creer",
  async (session) => {
    // Pour l'instant, retourner des valeurs à 0 car les projets ne sont pas encore implémentés
    return {
      chantiersEnCours: 0, // M5
      avancementMoyen: 0, // M5
      relevesNonVises: 0, // M6
      materielImmobilise: 0, // M8
    };
  }
);
