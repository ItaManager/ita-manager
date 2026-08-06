/**
 * Mapping entre les routes de navigation et les permissions requises
 * Une entrée apparaît si l'utilisateur détient AU MOINS UNE des permissions listées
 */

export const NAV_PERMISSIONS: Record<string, string[]> = {
  // PILOTAGE
  "/": ["pilotage:dg", "pilotage:drh", "pilotage:dfc", "pilotage:dt"], // Tableau de bord principal (accès selon rôle)
  "/notifications": [], // Accessible à tous
  "/calendrier": [], // Accessible à tous

  // PERSONNEL - nécessite employe:lire
  "/employes": ["employe:lire", "employe:creer", "employe:modifier"],
  "/organisation/organigramme": ["employe:lire", "referentiel:creer"],
  "/organisation/services": ["employe:lire", "referentiel:creer"],
  "/contrats": ["employe:lire", "employe:creer", "employe:modifier"],
  // M17 — Compétences et taux journaliers
  "/personnel/competences": ["competence:lire"],
  "/personnel/competences/agents": ["competence:lire"],
  // TEMPS & ABSENCES
  "/conges": ["absence:demander", "absence:valider"],
  "/conges/a-valider": [], // Accessible à tous, contrôle par lien de données dans l'action
  "/conges/controle": ["absence:valider"],
  "/conges/calendrier": ["employe:lire"],
  "/planning": ["planning:modifier", "projet:creer"],
  "/releves": ["releve:saisir", "releve:viser"],
  "/presences": ["employe:lire"],
  "/presences/temps-reel": ["employe:lire"],
  "/presences/codes": ["presence:gererCodes"],
  "/presences/bornes": ["presence:gererBornes"],

  // TECHNIQUE
  "/projets": ["projet:creer", "planning:modifier", "jalon:valider"],
  "/appels-offres": ["ao:creer", "ao:soumettre", "ao:validerDG"],
  "/ressources": ["ressource:demander"],

  // ACHATS
  "/achats/demandes": ["achat:demander"],
  "/achats/a-valider": [], // Contrôle par lien de données
  "/achats/instruction": ["achat:instruire"],
  "/achats/commandes": ["achat:instruire"],
  "/achats/receptions": ["achat:receptionner"],
  "/achats/facturation": ["achat:facturer"],
  "/achats/suivi": ["achat:demander", "achat:instruire", "achat:valider"],
  "/achats/articles": ["referentiel:creer"],
  "/achats/fournisseurs": ["referentiel:creer"],

  // ASSISTANAT
  "/assistanat/visiteurs": ["visiteur:enregistrer"],
  "/assistanat/visiteurs/historique": ["visiteur:enregistrer"],
  "/assistanat/courrier/arrivee": ["courrier:enregistrer"],
  "/assistanat/courrier/depart": ["courrier:enregistrer"],
  "/assistanat/courrier/a-traiter": ["courrier:traiter"],

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
  "/admin/roles": ["admin:parametres"],
  "/admin/alertes": ["admin:parametres"],
  "/admin/parametres": ["admin:parametres"],
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
