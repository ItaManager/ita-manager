/**
 * Permissions M15 — ItaPay
 *
 * Module d'exécution des paiements via Wave.
 * Séparation stricte : préparer ≠ autoriser ≠ exécuter.
 */

export const PERMISSIONS_M15 = {
  PAIEMENT_CONSULTER: {
    code: 'paiement:consulter',
    libelle: 'Consulter les paiements',
    domaine: 'PAIEMENT',
  },
  PAIEMENT_PREPARER: {
    code: 'paiement:preparer',
    libelle: 'Préparer une demande de paiement',
    domaine: 'PAIEMENT',
  },
  PAIEMENT_AUTORISER: {
    code: 'paiement:autoriser',
    libelle: 'Autoriser un paiement',
    domaine: 'PAIEMENT',
  },
  PAIEMENT_EXECUTER: {
    code: 'paiement:executer',
    libelle: 'Exécuter un paiement',
    domaine: 'PAIEMENT',
  },
  PAIEMENT_ANNULER: {
    code: 'paiement:annuler',
    libelle: 'Annuler un paiement (< 3 jours)',
    domaine: 'PAIEMENT',
  },
  PAIEMENT_PARAMETRES: {
    code: 'paiement:parametres',
    libelle: 'Configurer les paramètres de paiement',
    domaine: 'PAIEMENT',
  },
} as const;
