/**
 * Types pour l'API Wave Payout
 * Sources : https://docs.wave.com/payout (31 juillet 2026)
 */

export type ReponseWave = {
  httpStatus?: number;
  errorCode?: string;
  payoutError?: {
    error_code: string;
    error_message?: string;
  };
  status?: 'processing' | 'succeeded' | 'failed' | 'reversed';
  success?: boolean;
  payout_id?: string;
  amount?: string;
  currency?: string;
  recipient?: string;
  fees?: string;
};

export type ParamsPayout = {
  amount: string;
  currency: string;
  recipient: string;
  payment_reason: string;
  client_reference: string;
};

export type ReponseVerification = {
  httpStatus?: number;
  within_limits?: boolean | null;
  name_match?: 'MATCH' | 'NO_MATCH' | 'NAME_NOT_KNOWN' | null;
  national_id_match?: 'MATCH' | 'NO_MATCH' | 'ID_NOT_KNOWN' | null;
  errorCode?: string;
};

export type ParamsVerification = {
  recipient: string;
  name: string;
  amount: string;
};

export type ReponseRecherche = {
  httpStatus?: number;
  result?: ReponseWave[];
  errorCode?: string;
};

export type ParamsBatch = {
  payouts: ParamsPayout[];
};

export type ReponseBatch = {
  httpStatus?: number;
  id?: string;
  errorCode?: string;
};

export type ReponseRecuperationBatch = {
  httpStatus?: number;
  id?: string;
  status?: 'processing' | 'complete';
  payouts?: ReponseWave[];
  errorCode?: string;
};

export type Scenario =
  | 'SUCCES'
  | 'PROCESSING'
  | 'ERREUR_PAYOUT_200'
  | 'NO_MATCH'
  | 'RECIPIENT_LIMIT'
  | 'ERREUR_503'
  | 'TIMEOUT'
  | 'FAILED_SANS_MOTIF';

export type AppelPayout = {
  cleIdempotence: string;
  params: ParamsPayout;
  horodatage: Date;
  deduplique: boolean;
  reponse: ReponseWave;
};

export type AppelVerification = {
  params: ParamsVerification;
  horodatage: Date;
  reponse: ReponseVerification;
};

export interface ClientWave {
  payout(params: ParamsPayout, cleIdempotence: string): Promise<ReponseWave>;
  verifierDestinataire(params: ParamsVerification): Promise<ReponseVerification>;
  rechercher(clientReference: string): Promise<ReponseRecherche>;
  payoutBatch(params: ParamsBatch, cleIdempotence: string): Promise<ReponseBatch>;
  recupererBatch(batchId: string): Promise<ReponseRecuperationBatch>;
  annuler?(payoutId: string, cleIdempotence: string): Promise<ReponseWave>;
}

export interface ClientWaveSimule extends ClientWave {
  definirScenarioGlobal(scenario: Scenario): void;
  programmer(destinataire: string, scenario: Scenario): void;
  programmerOrdre(ordre: number, scenario: Scenario): void;
  obtenirAppelsPayout(): AppelPayout[];
  obtenirAppelsVerification(): AppelVerification[];
  transfertsReels(): number;
  verifierIdempotence(): {
    valide: boolean;
    doublons: string[];
    details: Map<string, { compte: number; deduplique: boolean }>;
  };
  reinitialiser(): void;
}
