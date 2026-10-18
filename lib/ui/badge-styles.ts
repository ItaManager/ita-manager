/**
 * Standards de badges — PREPARATION-PRODUCTION.md
 *
 * Couleurs ITA standardisées pour tous les badges de statut
 */

export type BadgeStatus =
  | "succes"
  | "en-cours"
  | "attention"
  | "erreur"
  | "neutre";

export const BADGE_STYLES: Record<BadgeStatus, string> = {
  succes: "bg-emerald-100 text-emerald-800", // VALIDÉ, SOLDÉE, CONFIRMÉ
  "en-cours": "bg-blue-100 text-blue-800", // EN_COURS, A_VALIDER, TRAITEMENT
  attention: "bg-orange-100 text-orange-800", // EN_ATTENTE, PARTIELLE, ALERTE
  erreur: "bg-red-100 text-red-800", // REFUSÉ, EN_RETARD, REJETÉ
  neutre: "bg-gray-100 text-gray-800", // BROUILLON, INACTIF
};

/**
 * Mappings par module
 */

// M3 - Congés
export const BADGE_CONGES: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  ATTENTE_N1: BADGE_STYLES.attention,
  ATTENTE_RH: BADGE_STYLES.attention,
  VALIDEE: BADGE_STYLES.succes,
  REFUSEE: BADGE_STYLES.erreur,
  ANNULEE: BADGE_STYLES.neutre,
};

// M14 - Achats
export const BADGE_ACHATS: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  SOUMISSION: BADGE_STYLES.attention,
  VALIDATION_N1: BADGE_STYLES["en-cours"],
  VALIDATION_DFC: BADGE_STYLES["en-cours"],
  VALIDATION_DG: BADGE_STYLES["en-cours"],
  VALIDEE: BADGE_STYLES.succes,
  REFUSEE: BADGE_STYLES.erreur,
};

// M15 L2 - Paiements Fournisseurs
export const BADGE_FACTURES: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  A_RECEVOIR: BADGE_STYLES.attention,
  A_VALIDER: BADGE_STYLES["en-cours"],
  A_VALIDER_DG: BADGE_STYLES["en-cours"],
  A_PAYER: BADGE_STYLES.attention,
  PARTIELLE: BADGE_STYLES.attention,
  SOLDEE: BADGE_STYLES.succes,
  REFUSEE: BADGE_STYLES.erreur,
  EN_RETARD: BADGE_STYLES.erreur,
};

// M15 - ITApay
export const BADGE_PAIEMENTS: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  A_PREPARER: BADGE_STYLES.attention,
  PREPAREE: BADGE_STYLES["en-cours"],
  A_AUTORISER: BADGE_STYLES.attention,
  AUTORISEE: BADGE_STYLES["en-cours"],
  EN_COURS: BADGE_STYLES["en-cours"],
  REUSSIE: BADGE_STYLES.succes,
  ECHOUEE: BADGE_STYLES.erreur,
  ANNULEE: BADGE_STYLES.neutre,
};

// M16 L2 - Carburant
export const BADGE_CARBURANT: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  EN_ATTENTE: BADGE_STYLES.attention,
  VALIDEE: BADGE_STYLES.succes,
  REFUSEE: BADGE_STYLES.erreur,
  EN_COURS: BADGE_STYLES["en-cours"],
  CLOTURE: BADGE_STYLES.succes,
  RECEPTIONNEE: BADGE_STYLES.succes,
};

// M6 - Relevés
export const BADGE_RELEVES: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  SAISI: BADGE_STYLES["en-cours"],
  VISE: BADGE_STYLES.succes,
  VALIDE: BADGE_STYLES.succes,
  CLOTURE: BADGE_STYLES.neutre,
};

// M4 - Rémunération (Grilles et Dérogations)
export const BADGE_REMUNERATION: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  PUBLIEE: BADGE_STYLES.succes,
  ARCHIVEE: BADGE_STYLES.neutre,
  EN_ATTENTE: BADGE_STYLES.attention,
  ACCEPTEE: BADGE_STYLES.succes,
  REFUSEE: BADGE_STYLES.erreur,
  SANS_OBJET: BADGE_STYLES.neutre,
};

// M5 - Projets
export const BADGE_PROJETS: Record<string, string> = {
  EN_PREPARATION: BADGE_STYLES.attention,
  EN_COURS: BADGE_STYLES["en-cours"],
  EN_PAUSE: BADGE_STYLES.attention,
  TERMINE: BADGE_STYLES.succes,
  CLOTURE: BADGE_STYLES.neutre,
  ANNULE: BADGE_STYLES.erreur,
};

// M9 - Appels d'offres
export const BADGE_APPELS_OFFRES: Record<string, string> = {
  BROUILLON: BADGE_STYLES.neutre,
  PUBLIE: BADGE_STYLES["en-cours"],
  EN_EVALUATION: BADGE_STYLES["en-cours"],
  ATTRIBUE: BADGE_STYLES.succes,
  INFRUCTUEUX: BADGE_STYLES.erreur,
  ANNULE: BADGE_STYLES.neutre,
};

/**
 * Fonction utilitaire pour obtenir les classes d'un badge
 */
export function getBadgeClasses(statut: string, module: "conges" | "achats" | "factures" | "paiements" | "carburant" | "releves" | "remuneration" | "projets" | "appels-offres"): string {
  const mappings = {
    conges: BADGE_CONGES,
    achats: BADGE_ACHATS,
    factures: BADGE_FACTURES,
    paiements: BADGE_PAIEMENTS,
    carburant: BADGE_CARBURANT,
    releves: BADGE_RELEVES,
    remuneration: BADGE_REMUNERATION,
    projets: BADGE_PROJETS,
    "appels-offres": BADGE_APPELS_OFFRES,
  };

  return mappings[module][statut] || BADGE_STYLES.neutre;
}

/**
 * Labels français pour les statuts
 */
export const STATUT_LABELS: Record<string, string> = {
  // Génériques
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  VALIDEE: "Validée",
  REFUSEE: "Refusée",
  ANNULEE: "Annulée",

  // Congés
  ATTENTE_N1: "En attente N+1",
  ATTENTE_RH: "En attente RH",

  // Achats
  SOUMISSION: "En attente N+1",
  VALIDATION_N1: "Validation N+1",
  VALIDATION_DFC: "Validation DFC",
  VALIDATION_DG: "Validation DG",

  // Factures fournisseurs
  A_RECEVOIR: "À recevoir",
  A_VALIDER: "À valider",
  A_VALIDER_DG: "Validation DG",
  A_PAYER: "À payer",
  PARTIELLE: "Partielle",
  SOLDEE: "Soldée",
  EN_RETARD: "En retard",

  // Paiements
  A_PREPARER: "À préparer",
  PREPAREE: "Préparée",
  A_AUTORISER: "À autoriser",
  AUTORISEE: "Autorisée",
  REUSSIE: "Réussie",
  ECHOUEE: "Échouée",

  // Carburant
  CLOTURE: "Clôturée",
  RECEPTIONNEE: "Réceptionnée",

  // Relevés
  SAISI: "Saisi",
  VISE: "Visé",
  VALIDE: "Validé",

  // Rémunération
  PUBLIEE: "Publiée",
  ARCHIVEE: "Archivée",
  ACCEPTEE: "Acceptée",
  SANS_OBJET: "Sans objet",

  // Projets
  EN_PREPARATION: "En préparation",
  EN_PAUSE: "En pause",
  TERMINE: "Terminé",
  ANNULE: "Annulé",

  // Appels d'offres
  PUBLIE: "Publié",
  EN_EVALUATION: "En évaluation",
  ATTRIBUE: "Attribué",
  INFRUCTUEUX: "Infructueux",
};
