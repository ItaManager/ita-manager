"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

// =====================================================================
// M11 — Administration
// =====================================================================

/**
 * Liste tous les paramètres, groupés par domaine
 */
export const listerParametres = actionProtegee(
  "admin:parametres",
  async (session) => {
    const parametres = await prisma.parametre.findMany({
      orderBy: [{ groupe: "asc" }, { cle: "asc" }],
    });

    // Grouper par domaine
    const groupes = parametres.reduce((acc, param) => {
      if (!acc[param.groupe]) {
        acc[param.groupe] = [];
      }
      acc[param.groupe].push(param);
      return acc;
    }, {} as Record<string, typeof parametres>);

    return groupes;
  }
);

/**
 * Modifie un paramètre et journalise la modification
 */
export const modifierParametre = actionProtegee(
  "admin:parametres",
  async (session, id: string, nouvelleValeur: string) => {
    // Récupérer l'ancienne valeur
    const ancienParametre = await prisma.parametre.findUnique({
      where: { id },
    });

    if (!ancienParametre) {
      throw new Error("Paramètre introuvable");
    }

    // Paramètres non modifiables (M11 § 4)
    const parametresVerrouilles = [
      "format.matricule",
      "codes.roles",
    ];

    if (parametresVerrouilles.includes(ancienParametre.cle)) {
      throw new Error(
        `Le paramètre ${ancienParametre.cle} ne peut pas être modifié sans intervention technique`
      );
    }

    // Mettre à jour
    const parametreModifie = await prisma.parametre.update({
      where: { id },
      data: {
        valeur: nouvelleValeur,
        modifieParId: session.userId,
      },
    });

    // Journaliser la modification
    await prisma.journalEvenement.create({
      data: {
        entite: "Parametre",
        entiteId: id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          cle: ancienParametre.cle,
          ancienneValeur: ancienParametre.valeur,
          nouvelleValeur,
        },
        commentaire: `Paramètre ${ancienParametre.libelle} modifié`,
      },
    });

    revalidatePath("/parametres");
    return parametreModifie;
  }
);

/**
 * Recherche dans le journal d'audit avec filtres
 * Pagination par curseur (décision E-01)
 */
export const rechercherJournal = actionProtegee(
  "admin:journal",
  async (
    session,
    filtres: {
      dateDebut?: string;
      dateFin?: string;
      auteurId?: string;
      entite?: string;
      action?: string;
      cursor?: string;
      limit?: number;
    } = {}
  ) => {
    const limit = filtres.limit || 50;

    // Construction des filtres
    const where: any = {};

    if (filtres.dateDebut || filtres.dateFin) {
      where.survenuLe = {};
      if (filtres.dateDebut) {
        where.survenuLe.gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        where.survenuLe.lte = new Date(filtres.dateFin);
      }
    }

    if (filtres.auteurId) {
      where.auteurId = filtres.auteurId;
    }

    if (filtres.entite) {
      where.entite = filtres.entite;
    }

    if (filtres.action) {
      where.action = filtres.action;
    }

    // Pagination par curseur
    const options: any = {
      where,
      orderBy: { survenuLe: "desc" as const },
      take: limit + 1, // +1 pour savoir s'il y a une page suivante
      include: {
        auteur: {
          select: {
            email: true,
          },
        },
      },
    };

    if (filtres.cursor) {
      options.cursor = { id: filtres.cursor };
      options.skip = 1; // Skip le curseur lui-même
    }

    const evenements = await prisma.journalEvenement.findMany(options);

    const hasNextPage = evenements.length > limit;
    const items = hasNextPage ? evenements.slice(0, -1) : evenements;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }
);

/**
 * Exporte le journal d'audit au format CSV
 */
export const exporterJournal = actionProtegee(
  "admin:journal",
  async (
    session,
    filtres: {
      dateDebut?: string;
      dateFin?: string;
      auteurId?: string;
      entite?: string;
      action?: string;
    } = {}
  ) => {
    // Récupérer tous les événements correspondants aux filtres (sans pagination)
    const where: any = {};

    if (filtres.dateDebut || filtres.dateFin) {
      where.survenuLe = {};
      if (filtres.dateDebut) {
        where.survenuLe.gte = new Date(filtres.dateDebut);
      }
      if (filtres.dateFin) {
        where.survenuLe.lte = new Date(filtres.dateFin);
      }
    }

    if (filtres.auteurId) {
      where.auteurId = filtres.auteurId;
    }

    if (filtres.entite) {
      where.entite = filtres.entite;
    }

    if (filtres.action) {
      where.action = filtres.action;
    }

    const evenements = await prisma.journalEvenement.findMany({
      where,
      orderBy: { survenuLe: "desc" },
      include: {
        auteur: {
          select: {
            email: true,
          },
        },
      },
    });

    // Construire le CSV
    const headers = [
      "Date",
      "Entité",
      "ID Entité",
      "Action",
      "Auteur",
      "Commentaire",
    ];

    const rows = evenements.map((e) => [
      new Date(e.survenuLe).toLocaleString("fr-FR"),
      e.entite,
      e.entiteId,
      e.action,
      e.auteurNom,
      e.commentaire || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Journaliser l'export
    await prisma.journalEvenement.create({
      data: {
        entite: "JournalEvenement",
        entiteId: "export",
        action: "EXPORT",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          nombreLignes: evenements.length,
          filtres,
        },
        commentaire: `Export du journal d'audit (${evenements.length} lignes)`,
      },
    });

    return {
      csv,
      nomFichier: `journal-audit-${new Date().toISOString().split("T")[0]}.csv`,
      nombreLignes: evenements.length,
    };
  }
);
