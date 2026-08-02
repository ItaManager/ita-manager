"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

/**
 * Compte les demandes en attente de validation N+1 pour l'utilisateur courant
 * Utilise la chaîne hiérarchique pour filtrer
 */
export const compterDemandesAValider = actionProtegee(
  "achat:demander",
  async (session) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) return 0;

    // Charger tous les subordonnés directs via Affectation
    const affectationsSubordonnes = await prisma.affectation.findMany({
      where: {
        superieurId: profil.employe.id,
        dateFin: null, // Affectation active
      },
      select: { employeId: true },
    });

    const subordinesIds = affectationsSubordonnes.map((a) => a.employeId);

    if (subordinesIds.length === 0) return 0;

    // Compter les demandes avec dernier événement = SOUMISSION
    const demandes = await prisma.demandeAchat.findMany({
      where: {
        demandeurId: { in: subordinesIds },
      },
      include: {
        evenements: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    return demandes.filter(
      (d) => d.evenements[0]?.type === "SOUMISSION"
    ).length;
  }
);

/**
 * Compte les demandes à instruire (Chef Service Achats)
 */
export const compterDemandesAInstruire = actionProtegee(
  "achat:instruire",
  async () => {
    const demandes = await prisma.demandeAchat.findMany({
      include: {
        evenements: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    return demandes.filter(
      (d) => d.evenements[0]?.type === "VALIDATION_N1"
    ).length;
  }
);

/**
 * Compte les bons de commande à émettre
 */
export const compterBonsCommande = actionProtegee(
  "achat:instruire",
  async () => {
    const demandes = await prisma.demandeAchat.findMany({
      include: {
        evenements: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    return demandes.filter((d) => {
      const dernier = d.evenements[0]?.type;
      return (
        dernier === "INSTRUCTION" ||
        dernier === "AVIS_COMITE" ||
        dernier === "TRANSMISSION_COMITE"
      );
    }).length;
  }
);

/**
 * Compte les réceptions à enregistrer
 */
export const compterReceptions = actionProtegee(
  "achat:receptionner",
  async () => {
    const demandes = await prisma.demandeAchat.findMany({
      where: {
        refBC: { not: null },
      },
      include: {
        lignes: true,
        evenements: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    return demandes.filter((d) => {
      const dernier = d.evenements[0]?.type;
      if (dernier !== "EMISSION_BC" && dernier !== "TRANSMISSION_LOG") {
        return false;
      }

      // Vérifier si des lignes restent à recevoir
      return d.lignes.some((l) => {
        const recue = Number(l.quantiteRecue || 0);
        const commandee = Number(l.quantite);
        return recue < commandee;
      });
    }).length;
  }
);

/**
 * Compte les factures à saisir
 */
export const compterFactures = actionProtegee(
  "achat:facturer",
  async () => {
    const demandes = await prisma.demandeAchat.findMany({
      where: {
        refFacture: null,
      },
      include: {
        evenements: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    return demandes.filter((d) => {
      const dernier = d.evenements[0]?.type;
      return dernier === "RECEPTION" || dernier === "VALIDATION_CONFORMITE";
    }).length;
  }
);

/**
 * Charge tous les compteurs pour le menu
 */
export const chargerCompteursAchats = actionProtegee(
  "achat:demander",
  async (session) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
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
      aValider: 0,
      aInstruire: 0,
      commandes: 0,
      receptions: 0,
      factures: 0,
    };

    // Pour "À valider" : compter les demandes de subordonnés directs
    if (permissions.includes("achat:demander") && profil?.employe) {
      const affectationsSubordonnes = await prisma.affectation.findMany({
        where: {
          superieurId: profil.employe.id,
          dateFin: null,
        },
        select: { employeId: true },
      });

      const subordinesIds = affectationsSubordonnes.map((a) => a.employeId);

      if (subordinesIds.length > 0) {
        const demandes = await prisma.demandeAchat.findMany({
          where: {
            demandeurId: { in: subordinesIds },
          },
          include: {
            evenements: {
              orderBy: { timestamp: "desc" },
              take: 1,
            },
          },
        });

        compteurs.aValider = demandes.filter(
          (d) => d.evenements[0]?.type === "SOUMISSION"
        ).length;
      }
    }

    // Pour "À instruire" : compter les demandes validées N+1
    if (permissions.includes("achat:instruire")) {
      const demandes = await prisma.demandeAchat.findMany({
        include: {
          evenements: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      compteurs.aInstruire = demandes.filter(
        (d) => d.evenements[0]?.type === "VALIDATION_N1"
      ).length;

      compteurs.commandes = demandes.filter((d) => {
        const dernier = d.evenements[0]?.type;
        return (
          dernier === "INSTRUCTION" ||
          dernier === "AVIS_COMITE" ||
          dernier === "TRANSMISSION_COMITE"
        );
      }).length;
    }

    // Pour "Réceptions" : compter les BC avec lignes non soldées
    if (permissions.includes("achat:receptionner")) {
      const demandes = await prisma.demandeAchat.findMany({
        where: {
          refBC: { not: null },
        },
        include: {
          lignes: true,
          evenements: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      compteurs.receptions = demandes.filter((d) => {
        const dernier = d.evenements[0]?.type;
        if (dernier !== "EMISSION_BC" && dernier !== "TRANSMISSION_LOG") {
          return false;
        }

        return d.lignes.some((l) => {
          const recue = Number(l.quantiteRecue || 0);
          const commandee = Number(l.quantite);
          return recue < commandee;
        });
      }).length;
    }

    // Pour "Factures" : compter les demandes sans facture
    if (permissions.includes("achat:facturer")) {
      const demandes = await prisma.demandeAchat.findMany({
        where: {
          refFacture: null,
        },
        include: {
          evenements: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      compteurs.factures = demandes.filter((d) => {
        const dernier = d.evenements[0]?.type;
        return dernier === "RECEPTION" || dernier === "VALIDATION_CONFORMITE";
      }).length;
    }

    return compteurs;
  }
);
