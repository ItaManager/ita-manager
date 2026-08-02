"use server";

/**
 * M13 L2 — Server Actions : Inspections matériel
 *
 * Fonctionnalités :
 * - Créer une inspection (ENTREE ou SORTIE)
 * - Enregistrer les points de contrôle (PHYSIQUE, DOCUMENT, EQUIPEMENT)
 * - Relever le compteur kilométrique/horaire
 * - Consulter l'historique des inspections
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS } from "@/lib/auth/guard";
import { Decimal } from "@prisma/client/runtime/library";
import type {
  MomentInspection,
  NiveauCarburant,
  EtatPoint,
  GrilleInspection,
} from "@prisma/client";

// ========== Types ==========

type InspectionInput = {
  materielId: string;
  moment: MomentInspection;
  mouvementId?: string;
  demandeTransportId?: string;
  lieuId: string;
  provenance?: string;
  destination?: string;
  compteur?: number;
  niveauCarburant?: NiveauCarburant;
  conducteurId?: string;
  conducteurNom?: string;
  transporteur?: string;
  etatGeneral: EtatPoint;
  observations?: string;
};

type LigneInspectionInput = {
  pointId: string;
  etat: EtatPoint;
  observation?: string;
  photoId?: string;
};

type ReleveCompteurInput = {
  materielId: string;
  valeur: number;
  unite: "KILOMETRE" | "HEURE";
  releveLe: Date;
  source: "INSPECTION" | "SAISIE_GARAGE" | "RELEVE_ACTIVITE";
  inspectionId?: string;
  anomalie?: boolean;
};

// ========== Points d'inspection ==========

/**
 * Lister les points d'inspection actifs par grille
 */
export const listerPointsInspection = actionProtegee(
  PERMISSIONS["materiel:inspecter"].code,
  async (_session, grille?: GrilleInspection, typeMateriel?: string) => {
    const where = {
      actif: true,
      ...(grille && { grille }),
      ...(typeMateriel && {
        typesMateriel: {
          contains: typeMateriel,
        },
      }),
    };

    const points = await prisma.pointInspection.findMany({
      where,
      orderBy: [{ grille: "asc" }, { ordre: "asc" }],
    });

    return { points };
  },
);

/**
 * Créer un point d'inspection personnalisé
 */
export const creerPointInspection = actionProtegee(
  PERMISSIONS["logistique:parametres"].code,
  async (session, libelle: string, grille: GrilleInspection, typesMateriel: string[]) => {
    // Vérifier unicité du libellé
    const existant = await prisma.pointInspection.findUnique({
      where: { libelle },
    });

    if (existant) {
      return {
        success: false,
        error: "Un point d'inspection avec ce libellé existe déjà",
      };
    }

    // Obtenir l'ordre max pour cette grille
    const maxOrdre = await prisma.pointInspection.findFirst({
      where: { grille },
      orderBy: { ordre: "desc" },
      select: { ordre: true },
    });

    const point = await prisma.pointInspection.create({
      data: {
        libelle,
        grille,
        typesMateriel: JSON.stringify(typesMateriel),
        ordre: (maxOrdre?.ordre ?? 0) + 1,
        actif: true,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "PointInspection",
        entiteId: point.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Point d'inspection créé : ${libelle} (${grille})`,
      },
    });

    return { success: true, pointId: point.id };
  },
);

// ========== Inspections ==========

/**
 * Créer une nouvelle inspection
 */
export const creerInspection = actionProtegee(
  PERMISSIONS["materiel:inspecter"].code,
  async (session, input: InspectionInput, lignes: LigneInspectionInput[]) => {
    // Vérifier que le matériel existe
    const materiel = await prisma.materiel.findUnique({
      where: { id: input.materielId },
      select: { codeIta: true, designation: true },
    });

    if (!materiel) {
      return { success: false, error: "Matériel non trouvé" };
    }

    // Créer l'inspection
    const inspection = await prisma.inspection.create({
      data: {
        materielId: input.materielId,
        moment: input.moment,
        mouvementId: input.mouvementId,
        demandeTransportId: input.demandeTransportId,
        dateHeure: new Date(),
        lieuId: input.lieuId,
        provenance: input.provenance,
        destination: input.destination,
        compteur: input.compteur ? new Decimal(input.compteur) : null,
        niveauCarburant: input.niveauCarburant,
        conducteurId: input.conducteurId,
        conducteurNom: input.conducteurNom,
        transporteur: input.transporteur,
        verificateurId: session.userId,
        verificateurNom: session.email,
        etatGeneral: input.etatGeneral,
        observations: input.observations,
      },
    });

    // Créer les lignes d'inspection
    for (const ligne of lignes) {
      await prisma.ligneInspection.create({
        data: {
          inspectionId: inspection.id,
          pointId: ligne.pointId,
          etat: ligne.etat,
          observation: ligne.observation,
          photoId: ligne.photoId,
        },
      });
    }

    // Si un compteur est saisi, créer un relevé
    if (input.compteur) {
      // Déterminer l'unité selon le type de matériel
      // Par défaut KILOMETRE pour véhicules, HEURE pour engins
      const unite = "KILOMETRE"; // TODO : déterminer selon typeMateriel

      await prisma.releveCompteur.create({
        data: {
          materielId: input.materielId,
          valeur: new Decimal(input.compteur),
          unite,
          releveLe: new Date(),
          source: "INSPECTION",
          inspectionId: inspection.id,
          anomalie: false,
          releveParId: session.userId,
          releveParNom: session.email,
        },
      });
    }

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Inspection",
        entiteId: inspection.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          materiel: materiel.codeIta,
          moment: input.moment,
          etatGeneral: input.etatGeneral,
          pointsVerifies: lignes.length,
        },
        commentaire: `Inspection ${input.moment} de ${materiel.codeIta} — État général : ${input.etatGeneral}`,
      },
    });

    return { success: true, inspectionId: inspection.id };
  },
);

/**
 * Consulter une inspection avec ses lignes
 */
export const consulterInspection = actionProtegee(
  PERMISSIONS["materiel:inspecter"].code,
  async (_session, inspectionId: string) => {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        materiel: {
          select: { codeIta: true, designation: true },
        },
        lieu: {
          select: { libelle: true },
        },
        lignes: {
          include: {
            point: {
              select: { libelle: true, grille: true },
            },
          },
          orderBy: { point: { ordre: "asc" } },
        },
      },
    });

    if (!inspection) {
      return { success: false, error: "Inspection non trouvée" };
    }

    return { success: true, inspection };
  },
);

/**
 * Lister les inspections avec pagination
 */
export const listerInspections = actionProtegee(
  PERMISSIONS["materiel:inspecter"].code,
  async (
    _session,
    page: number = 1,
    materielId?: string,
    moment?: MomentInspection,
    lieuId?: string,
  ) => {
    const limite = 25;
    const offset = (page - 1) * limite;

    const where = {
      ...(materielId && { materielId }),
      ...(moment && { moment }),
      ...(lieuId && { lieuId }),
    };

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          materiel: { select: { codeIta: true, designation: true } },
          lieu: { select: { libelle: true } },
        },
        orderBy: { dateHeure: "desc" },
        skip: offset,
        take: limite,
      }),
      prisma.inspection.count({ where }),
    ]);

    return {
      inspections,
      total,
      pages: Math.ceil(total / limite),
      page,
    };
  },
);

// ========== Relevés de compteur ==========

/**
 * Enregistrer un relevé de compteur manuel
 */
export const enregistrerReleveCompteur = actionProtegee(
  PERMISSIONS["materiel:inspecter"].code,
  async (session, input: ReleveCompteurInput) => {
    // Récupérer le dernier relevé pour détecter les anomalies
    const dernierReleve = await prisma.releveCompteur.findFirst({
      where: {
        materielId: input.materielId,
        unite: input.unite,
      },
      orderBy: { releveLe: "desc" },
    });

    let anomalie = false;
    if (dernierReleve) {
      const valeurActuelle = new Decimal(input.valeur);
      // Anomalie si le compteur a diminué (sauf si explicitement marqué comme anomalie)
      if (valeurActuelle.lessThan(dernierReleve.valeur) && !input.anomalie) {
        anomalie = true;
      }
    }

    const releve = await prisma.releveCompteur.create({
      data: {
        materielId: input.materielId,
        valeur: new Decimal(input.valeur),
        unite: input.unite,
        releveLe: input.releveLe,
        source: input.source,
        inspectionId: input.inspectionId,
        anomalie: input.anomalie ?? anomalie,
        releveParId: session.userId,
        releveParNom: session.email,
      },
    });

    if (anomalie) {
      await prisma.journalEvenement.create({
        data: {
          entite: "ReleveCompteur",
          entiteId: releve.id,
          action: "ANOMALIE",
          auteurId: session.userId,
          auteurNom: session.email,
          details: {
            valeurActuelle: input.valeur,
            valeurPrecedente: dernierReleve?.valeur.toNumber(),
          },
          commentaire: `Anomalie compteur : valeur en baisse détectée`,
        },
      });
    }

    return { success: true, releveId: releve.id, anomalie };
  },
);

/**
 * Consulter l'historique des relevés de compteur
 */
export const historiqueCompteur = actionProtegee(
  PERMISSIONS["materiel:lire"].code,
  async (_session, materielId: string, limite: number = 50) => {
    const releves = await prisma.releveCompteur.findMany({
      where: { materielId },
      orderBy: { releveLe: "desc" },
      take: limite,
    });

    return { releves };
  },
);
