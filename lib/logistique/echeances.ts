/**
 * Calcul d'état des pièces administratives M13 L1
 *
 * RÈGLE CRUCIALE : L'état se CALCULE depuis dateExpiration et delaiAlerteJours
 * DU TYPE. Aucun champ etat en base.
 *
 * - Une assurance alerte à 60 jours
 * - Une visite technique à 45 jours
 * - Pas de seuil global
 */

import { formaterDateCivile, joursEntre } from '@/lib/dates';

export type EtatPiece = 'PERIME' | 'EN_ALERTE' | 'VALIDE';

export type InfoEtat = {
  etat: EtatPiece;
  libelle: string; // Libellé explicite — R-01
  joursRestants: number; // Négatif si périmé
  urgence: number; // Pour tri : plus petit = plus urgent
};

/**
 * Calculer l'état d'une pièce administrative
 *
 * @param dateExpiration Date d'expiration de la pièce (@db.Date stockée UTC)
 * @param delaiAlerteJours Délai d'alerte en jours du TYPE de pièce
 * @param aujourdhui Date de référence (par défaut : aujourd'hui)
 */
export function calculerEtatPiece(
  dateExpiration: Date,
  delaiAlerteJours: number,
  aujourdhui: Date = new Date()
): InfoEtat {
  // Calculer les jours restants avec comparaison de dates civiles UTC
  // Élimine le décalage d'un jour lié au fuseau horaire
  const joursRestants = joursEntre(aujourdhui, dateExpiration);

  // Déterminer l'état
  let etat: EtatPiece;
  let libelle: string;
  let urgence: number;

  if (joursRestants < 0) {
    // PÉRIMÉ
    etat = 'PERIME';
    const joursDepuis = Math.abs(joursRestants);
    libelle = `Expirait le ${formaterDateCivile(dateExpiration)} — périmé depuis ${joursDepuis} jour${joursDepuis > 1 ? 's' : ''}`;
    urgence = joursRestants; // Plus ancien = plus urgent (nombre négatif plus petit)
  } else if (joursRestants <= delaiAlerteJours) {
    // EN ALERTE
    etat = 'EN_ALERTE';
    libelle = `Expire le ${formaterDateCivile(dateExpiration)} — dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`;
    urgence = joursRestants; // Plus proche = plus urgent
  } else {
    // VALIDE
    etat = 'VALIDE';
    libelle = `Valide jusqu'au ${formaterDateCivile(dateExpiration)}`;
    urgence = joursRestants; // Plus lointain = moins urgent
  }

  return {
    etat,
    libelle,
    joursRestants,
    urgence,
  };
}

/**
 * Comparer deux pièces pour tri par urgence
 *
 * Ordre : périmés (plus ancien d'abord), alertes (plus proche d'abord), valides
 */
export function comparerUrgence(a: InfoEtat, b: InfoEtat): number {
  // Tri par etat d'abord (PERIME < EN_ALERTE < VALIDE)
  const ordreEtat = { PERIME: 0, EN_ALERTE: 1, VALIDE: 2 };
  const diffEtat = ordreEtat[a.etat] - ordreEtat[b.etat];

  if (diffEtat !== 0) return diffEtat;

  // Même état : tri par urgence (plus petit = plus urgent)
  return a.urgence - b.urgence;
}
