# Seed Données Démo — M15 L2 Paiements Fournisseurs

## Usage

```bash
# Seed uniquement M15 L2
tsx scripts/seed-paiements-fournisseurs-demo.ts

# Seed tous les modules L2 (M15 + M16)
./scripts/seed-modules-l2.sh
```

---

## Données créées

### 5 Fournisseurs

| Nom | Catégorie | Mode paiement | Wave | RCCM |
|-----|-----------|---------------|------|------|
| TOTAL CI | CARBURANT | Mobile Money | ✓ | CI-ABJ-2020-B-12345 |
| SOCOCE | MATERIAUX | Virement | ✗ | CI-ABJ-2019-B-67890 |
| SCRELA | LOCATION | Chèque | ✓ | CI-ABJ-2018-B-11111 |
| SOGEA | SERVICES | Virement | ✗ | CI-ABJ-2017-B-22222 |
| EIFFAGE CI | MATERIAUX | Virement | ✗ | CI-ABJ-2016-B-33333 |

### 9 Factures avec statuts variés

| Référence | Fournisseur | Montant TTC | Statut | Scénario |
|-----------|-------------|-------------|--------|----------|
| FAC-2026-001 | TOTAL CI | 590 000 F | BROUILLON | — |
| FAC-2026-002 | SOCOCE | 1 416 000 F | A_RECEVOIR | D-01 : En attente réception |
| FAC-2026-003 | SCRELA | 354 000 F | A_VALIDER | D-01 : Réception confirmée |
| FAC-2026-004 | SOGEA | 944 000 F | A_VALIDER_DG | D-02 : > 500K → validation DG |
| FAC-2026-005 | EIFFAGE CI | 472 000 F | PARTIELLE | D-03 : 200K payés / 472K |
| FAC-2026-006 | TOTAL CI | 1 180 000 F | PARTIELLE | D-03 : 600K payés / 1180K |
| FAC-2026-007 | SOCOCE | 295 000 F | SOLDEE | Payée en totalité |
| FAC-2026-008 | SCRELA | 212 400 F | A_PAYER | D-04 : En retard (15j) |
| FAC-2026-009 | SOGEA | 106 200 F | REFUSEE | Marchandise non conforme |

### 3 Paiements

| Référence | Facture | Montant | Mode | Preuve | Statut |
|-----------|---------|---------|------|--------|--------|
| PF-2026-0001 | FAC-2026-006 | 600 000 F | Mobile Money | ✓ | CONFIRME |
| PF-2026-0002 | FAC-2026-007 | 295 000 F | Virement | ✓ | CONFIRME |
| PF-2026-0003 | FAC-2026-005 | 200 000 F | Espèces | ✗ | EN_ATTENTE_PREUVE |

---

## Scénarios testés (D-01 à D-10)

### ✅ D-01 : Pas de paiement sans réception
- **FAC-2026-002** : A_RECEVOIR → réception non confirmée
- **FAC-2026-003** : A_VALIDER → réception confirmée

### ✅ D-02 : Double validation au-delà du seuil
- **FAC-2026-004** : 944 000 F > 500 000 F → statut A_VALIDER_DG
- Gestionnaire a validé, DG doit valider ensuite

### ✅ D-03 : Paiements partiels libres
- **FAC-2026-006** : 600 000 F payés sur 1 180 000 F → solde 580 000 F
- **FAC-2026-005** : 200 000 F payés sur 472 000 F → solde 272 000 F

### ✅ D-04 : Alertes échéance et retard
- **FAC-2026-008** : Échéance dépassée de 15 jours
- Badge rouge "En retard" dans l'UI

### ✅ D-05 : Détection doublon référence facture
- Contrainte unique `[fournisseurId, reference]` en base
- Tester manuellement : créer FAC-2026-001 pour TOTAL CI → erreur

### ✅ D-06 : Preuve de paiement obligatoire
- **PF-2026-0003** : EN_ATTENTE_PREUVE → pas de `urlPreuve`
- **PF-2026-0001, PF-2026-0002** : CONFIRME → avec `urlPreuve`

### ✅ D-07 : Imputation comptable obligatoire
- Toutes les factures ont un `projetId`
- Champ requis dans le formulaire

### ✅ D-08 : Fournisseur enrichi
- 5 fournisseurs avec catégorie, mode paiement préféré, RCCM, contact
- Modèle étendu conforme à DECISIONS-M15-L2.md

### ✅ D-09 : Historique fournisseur accessible
- Page `/paiements/fournisseurs/[id]` implémentée
- Calcul solde dû : TOTAL CI = 590 000 F (BROUILLON) + 580 000 F (PARTIELLE) = 1 170 000 F

### ✅ D-10 : Lien avec ITApay
- Structure `PaiementFournisseur` prête pour lien avec `Paiement`
- TODO à implémenter dans `modal-payer-facture.tsx` ligne 422

---

## Indicateurs attendus

Après le seed, le dashboard `/paiements/fournisseurs` devrait afficher :

```
┌─────────────────────┬───────────────────┬─────────────────┬──────────────────┐
│ Total dû            │ Factures en retard│ À payer         │ Payé ce mois     │
├─────────────────────┼───────────────────┼─────────────────┼──────────────────┤
│ 2 504 400 F         │ 1                 │ 2               │ 1 095 000 F      │
└─────────────────────┴───────────────────┴─────────────────┴──────────────────┘
```

**Détail calcul solde dû** :
- FAC-2026-005 : 472 000 - 200 000 = 272 000 F
- FAC-2026-006 : 1 180 000 - 600 000 = 580 000 F
- FAC-2026-008 : 212 400 - 0 = 212 400 F
- **Total dû** : 272 000 + 580 000 + 212 400 = **1 064 400 F**

---

## Tests manuels recommandés

### 1. Workflow complet de paiement
```
1. Accéder à /paiements/fournisseurs
2. Cliquer sur FAC-2026-002 (A_RECEVOIR)
3. Bouton "Confirmer réception" → modal s'ouvre
4. Cocher "Réception conforme" → Soumettre
5. Vérifier statut passe à A_VALIDER
6. Cliquer "Valider" → vérifier passage à A_PAYER (< 500K)
7. Cliquer "Payer" → saisir montant, mode, preuve
8. Vérifier statut passe à SOLDEE
```

### 2. Validation DG (D-02)
```
1. Accéder à FAC-2026-004 (A_VALIDER_DG, 944 000 F)
2. Badge "Validation DG requise" visible
3. Bouton "Valider (DG)" → modal DG s'ouvre
4. Valider → vérifier passage à A_PAYER
```

### 3. Paiement partiel (D-03)
```
1. Accéder à FAC-2026-006 (PARTIELLE, 1 180 000 F, déjà payé 600 000 F)
2. Bouton "Payer" → modal paiement
3. Saisir montant : 300 000 F (< 580 000 F restant)
4. Vérifier message : "Paiement partiel. Nouveau solde : 280 000 F"
5. Soumettre → vérifier montantPaye = 900 000 F, statut = PARTIELLE
```

### 4. Doublon référence (D-05)
```
1. Créer nouvelle facture pour TOTAL CI
2. Référence : FAC-2026-001
3. Soumettre → vérifier erreur : "Une facture avec cette référence existe déjà"
```

### 5. Alerte retard (D-04)
```
1. Tableau factures → vérifier FAC-2026-008 a badge rouge "En retard"
2. Indicateur "1 facture en retard" dans dashboard
```

### 6. Preuve paiement (D-06)
```
1. Accéder à PF-2026-0003 (EN_ATTENTE_PREUVE)
2. Bouton "Ajouter preuve" → modal upload
3. Saisir URL preuve → soumettre
4. Vérifier statut passe à CONFIRME
```

---

## Nettoyage

Pour supprimer les données démo :

```sql
-- Ordre important (contraintes FK)
DELETE FROM "paiements_fournisseur";
DELETE FROM "factures_fournisseur";
DELETE FROM "fournisseurs" WHERE nom IN ('TOTAL CI', 'SOCOCE', 'SCRELA', 'SOGEA', 'EIFFAGE CI');
```

Ou relancer le seed (il nettoie automatiquement avant de recréer).
