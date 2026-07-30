"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutAppelOffres, TypeMarche } from "@prisma/client";

// =====================================================================
// M9 — Appels d'offres
// =====================================================================

/**
 * Créer un appel d'offres
 */
export const creerAppelOffres = actionProtegee(
  "ao:creer",
  async (
    session,
    donnees: {
      reference: string;
      maitreOuvrage: string;
      objet: string;
      montantEstime?: number;
      dateLimiteDepot: Date;
      lieu?: string;
      typeMarche?: TypeMarche;
    }
  ) => {
    const ao = await prisma.appelOffres.create({
      data: {
        ...donnees,
        montantEstime: donnees.montantEstime ? donnees.montantEstime : null,
        typeMarche: donnees.typeMarche ?? "PUBLIC",
        statut: "VEILLE",
        creePar: session.userId,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Appel d'offres créé : ${ao.reference}`,
      },
    });

    revalidatePath("/appels-offres");
    return ao;
  }
);

/**
 * Modifier un appel d'offres (avant go/no-go)
 */
export const modifierAppelOffres = actionProtegee(
  "ao:creer",
  async (
    session,
    id: string,
    donnees: {
      reference?: string;
      maitreOuvrage?: string;
      objet?: string;
      montantEstime?: number;
      dateLimiteDepot?: Date;
      lieu?: string;
      typeMarche?: TypeMarche;
    }
  ) => {
    // Vérifier que le statut permet la modification
    const aoActuel = await prisma.appelOffres.findUnique({
      where: { id },
    });

    if (!aoActuel) {
      throw new Error("Appel d'offres introuvable");
    }

    if (!["VEILLE"].includes(aoActuel.statut)) {
      throw new Error(
        "Impossible de modifier un appel d'offres après décision go/no-go"
      );
    }

    const ao = await prisma.appelOffres.update({
      where: { id },
      data: donnees,
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Appel d'offres modifié : ${ao.reference}`,
      },
    });

    revalidatePath("/appels-offres");
    revalidatePath(`/appels-offres/${id}`);
    return ao;
  }
);

/**
 * Décision go/no-go du DG
 */
export const deciderGoNoGo = actionProtegee(
  "ao:validerDG",
  async (
    session,
    id: string,
    decision: "GO" | "NO_GO",
    motif?: string
  ) => {
    const ao = await prisma.appelOffres.findUnique({
      where: { id },
    });

    if (!ao) {
      throw new Error("Appel d'offres introuvable");
    }

    if (ao.statut !== "VEILLE") {
      throw new Error("Cet appel d'offres a déjà été arbitré");
    }

    const nouveauStatut = decision === "GO" ? "GO" : "ABANDONNE";

    const aoMisAJour = await prisma.appelOffres.update({
      where: { id },
      data: {
        statut: nouveauStatut,
        goNoGoDecidePar: session.userId,
        goNoGoDecideLe: new Date(),
        goNoGoMotif: motif || null,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: decision === "GO" ? "GO" : "NO_GO",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          decision,
          motif,
        },
        commentaire: `Décision ${decision} : ${ao.reference}${motif ? ` — ${motif}` : ""}`,
      },
    });

    revalidatePath("/appels-offres");
    revalidatePath(`/appels-offres/${id}`);
    return aoMisAJour;
  }
);

/**
 * Passer en constitution
 */
export const passerEnConstitution = actionProtegee(
  "ao:creer",
  async (session, id: string) => {
    const ao = await prisma.appelOffres.findUnique({
      where: { id },
    });

    if (!ao) {
      throw new Error("Appel d'offres introuvable");
    }

    if (ao.statut !== "GO") {
      throw new Error(
        "Seul un appel d'offres validé (GO) peut passer en constitution"
      );
    }

    const aoMisAJour = await prisma.appelOffres.update({
      where: { id },
      data: {
        statut: "CONSTITUTION",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: "CONSTITUTION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Constitution du dossier : ${ao.reference}`,
      },
    });

    revalidatePath("/appels-offres");
    revalidatePath(`/appels-offres/${id}`);
    return aoMisAJour;
  }
);

/**
 * Marquer comme soumis
 */
export const marquerSoumis = actionProtegee(
  "ao:soumettre",
  async (session, id: string) => {
    const ao = await prisma.appelOffres.findUnique({
      where: { id },
    });

    if (!ao) {
      throw new Error("Appel d'offres introuvable");
    }

    if (ao.statut !== "CONSTITUTION") {
      throw new Error(
        "Seul un appel d'offres en constitution peut être marqué comme soumis"
      );
    }

    const aoMisAJour = await prisma.appelOffres.update({
      where: { id },
      data: {
        statut: "SOUMIS",
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: "SOUMISSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Dossier soumis : ${ao.reference}`,
      },
    });

    revalidatePath("/appels-offres");
    revalidatePath(`/appels-offres/${id}`);
    return aoMisAJour;
  }
);

/**
 * Enregistrer le résultat (gagné/perdu)
 */
export const enregistrerResultat = actionProtegee(
  "ao:creer",
  async (
    session,
    id: string,
    donnees: {
      gagne: boolean;
      montantAttribution?: number;
      attributaire?: string;
      dateNotification?: Date;
    }
  ) => {
    const ao = await prisma.appelOffres.findUnique({
      where: { id },
    });

    if (!ao) {
      throw new Error("Appel d'offres introuvable");
    }

    if (ao.statut !== "SOUMIS") {
      throw new Error(
        "Seul un appel d'offres soumis peut recevoir un résultat"
      );
    }

    const nouveauStatut = donnees.gagne ? "GAGNE" : "PERDU";

    const aoMisAJour = await prisma.appelOffres.update({
      where: { id },
      data: {
        statut: nouveauStatut,
        montantAttribution: donnees.montantAttribution || null,
        attributaire: donnees.attributaire || null,
        dateNotification: donnees.dateNotification || null,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "AppelOffres",
        entiteId: ao.id,
        action: donnees.gagne ? "ATTRIBUTION_GAGNE" : "ATTRIBUTION_PERDU",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          montantAttribution: donnees.montantAttribution,
          attributaire: donnees.attributaire,
        },
        commentaire: donnees.gagne
          ? `Marché attribué : ${ao.reference}`
          : `Marché perdu : ${ao.reference} (attributaire : ${donnees.attributaire})`,
      },
    });

    revalidatePath("/appels-offres");
    revalidatePath(`/appels-offres/${id}`);
    return aoMisAJour;
  }
);

/**
 * Liste des appels d'offres avec filtres
 */
export const listerAppelsOffres = actionProtegee(
  "ao:creer",
  async (
    session,
    filtres: {
      statut?: StatutAppelOffres;
      typeMarche?: TypeMarche;
      rechercheTexte?: string;
      cursor?: string;
      limit?: number;
    } = {}
  ) => {
    const limit = filtres.limit || 25;

    const where: any = {};

    if (filtres.statut) {
      where.statut = filtres.statut;
    }

    if (filtres.typeMarche) {
      where.typeMarche = filtres.typeMarche;
    }

    if (filtres.rechercheTexte) {
      where.OR = [
        { reference: { contains: filtres.rechercheTexte, mode: "insensitive" } },
        { maitreOuvrage: { contains: filtres.rechercheTexte, mode: "insensitive" } },
        { objet: { contains: filtres.rechercheTexte, mode: "insensitive" } },
      ];
    }

    const options: any = {
      where,
      orderBy: { dateLimiteDepot: "desc" as const },
      take: limit + 1,
      include: {
        pieces: {
          select: {
            id: true,
            obligatoire: true,
            deposeLe: true,
          },
        },
        concurrents: {
          select: {
            id: true,
          },
        },
      },
    };

    if (filtres.cursor) {
      options.cursor = { id: filtres.cursor };
      options.skip = 1;
    }

    const appelsOffres = await prisma.appelOffres.findMany(options);

    const hasNextPage = appelsOffres.length > limit;
    const items = hasNextPage ? appelsOffres.slice(0, -1) : appelsOffres;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }
);

/**
 * Détail d'un appel d'offres
 */
export const detailAppelOffres = actionProtegee(
  "ao:creer",
  async (session, id: string) => {
    const ao = await prisma.appelOffres.findUnique({
      where: { id },
      include: {
        pieces: {
          orderBy: { libelle: "asc" },
        },
        concurrents: {
          orderBy: { nom: "asc" },
        },
      },
    });

    if (!ao) {
      throw new Error("Appel d'offres introuvable");
    }

    return ao;
  }
);

/**
 * Ajouter une pièce au dossier
 */
export const ajouterPieceAO = actionProtegee(
  "ao:creer",
  async (
    session,
    appelOffresId: string,
    donnees: {
      libelle: string;
      obligatoire: boolean;
      fichierUrl?: string;
    }
  ) => {
    const piece = await prisma.pieceAO.create({
      data: {
        appelOffresId,
        ...donnees,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "PieceAO",
        entiteId: piece.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Pièce ajoutée : ${donnees.libelle}`,
      },
    });

    revalidatePath(`/appels-offres/${appelOffresId}`);
    return piece;
  }
);

/**
 * Marquer une pièce comme déposée
 */
export const marquerPieceDeposee = actionProtegee(
  "ao:creer",
  async (session, pieceId: string, fichierUrl: string) => {
    const piece = await prisma.pieceAO.update({
      where: { id: pieceId },
      data: {
        fichierUrl,
        deposeLe: new Date(),
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "PieceAO",
        entiteId: piece.id,
        action: "DEPOT",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Pièce déposée : ${piece.libelle}`,
      },
    });

    revalidatePath(`/appels-offres/${piece.appelOffresId}`);
    return piece;
  }
);

/**
 * Ajouter un concurrent
 */
export const ajouterConcurrent = actionProtegee(
  "ao:creer",
  async (
    session,
    appelOffresId: string,
    donnees: {
      nom: string;
      montantSoumis?: number;
      remarque?: string;
    }
  ) => {
    const concurrent = await prisma.concurrentAO.create({
      data: {
        appelOffresId,
        ...donnees,
        montantSoumis: donnees.montantSoumis || null,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "ConcurrentAO",
        entiteId: concurrent.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Concurrent ajouté : ${donnees.nom}`,
      },
    });

    revalidatePath(`/appels-offres/${appelOffresId}`);
    return concurrent;
  }
);

/**
 * Modifier un concurrent
 */
export const modifierConcurrent = actionProtegee(
  "ao:creer",
  async (
    session,
    id: string,
    donnees: {
      nom?: string;
      montantSoumis?: number;
      remarque?: string;
    }
  ) => {
    const concurrent = await prisma.concurrentAO.update({
      where: { id },
      data: donnees,
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "ConcurrentAO",
        entiteId: concurrent.id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Concurrent modifié : ${concurrent.nom}`,
      },
    });

    revalidatePath(`/appels-offres/${concurrent.appelOffresId}`);
    return concurrent;
  }
);

/**
 * Supprimer un concurrent
 */
export const supprimerConcurrent = actionProtegee(
  "ao:creer",
  async (session, id: string) => {
    const concurrent = await prisma.concurrentAO.findUnique({
      where: { id },
    });

    if (!concurrent) {
      throw new Error("Concurrent introuvable");
    }

    await prisma.concurrentAO.delete({
      where: { id },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "ConcurrentAO",
        entiteId: id,
        action: "SUPPRESSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Concurrent supprimé : ${concurrent.nom}`,
      },
    });

    revalidatePath(`/appels-offres/${concurrent.appelOffresId}`);
    return concurrent;
  }
);

/**
 * Statistiques pour le tableau de bord
 */
export const statistiquesAppelsOffres = actionProtegee(
  "ao:creer",
  async (session) => {
    const [
      enVeille,
      enGo,
      enConstitution,
      soumis,
      gagnes,
      perdus,
      abandonnes,
    ] = await Promise.all([
      prisma.appelOffres.count({ where: { statut: "VEILLE" } }),
      prisma.appelOffres.count({ where: { statut: "GO" } }),
      prisma.appelOffres.count({ where: { statut: "CONSTITUTION" } }),
      prisma.appelOffres.count({ where: { statut: "SOUMIS" } }),
      prisma.appelOffres.count({ where: { statut: "GAGNE" } }),
      prisma.appelOffres.count({ where: { statut: "PERDU" } }),
      prisma.appelOffres.count({ where: { statut: "ABANDONNE" } }),
    ]);

    const tauxReussite =
      gagnes + perdus > 0 ? (gagnes / (gagnes + perdus)) * 100 : 0;

    return {
      enVeille,
      enGo,
      enConstitution,
      soumis,
      gagnes,
      perdus,
      abandonnes,
      tauxReussite: Math.round(tauxReussite),
    };
  }
);
