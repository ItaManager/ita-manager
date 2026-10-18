/**
 * Client Wave simulé pour tests reproductibles
 *
 * Reproduit les 8 scénarios documentés SANS AUCUN APPEL RÉSEAU.
 * Enregistre chaque appel (payout, vérification) avec dédoublonnage.
 *
 * Programmation à 3 niveaux :
 * - programmerOrdre(ordre, scenario) — priorité maximale
 * - programmer(destinataire, scenario) — par destinataire
 * - definirScenarioGlobal(scenario) — défaut pour tous
 */

import type {
  ClientWave,
  ClientWaveSimule,
  ParamsPayout,
  ParamsVerification,
  ParamsBatch,
  ReponseWave,
  ReponseVerification,
  ReponseRecherche,
  ReponseBatch,
  ReponseRecuperationBatch,
  Scenario,
  AppelPayout,
  AppelVerification,
} from './types';

export class ClientWaveSimuleImpl implements ClientWaveSimule {
  private _scenarioGlobal: Scenario = 'SUCCES';
  private _scenariosParDestinataire = new Map<string, Scenario>();
  private _scenariosParOrdre = new Map<number, Scenario>();
  private _appelsPayout: AppelPayout[] = [];
  private _appelsVerification: AppelVerification[] = [];
  private _cacheIdempotence = new Map<
    string,
    { params: ParamsPayout; reponse: ReponseWave }
  >();
  private _ordreAppel = 0;
  private _lots = new Map<
    string,
    { params: ParamsBatch; interrogations: number; payouts: ReponseWave[] }
  >();

  definirScenarioGlobal(scenario: Scenario): void {
    this._scenarioGlobal = scenario;
  }

  programmer(destinataire: string, scenario: Scenario): void {
    this._scenariosParDestinataire.set(destinataire, scenario);
  }

  programmerOrdre(ordre: number, scenario: Scenario): void {
    this._scenariosParOrdre.set(ordre, scenario);
  }

  async payout(
    params: ParamsPayout,
    cleIdempotence: string
  ): Promise<ReponseWave> {
    this._ordreAppel++;

    // Vérifier idempotence
    const cache = this._cacheIdempotence.get(cleIdempotence);
    if (cache) {
      // Même clé : vérifier si même corps
      const memeCorps = JSON.stringify(cache.params) === JSON.stringify(params);

      this._appelsPayout.push({
        cleIdempotence,
        params,
        horodatage: new Date(),
        deduplique: memeCorps,
        reponse: memeCorps
          ? cache.reponse
          : this._genererReponse('IDEMPOTENCY_MISMATCH', params),
      });

      return memeCorps
        ? cache.reponse
        : this._genererReponse('IDEMPOTENCY_MISMATCH', params);
    }

    // Déterminer scénario
    const scenario = this._determinerScenario(this._ordreAppel, params.recipient);
    const reponse = this._genererReponse(scenario, params);

    // Enregistrer
    this._cacheIdempotence.set(cleIdempotence, { params, reponse });
    this._appelsPayout.push({
      cleIdempotence,
      params,
      horodatage: new Date(),
      deduplique: false,
      reponse,
    });

    return reponse;
  }

  async verifierDestinataire(
    params: ParamsVerification
  ): Promise<ReponseVerification> {
    const scenario = this._determinerScenario(
      this._ordreAppel + 1,
      params.recipient
    );

    let reponse: ReponseVerification;

    if (scenario === 'NO_MATCH') {
      reponse = {
        httpStatus: 200,
        within_limits: true,
        name_match: 'NO_MATCH',
        national_id_match: null,
      };
    } else if (scenario === 'RECIPIENT_LIMIT') {
      reponse = {
        httpStatus: 200,
        within_limits: false,
        name_match: 'MATCH',
        national_id_match: null,
      };
    } else if (scenario === 'ERREUR_503') {
      reponse = {
        httpStatus: 503,
        within_limits: null,
        name_match: null,
        national_id_match: null,
      };
    } else if (scenario === 'TIMEOUT') {
      reponse = {
        within_limits: null,
        name_match: null,
        national_id_match: null,
      };
    } else {
      // SUCCES, PROCESSING, ERREUR_PAYOUT_200
      reponse = {
        httpStatus: 200,
        within_limits: true,
        name_match: 'MATCH',
        national_id_match: null,
      };
    }

    this._appelsVerification.push({
      params,
      horodatage: new Date(),
      reponse,
    });

    return reponse;
  }

  async rechercher(clientReference: string): Promise<ReponseRecherche> {
    // Chercher dans les appels enregistrés
    const trouve = this._appelsPayout.find(
      (a) => a.params.client_reference === clientReference && !a.deduplique
    );

    if (!trouve) {
      return {
        httpStatus: 200,
        result: [],
      };
    }

    return {
      httpStatus: 200,
      result: [trouve.reponse],
    };
  }

  async payoutBatch(
    params: ParamsBatch,
    cleIdempotence: string
  ): Promise<ReponseBatch> {
    const batchId = `pb-${cleIdempotence.substring(0, 8)}`;

    // Générer les résultats pour chaque payout
    const payouts: ReponseWave[] = params.payouts.map((p, index) => {
      const ordre = this._ordreAppel + index + 1;
      const scenario = this._determinerScenario(ordre, p.recipient);

      // Dans un lot, pas de httpStatus par payout
      if (scenario === 'SUCCES') {
        return {
          status: 'succeeded',
          payout_id: `pyt-${Date.now()}-${index}`,
          amount: p.amount,
          currency: p.currency,
          recipient: p.recipient,
          fees: '250',
        };
      }

      if (scenario === 'PROCESSING') {
        return {
          status: 'processing',
          payout_id: `pyt-${Date.now()}-${index}`,
          amount: p.amount,
          currency: p.currency,
          recipient: p.recipient,
        };
      }

      if (scenario === 'RECIPIENT_LIMIT') {
        return {
          status: 'failed',
          payout_id: `pyt-${Date.now()}-${index}`,
          amount: p.amount,
          currency: p.currency,
          recipient: p.recipient,
          payoutError: {
            error_code: 'recipient-limit-exceeded',
            error_message: 'Recipient has reached their monthly limit',
          },
        };
      }

      if (scenario === 'ERREUR_503' || scenario === 'TIMEOUT') {
        // Équivalent dans un lot : reste en processing
        return {
          status: 'processing',
          payout_id: `pyt-${Date.now()}-${index}`,
          amount: p.amount,
          currency: p.currency,
          recipient: p.recipient,
        };
      }

      if (scenario === 'FAILED_SANS_MOTIF') {
        return {
          status: 'failed',
          payout_id: `pyt-${Date.now()}-${index}`,
          amount: p.amount,
          currency: p.currency,
          recipient: p.recipient,
        };
      }

      // Défaut
      return {
        status: 'succeeded',
        payout_id: `pyt-${Date.now()}-${index}`,
        amount: p.amount,
        currency: p.currency,
        recipient: p.recipient,
        fees: '250',
      };
    });

    this._lots.set(batchId, { params, interrogations: 0, payouts });
    this._ordreAppel += params.payouts.length;

    return {
      httpStatus: 200,
      id: batchId,
    };
  }

  async recupererBatch(batchId: string): Promise<ReponseRecuperationBatch> {
    const lot = this._lots.get(batchId);

    if (!lot) {
      return {
        httpStatus: 404,
        errorCode: 'batch-not-found',
      };
    }

    lot.interrogations++;

    // Après 5 interrogations, le lot est complet
    const status = lot.interrogations >= 5 ? 'complete' : 'processing';

    return {
      httpStatus: 200,
      id: batchId,
      status,
      payouts: lot.payouts,
    };
  }

  /**
   * Annuler un paiement (reverse) — Simulation
   */
  async annuler(
    payoutId: string,
    cleIdempotence: string
  ): Promise<ReponseWave> {
    // Simuler un délai
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Dans la simulation, on retourne toujours un succès d'annulation
    // En production réelle, Wave peut refuser si >3 jours ou déjà annulé
    return {
      httpStatus: 200,
      status: 'reversed',
      payout_id: payoutId,
      success: true,
    };
  }

  obtenirAppelsPayout(): AppelPayout[] {
    return this._appelsPayout;
  }

  obtenirAppelsVerification(): AppelVerification[] {
    return this._appelsVerification;
  }

  transfertsReels(): number {
    return this._appelsPayout.filter((a) => !a.deduplique).length;
  }

  verifierIdempotence(): {
    valide: boolean;
    doublons: string[];
    details: Map<string, { compte: number; deduplique: boolean }>;
  } {
    const compteur = new Map<
      string,
      { compte: number; deduplique: boolean }
    >();

    for (const appel of this._appelsPayout) {
      const existant = compteur.get(appel.cleIdempotence);
      if (existant) {
        compteur.set(appel.cleIdempotence, {
          compte: existant.compte + 1,
          deduplique: appel.deduplique,
        });
      } else {
        compteur.set(appel.cleIdempotence, {
          compte: 1,
          deduplique: appel.deduplique,
        });
      }
    }

    const doublons = Array.from(compteur.entries())
      .filter(([, v]) => v.compte > 1 && !v.deduplique)
      .map(([k]) => k);

    return {
      valide: doublons.length === 0,
      doublons,
      details: compteur,
    };
  }

  reinitialiser(): void {
    this._scenarioGlobal = 'SUCCES';
    this._scenariosParDestinataire.clear();
    this._scenariosParOrdre.clear();
    this._appelsPayout = [];
    this._appelsVerification = [];
    this._cacheIdempotence.clear();
    this._ordreAppel = 0;
    this._lots.clear();
  }

  private _determinerScenario(ordre: number, destinataire: string): Scenario {
    // Priorité 1 : ordre
    if (this._scenariosParOrdre.has(ordre)) {
      return this._scenariosParOrdre.get(ordre)!;
    }

    // Priorité 2 : destinataire
    if (this._scenariosParDestinataire.has(destinataire)) {
      return this._scenariosParDestinataire.get(destinataire)!;
    }

    // Priorité 3 : global
    return this._scenarioGlobal;
  }

  private _genererReponse(
    scenario: Scenario | 'IDEMPOTENCY_MISMATCH',
    params: ParamsPayout
  ): ReponseWave {
    if (scenario === 'SUCCES') {
      return {
        httpStatus: 200,
        status: 'succeeded',
        success: true,
        payout_id: `pyt-${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
        fees: '250',
      };
    }

    if (scenario === 'PROCESSING') {
      return {
        httpStatus: 200,
        status: 'processing',
        payout_id: `pyt-${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
      };
    }

    if (scenario === 'ERREUR_PAYOUT_200') {
      return {
        httpStatus: 200,
        status: 'failed',
        payoutError: {
          error_code: 'insufficient-funds',
          error_message: 'Insufficient funds in sender account',
        },
        payout_id: `pyt-${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
      };
    }

    if (scenario === 'NO_MATCH') {
      return {
        httpStatus: 200,
        status: 'failed',
        payoutError: {
          error_code: 'request-validation-error',
          error_message: 'Recipient name does not match',
        },
        payout_id: `pyt-${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
      };
    }

    if (scenario === 'RECIPIENT_LIMIT') {
      return {
        httpStatus: 200,
        status: 'failed',
        payoutError: {
          error_code: 'recipient-limit-exceeded',
          error_message: 'Recipient has reached their monthly limit',
        },
        payout_id: `pyt-${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
      };
    }

    if (scenario === 'ERREUR_503') {
      return {
        httpStatus: 503,
      };
    }

    if (scenario === 'TIMEOUT') {
      return {};
    }

    if (scenario === 'FAILED_SANS_MOTIF') {
      return {
        httpStatus: 200,
        status: 'failed',
      };
    }

    if (scenario === 'IDEMPOTENCY_MISMATCH') {
      return {
        httpStatus: 409,
        errorCode: 'idempotency-mismatch',
      };
    }

    // Défaut
    return {
      httpStatus: 200,
      status: 'succeeded',
      success: true,
      payout_id: `pyt-${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      recipient: params.recipient,
      fees: '250',
    };
  }
}

export function creerClientSimule(): ClientWaveSimule {
  return new ClientWaveSimuleImpl();
}
