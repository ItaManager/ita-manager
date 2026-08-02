"use server";

/**
 * Server Actions — Logistique (M13)
 *
 * M13 §3 : Registre matériel avec pagination serveur
 * E-01 : Pagination serveur, 25 lignes, état dans l'URL
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, verifierPermission, PERMISSIONS } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { genererCode, validerFormat, type ResultatGeneration } from "@/lib/logistique/code";
import { calculerEtatPiece } from "@/lib/logistique/echeances";
import { Prisma, type TypeMateriel, type StatutMateriel } from "@prisma/client";

// =====================================================================
// M13 L1 — REGISTRE MATÉRIEL
// =====================================================================

export type MaterielRegistreItem = {
  id: string;
  codeIta: string;
  numeroParcAncien: string | null;
  codeLong: string | null;
  designation: string;
  famille: {
    code: string;
    libelle: string;
  };
  type: TypeMateriel;
  statut: StatutMateriel;
  lieuBase: {
    libelle: string;
  } | null;
  // Coûts masqués si pas la permission
  coutAcquisition: number | null;
};

export type ResultatListeMateriel = {
  items: MaterielRegistreItem[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
};

/**
 * Lister le registre matériel avec pagination et recherche
 *
 * M13 L1 — Registre matériel (étape 3)
 * - Pagination serveur 25 lignes
 * - Recherche sur les trois codes
 * - Coûts masqués sans materiel:coutsAdministratifs
 */
export const listerMaterielM13 = actionProtegee(
  "materiel:lire",
  async (
    session,
    params: {
      page?: number;
      recherche?: string; // Recherche sur les 3 codes
    } = {}
  ): Promise<ResultatListeMateriel> => {
    const page = params.page || 1;
    const perPage = 25; // E-01 : 25 lignes
    const skip = (page - 1) * perPage;

    // Vérifier permission pour les coûts
    const peutVoirCouts = await verifierPermission(
      session.userId,
      "materiel:coutsAdministratifs"
    );

    // Construire le where pour la recherche
    const where: any = {};
    if (params.recherche && params.recherche.trim()) {
      const rechercheTrimmed = params.recherche.trim();
      where.OR = [
        { codeIta: { contains: rechercheTrimmed, mode: "insensitive" } },
        {
          numeroParcAncien: {
            contains: rechercheTrimmed,
            mode: "insensitive",
          },
        },
        { codeLong: { contains: rechercheTrimmed, mode: "insensitive" } },
      ];
    }

    // Compter le total
    const total = await prisma.materiel.count({ where });

    // Récupérer les items
    const materiel = await prisma.materiel.findMany({
      where,
      select: {
        id: true,
        codeIta: true,
        numeroParcAncien: true,
        codeLong: true,
        designation: true,
        famille: {
          select: {
            code: true,
            libelle: true,
          },
        },
        type: true,
        statut: true,
        lieuBase: {
          select: {
            libelle: true,
          },
        },
        coutAcquisition: peutVoirCouts,
      },
      orderBy: [{ codeIta: "asc" }],
      skip,
      take: perPage,
    });

    const items: MaterielRegistreItem[] = materiel.map((m) => ({
      id: m.id,
      codeIta: m.codeIta,
      numeroParcAncien: m.numeroParcAncien,
      codeLong: m.codeLong,
      designation: m.designation,
      famille: m.famille,
      type: m.type,
      statut: m.statut,
      lieuBase: m.lieuBase,
      coutAcquisition: peutVoirCouts && m.coutAcquisition ? m.coutAcquisition.toNumber() : null,
    }));

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      perPage,
    };
  }
);

/**
 * Vérifier si un code matériel existe déjà
 *
 * M13 L1 — Contrôle 1 décision 1.1
 */
export const verifierCodeExistant = actionProtegee(
  "materiel:creer",
  async (
    session,
    codeIta: string
  ): Promise<{ existe: boolean; materiel?: { designation: string } }> => {
    const materiel = await prisma.materiel.findUnique({
      where: { codeIta },
      select: { designation: true },
    });

    return {
      existe: !!materiel,
      materiel: materiel || undefined,
    };
  }
);

/**
 * Générer un nouveau code pour une famille
 *
 * M13 L1 — Génération code avec format flexible
 */
export const genererCodeMateriel = actionProtegee(
  "materiel:creer",
  async (
    session,
    params: {
      familleId: string;
      dateAcquisition?: Date;
    }
  ): Promise<ResultatGeneration> => {
    const famille = await prisma.familleMateriel.findUnique({
      where: { id: params.familleId },
      select: {
        code: true,
        formatCode: true,
        prochainNumero: true,
      },
    });

    if (!famille) {
      throw new Error("Famille introuvable");
    }

    const annee = params.dateAcquisition
      ? params.dateAcquisition.getFullYear()
      : undefined;

    return genererCode(famille, annee);
  }
);

/**
 * Vérifier si un code correspond au format de sa famille
 *
 * M13 L1 — Contrôle 2 décision 1.1 (warning, non bloquant)
 */
export const verifierFormatCode = actionProtegee(
  "materiel:creer",
  async (
    session,
    params: {
      codeIta: string;
      familleId: string;
    }
  ): Promise<{ conforme: boolean; message?: string }> => {
    const famille = await prisma.familleMateriel.findUnique({
      where: { id: params.familleId },
      select: { code: true, formatCode: true },
    });

    if (!famille) {
      return { conforme: false, message: "Famille introuvable" };
    }

    // Construire regex depuis formatCode
    // {FAMILLE}{SEQ:3} → AK-VL\d{3}
    // {FAMILLE}{SEQ:2}-{ANNEE} → AK-BUL\d{2}-\d{4}
    let regex = famille.formatCode
      .replace(/{FAMILLE}/g, famille.code)
      .replace(/{SEQ:(\d+)}/g, (_, digits) => `\\d{${digits}}`)
      .replace(/{ANNEE}/g, "\\d{4}");

    const pattern = new RegExp(`^${regex}$`);
    const conforme = pattern.test(params.codeIta);

    if (!conforme) {
      return {
        conforme: false,
        message: `Ce code ne suit pas le format ${famille.formatCode.replace(/{FAMILLE}/g, famille.code)} de la famille. Il sera enregistré tel quel.`,
      };
    }

    return { conforme: true };
  }
);

/**
 * Créer un matériel
 *
 * M13 L1 — Création avec contrôles décision 1.1
 */
export const creerMateriel = actionProtegee(
  "materiel:creer",
  async (
    session,
    donnees: {
      codeIta: string;
      designation: string;
      familleId: string;
      type: TypeMateriel;
      statut: StatutMateriel;
      partageable: boolean;
      lieuBaseId?: string;
      numeroParcAncien?: string;
      codeLong?: string;
      numeroSerie?: string;
      marque?: string;
      modele?: string;
      dateAcquisition?: Date;
      coutAcquisition?: number;
    }
  ) => {
    // Contrôle 1 : Code déjà pris
    const existant = await prisma.materiel.findUnique({
      where: { codeIta: donnees.codeIta },
      select: { designation: true },
    });

    if (existant) {
      throw new Error(
        `Le code ${donnees.codeIta} est déjà utilisé par : ${existant.designation}`
      );
    }

    // Contrôle 2 : Code hors format (warning, non bloquant)
    // Décision 1.1 : avertir si le code ne suit pas le format attendu
    // Permet d'importer A10CI1 tout en signalant l'écart

    // Créer le matériel
    const materiel = await prisma.materiel.create({
      data: {
        codeIta: donnees.codeIta,
        designation: donnees.designation,
        familleId: donnees.familleId,
        type: donnees.type,
        statut: donnees.statut,
        lieuBaseId: donnees.lieuBaseId,
        numeroParcAncien: donnees.numeroParcAncien,
        codeLong: donnees.codeLong,
        numeroSerie: donnees.numeroSerie,
        marque: donnees.marque,
        modele: donnees.modele,
        dateAcquisition: donnees.dateAcquisition,
        coutAcquisition: donnees.coutAcquisition
          ? new Prisma.Decimal(donnees.coutAcquisition)
          : undefined,
        partageable: donnees.partageable,
      },
      include: {
        famille: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Materiel",
        entiteId: materiel.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Matériel créé : ${materiel.codeIta} - ${materiel.designation}`,
      },
    });

    revalidatePath("/ressources");
    return materiel;
  }
);

// =====================================================================
// M13 L1 — ÉCHÉANCES PIÈCES ADMINISTRATIVES
// =====================================================================

export type PieceEcheance = {
  id: string;
  materiel: {
    id: string;
    codeIta: string;
    designation: string;
    type: TypeMateriel;
    lieuBase: {
      libelle: string;
    } | null;
  };
  type: {
    libelle: string;
    delaiAlerteJours: number;
  };
  numero: string | null;
  emetteur: string | null;
  dateEdition: Date;
  dateExpiration: Date;
};

/**
 * Lister les échéances pièces administratives
 *
 * M13 L1 — Étape 4
 * - État CALCULÉ depuis dateExpiration et delaiAlerteJours du type
 * - Tri : périmés (plus ancien), alertes (plus proche), valides
 * - Filtres : type pièce, type matériel, état, lieu
 */
export const listerEcheances = actionProtegee(
  "materiel:lire",
  async (
    session,
    params: {
      typePieceId?: string;
      typeMateriel?: TypeMateriel;
      lieu?: string;
      etat?: 'PERIME' | 'EN_ALERTE' | 'VALIDE';
    } = {}
  ): Promise<PieceEcheance[]> => {
    // Construire le where pour les filtres
    const where: any = {};

    if (params.typePieceId) {
      where.typeId = params.typePieceId;
    }

    if (params.typeMateriel) {
      where.materiel = { type: params.typeMateriel };
    }

    if (params.lieu) {
      where.materiel = {
        ...where.materiel,
        lieuBase: { libelle: params.lieu },
      };
    }

    // Récupérer toutes les pièces (le filtre par état se fera en mémoire)
    const pieces = await prisma.pieceAdministrative.findMany({
      where,
      select: {
        id: true,
        numero: true,
        emetteur: true,
        dateEdition: true,
        dateExpiration: true,
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
            type: true,
            lieuBase: {
              select: {
                libelle: true,
              },
            },
          },
        },
        type: {
          select: {
            libelle: true,
            delaiAlerteJours: true,
          },
        },
      },
    });

    return pieces;
  }
);

// =====================================================================
// M13 L1 — TABLEAU PIÈCES ADMINISTRATIVES
// =====================================================================

export type CellulePiece = {
  applicable: boolean; // false = "s.o."
  piece?: {
    id: string;
    numero: string | null;
    emetteur: string | null;
    dateExpiration: Date;
    montant: number | null;
  };
  etat?: 'PERIME' | 'EN_ALERTE' | 'VALIDE'; // absent si !piece
  libelle?: string; // absent si !piece
};

export type LigneTableauPieces = {
  materiel: {
    id: string;
    codeIta: string;
    designation: string;
    type: TypeMateriel;
  };
  pieces: Record<string, CellulePiece>; // typeId → cellule
  totalAnnuel: number | null; // null si pas permission
};

export type TypeColonne = {
  id: string;
  libelle: string;
  ordreAffichage: number;
};

/**
 * Tableau croisé matériels × types de pièces
 *
 * M13 L1 — Étape 5 (§6.3)
 * - Colonnes adaptatives selon types applicables
 * - 5 états par cellule : valide, alerte, périmé, —, s.o.
 * - Total annuel masqué sans permission
 */
export const listerTableauPieces = actionProtegee(
  "materiel:lire",
  async (
    session,
    params: {
      typeMateriel?: TypeMateriel;
      lieu?: string;
      recherche?: string;
    } = {}
  ): Promise<{
    lignes: LigneTableauPieces[];
    colonnes: TypeColonne[];
  }> => {
    // Vérifier permission pour les coûts
    const peutVoirCouts = await verifierPermission(
      session.userId,
      "materiel:coutsAdministratifs"
    );

    // Construire le where pour les matériels
    const whereMateriel: any = {};
    if (params.typeMateriel) {
      whereMateriel.type = params.typeMateriel;
    }
    if (params.lieu) {
      whereMateriel.lieuBase = { libelle: params.lieu };
    }

    // Recherche sur code, désignation, immatriculation, lieu
    if (params.recherche) {
      const rechercheNormalisee = params.recherche.toLowerCase();
      whereMateriel.OR = [
        { codeIta: { contains: rechercheNormalisee, mode: 'insensitive' } },
        { designation: { contains: rechercheNormalisee, mode: 'insensitive' } },
        { immatriculation: { contains: rechercheNormalisee, mode: 'insensitive' } },
        { lieuBase: { libelle: { contains: rechercheNormalisee, mode: 'insensitive' } } },
      ];
    }

    // Récupérer les matériels
    const materiels = await prisma.materiel.findMany({
      where: whereMateriel,
      select: {
        id: true,
        codeIta: true,
        designation: true,
        type: true,
      },
      orderBy: {
        codeIta: 'asc',
      },
    });

    // Récupérer les pièces pour tous les matériels
    const pieces = await prisma.pieceAdministrative.findMany({
      where: {
        materielId: {
          in: materiels.map((m) => m.id),
        },
      },
      select: {
        id: true,
        materielId: true,
        typeId: true,
        numero: true,
        emetteur: true,
        dateExpiration: true,
        montant: true,
        type: {
          select: {
            delaiAlerteJours: true,
          },
        },
      },
      orderBy: {
        dateExpiration: 'desc',
      },
    });

    // Grouper les pièces par matériel
    const piecesParMateriel = materiels.map((materiel) => ({
      ...materiel,
      pieces: pieces.filter((p) => p.materielId === materiel.id),
    }));

    // Déterminer les types TypeMateriel présents
    const typesPresents = Array.from(
      new Set(materiels.map((m) => m.type))
    );

    // Récupérer les types de pièce actifs applicables
    const typesPiece = await prisma.typePieceAdministrative.findMany({
      where: { actif: true },
      select: {
        id: true,
        libelle: true,
        ordreAffichage: true,
        typesMateriel: true, // JSON array
      },
      orderBy: {
        ordreAffichage: 'asc',
      },
    });

    // Filtrer les types applicables aux matériels affichés
    const typesApplicables = typesPiece.filter((type) => {
      const typesMaterielArray = JSON.parse(type.typesMateriel) as string[];
      // Si vide → applicable à tous
      if (typesMaterielArray.length === 0) return true;
      // Sinon → au moins un type présent dans les matériels
      return typesPresents.some((t) => typesMaterielArray.includes(t));
    });

    const colonnes: TypeColonne[] = typesApplicables.map((t) => ({
      id: t.id,
      libelle: t.libelle,
      ordreAffichage: t.ordreAffichage,
    }));

    // Construire les lignes
    const lignes: LigneTableauPieces[] = piecesParMateriel.map((materiel) => {
      const pieces: Record<string, CellulePiece> = {};
      let totalAnnuel = 0;

      for (const typeCol of typesApplicables) {
        const typesMaterielArray = JSON.parse(typeCol.typesMateriel) as string[];
        const applicable =
          typesMaterielArray.length === 0 ||
          typesMaterielArray.includes(materiel.type);

        if (!applicable) {
          pieces[typeCol.id] = { applicable: false };
          continue;
        }

        // Chercher la pièce la plus récente pour ce type
        const pieceRecente = materiel.pieces.find(
          (p) => p.typeId === typeCol.id
        );

        if (!pieceRecente) {
          pieces[typeCol.id] = { applicable: true }; // — (applicable non renseignée)
          continue;
        }

        // Calculer l'état
        const infoEtat = calculerEtatPiece(
          pieceRecente.dateExpiration,
          pieceRecente.type.delaiAlerteJours
        );

        pieces[typeCol.id] = {
          applicable: true,
          piece: {
            id: pieceRecente.id,
            numero: pieceRecente.numero,
            emetteur: pieceRecente.emetteur,
            dateExpiration: pieceRecente.dateExpiration,
            montant: pieceRecente.montant
              ? pieceRecente.montant.toNumber()
              : null,
          },
          etat: infoEtat.etat,
          libelle: infoEtat.libelle,
        };

        // Ajouter au total annuel si valide
        if (
          infoEtat.etat === 'VALIDE' &&
          pieceRecente.montant &&
          peutVoirCouts
        ) {
          totalAnnuel += pieceRecente.montant.toNumber();
        }
      }

      return {
        materiel: {
          id: materiel.id,
          codeIta: materiel.codeIta,
          designation: materiel.designation,
          type: materiel.type,
        },
        pieces,
        totalAnnuel: peutVoirCouts ? totalAnnuel : null,
      };
    });

    return {
      lignes,
      colonnes,
    };
  }
);

/**
 * Consulter les détails d'une pièce administrative
 *
 * Retourne la pièce avec sa chaîne de renouvellement (pieces précédentes)
 * et le type de pièce complet.
 */
export type PieceDetaillee = {
  id: string;
  numero: string;
  emetteur: string;
  dateEdition: Date;
  dateExpiration: Date;
  montant: number | null;
  etat: "VALIDE" | "EN_ALERTE" | "PERIME";
  libelle: string;
  materiel: {
    id: string;
    codeIta: string;
    designation: string;
    lieuBase: string | null;
  };
  type: {
    id: string;
    libelle: string;
    delaiAlerteJours: number;
    periodiciteMois: number | null;
    bloquante: boolean;
    ordreAffichage: number;
    typesMateriel: string[];
  };
  renouvellementDe: {
    id: string;
    numero: string;
    dateExpiration: Date;
  } | null;
  renouvellements: Array<{
    id: string;
    numero: string;
    dateExpiration: Date;
  }>;
};

export const consulterPieceAdministrative = actionProtegee(
  "materiel:lire",
  async (session, pieceId: string): Promise<PieceDetaillee> => {
    const piece = await prisma.pieceAdministrative.findUnique({
      where: { id: pieceId },
      select: {
        id: true,
        numero: true,
        emetteur: true,
        dateEdition: true,
        dateExpiration: true,
        montant: true,
        materiel: {
          select: {
            id: true,
            codeIta: true,
            designation: true,
            lieuBase: {
              select: {
                libelle: true,
              },
            },
          },
        },
        type: {
          select: {
            id: true,
            libelle: true,
            delaiAlerteJours: true,
            periodiciteMois: true,
            bloquante: true,
            ordreAffichage: true,
            typesMateriel: true,
          },
        },
        renouvellementDe: {
          select: {
            id: true,
            numero: true,
            dateExpiration: true,
          },
        },
        renouvellements: {
          select: {
            id: true,
            numero: true,
            dateExpiration: true,
          },
          orderBy: {
            dateExpiration: 'asc',
          },
        },
      },
    });

    if (!piece) {
      throw new Error("Pièce administrative introuvable");
    }

    // Vérifier permission pour les coûts
    const peutVoirCouts = await verifierPermission(
      session.userId,
      "materiel:coutsAdministratifs"
    );

    // Calculer l'état
    const infoEtat = calculerEtatPiece(
      piece.dateExpiration,
      piece.type.delaiAlerteJours
    );

    return {
      id: piece.id,
      numero: piece.numero,
      emetteur: piece.emetteur,
      dateEdition: piece.dateEdition,
      dateExpiration: piece.dateExpiration,
      montant: peutVoirCouts && piece.montant ? piece.montant.toNumber() : null,
      etat: infoEtat.etat,
      libelle: infoEtat.libelle,
      materiel: {
        id: piece.materiel.id,
        codeIta: piece.materiel.codeIta,
        designation: piece.materiel.designation,
        lieuBase: piece.materiel.lieuBase?.libelle || null,
      },
      type: {
        id: piece.type.id,
        libelle: piece.type.libelle,
        delaiAlerteJours: piece.type.delaiAlerteJours,
        periodiciteMois: piece.type.periodiciteMois,
        bloquante: piece.type.bloquante,
        ordreAffichage: piece.type.ordreAffichage,
        typesMateriel: JSON.parse(piece.type.typesMateriel) as string[],
      },
      renouvellementDe: piece.renouvellementDe,
      renouvellements: piece.renouvellements,
    };
  }
);

/**
 * Renouveler une pièce administrative
 *
 * Crée une nouvelle pièce administrative en renouvellement de la pièce actuelle.
 * Propose automatiquement la date d'expiration basée sur periodiciteMois.
 */
export const renouvelerPieceAdministrative = actionProtegee(
  "materiel:creer",
  async (
    session,
    pieceId: string,
    donnees: {
      numero: string;
      emetteur: string;
      dateEdition: Date;
      dateExpiration: Date;
      montant?: number;
    }
  ): Promise<{ id: string }> => {
    // Récupérer la pièce originale
    const pieceOriginale = await prisma.pieceAdministrative.findUnique({
      where: { id: pieceId },
      select: {
        materielId: true,
        typeId: true,
      },
    });

    if (!pieceOriginale) {
      throw new Error("Pièce administrative introuvable");
    }

    // Créer la nouvelle pièce
    const nouvellePiece = await prisma.pieceAdministrative.create({
      data: {
        numero: donnees.numero,
        emetteur: donnees.emetteur,
        dateEdition: donnees.dateEdition,
        dateExpiration: donnees.dateExpiration,
        montant: donnees.montant,
        materielId: pieceOriginale.materielId,
        typeId: pieceOriginale.typeId,
        renouvellementDeId: pieceId,
      },
      select: {
        id: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PieceAdministrative",
        entiteId: nouvellePiece.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Renouvellement de pièce ${donnees.numero}`,
      },
    });

    revalidatePath("/ressources/pieces");

    return { id: nouvellePiece.id };
  }
);
