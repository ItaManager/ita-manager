# DECISIONS-M16-L2.md — Carburant

**Version** : 1.0
**Date** : 17 octobre 2026
**Module** : M16 L2 — Gestion du carburant

---

## Décisions applicables

### D-01 · Trois circuits distincts, pas de fusion

**Contexte** : Station-service, garage (cuve), rechargement garage.

**Décision** : Chaque circuit a son propre workflow et ses propres contrôles. Pas de modèle unique "Distribution" qui gérerait tout.

**Raison** : Les acteurs, validations et contrôles comptables diffèrent. Fusionner créerait des champs conditionnels et des états ambigus.

**Conséquence** :
- `DemandeCarburant` : demande initiale (station ou garage)
- `DistributionCarburant` : plein effectué
- `RemiseStation` : gestion argent remis/reliquat (station uniquement)
- `DemandeRechargement` : rechargement des garages

---

### D-02 · Argent remis : montant exact obligatoire

**Contexte** : Chauffeur reçoit de l'argent pour aller à la station.

**Décision** : `montantRemis = montantDepense + reliquat`. Le dossier reste ouvert tant que l'égalité n'est pas vraie.

**Raison** : Éviter les pertes non tracées et les abus.

**Conséquence** :
- Champ `statutRemise` : `EN_COURS` | `CLOTURE`
- Blocage du chauffeur pour nouvelle demande si reliquat non rendu

---

### D-03 · Reçu de station obligatoire pour clôture

**Contexte** : Prouver la dépense réelle.

**Décision** : Photo/scan du reçu station obligatoire pour passer `statutRemise` à `CLOTURE`.

**Raison** : Contrôle comptable et justificatif fiscal.

**Conséquence** : Champ `urlRecu` requis avant clôture.

---

### D-04 · Compteur : saisie >= dernier relevé

**Contexte** : Éviter les erreurs de saisie (recul de compteur).

**Décision** : Validation serveur : `compteurSaisi >= dernierCompteur`. Si inférieur, marquer `compteurAnomalie = true` + demander motif.

**Raison** : Calcul de consommation faussé si compteur recule.

**Conséquence** : Champ `compteurAnomalie` + `motifAnomalie` obligatoire si anomalie.

---

### D-05 · Consommation de référence par véhicule

**Contexte** : Détecter les consommations anormales.

**Décision** : Chaque véhicule/engin porte un champ `consommationReference` (L/100km ou L/h). Alerte si écart > 15%.

**Raison** : Détecter les fuites, vols, ou mauvais comportement.

**Conséquence** : Calcul automatique après chaque plein complet. Notification si anomalie.

---

### D-06 · Stock garage : impossible de distribuer plus que disponible

**Contexte** : Éviter stock négatif.

**Décision** : Contrôle bloquant côté serveur : `quantiteDemandee <= stockDisponible`.

**Raison** : Cohérence des stocks.

**Conséquence** : Erreur 400 si stock insuffisant. Afficher stock disponible dans le message.

---

### D-07 · Alerte seuil garage automatique

**Contexte** : Éviter rupture de stock.

**Décision** : Quand `stockActuel < seuilAlerte`, notification automatique au gestionnaire principal.

**Raison** : Anticipation des rechargements.

**Conséquence** : Champ `seuilAlerte` par garage (% de capacité, ex: 20%).

---

### D-08 · Imputation comptable au chantier

**Contexte** : Tracer les coûts par projet.

**Décision** : Toute distribution/achat carburant est imputé au chantier/projet indiqué dans la demande.

**Raison** : Comptabilité analytique.

**Conséquence** : Champ `projetId` obligatoire dans `DemandeCarburant` et `DemandeRechargement`.

---

### D-09 · Engins : compteur horaire, véhicules : kilométrage

**Contexte** : Unités différentes selon le type de matériel.

**Décision** : `UniteCompteur` = `KM` | `HEURES`. Véhicules légers → KM, engins → HEURES.

**Raison** : Les engins n'ont pas d'odomètre mais un compteur horaire.

**Conséquence** : Consommation calculée en L/100km ou L/h selon unité.

---

### D-10 · Plein complet = borne de calcul

**Contexte** : Calculer consommation sur intervalle connu.

**Décision** : Seuls les pleins complets (`pleinComplet = true`) servent au calcul de consommation.

**Raison** : Un plein partiel fausse le calcul (litres / km inconnu).

**Conséquence** : Checkbox "Plein complet" obligatoire à la saisie distribution.

---

## Référentiel

**Champs sensibles** (audit obligatoire) :
- `RemiseStation.montantRemis`
- `RemiseStation.reliquat`
- `DistributionCarburant.montant`
- `DemandeRechargement.quantiteLivree`

**Permissions requises** :
- `assistanat:carburant:demander` → Chauffeurs
- `assistanat:carburant:valider` → Gestionnaire principal
- `assistanat:carburant:distribuer-garage` → Responsables garage
- `assistanat:carburant:recharger` → Gestionnaire principal
- `assistanat:carburant:consulter` → Comptabilité

**Notifications automatiques** :
- Stock garage < seuil → Gestionnaire principal
- Consommation anormale → Chef de parc + Gestionnaire
- Reliquat non rendu > 7 jours → Gestionnaire + RH
