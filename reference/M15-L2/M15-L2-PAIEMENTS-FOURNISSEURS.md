# M15-L2-PAIEMENTS-FOURNISSEURS.md — Extension ITApay

**Version** : 1.0
**Date** : 17 octobre 2026
**Statut** : En développement
**Dépendances** : M14 (Achats), M15 L1 (ITApay), M13 (Logistique), M5 (Projets)

---

## 1. Vue d'ensemble

### Périmètre

Extension du module M15 ITApay pour gérer les paiements fournisseurs avec circuit de validation, réception confirmée, et paiements partiels.

### Acteurs

- **Gestionnaire** : enregistre factures, valide < seuil, ordonne paiements
- **DG** : valide factures > seuil
- **Comptabilité** : enregistre paiements, upload preuves
- **Logistique** : confirme réception (matériaux, carburant)
- **Chef chantier** : confirme réception (services)

### Workflow

```
Facture enregistrée → Réception confirmée (Logistique/Chef) →
Validation Gestionnaire → [Si > seuil] Validation DG →
Paiement (total/partiel) → Upload preuve → Soldée → Imputation chantier
```

---

## 2. Schéma Prisma (ajouts requis)

### Extension Fournisseur (D-08)

```prisma
/// M14 — Fournisseur (extension pour M15 L2)
model Fournisseur {
  id           String            @id @default(cuid())
  nom          String
  nomNormalise String            @unique
  numeroWave   String?

  /// Nouveaux champs M15 L2
  categorie          CategorieFournisseur?
  modePaiementPrefere ModePaiementFournisseur?
  contact            String?
  rccm               String? /// Registre du Commerce
  adresse            String?

  actif Boolean @default(true)

  creeLe DateTime @default(now())
  creePar String

  /// Relations M14
  prix   PrixFournisseur[]
  lignes LigneAchat[]

  /// Relations M15 L2
  factures  FactureFournisseur[]
  paiements PaiementFournisseur[]

  @@index([nom])
  @@map("fournisseurs")
}

enum CategorieFournisseur {
  CARBURANT
  MATERIAUX
  LOCATION
  SERVICES
  AUTRE
}

enum ModePaiementFournisseur {
  VIREMENT
  MOBILE_MONEY
  ESPECES
  CHEQUE
}
```

### Facture Fournisseur

```prisma
/// M15 L2 — Facture fournisseur
model FactureFournisseur {
  id String @id @default(cuid())
  reference String /// Référence facture du fournisseur

  /// Fournisseur
  fournisseurId String
  fournisseur   Fournisseur @relation(fields: [fournisseurId], references: [id])

  /// Montants
  montantHT  Decimal @db.Decimal(12, 0)
  montantTVA Decimal @db.Decimal(12, 0)
  montantTTC Decimal @db.Decimal(12, 0)
  montantPaye Decimal @default(0) @db.Decimal(12, 0) /// Cumul paiements

  /// Dates
  dateFacture Date
  dateEcheance Date?

  /// Imputation (D-07)
  projetId String?
  projet   Projet? @relation(fields: [projetId], references: [id])

  /// Pièce jointe (PDF/photo facture)
  urlFacture String?

  /// Réception (D-01)
  receptionConfirmee Boolean @default(false)
  receptionneParId   String? @db.Uuid
  receptionneLe      DateTime? @db.Date
  receptionCommentaire String?

  /// Validation (D-02)
  valideParId String?   @db.Uuid
  valideLe    DateTime? @db.Date

  /// Validation DG (si > seuil)
  valideDgParId String?   @db.Uuid
  valideDgLe    DateTime? @db.Date

  /// Statut
  statutFacture StatutFactureFournisseur

  /// Relations
  paiements PaiementFournisseur[]

  creeLe    DateTime @default(now())
  creePar   String
  modifieLe DateTime @updatedAt

  @@unique([fournisseurId, reference]) /// D-05 Détection doublon
  @@index([fournisseurId, statutFacture])
  @@index([projetId])
  @@index([dateEcheance])
  @@map("factures_fournisseur")
}

enum StatutFactureFournisseur {
  BROUILLON
  A_RECEVOIR      /// Facture enregistrée, attente réception
  A_VALIDER       /// Réception confirmée, attente validation
  A_VALIDER_DG    /// Validée gestionnaire, attente DG (si > seuil)
  A_PAYER         /// Validée, prête pour paiement
  PARTIELLE       /// Paiement partiel effectué
  SOLDEE          /// Montant payé = montant TTC
  REFUSEE
}
```

### Paiement Fournisseur

```prisma
/// M15 L2 — Paiement fournisseur (total ou partiel)
model PaiementFournisseur {
  id String @id @default(cuid())
  reference String @unique /// PF-2026-0001

  /// Facture(s) concernée(s) - une facture peut avoir plusieurs paiements partiels
  factureId String
  facture   FactureFournisseur @relation(fields: [factureId], references: [id])

  /// Fournisseur (dénormalisé pour requêtes rapides)
  fournisseurId String
  fournisseur   Fournisseur @relation(fields: [fournisseurId], references: [id])

  /// Montant de ce paiement (D-03)
  montantPaye Decimal @db.Decimal(12, 0)

  /// Mode
  modePaiement ModePaiementFournisseur

  /// Date paiement
  datePaiement Date

  /// Preuve (D-06)
  urlPreuve String?
  statutPaiement StatutPaiementFournisseur

  /// Lien ITApay (D-10)
  paiementItapayId String? @unique
  paiementItapay   Paiement? @relation(fields: [paiementItapayId], references: [id])

  /// Qui a effectué
  effectueParId String @db.Uuid
  effectueLe    DateTime @default(now())

  creeLe    DateTime @default(now())
  creePar   String
  modifieLe DateTime @updatedAt

  @@index([factureId])
  @@index([fournisseurId, datePaiement])
  @@map("paiements_fournisseur")
}

enum StatutPaiementFournisseur {
  EN_ATTENTE_PREUVE
  CONFIRME
}
```

### Extension Paiement ITApay

```prisma
/// M15 L1 — Paiement (extension pour M15 L2)
model Paiement {
  // ... champs existants ...

  /// Nouveau lien M15 L2
  paiementFournisseur PaiementFournisseur?

  // ...
}
```

---

## 3. Workflow détaillé

### Étape 1 : Enregistrement facture

**Qui** : Gestionnaire ou Comptabilité

1. Création `FactureFournisseur`
   - `statutFacture = BROUILLON`
   - Saisir : `fournisseurId`, `reference`, `montantHT`, `montantTVA`, `montantTTC`
   - `dateFacture`, `dateEcheance`
   - `projetId` (imputation)
   - Upload PDF/photo → `urlFacture`

2. Vérification doublon (D-05)
   - Si `[fournisseurId, reference]` existe → erreur

3. Soumission → `statutFacture = A_RECEVOIR`

### Étape 2 : Confirmation réception (D-01)

**Qui** : Logistique (matériaux), Chef chantier (services), Responsable garage (carburant)

1. Accès facture via notification ou liste "À recevoir"
2. Vérifier que biens/services correspondent à facture
3. Confirmer :
   - `receptionConfirmee = true`
   - `receptionneParId` = userId
   - `receptionneLe` = now()
   - Commentaire optionnel
   - `statutFacture = A_VALIDER`

### Étape 3 : Validation Gestionnaire

**Qui** : Gestionnaire

1. Accès liste "À valider"
2. Vérifier cohérence facture/réception
3. Valider :
   - `valideParId` = userId
   - `valideLe` = now()
   - Si `montantTTC > SEUIL_VALIDATION_DG` → `statutFacture = A_VALIDER_DG`
   - Sinon → `statutFacture = A_PAYER`

### Étape 4 : Validation DG (si > seuil) (D-02)

**Qui** : DG

1. Notification "Facture > seuil à valider"
2. Accès liste "Validation DG"
3. Valider :
   - `valideDgParId` = userId
   - `valideDgLe` = now()
   - `statutFacture = A_PAYER`

Ou refuser :
   - `statutFacture = REFUSEE`

### Étape 5 : Paiement (D-03, D-06, D-10)

**Qui** : Gestionnaire ou Comptabilité

1. Accès liste "À payer"
2. Créer `PaiementFournisseur` :
   - `factureId`
   - `montantPaye` (libre, <= `montantTTC - montantPaye`)
   - `modePaiement`
   - `datePaiement`
   - `statutPaiement = EN_ATTENTE_PREUVE`

3. Effectuer paiement réel (virement, Wave, etc.)

4. Upload preuve :
   - `urlPreuve` = reçu/justificatif
   - `statutPaiement = CONFIRME`

5. Créer `Paiement` ITApay lié (D-10) :
   - `typeOperation = DECAISSEMENT`
   - `montant = montantPaye`
   - `motif = "Facture [reference]"`
   - `beneficiaire = fournisseur.nom`
   - `lieuId = projetId` (imputation)
   - `paiementFournisseur.paiementItapayId = paiement.id`

6. Mise à jour facture :
   - `montantPaye += paiementFournisseur.montantPaye`
   - Si `montantPaye < montantTTC` → `statutFacture = PARTIELLE`
   - Si `montantPaye = montantTTC` → `statutFacture = SOLDEE`

### Étape 6 : Alertes (D-04)

**Automatique** :

- J-7 avant échéance : notification Gestionnaire + Comptabilité
- Facture en retard (`dateEcheance < now() && statutFacture != SOLDEE`) : notification quotidienne + badge rouge

---

## 4. Écrans requis

### `/paiements/fournisseurs` (nouveau)

**Tableau de bord**
- Indicateurs : Total dû, Factures en retard, À payer, Payé ce mois
- Onglets : Factures | Paiements | Fournisseurs

**Onglet Factures**
- Filtre : Statut, Fournisseur, Projet, Période
- Colonnes : Référence, Fournisseur, Date, Échéance, Montant TTC, Montant payé, Solde, Statut
- Badge rouge si retard
- Badge orange si J-7
- Actions : Voir, Confirmer réception, Valider, Payer

**Onglet Paiements**
- Liste tous paiements effectués
- Colonnes : Référence, Date, Fournisseur, Facture, Montant, Mode, Statut
- Filtre par période, fournisseur, mode

**Onglet Fournisseurs**
- Liste fournisseurs
- Colonnes : Nom, Catégorie, Solde dû, Nb factures, Contact
- Clic → fiche fournisseur

### `/paiements/fournisseurs/[id]` (fiche fournisseur) (D-09)

**En-tête**
- Nom, Catégorie, Contact, RCCM, Mode paiement préféré
- Indicateurs : Solde dû, Total payé, Nb factures

**Onglets**
- **Infos** : Coordonnées, historique modifications
- **Factures** : Toutes factures (filtre statut)
- **Paiements** : Tous paiements effectués
- **Solde** : Graphe évolution, détail par projet

### Modales

**`modal-facture-fournisseur.tsx`**
- Étape 1 : Fournisseur (combobox avec création inline), Référence
- Étape 2 : Montants (HT, TVA, TTC)
- Étape 3 : Dates (facture, échéance), Projet
- Étape 4 : Upload PDF/photo
- Bouton "Enregistrer" (brouillon) / "Soumettre"

**`modal-confirmer-reception.tsx`**
- Affiche facture
- Checkbox "Réception conforme"
- Commentaire optionnel
- Bouton "Confirmer réception"

**`modal-valider-facture.tsx`**
- Affiche facture, réception
- Si > seuil : message "Envoi au DG après validation"
- Bouton "Valider" / "Refuser"

**`modal-payer-facture.tsx`**
- Affiche facture, solde restant
- Saisir montant à payer (max = solde)
- Mode paiement
- Date paiement
- Upload preuve (reçu)
- Bouton "Enregistrer paiement"

**`modal-fournisseur.tsx`** (création/édition)
- Nom, Catégorie, Contact, RCCM, Adresse
- Numero Wave, Mode paiement préféré
- Bouton "Enregistrer"

---

## 5. Règles métier (DECISIONS-M15-L2.md)

Voir `DECISIONS-M15-L2.md` pour les 10 décisions applicables.

**Calculs clés** :

```typescript
// Solde facture
function calculerSolde(facture: FactureFournisseur): number {
  return facture.montantTTC - facture.montantPaye;
}

// Solde dû fournisseur (D-09)
function calculerSoldeDuFournisseur(fournisseurId: string): number {
  const factures = await prisma.factureFournisseur.findMany({
    where: {
      fournisseurId,
      statutFacture: { in: ["A_PAYER", "PARTIELLE"] },
    },
  });

  return factures.reduce((sum, f) => sum + calculerSolde(f), 0);
}

// Vérification seuil DG (D-02)
async function necessiteValidationDG(montantTTC: number): boolean {
  const params = await prisma.parametreSysteme.findUnique({
    where: { cle: "SEUIL_VALIDATION_DG_FOURNISSEUR" },
  });

  const seuil = parseInt(params?.valeur || "500000");
  return montantTTC > seuil;
}

// Détection retard (D-04)
function estEnRetard(facture: FactureFournisseur): boolean {
  if (!facture.dateEcheance || facture.statutFacture === "SOLDEE") {
    return false;
  }

  return new Date(facture.dateEcheance) < new Date();
}

// Alerte J-7 (D-04)
function procheEcheance(facture: FactureFournisseur): boolean {
  if (!facture.dateEcheance || facture.statutFacture === "SOLDEE") {
    return false;
  }

  const joursRestants = differenceInDays(
    new Date(facture.dateEcheance),
    new Date()
  );

  return joursRestants <= 7 && joursRestants >= 0;
}
```

---

## 6. Actions serveur requises

**`lib/actions/paiements-fournisseurs.ts`** (nouveau fichier)

```typescript
// Factures
export const creerFactureFournisseur = actionProtegee(...)
export const soumettreFactureFournisseur = actionProtegee(...)
export const confirmerReceptionFacture = actionProtegee(...)
export const validerFactureFournisseur = actionProtegee(...)
export const validerFactureFournisseurDG = actionProtegee(...)
export const refuserFactureFournisseur = actionProtegee(...)
export const listerFacturesFournisseur = actionProtegee(...)
export const getFactureFournisseur = actionProtegee(...)

// Paiements
export const creerPaiementFournisseur = actionProtegee(...)
export const confirmerPaiementFournisseur = actionProtegee(...) // Upload preuve
export const listerPaiementsFournisseur = actionProtegee(...)

// Fournisseurs (extensions de M14)
export const getFicheFournisseur = actionProtegee(...)
export const getSoldeDuFournisseur = actionProtegee(...)
export const getHistoriqueFournisseur = actionProtegee(...)

// Tableau de bord
export const getIndicateursFournisseurs = actionProtegee(...)
export const getFacturesEnRetard = actionProtegee(...)
export const getFacturesAPayer = actionProtegee(...)

// Notifications (cron job)
export const envoyerAlertesEcheances = actionProtegee(...) // J-7
export const envoyerAlertesRetards = actionProtegee(...) // Quotidien
```

---

## 7. Permissions

```typescript
"paiements:fournisseurs:creer"      // Gestionnaire, Comptabilité
"paiements:fournisseurs:valider"    // Gestionnaire
"paiements:fournisseurs:valider-dg" // DG
"paiements:fournisseurs:payer"      // Gestionnaire, Comptabilité
"paiements:fournisseurs:consulter"  // Tous
"paiements:fournisseurs:recevoir"   // Logistique, Chef chantier, Responsable garage
```

---

## 8. Notifications

**Automatiques** :
- Facture soumise → Logistique/Chef (pour réception)
- Réception confirmée → Gestionnaire
- Facture validée (< seuil) → Comptabilité
- Facture validée (> seuil) → DG
- Facture validée DG → Comptabilité
- J-7 échéance → Gestionnaire + Comptabilité
- Retard (quotidien) → Gestionnaire + DG

**Manuelles** :
- Paiement effectué → Fournisseur (optionnel)

---

## 9. Intégrations

**M14 Achats** :
- Lecture `Fournisseur`
- Possibilité future : lier `FactureFournisseur` à `DemandeAchat` via BC

**M15 L1 ITApay** :
- Création `Paiement` pour chaque `PaiementFournisseur`
- Imputation au `projetId`

**M13 Logistique** :
- Confirmation réception par Logistique (matériaux)

**M5 Projets** :
- Imputation comptable par projet
- Tableau de bord projet : agrégation factures fournisseurs

**M16 L2 Carburant** :
- Confirmation réception par Responsable garage (carburant)

---

## 10. Paramètres système requis

```typescript
{
  cle: "SEUIL_VALIDATION_DG_FOURNISSEUR",
  valeur: "500000", // FCFA
  type: "MONTANT",
  description: "Montant TTC au-delà duquel validation DG requise",
}
```

---

## 11. État actuel vs. Requis

**Existe déjà** :
- ✅ `Fournisseur` (M14, minimal)
- ✅ `Paiement` ITApay (M15 L1)

**À créer** :
- ❌ Extension `Fournisseur` (catégorie, mode paiement, contact, RCCM)
- ❌ `FactureFournisseur`
- ❌ `PaiementFournisseur`
- ❌ Enums (`StatutFactureFournisseur`, `StatutPaiementFournisseur`, `CategorieFournisseur`, `ModePaiementFournisseur`)
- ❌ Lien `Paiement.paiementFournisseur`
- ❌ Page `/paiements/fournisseurs`
- ❌ Page `/paiements/fournisseurs/[id]`
- ❌ Modales facture, réception, validation, paiement
- ❌ Actions serveur `lib/actions/paiements-fournisseurs.ts`
- ❌ Cron jobs alertes (J-7, retards)
- ❌ Paramètre système seuil DG

---

## 12. Migration requise

Créer migration `ajout_paiements_fournisseurs` :
- Extension `Fournisseur` : nouveaux champs
- Nouveaux modèles : `FactureFournisseur`, `PaiementFournisseur`
- Nouveaux enums
- Lien `Paiement.paiementFournisseur`
- Index performances
- Contrainte unique `[fournisseurId, reference]` (D-05)
