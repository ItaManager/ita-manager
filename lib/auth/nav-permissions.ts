/**
 * Mapping entre les routes de navigation et les permissions requises
 * Une entrée apparaît si l'utilisateur détient AU MOINS UNE des permissions listées
 */

export const NAV_PERMISSIONS: Record<string, string[]> = {
  // PILOTAGE - accessible à tous
  "/": [],
  "/notifications": [],
  "/calendrier": [],

  // PERSONNEL - nécessite employe:lire
  "/employes": ["employe:lire", "employe:creer", "employe:modifier"],
  "/organisation/organigramme": ["employe:lire", "referentiel:creer"],
  "/organisation/services": ["employe:lire", "referentiel:creer"],
  "/contrats": ["employe:lire", "employe:creer", "employe:modifier"],

  // TEMPS & ABSENCES
  "/conges": ["absence:demander", "absence:valider"],
  "/planning": ["planning:modifier", "projet:creer"],
  "/releves": ["releve:saisir", "releve:viser"],
  "/presences": ["employe:lire"],

  // TECHNIQUE
  "/projets": ["projet:creer", "planning:modifier", "jalon:valider"],
  "/appels-offres": ["ao:creer", "ao:soumettre", "ao:validerDG"],
  "/ressources": ["ressource:demander"],

  // ADMINISTRATION
  "/documents": ["employe:lire"],
  "/paie": [
    "employe:donneesSensibles",
    "paie:ouvrirPeriode",
    "paie:validerDT",
    "paie:validerDFC",
    "paie:exporter",
  ],
  "/annonces": [],
  "/rapports": [],

  // BAS DE MENU
  "/admin/utilisateurs": ["admin:utilisateurs"],
  "/admin/journal": ["admin:journal"],
  "/parametres": ["admin:parametres"],
  "/aide": [],
};

/**
 * Vérifie si l'utilisateur a accès à une route donnée
 * @param route - Route à vérifier
 * @param userPermissions - Liste des permissions de l'utilisateur
 * @returns true si l'utilisateur a au moins une permission requise, ou si aucune permission n'est requise
 */
export function hasAccessToRoute(route: string, userPermissions: string[]): boolean {
  const requiredPermissions = NAV_PERMISSIONS[route];

  if (!requiredPermissions) {
    // Route non mappée → accessible par défaut
    return true;
  }

  if (requiredPermissions.length === 0) {
    // Aucune permission requise → accessible à tous
    return true;
  }

  // Vérifier si l'utilisateur a au moins une des permissions requises
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}
