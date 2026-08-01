/**
 * Erreurs métier pour le module M15 ItaPay
 */

export class InterditPaiement extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'InterditPaiement';
  }
}
