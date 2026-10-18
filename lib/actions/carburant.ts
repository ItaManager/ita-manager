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

/**
 * M16 L2 — Créer une demande de carburant (station ou garage)
 * Workflow A ou B selon circuit
 */
export const creerDemandeCarburant = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (
    session,
    data: {
      demandeurId: string;
      materielId: string;
      projetId?: string;
      typeCarburant: string;
      quantiteSouhai: number;
      compteurActuel: number;
      circuit: string;
      garageId?: string;
    }
  ) => {
    // Générer référence: DC-{ANNEE}-{SEQ:4}
    const annee = new Date().getFullYear();
    const dernier = await prisma.demandeCarburant.findFirst({
      where: { reference: { startsWith: `DC-${annee}-` } },
      orderBy: { reference: "desc" },
      select: { reference: true },
    });
    const seq = dernier ? Number(dernier.reference.slice(-4)) + 1 : 1;
    const reference = `DC-${annee}-${seq.toString().padStart(4, "0")}`;

    // Déduire unité compteur depuis le matériel
    const materiel = await prisma.materiel.findUnique({
      where: { id: data.materielId },
      select: { type: true },
    });

    if (!materiel) throw new Error("Matériel introuvable");

    const uniteCompteur =
      materiel.type === "VEHICULE_LEGER" || materiel.type === "VEHICULE_LOURD"
        ? "KILOMETRE"
        : "HEURE";

    // Vérifier stock disponible si circuit GARAGE (D-06)
    if (data.circuit === "GARAGE") {
      if (!data.garageId) {
        throw new Error("Garage requis pour circuit GARAGE");
      }

      const garage = await prisma.lieuStockage.findUnique({
        where: { id: data.garageId },
        select: { stockActuel: true },
      });

      if (
        !garage ||
        !garage.stockActuel ||
        garage.stockActuel.lessThan(data.quantiteSouhai)
      ) {
        throw new Error(
          `Stock insuffisant. Disponible: ${garage?.stockActuel?.toNumber() || 0} L`
        );
      }
    }

    const demande = await prisma.demandeCarburant.create({
      data: {
        reference,
        demandeurId: data.demandeurId,
        materielId: data.materielId,
        projetId: data.projetId,
        typeCarburant: data.typeCarburant as any,
        quantiteSouhai: new Decimal(data.quantiteSouhai),
        compteurActuel: new Decimal(data.compteurActuel),
        uniteCompteur: uniteCompteur as any,
        circuit: data.circuit as any,
        garageId: data.garageId,
        statut: "BROUILLON",
      },
      include: {
        demandeur: { select: { nom: true, prenom: true } },
        materiel: { select: { codeIta: true, designation: true } },
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeCarburant",
        entiteId: demande.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
          materiel: demande.materiel.codeIta,
          circuit: data.circuit,
          quantite: data.quantiteSouhai,
        },
        commentaire: `Demande ${data.circuit} créée`,
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true, demande };
  }
);

/**
 * M16 L2 — Soumettre une demande de carburant pour validation
 */
export const soumettreDemandeCarburant = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (session, demandeId: string) => {
    const demande = await prisma.demandeCarburant.findUnique({
      where: { id: demandeId },
      select: { statut: true, reference: true },
    });

    if (!demande) throw new Error("Demande introuvable");
    if (demande.statut !== "BROUILLON") {
      throw new Error("Seule une demande brouillon peut être soumise");
    }

    await prisma.demandeCarburant.update({
      where: { id: demandeId },
      data: { statut: "ATTENTE_VALIDATION" },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeCarburant",
        entiteId: demandeId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { reference: demande.reference, nouveauStatut: "ATTENTE_VALIDATION" },
        commentaire: "Demande soumise pour validation",
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true };
  }
);

/**
 * M16 L2 — Valider une demande de carburant
 * Crée RemiseStation si circuit STATION
 */
export const validerDemandeCarburant = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (
    session,
    data: {
      demandeId: string;
      modeRemise?: string; // Si circuit STATION
      montantRemis?: number; // Si ARGENT_REMIS
    }
  ) => {
    const demande = await prisma.demandeCarburant.findUnique({
      where: { id: data.demandeId },
      include: { materiel: true },
    });

    if (!demande) throw new Error("Demande introuvable");
    if (demande.statut !== "ATTENTE_VALIDATION") {
      throw new Error("Seule une demande en attente peut être validée");
    }

    // Vérifier compteur >= dernier relevé (D-04)
    const dernierReleve = await prisma.releveCompteur.findFirst({
      where: { materielId: demande.materielId },
      orderBy: { releveLe: "desc" },
      select: { valeur: true },
    });

    if (
      dernierReleve &&
      demande.compteurActuel.lessThan(dernierReleve.valeur)
    ) {
      throw new Error(
        `Compteur en recul. Dernier relevé: ${dernierReleve.valeur.toNumber()}`
      );
    }

    // Transaction: update demande + créer remise station si nécessaire
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la demande
      const demandeUpdated = await tx.demandeCarburant.update({
        where: { id: data.demandeId },
        data: {
          statut: "VALIDEE",
          valideParId: session.userId,
          valideLe: new Date(),
        },
      });

      // 2. Si circuit STATION, créer RemiseStation
      let remiseStation = null;
      if (demande.circuit === "STATION") {
        if (!data.modeRemise) {
          throw new Error("Mode de remise requis pour circuit STATION");
        }

        remiseStation = await tx.remiseStation.create({
          data: {
            demandeCarburantId: data.demandeId,
            modeRemise: data.modeRemise as any,
            montantRemis: data.montantRemis
              ? new Decimal(data.montantRemis)
              : null,
            statutRemise: "EN_COURS",
          },
        });

        // Lier la remise à la demande
        await tx.demandeCarburant.update({
          where: { id: data.demandeId },
          data: { remiseStationId: remiseStation.id },
        });
      }

      return { demandeUpdated, remiseStation };
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeCarburant",
        entiteId: data.demandeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
          modeRemise: data.modeRemise,
        },
        commentaire: "Demande validée",
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true, ...result };
  }
);

/**
 * M16 L2 — Refuser une demande de carburant
 */
export const refuserDemandeCarburant = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (session, data: { demandeId: string; motif: string }) => {
    const demande = await prisma.demandeCarburant.findUnique({
      where: { id: data.demandeId },
      select: { statut: true, reference: true },
    });

    if (!demande) throw new Error("Demande introuvable");
    if (demande.statut !== "ATTENTE_VALIDATION") {
      throw new Error("Seule une demande en attente peut être refusée");
    }

    await prisma.demandeCarburant.update({
      where: { id: data.demandeId },
      data: { statut: "REFUSEE" },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeCarburant",
        entiteId: data.demandeId,
        action: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { reference: demande.reference, motif: data.motif },
        commentaire: `Demande refusée: ${data.motif}`,
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true };
  }
);

/**
 * M16 L2 — Lister les demandes de carburant (pagination serveur)
 */
export const listerDemandesCarburant = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (
    session,
    {
      page = 1,
      limit = 25,
      statut,
      circuit,
    }: {
      page?: number;
      limit?: number;
      statut?: string;
      circuit?: string;
    }
  ) => {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statut) where.statut = statut;
    if (circuit) where.circuit = circuit;

    const [demandes, total] = await Promise.all([
      prisma.demandeCarburant.findMany({
        where,
        include: {
          demandeur: { select: { nom: true, prenom: true } },
          materiel: { select: { codeIta: true, designation: true } },
          garage: { select: { libelle: true } },
          projet: { select: { code: true, nom: true } },
        },
        orderBy: { creeLe: "desc" },
        skip,
        take: limit,
      }),
      prisma.demandeCarburant.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { demandes, total, totalPages, currentPage: page };
  }
);

/**
 * M16 L2 — Clôturer une remise station (D-02, D-03)
 */
export const cloturerRemiseStation = actionProtegee(
  PERMISSIONS["carburant:distribuer"].code,
  async (
    session,
    data: {
      remiseId: string;
      montantDepense: number;
      urlRecu: string;
    }
  ) => {
    const remise = await prisma.remiseStation.findUnique({
      where: { id: data.remiseId },
      include: { demandeCarburant: true },
    });

    if (!remise) throw new Error("Remise introuvable");
    if (remise.statutRemise === "CLOTURE") {
      throw new Error("Remise déjà clôturée");
    }

    // Vérifier reçu obligatoire (D-03)
    if (!data.urlRecu) {
      throw new Error("Reçu de station obligatoire pour clôturer");
    }

    // Calculer reliquat (D-02)
    const montantRemis = remise.montantRemis || new Decimal(0);
    const montantDepense = new Decimal(data.montantDepense);
    const reliquat = montantRemis.minus(montantDepense);

    await prisma.remiseStation.update({
      where: { id: data.remiseId },
      data: {
        montantDepense,
        reliquat,
        urlRecu: data.urlRecu,
        statutRemise: "CLOTURE",
        clotureparId: session.userId,
        clotureLe: new Date(),
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "RemiseStation",
        entiteId: data.remiseId,
        action: "CLOTURE",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          demande: remise.demandeCarburant?.reference,
          montantRemis: montantRemis.toNumber(),
          montantDepense: data.montantDepense,
          reliquat: reliquat.toNumber(),
        },
        commentaire: `Remise clôturée. Reliquat: ${reliquat.toNumber()} FCFA`,
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true, reliquat: reliquat.toNumber() };
  }
);

/**
 * M16 L2 — Créer une demande de rechargement garage
 */
export const creerDemandeRechargement = actionProtegee(
  PERMISSIONS["carburant:reapprovisionner"].code,
  async (
    session,
    data: {
      garageId: string;
      projetId?: string;
      typeCarburant: string;
      quantiteDemandee: number;
    }
  ) => {
    // Générer référence: DR-{ANNEE}-{SEQ:4}
    const annee = new Date().getFullYear();
    const dernier = await prisma.demandeRechargement.findFirst({
      where: { reference: { startsWith: `DR-${annee}-` } },
      orderBy: { reference: "desc" },
      select: { reference: true },
    });
    const seq = dernier ? Number(dernier.reference.slice(-4)) + 1 : 1;
    const reference = `DR-${annee}-${seq.toString().padStart(4, "0")}`;

    // Vérifier que le demandeur est le responsable du garage ou admin
    const garage = await prisma.lieuStockage.findUnique({
      where: { id: data.garageId },
      select: { responsableId: true, libelle: true },
    });

    if (!garage) throw new Error("Garage introuvable");

    // Récupérer l'employeId du profil connecté
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      select: { employeId: true },
    });

    if (!profil?.employeId) {
      throw new Error("Profil employé non trouvé");
    }

    const demande = await prisma.demandeRechargement.create({
      data: {
        reference,
        garageId: data.garageId,
        projetId: data.projetId,
        typeCarburant: data.typeCarburant as any,
        quantiteDemandee: new Decimal(data.quantiteDemandee),
        statut: "BROUILLON",
        demandeurId: profil.employeId,
      },
      include: {
        garage: { select: { libelle: true } },
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRechargement",
        entiteId: demande.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
          garage: demande.garage.libelle,
          quantite: data.quantiteDemandee,
        },
        commentaire: `Demande rechargement créée`,
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true, demande };
  }
);

/**
 * M16 L2 — Valider une demande de rechargement
 */
export const validerDemandeRechargement = actionProtegee(
  PERMISSIONS["carburant:reapprovisionner"].code,
  async (session, demandeId: string) => {
    const demande = await prisma.demandeRechargement.findUnique({
      where: { id: demandeId },
      select: { statut: true, reference: true },
    });

    if (!demande) throw new Error("Demande introuvable");
    if (demande.statut !== "ATTENTE_VALIDATION") {
      throw new Error("Seule une demande en attente peut être validée");
    }

    await prisma.demandeRechargement.update({
      where: { id: demandeId },
      data: {
        statut: "VALIDEE",
        valideParId: session.userId,
        valideLe: new Date(),
      },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRechargement",
        entiteId: demandeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { reference: demande.reference },
        commentaire: "Demande rechargement validée",
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true };
  }
);

/**
 * M16 L2 — Réceptionner un rechargement de garage
 * Met à jour le stock automatiquement
 */
export const receptionnerRechargement = actionProtegee(
  PERMISSIONS["carburant:reapprovisionner"].code,
  async (
    session,
    data: {
      demandeId: string;
      quantiteLivree: number;
    }
  ) => {
    const demande = await prisma.demandeRechargement.findUnique({
      where: { id: data.demandeId },
      include: { garage: true },
    });

    if (!demande) throw new Error("Demande introuvable");
    if (demande.statut !== "VALIDEE") {
      throw new Error("Seule une demande validée peut être réceptionnée");
    }

    // Transaction: update demande + update stock garage
    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la demande
      await tx.demandeRechargement.update({
        where: { id: data.demandeId },
        data: {
          statut: "LIVREE",
          quantiteLivree: new Decimal(data.quantiteLivree),
          receptionneParId: session.userId,
          receptionneLe: new Date(),
        },
      });

      // 2. Augmenter le stock du garage
      const nouveauStock = (demande.garage.stockActuel || new Decimal(0)).plus(
        data.quantiteLivree
      );

      await tx.lieuStockage.update({
        where: { id: demande.garageId },
        data: { stockActuel: nouveauStock },
      });
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRechargement",
        entiteId: data.demandeId,
        action: "RECEPTION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          reference: demande.reference,
          quantiteLivree: data.quantiteLivree,
        },
        commentaire: `Rechargement réceptionné: ${data.quantiteLivree} L`,
      },
    });

    revalidatePath("/assistanat/carburant");
    return { success: true };
  }
);

/**
 * M16 L2 — Lister les demandes de rechargement (pagination serveur)
 */
export const listerDemandesRechargement = actionProtegee(
  PERMISSIONS["carburant:reapprovisionner"].code,
  async (
    session,
    {
      page = 1,
      limit = 25,
      statut,
    }: {
      page?: number;
      limit?: number;
      statut?: string;
    }
  ) => {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statut) where.statut = statut;

    const [demandes, total] = await Promise.all([
      prisma.demandeRechargement.findMany({
        where,
        include: {
          demandeur: { select: { nom: true, prenom: true } },
          garage: { select: { libelle: true } },
          projet: { select: { code: true, nom: true } },
        },
        orderBy: { creeLe: "desc" },
        skip,
        take: limit,
      }),
      prisma.demandeRechargement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { demandes, total, totalPages, currentPage: page };
  }
);

/**
 * M16 L2 — Lister les garages avec infos carburant
 */
export const listerGarages = actionProtegee(
  PERMISSIONS["carburant:consulter"].code,
  async (session) => {
    const garages = await prisma.lieuStockage.findMany({
      where: {
        actif: true,
        nature: "GARAGE",
      },
      include: {
        responsable: { select: { nom: true, prenom: true } },
      },
      orderBy: { libelle: "asc" },
    });

    // Calculer alerte seuil pour chaque garage (D-07)
    const garagesAvecAlertes = garages.map((garage) => {
      const alerteSeuil =
        garage.capaciteCarburant &&
        garage.stockActuel &&
        garage.seuilAlerte
          ? garage.stockActuel.lessThan(
              garage.capaciteCarburant.times(garage.seuilAlerte).dividedBy(100)
            )
          : false;

      return {
        ...garage,
        alerteSeuil,
        stockActuel: garage.stockActuel?.toNumber() || 0,
        capaciteCarburant: garage.capaciteCarburant?.toNumber() || 0,
      };
    });

    return { garages: garagesAvecAlertes };
  }
);

/**
 * M16 L2 — Lister les anomalies de consommation
 * Calcule pour tous les véhicules et retourne ceux avec écart > 15%
 */
export const listerAnomalies = actionProtegee(
  PERMISSIONS["carburant:consulter"].code,
  async (session) => {
    // Récupérer tous les matériels avec au moins 2 distributions
    const materielsAvecDistributions = await prisma.materiel.findMany({
      where: {
        distributionsCarburant: {
          some: {},
        },
      },
      select: {
        id: true,
        codeIta: true,
        designation: true,
      },
    });

    const anomalies = [];

    for (const materiel of materielsAvecDistributions) {
      // Calculer la consommation pour ce matériel (appel interne)
      // Réutiliser la logique sans passer par l'action protégée
      const distributions = await prisma.distributionCarburant.findMany({
        where: {
          materielId: materiel.id,
          compteurAnomalie: false,
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

      if (distributions.length < 2) continue;

      const pleinsComplets = distributions.filter((d) => d.pleinComplet);
      if (pleinsComplets.length < 2) continue;

      // Calculer consommation pour le dernier intervalle
      const debut = pleinsComplets[pleinsComplets.length - 2];
      const fin = pleinsComplets[pleinsComplets.length - 1];

      const distsDansIntervalle = distributions.filter(
        (d) =>
          d.dateDistribution >= debut.dateDistribution &&
          d.dateDistribution < fin.dateDistribution
      );

      const aAnomalie = distsDansIntervalle.some((d) => d.compteurAnomalie);
      if (aAnomalie) continue;

      const litres = distsDansIntervalle.reduce(
        (sum, d) => sum.plus(d.quantite),
        new Decimal(0)
      );

      const distanceParcourue = fin.compteur.minus(debut.compteur);

      let consommation: Decimal;
      if (debut.uniteCompteur === "KILOMETRE") {
        consommation = litres.dividedBy(distanceParcourue).times(100);
      } else {
        consommation = litres.dividedBy(distanceParcourue);
      }

      // Calculer moyenne sur tous les intervalles
      const intervalles = [];
      for (let i = 0; i < pleinsComplets.length - 1; i++) {
        const d = pleinsComplets[i];
        const f = pleinsComplets[i + 1];

        const dists = distributions.filter(
          (di) =>
            di.dateDistribution >= d.dateDistribution &&
            di.dateDistribution < f.dateDistribution
        );

        if (dists.some((di) => di.compteurAnomalie)) continue;

        const l = dists.reduce((sum, di) => sum.plus(di.quantite), new Decimal(0));
        const dist = f.compteur.minus(d.compteur);

        let conso: Decimal;
        if (d.uniteCompteur === "KILOMETRE") {
          conso = l.dividedBy(dist).times(100);
        } else {
          conso = l.dividedBy(dist);
        }

        intervalles.push(conso.toNumber());
      }

      if (intervalles.length === 0) continue;

      const moyenneConsommation =
        intervalles.reduce((sum, i) => sum + i, 0) / intervalles.length;

      const ecartPourcent =
        ((consommation.toNumber() - moyenneConsommation) / moyenneConsommation) * 100;

      const result = {
        type: "CALCULE" as const,
        moyenneConsommation,
        dernierCalcul: consommation.toNumber(),
        ecartPourcent,
        unite: debut.uniteCompteur === "KILOMETRE" ? "L/100km" : "L/h",
        dernierPlein: fin.dateDistribution,
      };

      if (result.type === "CALCULE" && result.ecartPourcent !== undefined && Math.abs(result.ecartPourcent) > 15) {
        anomalies.push({
          materiel: {
            id: materiel.id,
            code: materiel.codeIta,
            designation: materiel.designation,
          },
          consommationMoyenne: result.moyenneConsommation || 0,
          dernierCalcul: result.dernierCalcul || 0,
          ecartPourcent: result.ecartPourcent,
          unite: result.unite || "",
          dernierPlein: result.dernierPlein,
        });
      }
    }

    // Trier par écart décroissant
    anomalies.sort((a, b) => Math.abs(b.ecartPourcent) - Math.abs(a.ecartPourcent));

    return { anomalies };
  }
);
