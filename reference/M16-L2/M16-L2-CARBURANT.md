# M16-L2-CARBURANT.md — Gestion du carburant

**Version** : 1.0
**Date** : 17 octobre 2026
**Statut** : En développement
**Dépendances** : M2 (Employés), M5 (Projets), M13 (Logistique), M15 (ITApay)

---

## 1. Vue d'ensemble

### Périmètre

Gérer les distributions de carburant pour les véhicules et engins ITA, à la station ou depuis le stock des garages, et le rechargement des garages.

### Acteurs

- **Chauffeur** : fait une demande de carburant
- **Gestionnaire principal** : valide les demandes station, gère les rechargements
- **Responsable garage** : valide et sert les demandes garage
- **Comptabilité** : enregistre les sorties de caisse (ITApay)
- **Chef de parc** : reçoit alertes consommation anormale

### Trois circuits

1. **Station** : argent remis ou accompagnement → plein → reliquat → clôture
2. **Garage (cuve)** : demande → validation responsable → distribution → stock diminue
3. **Rechargement** : stock bas → demande → validation → livraison → stock augmente

---

## 2. Schéma Prisma (ajouts requis)

```prisma
/// M16 L2 — Demande de carburant (station ou garage)
model DemandeCarburant {
  id String @id @default(cuid())
  reference String @unique /// DC-2026-0001

  /// Qui demande
  demandeurId String
  demandeur   Employe @relation("DemandesCarburantDemandees", fields: [demandeurId], references: [id])

  /// Pour quel matériel
  materielId String
  materiel   Materiel @relation(fields: [materielId], references: [id])

  /// Imputation chantier (D-08)
  projetId String?
  projet   Projet? @relation(fields: [projetId], references: [id])

  typeCarburant  TypeCarburant
  quantiteSouhai Decimal       @db.Decimal(10, 2) /// Litres demandés
  compteurActuel Decimal       @db.Decimal(10, 2)
  uniteCompteur  UniteCompteur

  /// Circuit : STATION ou GARAGE
  circuit CircuitCarburant

  /// Si GARAGE
  garageId String?
  garage   LieuStockage? @relation("DemandesGarage", fields: [garageId], references: [id])

  statut StatutDemandeCarburant

  /// Validation
  valideParId String?   @db.Uuid
  valideLe    DateTime? @db.Date

  /// Distribution créée (si acceptée)
  distributionId String?                @unique
  distribution   DistributionCarburant? @relation(fields: [distributionId], references: [id])

  /// Remise station créée (si circuit STATION)
  remiseStationId String?        @unique
  remiseStation   RemiseStation? @relation(fields: [remiseStationId], references: [id])

  creeLe    DateTime @default(now())
  modifieLe DateTime @updatedAt

  @@index([demandeurId, statut])
  @@index([materielId])
  @@index([projetId])
  @@map("demandes_carburant")
}

/// M16 L2 — Remise d'argent pour station (D-02, D-03)
model RemiseStation {
  id String @id @default(cuid())

  /// Demande liée
  demandeCarburantId String?           @unique
  demandeCarburant   DemandeCarburant? @relation

  modeRemise ModeRemiseStation /// ARGENT_REMIS | ACCOMPAGNEMENT

  /// Si ARGENT_REMIS
  montantRemis  Decimal? @db.Decimal(12, 0)
  montantDepense Decimal? @db.Decimal(12, 0)
  reliquat      Decimal? @db.Decimal(12, 0) /// = montantRemis - montantDepense

  /// Reçu station (D-03)
  urlRecu String?

  statutRemise StatutRemise /// EN_COURS | CLOTURE

  /// Qui a clôturé
  clotureparId String?   @db.Uuid
  clotureLe    DateTime? @db.Date

  creeLe    DateTime @default(now())
  modifieLe DateTime @updatedAt

  @@map("remises_station")
}

/// M16 L2 — Demande de rechargement garage
model DemandeRechargement {
  id String @id @default(cuid())
  reference String @unique /// DR-2026-0001

  /// Quel garage
  garageId String
  garage   LieuStockage @relation("DemandesRechargement", fields: [garageId], references: [id])

  /// Imputation chantier (D-08)
  projetId String?
  projet   Projet? @relation(fields: [projetId], references: [id])

  typeCarburant    TypeCarburant
  quantiteDemandee Decimal       @db.Decimal(10, 2)
  quantiteLivree   Decimal?      @db.Decimal(10, 2)

  statut StatutDemandeRechargement

  /// Demandeur (responsable garage)
  demandeurId String
  demandeur   Employe @relation("DemandesRechargementDemandees", fields: [demandeurId], references: [id])

  /// Validation gestionnaire principal
  valideParId String?   @db.Uuid
  valideLe    DateTime? @db.Date

  /// Réception
  receptionneParId String?   @db.Uuid
  receptionneLe    DateTime? @db.Date

  creeLe    DateTime @default(now())
  modifieLe DateTime @updatedAt

  @@index([garageId, statut])
  @@index([projetId])
  @@map("demandes_rechargement")
}

/// M16 L2 — Garage (extension de LieuStockage)
/// Ajout champs dans LieuStockage existant :
/// - capaciteCarburant: Decimal? (litres max)
/// - stockActuel: Decimal? (litres actuels)
/// - seuilAlerte: Int? (% de capacité, ex: 20)
/// - responsableId: String? (Employé responsable)

enum CircuitCarburant {
  STATION
  GARAGE
}

enum StatutDemandeCarburant {
  BROUILLON
  ATTENTE_VALIDATION
  VALIDEE
  DISTRIBUEE
  REFUSEE
}

enum ModeRemiseStation {
  ARGENT_REMIS
  ACCOMPAGNEMENT
}

enum StatutRemise {
  EN_COURS
  CLOTURE
}

enum StatutDemandeRechargement {
  BROUILLON
  ATTENTE_VALIDATION
  VALIDEE
  LIVREE
  REFUSEE
}
```

**Note** : Le modèle `DistributionCarburant` existe déjà dans le schema (migration 20260802192009).

---

## 3. Workflows détaillés

### Workflow A — Plein à la station

1. **Chauffeur crée demande** (`DemandeCarburant`)
   - `circuit = STATION`
   - `statut = BROUILLON`
   - Saisit : `materielId`, `compteurActuel`, `quantiteSouhai`, `projetId`

2. **Chauffeur soumet** → `statut = ATTENTE_VALIDATION`

3. **Gestionnaire valide**
   - Vérifie compteur >= dernier relevé (D-04)
   - Choisit `modeRemise` : `ARGENT_REMIS` ou `ACCOMPAGNEMENT`
   - Crée `RemiseStation` liée
   - Si `ARGENT_REMIS` : saisit `montantRemis`
   - `statut = VALIDEE`

4. **Plein effectué** (chauffeur ou gestionnaire)
   - Crée `DistributionCarburant`
   - Saisit : `quantite`, `montant`, `compteur`, `typeCarburant`, `stationId`
   - Checkbox `pleinComplet` (D-10)
   - Upload photo reçu → `RemiseStation.urlRecu`
   - `DemandeCarburant.statut = DISTRIBUEE`

5. **Si argent remis : clôture**
   - Gestionnaire saisit `montantDepense`
   - Calcul auto : `reliquat = montantRemis - montantDepense`
   - Si `reliquat > 0` : chauffeur doit rendre
   - Gestionnaire confirme clôture → `statutRemise = CLOTURE`

6. **Comptabilité enregistre** (ITApay)
   - Sortie de caisse liée à `DistributionCarburant`
   - Imputée au `projetId`

### Workflow B — Distribution au garage

1. **Chauffeur crée demande**
   - `circuit = GARAGE`
   - Sélectionne `garageId`
   - `statut = BROUILLON`

2. **Chauffeur soumet** → `statut = ATTENTE_VALIDATION`

3. **Responsable garage valide**
   - Vérifie `quantiteSouhai <= stockActuel` (D-06)
   - Si OK : `statut = VALIDEE`

4. **Responsable distribue**
   - Crée `DistributionCarburant`
   - `nature = CUVE`
   - `lieuStockageId = garageId`
   - `quantite`, `compteur`, `typeCarburant`
   - **Stock diminue automatiquement** via trigger ou transaction
   - `DemandeCarburant.statut = DISTRIBUEE`

5. **Alerte si stock bas** (D-07)
   - Si `stockActuel < seuilAlerte * capacite / 100`
   - Notification automatique → Gestionnaire principal

### Workflow C — Rechargement d'un garage

1. **Stock bas détecté** ou **Responsable crée demande**
   - `DemandeRechargement`
   - `garageId`, `typeCarburant`, `quantiteDemandee`, `projetId`
   - `statut = BROUILLON`

2. **Responsable soumet** → `statut = ATTENTE_VALIDATION`

3. **Gestionnaire principal valide**
   - Vérifie budget, fournisseur
   - `statut = VALIDEE`
   - Organise livraison

4. **Livraison reçue au garage**
   - Responsable saisit `quantiteLivree`
   - Confirme réception → `statut = LIVREE`
   - **Stock augmente automatiquement**

5. **Comptabilité enregistre achat** (ITApay)
   - Dépense imputée au `projetId`

---

## 4. Écrans requis

### `/assistanat/carburant` (existe partiellement)

**Tableau de bord**
- Indicateurs : Total litres mois, Coût total, Nb distributions, Alertes
- Onglets : Demandes | Distributions | Garages | Rechargements | Consommation

**Onglet Demandes**
- Filtre : Statut, Circuit, Demandeur, Projet
- Colonnes : Référence, Date, Demandeur, Matériel, Circuit, Quantité, Statut
- Actions : Voir, Valider (gestionnaire), Distribuer (garage)

**Onglet Distributions**
- Filtre : Nature, Type carburant, Période
- Colonnes : Référence, Date, Matériel, Litres, Montant, Compteur, Anomalie
- Badge si `compteurAnomalie = true` (D-04)
- Badge orange si consommation > 15% écart (D-05)

**Onglet Garages**
- Vue globale pour gestionnaire principal
- Cartes par garage : Stock actuel, Capacité, %, Seuil, Responsable
- Badge rouge si stock < seuil
- Bouton "Demander rechargement"

**Onglet Rechargements**
- Liste demandes rechargement
- Statuts, validation, réception

**Onglet Consommation**
- Tableau : Par véhicule, Par chantier, Par garage, Par mois
- Graphe évolution consommation
- Alertes consommation anormale

### Modales

**`modal-demande-carburant.tsx`**
- Étape 1 : Matériel, Compteur, Quantité souhaitée, Projet
- Étape 2 : Circuit (Station / Garage)
- Si Garage : sélectionner garage (combobox, affiche stock disponible)
- Bouton "Soumettre"

**`modal-valider-demande.tsx`**
- Affiche demande
- Si station : choisir mode remise + montant si argent remis
- Si garage : vérifier stock
- Bouton "Valider" / "Refuser"

**`modal-distribuer-carburant.tsx`** (existe partiellement)
- Litres, Montant (si station), Compteur actuel
- Type carburant, Plein complet (checkbox)
- Si station : upload reçu
- Si garage : stock se met à jour auto
- Bouton "Enregistrer distribution"

**`modal-cloturer-remise.tsx`**
- Affiche montant remis
- Saisir montant dépensé
- Calcul auto reliquat
- Si reliquat > 0 : confirmation chauffeur a rendu
- Bouton "Clôturer"

**`modal-demande-rechargement.tsx`**
- Garage, Type carburant, Quantité
- Projet (imputation)
- Bouton "Soumettre"

**`modal-reception-rechargement.tsx`**
- Affiche demande
- Saisir quantité livrée
- Bouton "Confirmer réception" → stock augmente

---

## 5. Règles métier (DECISIONS-M16-L2.md)

Voir `DECISIONS-M16-L2.md` pour les 10 décisions applicables.

**Calculs clés** :

```typescript
// Consommation (D-05, D-09, D-10)
function calculerConsommation(
  distribution: DistributionCarburant,
  precedent: DistributionCarburant
): number {
  if (!distribution.pleinComplet || !precedent.pleinComplet) {
    return null; // Calcul impossible
  }

  const deltaCompteur = distribution.compteur - precedent.compteur;
  const litres = distribution.quantite;

  if (distribution.uniteCompteur === "KM") {
    return (litres / deltaCompteur) * 100; // L/100km
  } else {
    return litres / deltaCompteur; // L/h
  }
}

// Alerte consommation anormale (D-05)
function verifierConsommation(
  consommationCalculee: number,
  consommationReference: number
): boolean {
  const ecart = Math.abs(consommationCalculee - consommationReference);
  const pourcentageEcart = (ecart / consommationReference) * 100;
  return pourcentageEcart > 15;
}

// Stock après distribution (D-06)
function verifierStockGarage(
  garageId: string,
  quantiteDemandee: number
): boolean {
  const garage = await prisma.lieuStockage.findUnique({
    where: { id: garageId },
  });

  return garage.stockActuel >= quantiteDemandee;
}

// Alerte seuil garage (D-07)
function verifierSeuilGarage(garage: LieuStockage): boolean {
  const stockMin = (garage.capaciteCarburant * garage.seuilAlerte) / 100;
  return garage.stockActuel < stockMin;
}
```

---

## 6. Actions serveur requises

**`lib/actions/carburant.ts`** (existe partiellement, à compléter)

```typescript
// Demandes
export const creerDemandeCarburant = actionProtegee(...)
export const soumettreDemandeCarburant = actionProtegee(...)
export const validerDemandeCarburant = actionProtegee(...)
export const refuserDemandeCarburant = actionProtegee(...)
export const listerDemandesCarburant = actionProtegee(...)

// Distributions
export const distribuerCarburant = actionProtegee(...) // Existe
export const listerDistributions = actionProtegee(...) // Existe

// Remises station
export const cloturerRemiseStation = actionProtegee(...)

// Rechargements
export const creerDemandeRechargement = actionProtegee(...)
export const validerDemandeRechargement = actionProtegee(...)
export const receptionnerRechargement = actionProtegee(...)
export const listerDemandesRechargement = actionProtegee(...)

// Garages
export const listerGarages = actionProtegee(...)
export const mettreAJourStockGarage = actionProtegee(...)

// Consommation
export const calculerConsommations = actionProtegee(...)
export const listerAnomalies = actionProtegee(...)

// Stations
export const listerStationsService = actionProtegee(...) // Existe
export const creerStationService = actionProtegee(...)
```

---

## 7. Permissions

```typescript
"assistanat:carburant:demander"          // Chauffeurs
"assistanat:carburant:valider"           // Gestionnaire principal
"assistanat:carburant:distribuer-garage" // Responsables garage
"assistanat:carburant:recharger"         // Gestionnaire principal
"assistanat:carburant:consulter"         // Comptabilité, Chef parc
```

---

## 8. Notifications

**Automatiques** :
- Stock garage < seuil → Gestionnaire principal + Responsable garage
- Consommation anormale → Chef de parc + Gestionnaire
- Reliquat non rendu > 7 jours → Gestionnaire + RH

**Manuelles** :
- Demande soumise → Gestionnaire (station) ou Responsable (garage)
- Demande validée → Chauffeur
- Demande rechargement → Gestionnaire principal

---

## 9. Intégrations

**M13 Logistique** :
- Lecture `Materiel` (véhicules, engins)
- Lecture `LieuStockage` (garages/cuves)
- Création `ReleveCompteur` après distribution
- Création `MouvementStock` pour distribution garage

**M15 ITApay** :
- Sortie caisse station → `Paiement` ITApay
- Achat rechargement → `Paiement` ITApay
- Imputation au `projetId`

**M5 Projets** :
- Imputation comptable par projet

**M2 Employés** :
- Demandeur, Responsables garage

---

## 10. État actuel vs. Requis

**Existe déjà** :
- ✅ `DistributionCarburant`
- ✅ `StationService`
- ✅ Page `/assistanat/carburant/page.tsx`
- ✅ Actions partielles `lib/actions/carburant.ts`

**À créer** :
- ❌ `DemandeCarburant`
- ❌ `RemiseStation`
- ❌ `DemandeRechargement`
- ❌ Extension `LieuStockage` (champs garage)
- ❌ Enums (`CircuitCarburant`, `StatutDemandeCarburant`, etc.)
- ❌ Modales demande, validation, clôture, rechargement
- ❌ Onglets Demandes, Garages, Rechargements, Consommation
- ❌ Actions serveur complètes
- ❌ Calculs consommation
- ❌ Notifications automatiques

---

## 11. Migration requise

Créer migration `ajout_workflows_carburant` :
- Nouveaux modèles : `DemandeCarburant`, `RemiseStation`, `DemandeRechargement`
- Nouveaux enums
- Extensions `LieuStockage` : `capaciteCarburant`, `stockActuel`, `seuilAlerte`, `responsableId`
- Index performances
