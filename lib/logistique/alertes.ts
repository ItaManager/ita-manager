/**
 * Détection des alertes pour pièces administratives M13 L1.4
 *
 * Alertes par courriel selon niveaux d'urgence (DECISIONS-M13.md §B-06) :
 * - CRITIQUE : périmé (relance 24h)
 * - HAUTE : expire dans 60 jours ou moins (relance 3 jours)
 */

import { prisma } from '@/lib/db/prisma';
import { calculerEtatPiece } from './echeances';
import type { EtatPiece } from './echeances';

export type NiveauUrgence = 'CRITIQUE' | 'HAUTE';

export type AlertePiece = {
  id: string;
  numero: string | null;
  dateExpiration: Date;
  etat: EtatPiece;
  libelle: string;
  joursRestants: number;
  urgence: NiveauUrgence;
  typePiece: {
    libelle: string;
    bloquante: boolean;
  };
  materiel: {
    id: string;
    codeIta: string;
    designation: string;
    type: string;
    lieuBase: string | null;
  };
};

/**
 * Détecter les pièces en alerte ou périmées
 *
 * Retourne uniquement les pièces avec état PERIME ou EN_ALERTE,
 * triées par urgence décroissante.
 */
export async function detecterAlertesPieces(): Promise<AlertePiece[]> {
  // Récupérer toutes les pièces actives avec leur type
  const pieces = await prisma.pieceAdministrative.findMany({
    where: {
      // Exclure les pièces remplacées (renouvele existe)
      renouvele: null,
    },
    select: {
      id: true,
      numero: true,
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
          bloquante: true,
        },
      },
    },
    orderBy: {
      dateExpiration: 'asc',
    },
  });

  // Calculer l'état de chaque pièce et filtrer
  const alertes: AlertePiece[] = [];
  const aujourdhui = new Date();

  for (const piece of pieces) {
    const infoEtat = calculerEtatPiece(
      piece.dateExpiration,
      piece.type.delaiAlerteJours,
      aujourdhui
    );

    // Ne garder que PERIME et EN_ALERTE
    if (infoEtat.etat !== 'PERIME' && infoEtat.etat !== 'EN_ALERTE') {
      continue;
    }

    // Déterminer le niveau d'urgence
    const urgence: NiveauUrgence =
      infoEtat.etat === 'PERIME' ? 'CRITIQUE' : 'HAUTE';

    alertes.push({
      id: piece.id,
      numero: piece.numero,
      dateExpiration: piece.dateExpiration,
      etat: infoEtat.etat,
      libelle: infoEtat.libelle,
      joursRestants: infoEtat.joursRestants,
      urgence,
      typePiece: {
        libelle: piece.type.libelle,
        bloquante: piece.type.bloquante,
      },
      materiel: {
        id: piece.materiel.id,
        codeIta: piece.materiel.codeIta,
        designation: piece.materiel.designation,
        type: piece.materiel.type,
        lieuBase: piece.materiel.lieuBase?.libelle || null,
      },
    });
  }

  // Trier par urgence : CRITIQUE d'abord, puis HAUTE
  // Puis par jours restants (plus ancien/proche d'abord)
  alertes.sort((a, b) => {
    if (a.urgence !== b.urgence) {
      return a.urgence === 'CRITIQUE' ? -1 : 1;
    }
    return a.joursRestants - b.joursRestants;
  });

  return alertes;
}

/**
 * Grouper les alertes par niveau d'urgence
 */
export function grouperAlertesParUrgence(alertes: AlertePiece[]): {
  critiques: AlertePiece[];
  hautes: AlertePiece[];
} {
  return {
    critiques: alertes.filter((a) => a.urgence === 'CRITIQUE'),
    hautes: alertes.filter((a) => a.urgence === 'HAUTE'),
  };
}
