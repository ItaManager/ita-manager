"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutDemandeTransport, TypeDemandeTransport } from "@prisma/client";

// =====================================================================
// M13 L3 — Transport
// =====================================================================

/**
 * Créer une demande de transport
 *
 * Génère une référence unique DTR-xxxxx (count + 1)
 */
export const creerDemandeTransport = actionProtegee(
  "transport:demander",
  async (
    session,
    donnees: {
      type: TypeDemandeTransport;
      materielId?: string;
      lieuDepartId: string;
      lieuArriveeId: string;
      dateDebut: Date;
      dateFin?: Date;
      description?: string;
    }
  ) => {
    // Générer référence unique DTR-xxxxx
    const count = await prisma.demandeTransport.count();
    const reference = `DTR-${String(count + 1).padStart(5, "0")}`;

    const demande = await prisma.demandeTransport.create({
      data: {
        reference,
        type: donnees.type,
        materielId: donnees.materielId || null,
        lieuDepartId: donnees.lieuDepartId,
        lieuArriveeId: donnees.lieuArriveeId,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin || null,
        description: donnees.description || null,
        statut: "EN_ATTENTE",
        demandeurId: session.userId,
      },
      include: {
        demandeur: {
          select: {
            id: true,
            email: true,
          },
        },
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        lieuDepart: {
          select: {
            id: true,
            libelle: true,
          },
        },
        lieuArrivee: {
          select: {
            id: true,
            libelle: true,
          },
        },
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeTransport",
        entiteId: demande.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
          type: demande.type,
          materielId: demande.materielId,
          lieuDepartId: demande.lieuDepartId,
          lieuArriveeId: demande.lieuArriveeId,
        },
        commentaire: `Demande de transport créée : ${demande.reference}`,
      },
    });

    revalidatePath("/transport");
    return demande;
  }
);

/**
 * Lister les demandes de transport avec filtres et pagination
 *
 * Pagination 25 items, tri dateDebut desc
 */
export const listerDemandesTransport = actionProtegee(
  "transport:demander",
  async (
    session,
    filtres: {
      statut?: StatutDemandeTransport;
      type?: TypeDemandeTransport;
      dateDebut?: Date;
      dateFin?: Date;
      cursor?: string;
      limit?: number;
    } = {}
  ) => {
    const limit = filtres.limit || 25;

    const where: {
      statut?: StatutDemandeTransport;
      type?: TypeDemandeTransport;
      dateDebut?: { gte: Date };
      dateFin?: { lte: Date };
    } = {};

    if (filtres.statut) {
      where.statut = filtres.statut;
    }

    if (filtres.type) {
      where.type = filtres.type;
    }

    if (filtres.dateDebut) {
      where.dateDebut = {
        gte: filtres.dateDebut,
      };
    }

    if (filtres.dateFin) {
      where.dateFin = {
        lte: filtres.dateFin,
      };
    }

    const options = {
      where,
      orderBy: { dateDebut: "desc" as const },
      take: limit + 1,
      cursor: filtres.cursor ? { id: filtres.cursor } : undefined,
      skip: filtres.cursor ? 1 : undefined,
      include: {
        demandeur: {
          select: {
            id: true,
            email: true,
          },
        },
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        lieuDepart: {
          select: {
            id: true,
            libelle: true,
          },
        },
        lieuArrivee: {
          select: {
            id: true,
            libelle: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    };

    const demandes = await prisma.demandeTransport.findMany(options);

    const hasNextPage = demandes.length > limit;
    const items = hasNextPage ? demandes.slice(0, -1) : demandes;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }
);

/**
 * Consulter le détail d'une demande de transport
 */
export const consulterDemandeTransport = actionProtegee(
  "transport:demander",
  async (session, id: string) => {
    const demande = await prisma.demandeTransport.findUnique({
      where: { id },
      include: {
        demandeur: {
          select: {
            id: true,
            email: true,
          },
        },
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
            immatriculation: true,
            famille: {
              select: {
                libelle: true,
              },
            },
          },
        },
        lieuDepart: {
          select: {
            id: true,
            libelle: true,
          },
        },
        lieuArrivee: {
          select: {
            id: true,
            libelle: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!demande) {
      throw new Error("Demande de transport introuvable");
    }

    return demande;
  }
);

/**
 * Affecter un chauffeur à une demande de transport
 *
 * Change le statut à AFFECTEE
 */
export const affecterChauffeur = actionProtegee(
  "transport:demander",
  async (session, demandeId: string, chauffeurId: string) => {
    // Vérifier que la demande existe et est en statut compatible
    const demandeActuelle = await prisma.demandeTransport.findUnique({
      where: { id: demandeId },
      select: {
        id: true,
        reference: true,
        statut: true,
      },
    });

    if (!demandeActuelle) {
      throw new Error("Demande de transport introuvable");
    }

    if (
      !["EN_ATTENTE", "APPROUVEE"].includes(demandeActuelle.statut)
    ) {
      throw new Error(
        `Impossible d'affecter un chauffeur : la demande ${demandeActuelle.reference} est au statut ${demandeActuelle.statut}`
      );
    }

    // Vérifier que le chauffeur existe
    const chauffeur = await prisma.employe.findUnique({
      where: { id: chauffeurId },
      select: {
        id: true,
        nom: true,
        prenom: true,
      },
    });

    if (!chauffeur) {
      throw new Error("Employé introuvable");
    }

    const demande = await prisma.demandeTransport.update({
      where: { id: demandeId },
      data: {
        chauffeurId,
        statut: "AFFECTEE",
      },
      include: {
        demandeur: {
          select: {
            id: true,
            email: true,
          },
        },
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        lieuDepart: {
          select: {
            id: true,
            libelle: true,
          },
        },
        lieuArrivee: {
          select: {
            id: true,
            libelle: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeTransport",
        entiteId: demande.id,
        action: "AFFECTATION_CHAUFFEUR",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
          chauffeurId,
          chauffeurNom: `${chauffeur.prenom} ${chauffeur.nom}`,
        },
        commentaire: `Chauffeur affecté : ${chauffeur.prenom} ${chauffeur.nom} — ${demande.reference}`,
      },
    });

    revalidatePath("/transport");
    revalidatePath(`/transport/${demandeId}`);
    return demande;
  }
);

/**
 * Démarrer un transport (passage au statut EN_COURS)
 *
 * Enregistre l'heure de début réelle
 */
export const demarrerTransport = actionProtegee(
  "transport:demander",
  async (session, demandeId: string) => {
    // Vérifier que la demande existe et est affectée
    const demandeActuelle = await prisma.demandeTransport.findUnique({
      where: { id: demandeId },
      select: {
        id: true,
        reference: true,
        statut: true,
        chauffeurId: true,
      },
    });

    if (!demandeActuelle) {
      throw new Error("Demande de transport introuvable");
    }

    if (demandeActuelle.statut !== "AFFECTEE") {
      throw new Error(
        `Impossible de démarrer le transport : la demande ${demandeActuelle.reference} est au statut ${demandeActuelle.statut}. Seules les demandes affectées peuvent être démarrées.`
      );
    }

    if (!demandeActuelle.chauffeurId) {
      throw new Error(
        `Impossible de démarrer le transport : aucun chauffeur affecté à la demande ${demandeActuelle.reference}`
      );
    }

    const demande = await prisma.demandeTransport.update({
      where: { id: demandeId },
      data: {
        statut: "EN_COURS",
      },
      include: {
        demandeur: {
          select: {
            id: true,
            email: true,
          },
        },
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        lieuDepart: {
          select: {
            id: true,
            libelle: true,
          },
        },
        lieuArrivee: {
          select: {
            id: true,
            libelle: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeTransport",
        entiteId: demande.id,
        action: "DEMARRAGE",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
        },
        commentaire: `Transport démarré : ${demande.reference}`,
      },
    });

    revalidatePath("/transport");
    revalidatePath(`/transport/${demandeId}`);
    return demande;
  }
);

/**
 * Terminer un transport (passage au statut TERMINEE)
 *
 * Enregistre l'heure de fin réelle et calcule la durée
 */
export const terminerTransport = actionProtegee(
  "transport:demander",
  async (session, demandeId: string) => {
    // Vérifier que la demande existe et est en cours
    const demandeActuelle = await prisma.demandeTransport.findUnique({
      where: { id: demandeId },
      select: {
        id: true,
        reference: true,
        statut: true,
      },
    });

    if (!demandeActuelle) {
      throw new Error("Demande de transport introuvable");
    }

    if (demandeActuelle.statut !== "EN_COURS") {
      throw new Error(
        `Impossible de terminer le transport : la demande ${demandeActuelle.reference} est au statut ${demandeActuelle.statut}. Seules les demandes en cours peuvent être terminées.`
      );
    }

    const demande = await prisma.demandeTransport.update({
      where: { id: demandeId },
      data: {
        statut: "TERMINEE",
      },
      include: {
        demandeur: {
          select: {
            id: true,
            email: true,
          },
        },
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
          },
        },
        lieuDepart: {
          select: {
            id: true,
            libelle: true,
          },
        },
        lieuArrivee: {
          select: {
            id: true,
            libelle: true,
          },
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeTransport",
        entiteId: demande.id,
        action: "TERMINAISON",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
        },
        commentaire: `Transport terminé : ${demande.reference}`,
      },
    });

    revalidatePath("/transport");
    revalidatePath(`/transport/${demandeId}`);
    return demande;
  }
);
