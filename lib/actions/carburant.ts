"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { TypeCarburant, NatureDistribution, SensMouvement, SourceReleve } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * M16 L2 — Distribuer du carburant
 *
 * Deux natures:
 * - STATION: crée dépense uniquement
 * - CUVE: crée mouvement de stock (SORTIE)
 *
 * Toujours crée un ReleveCompteur (source: CARBURANT)
 */
export const distribuerCarburant = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (
    session,
    data: {
      demandeurId: string;
      materielId: string;
      typeCarburant: TypeCarburant;
      quantite: number;
      montant?: number;
      compteur: number;
      pleinComplet: boolean;
      nature: NatureDistribution;
      stationId?: string;
      lieuStockageId?: string;
      articleStockId?: string; // Pour CUVE
      dateDistribution: Date;
    }
  ) => {
    // Générer référence: DC-{ANNEE}-{SEQ:4}
    const annee = new Date().getFullYear();
    const dernier = await prisma.distributionCarburant.findFirst({
      where: { reference: { startsWith: `DC-${annee}-` } },
      orderBy: { reference: "desc" },
      select: { reference: true },
    });
    const seq = dernier ? Number(dernier.reference.slice(-4)) + 1 : 1;
    const reference = `DC-${annee}-${seq.toString().padStart(4, "0")}`;

    // Vérifier compteur en recul
    const dernierReleve = await prisma.releveCompteur.findFirst({
      where: { materielId: data.materielId },
      orderBy: { releveLe: "desc" },
      select: { valeur: true, releveLe: true },
    });

    const compteurAnomalie =
      dernierReleve &&
      new Decimal(data.compteur).lessThan(dernierReleve.valeur);

    const motifAnomalie = compteurAnomalie
      ? "Compteur en recul — nécessite vérification"
      : null;

    // Transaction: distribution + relevé compteur + mouvement stock (si cuve)
    const distribution = await prisma.$transaction(async (tx) => {
      // 1. Créer le relevé compteur
      const materiel = await tx.materiel.findUnique({
        where: { id: data.materielId },
        select: { type: true },
      });

      if (!materiel) throw new Error("Matériel introuvable");

      // Déduire l'unité du compteur selon le type de matériel
      const uniteCompteur =
        materiel.type === "VEHICULE_LEGER" || materiel.type === "VEHICULE_LOURD"
          ? "KILOMETRE"
          : "HEURE";

      const releveCompteur = await tx.releveCompteur.create({
        data: {
          materielId: data.materielId,
          valeur: new Decimal(data.compteur),
          unite: uniteCompteur,
          releveLe: data.dateDistribution,
          source: SourceReleve.CARBURANT,
          anomalie: compteurAnomalie || false,
          releveParId: session.userId,
          releveParNom: session.email,
        },
      });

      // 2. Créer le mouvement de stock (si CUVE)
      let mouvementStock = null;
      if (data.nature === NatureDistribution.CUVE) {
        if (!data.lieuStockageId || !data.articleStockId) {
          throw new Error(
            "Lieu de stockage et article requis pour distribution en cuve"
          );
        }

        mouvementStock = await tx.mouvementStock.create({
          data: {
            articleStockId: data.articleStockId,
            sens: SensMouvement.SORTIE,
            quantite: new Decimal(data.quantite),
            lieuStockageId: data.lieuStockageId,
            motif: `Distribution carburant ${reference}`,
            dateMouvement: data.dateDistribution,
          },
        });
      }

      // 3. Créer la distribution
      const dist = await tx.distributionCarburant.create({
        data: {
          reference,
          demandeurId: data.demandeurId,
          materielId: data.materielId,
          typeCarburant: data.typeCarburant,
          quantite: new Decimal(data.quantite),
          montant: data.montant ? new Decimal(data.montant) : null,
          compteur: new Decimal(data.compteur),
          uniteCompteur: uniteCompteur,
          pleinComplet: data.pleinComplet,
          compteurAnomalie: compteurAnomalie || false,
          motifAnomalie,
          nature: data.nature,
          stationId: data.stationId,
          lieuStockageId: data.lieuStockageId,
          mouvementStockId: mouvementStock?.id,
          serviParId: session.userId,
          dateDistribution: data.dateDistribution,
          releveCompteurId: releveCompteur.id,
        },
        include: {
          demandeur: { select: { nom: true, prenom: true } },
          materiel: { select: { codeIta: true, designation: true } },
        },
      });

      return dist;
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DistributionCarburant",
        entiteId: distribution.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: distribution.reference,
          materiel: distribution.materiel.codeIta,
          quantite: data.quantite,
          nature: data.nature,
          pleinComplet: data.pleinComplet,
        },
        commentaire: `Distribution ${data.nature === "STATION" ? "en station" : "depuis cuve"}`,
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true, distribution };
  }
);

/**
 * M16 L2 — Calculer la consommation d'un matériel
 *
 * RÈGLE CRITIQUE:
 * Les litres retenus sont ceux du PREMIER plein + partiels intermédiaires
 * PAS ceux du second plein complet (il n'a pas encore été consommé)
 *
 * Exemple:
 * 12 juin 45 200 km 60 L plein ← 60 L retenus
 * 18 juin 45 450 km 30 L partiel ← 30 L retenus
 * 28 juin 45 890 km 55 L plein ← 55 L NON retenus
 * = 690 km avec 90 L → 13,0 L/100 km
 */
export const calculerConsommation = actionProtegee(
  PERMISSIONS["carburant:consulter"].code,
  async (session, materielId: string) => {
    // Récupérer toutes les distributions du matériel, ordonnées par date
    const distributions = await prisma.distributionCarburant.findMany({
      where: {
        materielId,
        compteurAnomalie: false, // Exclure intervalles avec anomalie
      },
      orderBy: { dateDistribution: "asc" },
      select: {
        id: true,
        dateDistribution: true,
        compteur: true,
        uniteCompteur: true,
        quantite: true,
        pleinComplet: true,
        compteurAnomalie: true,
      },
    });

    if (distributions.length < 2) {
      return {
        type: "EN_ATTENTE",
        message: "En attente d'au moins deux pleins complets",
      };
    }

    // Trouver les intervalles entre pleins complets
    const pleinsComplets = distributions.filter((d) => d.pleinComplet);

    if (pleinsComplets.length < 2) {
      return {
        type: "EN_ATTENTE",
        message: "En attente d'au moins deux pleins complets",
      };
    }

    // Calculer consommation pour chaque intervalle entre pleins complets
    const intervalles = [];
    for (let i = 0; i < pleinsComplets.length - 1; i++) {
      const debut = pleinsComplets[i];
      const fin = pleinsComplets[i + 1];

      // Trouver toutes les distributions entre ces deux pleins (inclusif début, exclusif fin)
      const distsDansIntervalle = distributions.filter(
        (d) =>
          d.dateDistribution >= debut.dateDistribution &&
          d.dateDistribution < fin.dateDistribution
      );

      // Vérifier anomalies dans l'intervalle (exclut l'intervalle si anomalie)
      const aAnomalie = distsDansIntervalle.some((d) => d.compteurAnomalie);
      if (aAnomalie) continue; // Sauter cet intervalle

      // Litres = PREMIER plein + tous les partiels
      // PAS le second plein (il n'a pas encore été consommé)
      const litres = distsDansIntervalle.reduce(
        (sum, d) => sum.plus(d.quantite),
        new Decimal(0)
      );

      const distanceParcourue = fin.compteur.minus(debut.compteur);

      // Calcul selon l'unité
      let consommation: Decimal;
      if (debut.uniteCompteur === "KILOMETRE") {
        // L/100 km
        consommation = litres.dividedBy(distanceParcourue).times(100);
      } else {
        // L/h
        consommation = litres.dividedBy(distanceParcourue);
      }

      intervalles.push({
        debut: debut.dateDistribution,
        fin: fin.dateDistribution,
        litres: litres.toNumber(),
        distance: distanceParcourue.toNumber(),
        consommation: consommation.toNumber(),
        unite: debut.uniteCompteur,
      });
    }

    if (intervalles.length === 0) {
      return {
        type: "EN_ATTENTE",
        message: "Aucun intervalle valide sans anomalie",
      };
    }

    // Moyenne de consommation
    const moyenneConsommation =
      intervalles.reduce((sum, i) => sum + i.consommation, 0) /
      intervalles.length;

    // Dernier calcul
    const dernierIntervalle = intervalles[intervalles.length - 1];

    // Écart
    const ecart =
      ((dernierIntervalle.consommation - moyenneConsommation) /
        moyenneConsommation) *
      100;

    return {
      type: "CALCULE",
      moyenneConsommation,
      dernierCalcul: dernierIntervalle.consommation,
      ecartPourcent: ecart,
      unite: dernierIntervalle.unite === "KILOMETRE" ? "L/100km" : "L/h",
      nbIntervalles: intervalles.length,
      dernierPlein: dernierIntervalle.fin,
      intervalles,
    };
  }
);

/**
 * M16 L2 — Lister les distributions (pagination serveur)
 */
export const listerDistributions = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (session, page: number = 1, limit: number = 25) => {
    const skip = (page - 1) * limit;

    const [distributions, total] = await Promise.all([
      prisma.distributionCarburant.findMany({
        include: {
          demandeur: { select: { nom: true, prenom: true } },
          materiel: { select: { codeIta: true, designation: true } },
          station: { select: { libelle: true } },
          lieuStockage: { select: { libelle: true } },
        },
        orderBy: { dateDistribution: "desc" },
        skip,
        take: limit,
      }),
      prisma.distributionCarburant.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { distributions, total, totalPages, currentPage: page };
  }
);

/**
 * M16 L2 — Lister les cuves avec soldes de carburant
 *
 * Calcule le solde depuis les mouvements de stock
 */
export const listerCuves = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (session) => {
    // Récupérer tous les lieux type GARAGE
    const lieux = await prisma.lieuStockage.findMany({
      where: {
        actif: true,
        nature: "GARAGE",
      },
      select: {
        id: true,
        libelle: true,
      },
    });

    // Pour chaque lieu, calculer les soldes de carburant
    const cuvesAvecSoldes = await Promise.all(
      lieux.map(async (lieu) => {
        // Récupérer tous les mouvements de stock de carburant pour ce lieu
        const mouvements = await prisma.mouvementStock.findMany({
          where: {
            lieuStockageId: lieu.id,
          },
          include: {
            articleStock: {
              select: {
                id: true,
                designation: true,
              },
            },
          },
          orderBy: { dateMouvement: "asc" },
        });

        // Grouper par article et calculer soldes
        const articlesMap = new Map<
          string,
          { libelle: string; solde: Decimal }
        >();

        mouvements.forEach((mouvement) => {
          const articleId = mouvement.articleStockId;
          const articleLibelle = mouvement.articleStock.designation;

          if (!articlesMap.has(articleId)) {
            articlesMap.set(articleId, {
              libelle: articleLibelle,
              solde: new Decimal(0),
            });
          }

          const article = articlesMap.get(articleId)!;
          if (mouvement.sens === "ENTREE") {
            article.solde = article.solde.plus(mouvement.quantite);
          } else {
            article.solde = article.solde.minus(mouvement.quantite);
          }
        });

        return {
          id: lieu.id,
          libelle: lieu.libelle,
          articles: Array.from(articlesMap.entries()).map(([id, data]) => ({
            articleId: id,
            libelle: data.libelle,
            solde: data.solde.toNumber(),
          })),
        };
      })
    );

    return { cuves: cuvesAvecSoldes };
  }
);

/**
 * M16 L2 — Créer/lister stations-service
 */
export const creerStationService = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (session, libelle: string, localisation?: string) => {
    const libelleNormalise = libelle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    // Vérifier doublon
    const existante = await prisma.stationService.findUnique({
      where: { libelleNormalise },
    });

    if (existante) {
      return { success: true, station: existante, cree: false };
    }

    const station = await prisma.stationService.create({
      data: {
        libelle,
        libelleNormalise,
        localisation,
      },
    });

    revalidatePath("/assistanat/carburant/stations");
    return { success: true, station, cree: true };
  }
);

export const listerStationsService = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (session) => {
    const stations = await prisma.stationService.findMany({
      where: { actif: true },
      orderBy: { libelle: "asc" },
    });

    return { stations };
  }
);
