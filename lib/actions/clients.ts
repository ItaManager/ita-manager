"use server";

import { actionProtegee } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

// =====================================================================
// CLIENTS / MAÎTRES D'OUVRAGE
// =====================================================================

/**
 * Lister tous les clients
 */
export const listerClients = actionProtegee(
  "projet:modifier",
  async (session) => {
    const clients = await prisma.client.findMany({
      orderBy: { nom: "asc" },
      include: {
        _count: {
          select: { projets: true },
        },
      },
    });

    return clients;
  }
);

/**
 * Obtenir un client par son ID
 */
export const obtenirClient = actionProtegee(
  "projet:modifier",
  async (session, clientId: string) => {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projets: {
          orderBy: { creeLe: "desc" },
          select: {
            id: true,
            code: true,
            nom: true,
            statut: true,
            montantMarche: true,
            dateDebut: true,
            dateFin: true,
          },
        },
      },
    });

    if (!client) {
      return null;
    }

    return {
      ...client,
      projets: client.projets.map((p: any) => ({
        ...p,
        montantMarche: p.montantMarche ? Number(p.montantMarche) : null,
      })),
    };
  }
);

/**
 * Créer un client
 */
export const creerClient = actionProtegee(
  "projet:modifier",
  async (
    session,
    input: {
      nom: string;
      type?: string;
      telephone?: string;
      email?: string;
      contactPrincipal?: string;
      fonctionContact?: string;
      adresse?: string;
      ville?: string;
      pays?: string;
      numeroContribuable?: string;
      notes?: string;
    }
  ) => {
    // Vérifier si un client avec le même nom existe déjà
    const existant = await prisma.client.findFirst({
      where: {
        nom: {
          equals: input.nom,
          mode: "insensitive",
        },
      },
    });

    if (existant) {
      throw new Error(`Un client nommé "${input.nom}" existe déjà`);
    }

    const client = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const nouveau = await tx.client.create({
        data: {
          ...input,
          creePar: session.userId,
        },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "Client",
          entiteId: nouveau.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Client créé : ${input.nom}`,
        },
      });

      return nouveau;
    });

    revalidatePath("/projets");
    return client;
  }
);

/**
 * Modifier un client
 */
export const modifierClient = actionProtegee(
  "projet:modifier",
  async (
    session,
    clientId: string,
    input: {
      nom?: string;
      type?: string;
      telephone?: string;
      email?: string;
      contactPrincipal?: string;
      fonctionContact?: string;
      adresse?: string;
      ville?: string;
      pays?: string;
      numeroContribuable?: string;
      notes?: string;
    }
  ) => {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error("Client introuvable");
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (input.nom && input.nom !== client.nom) {
      const existant = await prisma.client.findFirst({
        where: {
          nom: {
            equals: input.nom,
            mode: "insensitive",
          },
          id: { not: clientId },
        },
      });

      if (existant) {
        throw new Error(`Un client nommé "${input.nom}" existe déjà`);
      }
    }

    const clientMaj = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const maj = await tx.client.update({
        where: { id: clientId },
        data: input,
      });

      await tx.journalEvenement.create({
        data: {
          entite: "Client",
          entiteId: clientId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Client modifié : ${maj.nom}`,
        },
      });

      return maj;
    });

    revalidatePath("/projets");
    revalidatePath(`/clients/${clientId}`);
    return clientMaj;
  }
);

/**
 * Supprimer un client
 */
export const supprimerClient = actionProtegee(
  "projet:modifier",
  async (session, clientId: string) => {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        _count: {
          select: { projets: true },
        },
      },
    });

    if (!client) {
      throw new Error("Client introuvable");
    }

    if (client._count.projets > 0) {
      throw new Error(
        `Impossible de supprimer ce client car il est lié à ${client._count.projets} projet(s)`
      );
    }

    const nom = client.nom;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.client.delete({
        where: { id: clientId },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "Client",
          entiteId: clientId,
          action: "SUPPRESSION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Client supprimé : ${nom}`,
        },
      });
    });

    revalidatePath("/projets");
  }
);

/**
 * Assigner un client à un projet
 */
export const assignerClientProjet = actionProtegee(
  "projet:modifier",
  async (session, projetId: string, clientId: string | null) => {
    const projet = await prisma.projet.findUnique({
      where: { id: projetId },
      select: { code: true, client: { select: { nom: true } } },
    });

    if (!projet) {
      throw new Error("Projet introuvable");
    }

    let client = null;
    if (clientId) {
      client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { nom: true },
      });

      if (!client) {
        throw new Error("Client introuvable");
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.projet.update({
        where: { id: projetId },
        data: { clientId },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "Projet",
          entiteId: projetId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: clientId
            ? `Client assigné au projet ${projet.code} : ${client!.nom}`
            : `Client retiré du projet ${projet.code}`,
        },
      });
    });

    revalidatePath(`/projets/${projetId}`);
    revalidatePath("/projets");
  }
);
