"use server";

/**
 * M13 L2 — Server Actions : Stocks et mouvements
 *
 * Fonctionnalités :
 * - Créer/modifier des articles de stock
 * - Enregistrer des mouvements (ENTREE, SORTIE, AJUSTEMENT)
 * - Créer et clore des inventaires
 * - Consulter soldes et historique
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { Decimal } from "@prisma/client/runtime/library";
import type { SensMouvement, StatutInventaire } from "@prisma/client";

// ========== Types ==========

type ArticleStockInput = {
  reference: string;
  designation: string;
  unite: string;
  seuilAlerte?: number;
  famille?: string;
};

type MouvementStockInput = {
  articleStockId: string;
  sens: SensMouvement;
  quantite: number;
  lieuStockageId: string;
  bonMouvementId?: string;
  motif: string;
  prixUnitaire?: number;
  dateMouvement: Date;
};

type InventaireInput = {
  lieuStockageId: string;
  dateOuverture: Date;
};

type LigneInventaireInput = {
  inventaireId: string;
  articleStockId: string;
  quantiteComptee: number;
  justification?: string;
};

// ========== Articles de stock ==========

/**
 * Créer un nouvel article de stock
 */
export const creerArticleStock = actionProtegee(
  PERMISSIONS["referentiel:creer"].code,
  async (session, input: ArticleStockInput) => {
    // Vérifier unicité de la référence
    const existant = await prisma.articleStock.findUnique({
      where: { reference: input.reference },
    });

    if (existant) {
      return {
        success: false,
        error: `La référence ${input.reference} est déjà utilisée`,
      };
    }

    const article = await prisma.articleStock.create({
      data: {
        reference: input.reference,
        designation: input.designation,
        unite: input.unite,
        seuilAlerte: input.seuilAlerte ? new Decimal(input.seuilAlerte) : null,
        famille: input.famille,
        actif: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "ArticleStock",
        entiteId: article.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { reference: article.reference, designation: article.designation },
        commentaire: `Article de stock ${article.reference} créé`,
      },
    });

    return { success: true, articleId: article.id };
  },
);

/**
 * Modifier un article de stock
 */
export const modifierArticleStock = actionProtegee(
  PERMISSIONS["referentiel:creer"].code,
  async (session, articleId: string, input: Partial<ArticleStockInput>) => {
    const avant = await prisma.articleStock.findUnique({
      where: { id: articleId },
    });

    if (!avant) {
      return { success: false, error: "Article non trouvé" };
    }

    const apres = await prisma.articleStock.update({
      where: { id: articleId },
      data: {
        designation: input.designation ?? avant.designation,
        unite: input.unite ?? avant.unite,
        seuilAlerte: input.seuilAlerte !== undefined
          ? input.seuilAlerte ? new Decimal(input.seuilAlerte) : null
          : avant.seuilAlerte,
        famille: input.famille ?? avant.famille,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "ArticleStock",
        entiteId: articleId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { avant, apres },
        commentaire: `Article ${avant.reference} modifié`,
      },
    });

    return { success: true };
  },
);

/**
 * Désactiver un article de stock
 */
export const desactiverArticleStock = actionProtegee(
  PERMISSIONS["referentiel:creer"].code,
  async (session, articleId: string) => {
    const article = await prisma.articleStock.update({
      where: { id: articleId },
      data: { actif: false },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "ArticleStock",
        entiteId: articleId,
        action: "DESACTIVATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Article ${article.reference} désactivé`,
      },
    });

    return { success: true };
  },
);

/**
 * Lister les articles de stock avec pagination
 */
export const listerArticlesStock = actionProtegee(
  PERMISSIONS["stock:lire"].code,
  async (_session, page: number = 1, recherche?: string) => {
    const limite = 25;
    const offset = (page - 1) * limite;

    const where = recherche
      ? {
          OR: [
            { reference: { contains: recherche, mode: "insensitive" as const } },
            { designation: { contains: recherche, mode: "insensitive" as const } },
            { famille: { contains: recherche, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [articlesRaw, total] = await Promise.all([
      prisma.articleStock.findMany({
        where,
        orderBy: { reference: "asc" },
        skip: offset,
        take: limite,
      }),
      prisma.articleStock.count({ where }),
    ]);

    // Convertir Decimal en number pour sérialisation Client Component
    const articles = articlesRaw.map((a) => ({
      ...a,
      seuilAlerte: a.seuilAlerte ? a.seuilAlerte.toNumber() : null,
    }));

    return {
      articles,
      total,
      pages: Math.ceil(total / limite),
      page,
    };
  },
);

// ========== Bons de mouvement ==========

/**
 * Créer un bon de mouvement
 */
export const creerBonMouvement = actionProtegee(
  PERMISSIONS["stock:mouvementer"].code,
  async (
    session,
    sens: SensMouvement,
    lieuOrigineId: string | null,
    lieuDestinationId: string | null,
    motif: string,
    dateMouvement: Date,
  ) => {
    // Générer une référence unique
    const count = await prisma.bonMouvement.count();
    const prefix = sens === "ENTREE" ? "BE" : sens === "SORTIE" ? "BS" : "ADJ";
    const reference = `${prefix}-${String(count + 1).padStart(5, "0")}`;

    const bon = await prisma.bonMouvement.create({
      data: {
        reference,
        sens,
        lieuOrigineId,
        lieuDestinationId,
        motif,
        emetteurId: session.userId,
        emetteurNom: session.email,
        dateMouvement,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "BonMouvement",
        entiteId: bon.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { reference, sens, motif },
        commentaire: `Bon de mouvement ${reference} créé`,
      },
    });

    return { success: true, bonId: bon.id, reference };
  },
);

/**
 * Lister les bons de mouvement avec pagination
 */
export const listerBonsMouvement = actionProtegee(
  PERMISSIONS["stock:lire"].code,
  async (
    _session,
    page: number = 1,
    sens?: SensMouvement,
    lieuId?: string,
  ) => {
    const limite = 25;
    const offset = (page - 1) * limite;

    const where = {
      ...(sens && { sens }),
      ...(lieuId && {
        OR: [{ lieuOrigineId: lieuId }, { lieuDestinationId: lieuId }],
      }),
    };

    const [bons, total] = await Promise.all([
      prisma.bonMouvement.findMany({
        where,
        include: {
          lieuOrigine: { select: { libelle: true } },
          lieuDestination: { select: { libelle: true } },
          mouvements: {
            select: { id: true },
          },
        },
        orderBy: { dateMouvement: "desc" },
        skip: offset,
        take: limite,
      }),
      prisma.bonMouvement.count({ where }),
    ]);

    return {
      bons,
      total,
      pages: Math.ceil(total / limite),
      page,
    };
  },
);

/**
 * Consulter un bon de mouvement avec ses lignes
 */
export const consulterBonMouvement = actionProtegee(
  PERMISSIONS["stock:lire"].code,
  async (_session, bonId: string) => {
    const bonRaw = await prisma.bonMouvement.findUnique({
      where: { id: bonId },
      include: {
        lieuOrigine: { select: { libelle: true } },
        lieuDestination: { select: { libelle: true } },
        mouvements: {
          include: {
            articleStock: {
              select: { reference: true, designation: true, unite: true },
            },
          },
        },
      },
    });

    if (!bonRaw) {
      return { success: false, error: "Bon de mouvement non trouvé" };
    }

    // Convertir Decimal en number pour sérialisation Client Component
    const bon = {
      ...bonRaw,
      mouvements: bonRaw.mouvements.map((m) => ({
        ...m,
        quantite: m.quantite.toNumber(),
        prixUnitaire: m.prixUnitaire ? m.prixUnitaire.toNumber() : null,
      })),
    };

    return { success: true, bon };
  },
);

// ========== Mouvements de stock ==========

/**
 * Enregistrer un mouvement de stock (ENTREE, SORTIE, AJUSTEMENT)
 */
export const enregistrerMouvement = actionProtegee(
  PERMISSIONS["stock:mouvementer"].code,
  async (session, input: MouvementStockInput) => {
    // Vérifier que l'article existe
    const article = await prisma.articleStock.findUnique({
      where: { id: input.articleStockId },
    });

    if (!article) {
      return { success: false, error: "Article non trouvé" };
    }

    // Calculer l'écart selon le sens
    const quantite = new Decimal(input.quantite);
    const ecart = input.sens === "ENTREE"
      ? quantite
      : input.sens === "SORTIE"
      ? quantite.neg()
      : quantite; // AJUSTEMENT peut être + ou -

    const mouvement = await prisma.mouvementStock.create({
      data: {
        articleStockId: input.articleStockId,
        sens: input.sens,
        quantite,
        lieuStockageId: input.lieuStockageId,
        bonMouvementId: input.bonMouvementId,
        motif: input.motif,
        prixUnitaire: input.prixUnitaire ? new Decimal(input.prixUnitaire) : null,
        dateMouvement: input.dateMouvement,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "MouvementStock",
        entiteId: mouvement.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          article: article.reference,
          sens: input.sens,
          quantite: input.quantite,
          lieu: input.lieuStockageId,
        },
        commentaire: `Mouvement ${input.sens} : ${input.quantite} ${article.unite} de ${article.designation}`,
      },
    });

    return { success: true, mouvementId: mouvement.id };
  },
);

/**
 * Calculer le solde théorique d'un article dans un lieu (fonction interne)
 */
async function calculerSoldeArticleInterne(
  articleId: string,
  lieuId: string,
): Promise<number> {
  const mouvements = await prisma.mouvementStock.findMany({
    where: {
      articleStockId: articleId,
      lieuStockageId: lieuId,
    },
    orderBy: { dateMouvement: "asc" },
  });

  let solde = new Decimal(0);
  for (const mvt of mouvements) {
    if (mvt.sens === "ENTREE") {
      solde = solde.add(mvt.quantite);
    } else if (mvt.sens === "SORTIE") {
      solde = solde.sub(mvt.quantite);
    } else {
      // AJUSTEMENT : la quantité est déjà signée
      solde = mvt.quantite;
    }
  }

  return solde.toNumber();
}

/**
 * Calculer le solde théorique d'un article dans un lieu (API publique)
 */
export const calculerSoldeArticle = actionProtegee(
  PERMISSIONS["stock:lire"].code,
  async (_session, articleId: string, lieuId: string) => {
    const solde = await calculerSoldeArticleInterne(articleId, lieuId);
    return { solde };
  },
);

// ========== Inventaires ==========

/**
 * Créer un nouvel inventaire
 */
export const creerInventaire = actionProtegee(
  PERMISSIONS["stock:mouvementer"].code,
  async (session, input: InventaireInput) => {
    // Générer une référence unique
    const count = await prisma.inventaire.count();
    const reference = `INV-${String(count + 1).padStart(5, "0")}`;

    const inventaire = await prisma.inventaire.create({
      data: {
        reference,
        lieuStockageId: input.lieuStockageId,
        dateOuverture: input.dateOuverture,
        statut: "OUVERT",
        responsableId: session.userId,
        responsableNom: session.email,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Inventaire",
        entiteId: inventaire.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Inventaire ${reference} ouvert`,
      },
    });

    return { success: true, inventaireId: inventaire.id, reference };
  },
);

/**
 * Ajouter une ligne d'inventaire
 */
export const ajouterLigneInventaire = actionProtegee(
  PERMISSIONS["stock:mouvementer"].code,
  async (session, input: LigneInventaireInput) => {
    // Vérifier que l'inventaire est ouvert
    const inventaire = await prisma.inventaire.findUnique({
      where: { id: input.inventaireId },
    });

    if (!inventaire) {
      return { success: false, error: "Inventaire non trouvé" };
    }

    if (inventaire.statut !== "OUVERT") {
      return { success: false, error: "L'inventaire est déjà clos" };
    }

    // Calculer le solde théorique
    const solde = await calculerSoldeArticleInterne(
      input.articleStockId,
      inventaire.lieuStockageId,
    );

    const quantiteComptee = new Decimal(input.quantiteComptee);
    const soldeTheorique = new Decimal(solde);
    const ecart = quantiteComptee.sub(soldeTheorique);

    const ligne = await prisma.ligneInventaire.create({
      data: {
        inventaireId: input.inventaireId,
        articleStockId: input.articleStockId,
        soldeTheorique,
        quantiteComptee,
        ecart,
        justification: input.justification,
        ajuste: false,
      },
    });

    return { success: true, ligneId: ligne.id };
  },
);

/**
 * Clore un inventaire et générer les ajustements
 */
export const cloreInventaire = actionProtegee(
  PERMISSIONS["stock:mouvementer"].code,
  async (session, inventaireId: string) => {
    const inventaire = await prisma.inventaire.findUnique({
      where: { id: inventaireId },
      include: { lignes: true },
    });

    if (!inventaire) {
      return { success: false, error: "Inventaire non trouvé" };
    }

    if (inventaire.statut !== "OUVERT") {
      return { success: false, error: "L'inventaire est déjà clos" };
    }

    // Générer un mouvement d'ajustement pour chaque ligne avec écart
    let ajustements = 0;
    for (const ligne of inventaire.lignes) {
      if (!ligne.ecart.isZero() && !ligne.ajuste) {
        await prisma.mouvementStock.create({
          data: {
            articleStockId: ligne.articleStockId,
            sens: "AJUSTEMENT",
            quantite: ligne.quantiteComptee, // Le nouveau solde
            lieuStockageId: inventaire.lieuStockageId,
            motif: `Ajustement inventaire ${inventaire.reference}`,
            dateMouvement: new Date(),
          },
        });

        await prisma.ligneInventaire.update({
          where: { id: ligne.id },
          data: { ajuste: true },
        });

        ajustements++;
      }
    }

    // Clore l'inventaire
    await prisma.inventaire.update({
      where: { id: inventaireId },
      data: {
        statut: "CLOS",
        dateClôture: new Date(),
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Inventaire",
        entiteId: inventaireId,
        action: "CLOTURE",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { ajustements },
        commentaire: `Inventaire ${inventaire.reference} clos (${ajustements} ajustements)`,
      },
    });

    return { success: true, ajustements };
  },
);
