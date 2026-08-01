/**
 * Factory Wave — Bascule automatique simulé/réel
 *
 * Stratégie :
 * - Production → TOUJOURS client réel (erreur si pas de WAVE_API_KEY)
 * - Développement → client simulé par défaut, réel si WAVE_API_KEY présent
 *
 * Permet de tester avec le vrai client en DEV en configurant WAVE_API_KEY.
 */

import type { ClientWave } from './types';
import { creerClientWave } from './client';
import { creerClientSimule } from './client-simule';

/**
 * Crée le client Wave approprié selon l'environnement
 *
 * @returns ClientWave (réel ou simulé)
 * @throws Error en production si WAVE_API_KEY manquant
 */
export function obtenirClientWave(): ClientWave {
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.WAVE_API_KEY;

  // PRODUCTION → client réel obligatoire
  if (isProd) {
    if (!apiKey) {
      throw new Error(
        '🚨 WAVE_API_KEY manquant en PRODUCTION.\n' +
          'Configurez cette variable d\'environnement sur Vercel.'
      );
    }

    console.log('✅ Wave API — Mode RÉEL (production)');
    return creerClientWave(apiKey);
  }

  // DÉVELOPPEMENT → simulé par défaut, réel si clé présente
  if (apiKey) {
    console.log('✅ Wave API — Mode RÉEL (dev avec clé API)');
    return creerClientWave(apiKey);
  }

  console.log('🧪 Wave API — Mode SIMULÉ (dev sans clé API)');
  return creerClientSimule();
}

/**
 * Instance singleton du client Wave
 *
 * Permet de partager la même instance dans toute l'application.
 * En mode simulé, cela permet de préserver l'état (programmations, appels enregistrés).
 */
let _clientWaveSingleton: ClientWave | null = null;

/**
 * Obtenir le client Wave singleton
 *
 * Utilise la même instance pour toute l'application.
 * En mode simulé, préserve l'état entre les appels.
 *
 * @returns ClientWave (singleton)
 */
export function obtenirClientWaveSingleton(): ClientWave {
  if (!_clientWaveSingleton) {
    _clientWaveSingleton = obtenirClientWave();
  }
  return _clientWaveSingleton;
}

/**
 * Réinitialiser le singleton (TESTS UNIQUEMENT)
 *
 * Force la recréation du client au prochain appel.
 * Utile pour les tests qui veulent un client neuf.
 */
export function reinitialiserClientWave(): void {
  _clientWaveSingleton = null;
}
