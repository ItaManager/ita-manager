/**
 * Client Wave API — Client réel pour production
 *
 * Documentation : https://docs.wave.com/payout
 *
 * SÉCURITÉ :
 * - Utilise WAVE_API_KEY (variable d'environnement)
 * - Timeout 30s par défaut
 * - Retry automatique (via retry.ts)
 * - Logs de tous les appels
 */

import type {
  ClientWave,
  ParamsPayout,
  ParamsVerification,
  ParamsBatch,
  ReponseWave,
  ReponseVerification,
  ReponseRecherche,
  ReponseBatch,
  ReponseRecuperationBatch,
} from './types';

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const WAVE_API_URL = 'https://api.wave.com/v1';
const TIMEOUT_MS = 30000; // 30 secondes

/**
 * Vérifications au démarrage (INTERDIT #8)
 *
 * Refuse de démarrer si :
 * - Clé de production en développement
 * - Clé de test en production
 */
function verifierEnvironnement() {
  const apiKey = process.env.WAVE_API_KEY;
  const nodeEnv = process.env.NODE_ENV;

  if (!apiKey) {
    throw new Error(
      'WAVE_API_KEY manquant. Configurez cette variable d\'environnement.'
    );
  }

  // INTERDIT #8 : Clé de production en développement
  const estCleProduction = apiKey.startsWith('wave_live_');
  const estEnviroDev = nodeEnv === 'development';

  if (estCleProduction && estEnviroDev) {
    throw new Error(
      '🚨 INTERDIT #8 : Clé de PRODUCTION détectée en DÉVELOPPEMENT.\n' +
        'Utilisez une clé de test (wave_test_) en développement.\n' +
        'Supprimez WAVE_API_KEY de .env.dev ou utilisez une clé de test.'
    );
  }

  // Avertissement inverse : clé de test en production
  const estCleTest = apiKey.startsWith('wave_test_');
  const estEnviroProd = nodeEnv === 'production';

  if (estCleTest && estEnviroProd) {
    console.warn(
      '⚠️ ATTENTION : Clé de TEST détectée en PRODUCTION.\n' +
        'Utilisez une clé de production (wave_live_) en production.'
    );
  }
}

// Vérifier au chargement du module
verifierEnvironnement();

// ═══════════════════════════════════════════════════════════════════════
// CLIENT WAVE RÉEL
// ═══════════════════════════════════════════════════════════════════════

export class ClientWaveReel implements ClientWave {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.WAVE_API_KEY || '';
    this.baseUrl = baseUrl || WAVE_API_URL;

    if (!this.apiKey) {
      throw new Error('WAVE_API_KEY manquant');
    }
  }

  /**
   * Appel HTTP générique vers Wave API
   */
  private async appelerWave<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE',
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      // Log de l'appel (monitoring)
      this.logAppel(endpoint, method, response.status, data);

      // Enrichir la réponse avec le httpStatus
      return {
        ...data,
        httpStatus: response.status,
      } as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Timeout
      if (error.name === 'AbortError') {
        const erreur = {
          httpStatus: 0,
          errorCode: 'TIMEOUT',
        };
        this.logErreur(endpoint, method, erreur);
        throw erreur;
      }

      // Erreur réseau
      const erreur = {
        httpStatus: 0,
        errorCode: 'NETWORK_ERROR',
        message: error.message,
      };
      this.logErreur(endpoint, method, erreur);
      throw erreur;
    }
  }

  /**
   * Créer un payout Wave
   */
  async payout(
    params: ParamsPayout,
    cleIdempotence: string
  ): Promise<ReponseWave> {
    return this.appelerWave<ReponseWave>('/payout', 'POST', params, {
      'Idempotency-Key': cleIdempotence,
    });
  }

  /**
   * Vérifier un destinataire (verify_recipient)
   */
  async verifierDestinataire(
    params: ParamsVerification
  ): Promise<ReponseVerification> {
    return this.appelerWave<ReponseVerification>(
      '/verify_recipient',
      'POST',
      params
    );
  }

  /**
   * Rechercher un payout par client_reference
   */
  async rechercher(clientReference: string): Promise<ReponseRecherche> {
    return this.appelerWave<ReponseRecherche>(
      `/payout/search?client_reference=${encodeURIComponent(clientReference)}`,
      'GET'
    );
  }

  /**
   * Créer un batch de payouts
   */
  async payoutBatch(
    params: ParamsBatch,
    cleIdempotence: string
  ): Promise<ReponseBatch> {
    return this.appelerWave<ReponseBatch>('/payout/batch', 'POST', params, {
      'Idempotency-Key': cleIdempotence,
    });
  }

  /**
   * Récupérer l'état d'un batch
   */
  async recupererBatch(batchId: string): Promise<ReponseRecuperationBatch> {
    return this.appelerWave<ReponseRecuperationBatch>(
      `/payout/batch/${batchId}`,
      'GET'
    );
  }

  /**
   * Annuler un payout (reverse)
   */
  async annuler(
    payoutId: string,
    cleIdempotence: string
  ): Promise<ReponseWave> {
    return this.appelerWave<ReponseWave>(
      `/payout/${payoutId}/reverse`,
      'POST',
      {},
      {
        'Idempotency-Key': cleIdempotence,
      }
    );
  }

  /**
   * Log d'un appel réussi
   */
  private logAppel(
    endpoint: string,
    method: string,
    status: number,
    data: any
  ) {
    // En production, envoyer vers un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      console.log(
        JSON.stringify({
          type: 'wave_api_call',
          endpoint,
          method,
          status,
          timestamp: new Date().toISOString(),
          payoutId: data.payout_id,
          errorCode: data.errorCode,
        })
      );
    }
  }

  /**
   * Log d'une erreur
   */
  private logErreur(endpoint: string, method: string, erreur: any) {
    console.error(
      JSON.stringify({
        type: 'wave_api_error',
        endpoint,
        method,
        errorCode: erreur.errorCode,
        httpStatus: erreur.httpStatus,
        message: erreur.message,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Factory : crée le client Wave réel
 */
export function creerClientWave(apiKey?: string): ClientWave {
  return new ClientWaveReel(apiKey);
}
