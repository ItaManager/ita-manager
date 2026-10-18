# Seed Données Démo — M16 L2 Carburant

## Usage

```bash
# Seed uniquement M16 L2
tsx scripts/seed-carburant-demo.ts

# Seed tous les modules L2 (M15 + M16)
./scripts/seed-modules-l2.sh
```

---

## Données créées

### 4 Demandes de carburant

| Référence | Circuit | Véhicule/Engin | Montant/Quantité | Statut | Scénario |
|-----------|---------|----------------|------------------|--------|----------|
| CAR-2026-001 | STATION | Véhicule | 25 000 F | EN_ATTENTE | Demande en attente validation |
| CAR-2026-002 | STATION | Véhicule | 30 000 F | VALIDEE | Remise créée (EN_COURS) |
| CAR-2026-003 | GARAGE | Engin | 50 L | EN_ATTENTE | Demande garage |
| CAR-2026-004 | GARAGE | Véhicule | 40 L | VALIDEE | Prête pour distribution |

### 1 Remise station

| Demande | Montant remis | Mode | Statut | Scénario D-02 |
|---------|---------------|------|--------|---------------|
| CAR-2026-002 | 30 000 F | ARGENT | EN_COURS | En attente clôture avec reçu |

### 2 Demandes de rechargement garage

| Référence | Garage | Quantité | Statut | Livraison |
|-----------|--------|----------|--------|-----------|
| RCH-2026-001 | Garage principal | 500 L | EN_ATTENTE | — |
| RCH-2026-002 | Garage principal | 1 000 L | RECEPTIONNEE | ✓ Stock augmenté |

### 3 Distributions (pour calcul consommation)

| Véhicule | Quantité | Compteur | Plein complet | Date | Delta |
|----------|----------|----------|---------------|------|-------|
| Véhicule 1 | 45 L | 15 000 km | ✓ | -15 jours | — |
| Véhicule 1 | 48 L | 15 450 km | ✓ | -7 jours | 450 km → 10,7 L/100km |
| Véhicule 1 | 50 L | 15 920 km | ✓ | Aujourd'hui | 470 km → 10,6 L/100km |

**Consommation moyenne** : ~10,6 L/100km

---

## Scénarios testés (D-01 à D-10)

### ✅ D-01 : Trois circuits distincts
- **CAR-2026-001, CAR-2026-002** : Circuit STATION avec `montantEstime`
- **CAR-2026-003, CAR-2026-004** : Circuit GARAGE avec `quantiteLitres` et `garageId`
- Champs conditionnels selon le circuit

### ✅ D-02 : Montant remis exact obligatoire
- **Remise CAR-2026-002** : 30 000 F remis, EN_COURS
- Formule à respecter : `montantRemis = montantDepense + reliquat`
- Clôture impossible sans cette égalité

### ✅ D-03 : Reçu station obligatoire pour clôture
- Remise EN_COURS → pas de `urlRecu` encore
- Bouton "Clôturer" désactivé jusqu'à upload reçu
- Test manuel : ajouter reçu → clôturer

### ✅ D-04 : Compteur >= dernier relevé
- Distributions avec compteurs : 15 000 → 15 450 → 15 920 km
- Validation : compteur croissant
- Si recul → `compteurAnomalie = true` + motif requis

### ✅ D-05 : Consommation de référence par véhicule
- Calcul automatique : 10,6 L/100km
- Alerte si écart > 15% (ex: > 12,2 L/100km ou < 9,0 L/100km)
- Visible dans onglet Consommation

### ✅ D-06 : Stock garage insuffisant
- Garage avec stock mis à jour après RCH-2026-002 (+1 000 L)
- Validation côté client : `quantiteDemandee <= stockDisponible`
- Message erreur si stock insuffisant

### ✅ D-07 : Alerte seuil garage
- Si `stockActuel < seuilAlerte` → Badge rouge "Niveau bas"
- Test : après plusieurs distributions, stock descend
- Notification gestionnaire principal

### ✅ D-08 : Imputation comptable au chantier
- Toutes les demandes ont un `projetId`
- Champ requis dans formulaires
- Agrégation coûts par projet

### ✅ D-09 : Engins : compteur horaire, véhicules : kilométrage
- **Véhicule 1** : compteur KM (15 000 → 15 920 km)
- **Engin 1** : compteur HEURES (si distribué)
- Unité adaptée dans UI : "km ou heures"

### ✅ D-10 : Plein complet = borne de calcul
- 3 distributions avec `pleinComplet = true`
- Calcul consommation uniquement entre pleins complets
- Checkbox cochée par défaut dans modale distribution

---

## Indicateurs attendus

Après le seed, la page `/assistanat/carburant` devrait afficher :

### Onglet Demandes
```
┌─────────────┬─────────┬────────────┬──────────┬────────────┐
│ Référence   │ Circuit │ Matériel   │ Montant  │ Statut     │
├─────────────┼─────────┼────────────┼──────────┼────────────┤
│ CAR-2026-001│ STATION │ Véhicule 1 │ 25 000 F │ EN_ATTENTE │
│ CAR-2026-002│ STATION │ Véhicule 1 │ 30 000 F │ VALIDEE    │
│ CAR-2026-003│ GARAGE  │ Engin 1    │ 50 L     │ EN_ATTENTE │
│ CAR-2026-004│ GARAGE  │ Véhicule 1 │ 40 L     │ VALIDEE    │
└─────────────┴─────────┴────────────┴──────────┴────────────┘
```

### Onglet Garages
```
┌──────────────┬────────────┬──────────────┬────────┬────────────┐
│ Garage       │ Capacité   │ Stock actuel │ Seuil  │ Alertes    │
├──────────────┼────────────┼──────────────┼────────┼────────────┤
│ Garage princ.│ 5 000 L    │ 1 000 L      │ 20%    │ ⚠️  Niveau │
│              │            │              │(1000L) │    correct │
└──────────────┴────────────┴──────────────┴────────┴────────────┘
```

### Onglet Rechargements
```
┌──────────────┬──────────────┬────────────┬──────────────┬─────────────┐
│ Référence    │ Garage       │ Quantité   │ Statut       │ Livraison   │
├──────────────┼──────────────┼────────────┼──────────────┼─────────────┤
│ RCH-2026-001 │ Garage princ.│ 500 L      │ EN_ATTENTE   │ —           │
│ RCH-2026-002 │ Garage princ.│ 1 000 L    │ RECEPTIONNEE │ 1 000 L ✓   │
└──────────────┴──────────────┴────────────┴──────────────┴─────────────┘
```

### Onglet Consommation
```
┌────────────┬───────────────┬──────────────┬──────────┬────────────┐
│ Matériel   │ Consommation  │ Référence    │ Écart    │ Sévérité   │
├────────────┼───────────────┼──────────────┼──────────┼────────────┤
│ Véhicule 1 │ 10,6 L/100km  │ 9,0 L/100km  │ +17,8%   │ ⚠️  Élevée  │
└────────────┴───────────────┴──────────────┴──────────┴────────────┘
```

---

## Tests manuels recommandés

### 1. Workflow demande STATION complète
```
1. Accéder à /assistanat/carburant
2. Créer nouvelle demande → Circuit STATION
3. Saisir : véhicule, montant estimé 20 000 F, justification
4. Soumettre → vérifier statut EN_ATTENTE
5. Valider → modale validation
6. Mode remise : ARGENT, montant 20 000 F
7. Soumettre → vérifier création remise EN_COURS
8. Clôturer remise → modale clôture
9. Saisir montant dépensé : 18 500 F, reliquat : 1 500 F
10. Upload reçu → soumettre
11. Vérifier formule : 20 000 = 18 500 + 1 500 ✓
12. Vérifier statut remise CLOTURE
```

### 2. Workflow demande GARAGE (D-06)
```
1. Créer demande → Circuit GARAGE
2. Sélectionner garage → afficher stock disponible
3. Saisir quantité > stock → vérifier erreur client
4. Corriger quantité ≤ stock → soumettre OK
5. Valider demande → prête pour distribution
6. Distribuer → modale distribution garage
7. Saisir compteur >= dernier → soumettre
8. Vérifier stock garage diminué
```

### 3. Test compteur anomalie (D-04)
```
1. Distribution garage → saisir compteur
2. Dernier compteur affiché : 15 920 km
3. Saisir 15 500 km (recul) → alerte rouge
4. Message : "Compteur inférieur au dernier relevé (15 920 km). Anomalie sera enregistrée"
5. Champ motif devient visible et requis
6. Saisir motif : "Erreur compteur réparé" → soumettre
7. Vérifier `compteurAnomalie = true` en base
```

### 4. Test seuil garage (D-07)
```
1. Onglet Garages → voir garage avec stock actuel
2. Plusieurs distributions successives pour faire baisser stock
3. Quand stock < seuilAlerte (ex: < 1 000 L si seuil 20% de 5 000 L)
4. Badge rouge "Niveau bas" apparaît
5. Message : "950 L / 5 000 L (19%)"
6. Notification envoyée au gestionnaire
```

### 5. Calcul consommation (D-05, D-10)
```
1. Onglet Consommation → tableau véhicules
2. Véhicule 1 : consommation calculée 10,6 L/100km
3. Si référence constructeur : 9,0 L/100km
4. Écart : (10,6 - 9,0) / 9,0 = +17,8%
5. Sévérité : Élevée (> 15%)
6. Badge orange visible
```

### 6. Rechargement garage
```
1. Onglet Rechargements → créer demande
2. Sélectionner garage, quantité 500 L
3. Soumettre → statut EN_ATTENTE
4. Valider → modale validation
5. Soumettre → statut VALIDEE
6. Réceptionner → modale réception
7. Quantité livrée : 500 L (peut différer de demandée)
8. Soumettre → vérifier :
   - Statut RECEPTIONNEE
   - Stock garage augmenté de 500 L
```

---

## Nettoyage

Pour supprimer les données démo :

```sql
-- Ordre important (contraintes FK)
DELETE FROM "distributions_carburant";
DELETE FROM "remises_station";
DELETE FROM "demandes_rechargement";
DELETE FROM "demandes_carburant";
```

Ou relancer le seed (il nettoie automatiquement avant de recréer).

---

## Données pré-requises

Le seed nécessite :
- ✅ Au moins 5 employés
- ✅ Au moins 2 matériels (1 VEHICULE_LEGER, 1 ENGIN)
- ✅ Au moins 1 projet actif (statut EN_COURS)
- ✅ Au moins 1 lieu de stockage type GARAGE

Si ces données manquent, lancer d'abord :
```bash
npx prisma db seed  # Seed de base du projet
```
