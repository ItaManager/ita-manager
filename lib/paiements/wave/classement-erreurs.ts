/**
 * Aiguillage des réponses Wave vers EN_ATTENTE ou ECHOUE
 *
 * Règle critique (SECURITE-M15.md § 4.1) :
 * - 5xx, timeout, erreur réseau → EN_ATTENTE (état INCONNU)
 * - Erreur de validation, solde insuffisant → ECHOUE (définitif)
 * - Code inconnu → EN_ATTENTE (en cas de doute, JAMAIS ECHOUE)
 *
 * Wave peut renvoyer HTTP 200 avec un payout_error — deux formes d'erreur
 * coexistent. L'aiguillage lit dans l'ordre :
 * 1. payoutError.error_code (erreur sur l'objet Payout)
 * 2. status (processing, succeeded, failed, reversed)
 * 3. errorCode (erreur de niveau requête)
 * 4. httpStatus
 *
 * Sources : https://docs.wave.com/payout (31 juillet 2026)
 */

import { StatutPaiement } from '@prisma/client';

export type ReponseWave = {
  httpStatus?: number;
  errorCode?: string;
  payoutError?: {
    error_code: string;
    error_message?: string;
  };
  status?: 'processing' | 'succeeded' | 'failed' | 'reversed';
  success?: boolean;
};

type ResultatClassement = {
  statut: StatutPaiement;
  alerteCritique?: string;
};

export function statutDepuisReponse(reponse: ReponseWave): ResultatClassement {
  const { httpStatus, errorCode, success, payoutError, status } = reponse;

  // ⚠️ ORDRE DE LECTURE CRITIQUE
  // payoutError et status AVANT httpStatus.
  // Les paiements d'un lot n'ont PAS de httpStatus — seulement un status.
  // Tester httpStatus en premier enverrait tout le lot en EN_ATTENTE.

  // Ordre de lecture (documentation Wave § Errors) :
  // 1. payoutError.error_code s'il existe
  if (payoutError?.error_code) {
    return classifierErreurMetier(payoutError.error_code);
  }

  // 2. status — état de l'objet Payout
  //    Présent dans les réponses directes ET dans les lots
  //    Les payouts d'un lot n'ont PAS de httpStatus
  if (status === 'succeeded') {
    return { statut: 'REUSSI' };
  }

  if (status === 'processing') {
    return { statut: 'EN_COURS' };
  }

  if (status === 'failed') {
    // Wave documente TOUJOURS pourquoi un paiement échoue.
    // Un failed sans payout_error signale un défaut d'analyse chez nous.
    return {
      statut: 'EN_ATTENTE',
      alerteCritique:
        'status failed sans payout_error — Wave documente toujours ses échecs. ' +
        'DÉFAUT D\'ANALYSE : notre code n\'a pas lu la réponse correctement.',
    };
  }

  if (status === 'reversed') {
    return { statut: 'ANNULE' };
  }

  // 3. errorCode — erreur de niveau requête
  if (errorCode) {
    return classifierErreurMetier(errorCode);
  }

  // 4. httpStatus — seulement pour réponses directes
  //    Timeout ou absence de réponse HTTP (et pas de status non plus)
  if (!httpStatus) {
    return { statut: 'EN_ATTENTE' };
  }

  // 5xx — erreur serveur Wave, état INCONNU
  if (httpStatus >= 500) {
    return { statut: 'EN_ATTENTE' };
  }

  if (httpStatus >= 400 && httpStatus < 500) {
    // Cas temporaires ou ambigus
    if (httpStatus === 408) return { statut: 'EN_ATTENTE' };
    if (httpStatus === 429) return { statut: 'EN_ATTENTE' };
    if (httpStatus === 409) return { statut: 'EN_ATTENTE' };

    // 401 — clé révoquée
    if (httpStatus === 401) {
      return {
        statut: 'ECHOUE',
        alerteCritique:
          'HTTP 401 Unauthorized — clé Wave invalide ou révoquée. ' +
          'AUCUN paiement ne peut aboutir tant que ce n\'est pas réglé.',
      };
    }

    // 403 — IP non autorisée
    if (httpStatus === 403) {
      return {
        statut: 'ECHOUE',
        alerteCritique:
          'HTTP 403 Forbidden — IP non autorisée ou permissions insuffisantes. ' +
          'Vérifier la liste blanche Wave et les droits de la clé.',
      };
    }

    // Autres 4xx définitifs
    if ([400, 404, 405, 422].includes(httpStatus)) {
      return { statut: 'ECHOUE' };
    }

    // 4xx inconnu — par prudence
    return { statut: 'EN_ATTENTE' };
  }

  // HTTP 200 avec success explicite
  if (httpStatus === 200 && success === true) {
    return { statut: 'REUSSI' };
  }

  // HTTP 200 sans success ni payoutError ni status — le cas le plus dangereux
  if (httpStatus === 200 && success === undefined && !payoutError && !status) {
    return { statut: 'EN_ATTENTE' };
  }

  // Cas par défaut
  return { statut: 'EN_ATTENTE' };
}

function classifierErreurMetier(code: string): ResultatClassement {
  const erreursDefinitives = [
    'insufficient-funds',
    'recipient-limit-exceeded',
    'recipient-account-blocked',
    'recipient-account-inactive',
    'recipient-minor',
    'country-mismatch',
    'currency-mismatch',
    'request-validation-error',
    'payout-reversal-time-limit-exceeded',
  ];

  if (erreursDefinitives.includes(code)) {
    return { statut: 'ECHOUE' };
  }

  if (code === 'idempotency-mismatch') {
    return {
      statut: 'ECHOUE',
      alerteCritique:
        'idempotency-mismatch détecté — même clé, corps différent. ' +
        'DÉFAUT DE CODE : la clé d\'idempotence n\'est pas gérée correctement. ' +
        'Risque de double paiement si la ligne est rejouée.',
    };
  }

  return { statut: 'EN_ATTENTE' };
}

export function estAlerteCritique(reponse: ReponseWave): boolean {
  const { httpStatus, errorCode, payoutError, status } = reponse;

  if (httpStatus === 401 || httpStatus === 403) {
    return true;
  }

  const code = payoutError?.error_code || errorCode;
  if (code === 'idempotency-mismatch') {
    return true;
  }

  if (status === 'failed' && !payoutError) {
    return true;
  }

  return false;
}

export function doitReprendre(statut: StatutPaiement): boolean {
  return statut === 'EN_ATTENTE';
}

export function delaiReprise(numeroTentative: number): number | null {
  const delais = [1, 5, 15, 60, 360];

  if (numeroTentative > delais.length) {
    return null;
  }

  return delais[numeroTentative - 1];
}
