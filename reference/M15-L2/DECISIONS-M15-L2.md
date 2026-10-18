# DECISIONS-M15-L2.md — Paiements Fournisseurs

**Version** : 1.0
**Date** : 17 octobre 2026
**Module** : M15 L2 — Extension ITApay pour fournisseurs

---

## Décisions applicables

### D-01 · Pas de paiement sans réception confirmée

**Contexte** : Éviter de payer pour des marchandises/services non reçus.

**Décision** : Champ `receptionConfirmee = true` obligatoire avant autorisation de paiement.

**Raison** : Contrôle financier. La facture peut exister mais les biens/services non livrés.

**Conséquence** :
- Statut `FactureFournisseur.statutFacture` : `A_RECEVOIR` → `A_PAYER` → `PAYEE`
- Bouton "Payer" désactivé si `receptionConfirmee = false`
- Qui confirme : Logistique (matériaux), Chef chantier (services), Responsable garage (carburant)

---

### D-02 · Double validation au-delà du seuil

**Contexte** : Gros montants nécessitent contrôle DG.

**Décision** : Si `montantTTC > SEUIL_VALIDATION_DG`, validation DG obligatoire après Gestionnaire.

**Raison** : Délégation de pouvoir et contrôle budgétaire.

**Conséquence** :
- Champ `seuilValidationDG` dans paramètres système (ex: 500 000 FCFA)
- Workflow : Réception → Gestionnaire → [Si > seuil] DG → Paiement
- Champ `valideDgParId` + `valideDgLe` si applicable

---

### D-03 · Paiements partiels libres

**Contexte** : Échelonnement ou paiements en plusieurs fois selon trésorerie.

**Décision** : Le gestionnaire décide librement du montant payé à chaque fois, tant que `total payé <= montant facture`.

**Raison** : Flexibilité trésorerie.

**Conséquence** :
- Champ `FactureFournisseur.montantPaye` (cumul)
- Contrôle : `montantPaye + nouveauPaiement <= montantTTC`
- Statut passe à `SOLDEE` quand `montantPaye = montantTTC`

---

### D-04 · Alertes échéance et retard

**Contexte** : Éviter pénalités et détérioration relation fournisseur.

**Décision** : Alerte automatique à J-7 et si dépassement échéance.

**Raison** : Anticipation.

**Conséquence** :
- Notification gestionnaire + comptabilité à J-7
- Badge rouge sur facture si `dateEcheance < now() && statutFacture != SOLDEE`
- Tableau de bord : "X factures en retard"

---

### D-05 · Détection doublon référence facture

**Contexte** : Éviter paiement double d'une même facture.

**Décision** : Alerte si `referenceFacture` déjà saisie pour le même fournisseur.

**Raison** : Erreur de saisie ou fraude.

**Conséquence** :
- Contrainte unique : `[fournisseurId, referenceFacture]`
- Message d'erreur bloquant si doublon

---

### D-06 · Preuve de paiement obligatoire

**Contexte** : Traçabilité et audit.

**Décision** : Upload reçu/justificatif requis pour marquer paiement effectué.

**Raison** : Comptabilité et fiscalité.

**Conséquence** :
- Champ `PaiementFournisseur.urlPreuve` requis
- Statut `PaiementFournisseur.statutPaiement` : `EN_ATTENTE_PREUVE` → `CONFIRME`

---

### D-07 · Imputation comptable obligatoire

**Contexte** : Comptabilité analytique par chantier.

**Décision** : Toute facture est imputée à un chantier/projet.

**Raison** : Suivi coûts réels par projet.

**Conséquence** :
- Champ `FactureFournisseur.projetId` obligatoire
- Agrégation coûts dans tableau de bord projet (M5)

---

### D-08 · Fournisseur enrichi avec catégorie et mode paiement

**Contexte** : Le modèle `Fournisseur` actuel (M14) est minimal (nom, numeroWave).

**Décision** : Extension du modèle : `categorie`, `modePaiementPrefere`, `contact`, `rccm`.

**Raison** : Meilleure gestion et reporting (ex: "Dépenses par catégorie fournisseur").

**Conséquence** :
- Nouveaux champs dans `Fournisseur`
- `CategorieFournisseur` enum : `CARBURANT`, `MATERIAUX`, `LOCATION`, `SERVICES`, `AUTRE`
- `ModePaiementFournisseur` enum : `VIREMENT`, `MOBILE_MONEY`, `ESPECES`, `CHEQUE`

---

### D-09 · Historique fournisseur accessible

**Contexte** : Voir toutes les factures et paiements d'un fournisseur.

**Décision** : Page `/paiements/fournisseurs/[id]` affiche fiche fournisseur avec historique complet.

**Raison** : Relation commerciale et solde dû.

**Conséquence** :
- Onglets : Infos | Factures | Paiements | Solde dû
- Calcul : `soldeDu = SUM(montantTTC) - SUM(montantPaye)`

---

### D-10 · Lien avec ITApay (M15 L1)

**Contexte** : Les paiements fournisseurs utilisent le même système de paiement (Wave, caisse).

**Décision** : Un `PaiementFournisseur` crée un `Paiement` ITApay lié.

**Raison** : Unification flux de trésorerie.

**Conséquence** :
- `PaiementFournisseur.paiementItapayId` → `Paiement.id`
- Le paiement ITApay porte `motif = "Facture [ref]"` et `montant = montantPaye`

---

## Référentiel

**Champs sensibles** (audit obligatoire) :
- `FactureFournisseur.montantTTC`
- `PaiementFournisseur.montantPaye`
- `PaiementFournisseur.urlPreuve`

**Permissions requises** :
- `paiements:fournisseurs:creer` → Gestionnaire, Comptabilité
- `paiements:fournisseurs:valider` → Gestionnaire
- `paiements:fournisseurs:valider-dg` → DG
- `paiements:fournisseurs:payer` → Gestionnaire, Comptabilité
- `paiements:fournisseurs:consulter` → Tous

**Notifications automatiques** :
- Facture à J-7 échéance → Gestionnaire + Comptabilité
- Facture en retard → Gestionnaire + DG
- Réception confirmée → Gestionnaire
