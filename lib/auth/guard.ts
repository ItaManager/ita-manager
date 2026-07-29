// Catalogue des permissions applicatives (M0-SOCLE.md §5) — transcrit
// verbatim, ne pas modifier sans validation (BRIEF-CLAUDE-CODE.md,
// « ce que tu ne décides pas seul »).
//
// `exigerPermission` et `actionProtegee` — la garde d'autorisation
// proprement dite — sont ajoutées à l'étape 0.5. Ce fichier ne porte pour
// l'instant que le catalogue, nécessaire dès l'étape 0.3 (seed).

export const PERMISSIONS = [
  { code: "employe:lire", libelle: "Consulter les employés", domaine: "RH" },
  { code: "employe:creer", libelle: "Créer un employé", domaine: "RH" },
  { code: "employe:modifier", libelle: "Modifier un employé", domaine: "RH" },
  { code: "employe:archiver", libelle: "Archiver un employé", domaine: "RH" },
  {
    code: "employe:donneesSensibles",
    libelle: "Consulter les données sensibles d'un employé",
    domaine: "RH",
  },
  {
    code: "referentiel:creer",
    libelle: "Créer une valeur de référentiel",
    domaine: "REFERENTIEL",
  },
  { code: "direction:creer", libelle: "Créer une direction", domaine: "REFERENTIEL" },
  {
    code: "posteDirection:affecter",
    libelle: "Affecter un poste à une direction",
    domaine: "REFERENTIEL",
  },
  { code: "absence:demander", libelle: "Demander une absence", domaine: "RH" },
  {
    code: "absence:valider",
    libelle: "Valider une demande d'absence",
    domaine: "RH",
  },
  {
    code: "reglesConges:modifier",
    libelle: "Modifier les règles de congés",
    domaine: "RH",
  },
  { code: "grille:modifier", libelle: "Modifier la grille salariale", domaine: "PAIE" },
  {
    code: "derogation:valider",
    libelle: "Valider une dérogation salariale",
    domaine: "PAIE",
  },
  {
    code: "paie:ouvrirPeriode",
    libelle: "Ouvrir une période de paie",
    domaine: "PAIE",
  },
  {
    code: "paie:validerDT",
    libelle: "Valider la paie (Direction Technique)",
    domaine: "PAIE",
  },
  { code: "paie:validerDFC", libelle: "Valider la paie (DFC)", domaine: "PAIE" },
  { code: "paie:exporter", libelle: "Exporter la paie", domaine: "PAIE" },
  { code: "ao:creer", libelle: "Créer un appel d'offres", domaine: "TECHNIQUE" },
  {
    code: "ao:soumettre",
    libelle: "Soumettre un appel d'offres",
    domaine: "TECHNIQUE",
  },
  {
    code: "ao:validerDG",
    libelle: "Valider un appel d'offres (Direction Générale)",
    domaine: "TECHNIQUE",
  },
  { code: "projet:creer", libelle: "Créer un projet", domaine: "TECHNIQUE" },
  {
    code: "planning:modifier",
    libelle: "Modifier le planning",
    domaine: "TECHNIQUE",
  },
  { code: "jalon:valider", libelle: "Valider un jalon", domaine: "TECHNIQUE" },
  {
    code: "releve:saisir",
    libelle: "Saisir un relevé d'activité",
    domaine: "TECHNIQUE",
  },
  {
    code: "releve:viser",
    libelle: "Viser un relevé d'activité",
    domaine: "TECHNIQUE",
  },
  {
    code: "ressource:demander",
    libelle: "Demander une ressource",
    domaine: "TECHNIQUE",
  },
  {
    code: "admin:utilisateurs",
    libelle: "Administrer les utilisateurs",
    domaine: "ADMIN",
  },
  {
    code: "admin:parametres",
    libelle: "Administrer les paramètres",
    domaine: "ADMIN",
  },
  {
    code: "admin:journal",
    libelle: "Consulter le journal d'audit",
    domaine: "ADMIN",
  },
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number]["code"];
