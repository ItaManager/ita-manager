"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { StatutAppelOffres, TypeMarche } from "@prisma/client";
import { formaterDateCivile } from "@/lib/dates";

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
 *
 * RÈGLE MÉTIER (M9 §1.1) : Un marché remporté peut créer un projet automatiquement
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
      creerProjet?: boolean; // Si true, créer le projet automatiquement
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
          creerProjet: donnees.creerProjet,
        },
        commentaire: donnees.gagne
          ? `Marché attribué : ${ao.reference}`
          : `Marché perdu : ${ao.reference} (attributaire : ${donnees.attributaire})`,
      },
    });

    // Si marché gagné ET création de projet demandée
    let projetCree = null;
    if (donnees.gagne && donnees.creerProjet) {
      // Générer un code projet basé sur l'année
      const annee = new Date().getFullYear();
      const compteProjets = await prisma.projet.count({
        where: {
          code: {
            startsWith: `CH-${annee}-`,
          },
        },
      });
      const numero = String(compteProjets + 1).padStart(3, "0");
      const codeProjet = `CH-${annee}-${numero}`;

      projetCree = await prisma.projet.create({
        data: {
          code: codeProjet,
          nom: ao.objet,
          description: `Projet créé depuis l'appel d'offres ${ao.reference}`,
          maitreOuvrage: ao.maitreOuvrage || undefined,
          montantMarche: donnees.montantAttribution
            ? donnees.montantAttribution
            : undefined,
          statut: "BROUILLON",
          creePar: session.userId,
          // Création automatique du lieu de livraison
          lieuLivraison: {
            create: {
              libelle: `Chantier ${ao.objet}`,
              adresse: ao.lieu || "",
              creePar: session.userId,
            },
          },
        },
      });

      await prisma.journalEvenement.create({
        data: {
          entite: "Projet",
          entiteId: projetCree.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          details: {
            source: "AppelOffres",
            appelOffresId: ao.id,
            appelOffresReference: ao.reference,
          },
          commentaire: `Projet créé depuis l'appel d'offres ${ao.reference}`,
        },
      });

      revalidatePath("/projets");
    }

    revalidatePath("/appels-offres");
    revalidatePath(`/appels-offres/${id}`);

    return {
      appelOffres: aoMisAJour,
      projet: projetCree,
    };
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
 *
 * RÈGLE MÉTIER (M9 §6) : Un dossier soumis est figé
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
    // Vérifier que le dossier n'est pas déjà soumis
    const ao = await prisma.appelOffres.findUnique({
      where: { id: appelOffresId },
      select: { statut: true, reference: true },
    });

    if (!ao) {
      throw new Error("Appel d'offres introuvable");
    }

    if (["SOUMIS", "GAGNE", "PERDU", "ABANDONNE"].includes(ao.statut)) {
      throw new Error(
        `Impossible de modifier les pièces : le dossier ${ao.reference} est au statut ${ao.statut}. Un dossier soumis est figé.`
      );
    }

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
 *
 * RÈGLE MÉTIER (M9 §6) : Un dossier soumis est figé
 */
export const marquerPieceDeposee = actionProtegee(
  "ao:creer",
  async (session, pieceId: string, fichierUrl: string) => {
    // Vérifier que le dossier n'est pas déjà soumis
    const piece = await prisma.pieceAO.findUnique({
      where: { id: pieceId },
      include: {
        appelOffres: {
          select: { statut: true, reference: true },
        },
      },
    });

    if (!piece) {
      throw new Error("Pièce introuvable");
    }

    if (
      ["SOUMIS", "GAGNE", "PERDU", "ABANDONNE"].includes(
        piece.appelOffres.statut
      )
    ) {
      throw new Error(
        `Impossible de modifier les pièces : le dossier ${piece.appelOffres.reference} est au statut ${piece.appelOffres.statut}. Un dossier soumis est figé.`
      );
    }

    const pieceUpdated = await prisma.pieceAO.update({
      where: { id: pieceId },
      data: {
        fichierUrl,
        deposeLe: new Date(),
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "PieceAO",
        entiteId: pieceUpdated.id,
        action: "DEPOT",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Pièce déposée : ${pieceUpdated.libelle}`,
      },
    });

    revalidatePath(`/appels-offres/${pieceUpdated.appelOffresId}`);
    return pieceUpdated;
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
 * Marquer automatiquement comme ABANDONNE les dossiers dépassés
 *
 * RÈGLE MÉTIER (M9 §6) : Un dossier dépassé sans soumission passe en ABANDONNE
 * automatiquement
 *
 * À exécuter quotidiennement via cron job ou Edge Function
 */
export const abandonnerDossiersDepasses = actionProtegee(
  "ao:creer",
  async (session) => {
    const aujourdhui = new Date();

    // Trouver tous les AO en VEILLE, GO ou CONSTITUTION dont la date limite est dépassée
    const dossiersDepasses = await prisma.appelOffres.findMany({
      where: {
        statut: { in: ["VEILLE", "GO", "CONSTITUTION"] },
        dateLimiteDepot: { lt: aujourdhui },
      },
    });

    const resultats = [];

    for (const ao of dossiersDepasses) {
      const aoAbandonne = await prisma.appelOffres.update({
        where: { id: ao.id },
        data: { statut: "ABANDONNE" },
      });

      await prisma.journalEvenement.create({
        data: {
          entite: "AppelOffres",
          entiteId: ao.id,
          action: "ABANDON_AUTO",
          auteurId: null, // Action système
          auteurNom: "Système (abandon automatique)",
          commentaire: `Dossier abandonné automatiquement : ${ao.reference} — date limite dépassée (${formaterDateCivile(ao.dateLimiteDepot)})`,
        },
      });

      resultats.push({
        id: ao.id,
        reference: ao.reference,
        dateLimite: ao.dateLimiteDepot,
      });
    }

    if (resultats.length > 0) {
      revalidatePath("/appels-offres");
    }

    return {
      count: resultats.length,
      dossiers: resultats,
    };
  }
);

/**
 * Vérifier les alertes sur les dossiers proches de leur date limite
 *
 * RÈGLE MÉTIER (M9 §6) : Alerte à J−15 et J−7 pour les dossiers non soumis
 *
 * Retourne les dossiers nécessitant une alerte (à traiter par le système de
 * notifications M10)
 *
 * À exécuter quotidiennement via cron job ou Edge Function
 */
export const verifierAlertesEcheance = actionProtegee(
  "ao:creer",
  async (session) => {
    const aujourdhui = new Date();
    const dans15jours = new Date();
    dans15jours.setDate(aujourdhui.getDate() + 15);
    const dans7jours = new Date();
    dans7jours.setDate(aujourdhui.getDate() + 7);

    // Dossiers à J-15
    const alertes15j = await prisma.appelOffres.findMany({
      where: {
        statut: { in: ["GO", "CONSTITUTION"] },
        dateLimiteDepot: {
          gte: aujourdhui,
          lte: dans15jours,
        },
      },
      select: {
        id: true,
        reference: true,
        objet: true,
        dateLimiteDepot: true,
        statut: true,
      },
    });

    // Dossiers à J-7 (urgents)
    const alertes7j = await prisma.appelOffres.findMany({
      where: {
        statut: { in: ["GO", "CONSTITUTION"] },
        dateLimiteDepot: {
          gte: aujourdhui,
          lte: dans7jours,
        },
      },
      select: {
        id: true,
        reference: true,
        objet: true,
        dateLimiteDepot: true,
        statut: true,
      },
    });

    return {
      alertes15jours: alertes15j,
      alertes7jours: alertes7j,
      total: alertes15j.length + alertes7j.length,
    };
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