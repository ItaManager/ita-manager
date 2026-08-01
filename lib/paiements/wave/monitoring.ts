/**
 * Monitoring et métriques Wave API
 *
 * Logs structurés pour :
 * - Succès/échecs de paiements
 * - Temps de réponse
 * - Erreurs et retries
 * - Vérifications de destinataires
 *
 * En production, ces logs sont ingérés par Vercel Analytics.
 */

/**
 * Type d'événement Wave
 */
export type TypeEvenementWave =
  | 'payout_success'
  | 'payout_failure'
  | 'verify_recipient'
  | 'batch_created'
  | 'batch_completed'
  | 'reverse_success'
  | 'reverse_failure'
  | 'network_error';

/**
 * Métadonnées d'un événement Wave
 */
interface MetadonneesEvenement {
  /**
   * ID du payout Wave (si disponible)
   */
  payoutId?: string;

  /**
   * Référence ITA (pour traçabilité)
   */
  referenceIta?: string;

  /**
   * Montant en F CFA
   */
  montant?: number;

  /**
   * Code d'erreur Wave (si échec)
   */
  errorCode?: string;

  /**
   * HTTP status (200, 400, 500, etc.)
   */
  httpStatus?: number;

  /**
   * Durée de l'appel en ms
   */
  dureeMs?: number;

  /**
   * Nombre de tentatives (si retry)
   */
  tentatives?: number;

  /**
   * Contexte additionnel
   */
  [key: string]: any;
}

/**
 * Logger un événement Wave
 *
 * En production, utilise console.log avec JSON structuré.
 * En développement, affiche un message lisible.
 */
export function loggerEvenementWave(
  type: TypeEvenementWave,
  meta: MetadonneesEvenement = {}
) {
  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === 'production';

  const payload = {
    type: 'wave_event',
    event: type,
    timestamp,
    ...meta,
  };

  if (isProd) {
    // Production : JSON structuré pour ingestion
    console.log(JSON.stringify(payload));
  } else {
    // Développement : message lisible
    const emoji = getEmojiForEvent(type);
    console.log(`${emoji} [Wave] ${type}`, meta);
  }
}

/**
 * Obtenir un emoji pour un type d'événement
 */
function getEmojiForEvent(type: TypeEvenementWave): string {
  switch (type) {
    case 'payout_success':
      return '✅';
    case 'payout_failure':
      return '❌';
    case 'verify_recipient':
      return '🔍';
    case 'batch_created':
      return '📦';
    case 'batch_completed':
      return '✅';
    case 'reverse_success':
      return '↩️';
    case 'reverse_failure':
      return '❌';
    case 'network_error':
      return '🌐';
    default:
      return 'ℹ️';
  }
}

/**
 * Wrapper pour mesurer la durée d'un appel
 */
export async function mesurerDuree<T>(
  fn: () => Promise<T>
): Promise<{ resultat: T; dureeMs: number }> {
  const debut = Date.now();
  const resultat = await fn();
  const dureeMs = Date.now() - debut;

  return { resultat, dureeMs };
}

/**
 * Logger une erreur Wave avec contexte complet
 */
export function loggerErreurWave(
  operation: string,
  erreur: any,
  meta: MetadonneesEvenement = {}
) {
  console.error(
    JSON.stringify({
      type: 'wave_error',
      operation,
      timestamp: new Date().toISOString(),
      errorCode: erreur.errorCode,
      httpStatus: erreur.httpStatus,
      message: erreur.message,
      ...meta,
    })
  );
}

/**
 * Compteur simple pour agréger des métriques
 *
 * En production, ces métriques pourraient être envoyées vers un service
 * comme Datadog, Prometheus, etc.
 */
class CompteurWave {
  private compteurs: Map<string, number> = new Map();

  incrementer(cle: string) {
    this.compteurs.set(cle, (this.compteurs.get(cle) || 0) + 1);
  }

  obtenir(cle: string): number {
    return this.compteurs.get(cle) || 0;
  }

  reset() {
    this.compteurs.clear();
  }

  dump(): Record<string, number> {
    return Object.fromEntries(this.compteurs);
  }
}

/**
 * Instance globale du compteur (pour debug uniquement)
 *
 * Note : en production, utiliser un vrai système de métriques
 * (Prometheus, Datadog, etc.)
 */
export const compteurGlobal = new CompteurWave();
