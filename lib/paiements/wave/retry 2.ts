/**
 * Logique de retry pour les appels Wave API
 *
 * Stratégie :
 * - Max 3 tentatives (1 initiale + 2 retries)
 * - Backoff exponentiel : 1s, 2s
 * - Retry uniquement sur erreurs réseau et 5xx
 * - Préservation de l'idempotence (même cleIdempotence)
 */

const MAX_TENTATIVES = 3;
const DELAIS_RETRY_MS = [1000, 2000]; // 1s puis 2s

/**
 * Détermine si une erreur justifie un retry
 */
function estRetriable(erreur: any): boolean {
  // Timeout → retry
  if (erreur.errorCode === 'TIMEOUT') {
    return true;
  }

  // Erreur réseau → retry
  if (erreur.errorCode === 'NETWORK_ERROR') {
    return true;
  }

  // HTTP 5xx → retry (erreur serveur Wave)
  if (erreur.httpStatus >= 500 && erreur.httpStatus < 600) {
    return true;
  }

  // Autres erreurs → ne pas retry
  // (4xx = erreur client, 200-299 = succès, etc.)
  return false;
}

/**
 * Attend un délai (pour backoff)
 */
function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Options de retry
 */
interface OptionsRetry {
  /**
   * Nom de l'opération (pour les logs)
   */
  operation?: string;
}

/**
 * Wrapper de retry pour appels Wave API
 *
 * Exemple :
 * ```typescript
 * const resultat = await avecRetry(
 *   () => client.payout(params, cleIdempotence),
 *   { operation: 'payout' }
 * );
 * ```
 */
export async function avecRetry<T>(
  fn: () => Promise<T>,
  options?: OptionsRetry
): Promise<T> {
  const operation = options?.operation || 'Wave API call';

  for (let tentative = 1; tentative <= MAX_TENTATIVES; tentative++) {
    try {
      // Tentative d'appel
      const resultat = await fn();

      // Succès → retourner
      if (tentative > 1) {
        console.log(
          `✅ ${operation} réussi après ${tentative} tentative(s)`
        );
      }
      return resultat;
    } catch (erreur: any) {
      const estDerniereTentative = tentative === MAX_TENTATIVES;

      // Si erreur non retriable ou dernière tentative → propager
      if (!estRetriable(erreur) || estDerniereTentative) {
        if (estDerniereTentative) {
          console.error(
            `❌ ${operation} échoué après ${MAX_TENTATIVES} tentatives`,
            erreur
          );
        }
        throw erreur;
      }

      // Erreur retriable → attendre puis retry
      const delai = DELAIS_RETRY_MS[tentative - 1];
      console.warn(
        `⚠️ ${operation} échoué (tentative ${tentative}/${MAX_TENTATIVES}) — ` +
          `Retry dans ${delai}ms — Erreur: ${erreur.errorCode || erreur.httpStatus}`
      );

      await attendre(delai);
      // Continue la boucle pour retry
    }
  }

  // Ne devrait jamais arriver ici (TypeScript flow analysis)
  throw new Error('Retry logic error');
}
