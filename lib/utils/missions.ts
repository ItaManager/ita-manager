/**
 * lib/utils/missions.ts — M19 Missions et frais de mission
 *
 * RÈGLE CENTRALE : le statut se déduit, il ne se stocke pas.
 *
 * Onze états, tous calculés à partir des événements horodatés.
 * L'ordre des tests compte — voir M19-MISSIONS.md § 3.1.
 */

import type { Mission } from "@prisma/client";

export type StatutMission =
  | "BROUILLON"
  | "ATTENTE_N1"
  | "ATTENTE_RH"
  | "ATTENTE_AVANCE"
  | "APPROUVEE"
  | "EN_COURS"
  | "ATTENTE_RAPPORT"
  | "ATTENTE_CONTROLE"
  | "CLOTUREE"
  | "REFUSEE"
  | "ANNULEE";

/**
 * Déduit le statut d'une mission à partir de ses événements.
 *
 * @param m - Mission (incluant tous les champs d'événements)
 * @param aujourdhui - Date de référence (par défaut : maintenant)
 *
 * ATTENTION : L'ORDRE DES TESTS COMPTE.
 *
 * - Une mission annulée reste ANNULEE même si sa date de départ est passée.
 * - Une mission clôturée ne redevient jamais ATTENTE_RAPPORT.
 * - Une mission refusée ne change plus d'état.
 *
 * Les dates sont @db.Date (minuit UTC). La comparaison se fait sur les
 * dates civiles, pas sur les instants.
 */
export function statutMission(
  m: Mission,
  aujourdhui = new Date()
): StatutMission {
  // 1. États terminaux — ne changent plus
  if (m.annuleeLe) return "ANNULEE";
  if (m.refuseeLe) return "REFUSEE";
  if (m.clotureeLe) return "CLOTUREE";

  // 2. Après le retour
  if (m.rapportDeposeLe) return "ATTENTE_CONTROLE";

  // Comparaison de dates civiles — @db.Date stockées à minuit UTC
  const dateRetourCivile = new Date(m.dateRetour);
  dateRetourCivile.setUTCHours(0, 0, 0, 0);
  const aujourdhuiCivile = new Date(aujourdhui);
  aujourdhuiCivile.setUTCHours(0, 0, 0, 0);

  if (
    dateRetourCivile < aujourdhuiCivile &&
    !m.rapportDeposeLe
  ) {
    return "ATTENTE_RAPPORT";
  }

  // 3. Pendant la mission
  const dateDepartCivile = new Date(m.dateDepart);
  dateDepartCivile.setUTCHours(0, 0, 0, 0);

  if (
    dateDepartCivile <= aujourdhuiCivile &&
    aujourdhuiCivile <= dateRetourCivile
  ) {
    return "EN_COURS";
  }

  // 4. Avant le départ
  if (m.avanceVerseeLe) return "APPROUVEE";

  if (m.valideeRhLe) {
    // Si frais estimés > 0, il faut verser l'avance
    return m.fraisEstimes > 0 ? "ATTENTE_AVANCE" : "APPROUVEE";
  }

  if (m.viseeN1Le) return "ATTENTE_RH";
  if (m.soumiseLe) return "ATTENTE_N1";

  // 5. État initial
  return "BROUILLON";
}

/**
 * Libellé français du statut.
 */
export function libelleutMission(statut: StatutMission): string {
  switch (statut) {
    case "BROUILLON":
      return "Brouillon";
    case "ATTENTE_N1":
      return "En attente du visa N+1";
    case "ATTENTE_RH":
      return "En attente de validation RH";
    case "ATTENTE_AVANCE":
      return "En attente de versement de l'avance";
    case "APPROUVEE":
      return "Approuvée";
    case "EN_COURS":
      return "En cours";
    case "ATTENTE_RAPPORT":
      return "En attente de rapport";
    case "ATTENTE_CONTROLE":
      return "En attente de contrôle";
    case "CLOTUREE":
      return "Clôturée";
    case "REFUSEE":
      return "Refusée";
    case "ANNULEE":
      return "Annulée";
  }
}

/**
 * Couleur du badge de statut (classes Tailwind).
 */
export function couleurStatutMission(statut: StatutMission): string {
  switch (statut) {
    case "BROUILLON":
      return "bg-neutral-100 text-neutral-700";
    case "ATTENTE_N1":
    case "ATTENTE_RH":
    case "ATTENTE_AVANCE":
    case "ATTENTE_CONTROLE":
      return "bg-amber-100 text-amber-800";
    case "ATTENTE_RAPPORT":
      return "bg-orange-100 text-orange-800"; // Plus urgent
    case "APPROUVEE":
      return "bg-green-100 text-green-800";
    case "EN_COURS":
      return "bg-blue-100 text-blue-800";
    case "CLOTUREE":
      return "bg-neutral-100 text-neutral-700";
    case "REFUSEE":
      return "bg-red-100 text-red-800";
    case "ANNULEE":
      return "bg-neutral-100 text-neutral-600";
  }
}
