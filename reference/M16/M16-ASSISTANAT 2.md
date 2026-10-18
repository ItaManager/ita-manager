# M16 — Assistanat de Direction

**Statut** : à cadrer · **Prérequis** : M2, M13 · **Bloque** : rien
**Version cible** : `v1.3.0` · **Rédigé le** : 2 août 2026

> Trois activités sans rapport entre elles, tenues par la même personne :
> **le carburant**, **le registre des visiteurs**, **le courrier**.
>
> Les trois sont cadrées. Le carburant est le plus lourd — c'est le seul qui
> touche aux stocks et aux compteurs.

---

## 1. Le module en une page

### 1.1 · Un seul type d'utilisateur

**Le demandeur n'a pas de compte.** Il vient voir l'Assistante de Direction,
qui saisit pour lui.

C'est la décision qui simplifie tout : pas de circuit de validation, pas
d'écran de suivi personnel, pas de notification.

| Qui | Où | Fait quoi |
| --- | --- | --- |
| **Assistante de Direction** | Siège | Saisit les distributions, réapprovisionne |
| **Gestionnaire de stock** | Garage, chantier | Distribue depuis sa cuve |
| Chef de Service Logistique · Chef du Garage · DT | — | **Consultent** le tableau de consommation |

### 1.2 · Deux natures de sortie

C'est la distinction structurante du bloc carburant.

| Nature | Ce qui se passe | Effet |
| --- | --- | --- |
| **Station-service** | Le véhicule fait le plein chez un prestataire | **Une dépense.** Aucun stock ITA n'est touché. |
| **Cuve** | Le carburant sort d'un lieu de stockage | **Un mouvement de stock.** Le solde baisse. |

Le formulaire est le même ; ce qui se passe derrière diffère.

### 1.3 · Pas de plafond, pas de validation — **arrêté**

N'importe quel détenteur de véhicule peut obtenir du carburant. L'Assistante
sert.

**Le contrôle est ailleurs** : dans le tableau de consommation. Un véhicule
qui passe de 8,7 à 14 L/100 se voit, même sans validation préalable.

> Bloquer une demande de carburant immobiliserait un chantier pour une
> dépense de fonctionnement. Le contrôle par la visibilité vaut mieux que le
> contrôle par le blocage.

---

## 2. Le kilométrage — la donnée qui compte

Chaque distribution enregistre le **compteur au moment de la demande**.

C'est ce qui permet de calculer la consommation, et c'est aussi un
`ReleveCompteur` qui alimente M13.

### 2.1 · Le calcul

Entre **deux pleins complets consécutifs**, en additionnant tous les litres de
l'intervalle.

```
12 juin   45 200 km   60 L   plein complet    ← départ
18 juin   45 450 km   30 L   partiel
28 juin   45 890 km   55 L   plein complet    ← arrivée
                             ─────
          690 km parcourus, 90 L consommés  →  13,0 L / 100 km
```

**Les partiels ne sont pas perdus** — ils sont inclus dans l'intervalle. La
méthode reste juste quel que soit leur nombre.

### 2.2 · Le plein complet — une case à cocher

Cochée par défaut. C'est ce qui borne l'intervalle.

Un véhicule qui n'a que des partiels affiche **« en attente d'un plein
complet »**, jamais un chiffre faux.

### 2.3 · Compteur en recul

Même règle qu'en M13 : **signalé, jamais refusé**.

Le relevé est enregistré avec `anomalie = true`, un motif est demandé —
compteur remplacé, erreur corrigée — et **le calcul saute cet intervalle**.

C'est ce qui distingue une panne d'un trafic.

### 2.4 · Deux unités, jamais mélangées

| Matériel | Compteur | Consommation |
| --- | --- | --- |
| Véhicule | Kilométrage | **L / 100 km** |
| Engin | Compteur horaire | **L / h** |

Le champ s'adapte au type de matériel. Le tableau filtre par type et ne
mélange jamais les deux unités dans une colonne.

### 2.5 · Le relevé alimente M13

```prisma
enum SourceReleve {
  INSPECTION
  SAISIE_GARAGE
  RELEVE_ACTIVITE
  CARBURANT          /// ← ajouté par M16
}
```

**Un seul modèle `ReleveCompteur`, deux modules qui l'écrivent** — comme
`DemandeRessource` entre M8 et M13.

Le kilométrage saisi ici apparaît sur la fiche matériel et alimente le
programme de vidange.

---

## 3. La boucle avec M14 et M13

```
Cuve basse
    ↓
M16 alerte l'Assistante
    ↓
M14 demande d'achat — le carburant est un ArticleStock
    ↓
M13 réception — entrée en stock
    ↓
M16 distribue
```

**Quatre modules, une seule ressource.** Le carburant n'est pas dupliqué : il
vit dans `ArticleStock` de M13, et M16 en enregistre les sorties.

---

## 4. Écrans

| Écran | Route | Permission | Compteur |
| --- | --- | --- | --- |
| Nouvelle distribution | `/assistanat/carburant/nouvelle` | `carburant:distribuer` | — |
| Distributions | `/assistanat/carburant` | `carburant:distribuer` | — |
| **Consommation** | `/assistanat/carburant/consommation` | `carburant:consulter` | 🔴 anomalies |
| Cuves et stocks | `/assistanat/carburant/stocks` | `carburant:distribuer` | 🔴 seuils |
| Stations-service | `/assistanat/carburant/stations` | `referentiel:creer` | — |
| **Registre des visiteurs** | `/assistanat/visiteurs` | `visiteur:enregistrer` | 🔴 présents |
| Historique des visites | `/assistanat/visiteurs/historique` | `visiteur:enregistrer` | — |
| Courrier arrivée | `/assistanat/courrier/arrivee` | `courrier:enregistrer` | — |
| Courrier départ | `/assistanat/courrier/depart` | `courrier:enregistrer` | — |
| **Courrier à traiter** | `/assistanat/courrier/a-traiter` | `courrier:enregistrer` | 🔴 |

### 4.0 · Arborescence de navigation

Neuf entrées, en trois blocs — un par activité.

```
Assistanat
├─ Carburant · nouvelle distribution   carburant:distribuer
├─ Carburant · distributions           carburant:distribuer
├─ Consommation                    🔴  carburant:consulter
├─ Cuves et stocks                 🔴  carburant:distribuer
│
├─ Visiteurs                       🔴  visiteur:enregistrer
├─ Historique des visites              visiteur:enregistrer
│
├─ Courrier arrivée                    courrier:enregistrer
├─ Courrier départ                     courrier:enregistrer
├─ Courrier à traiter              🔴  courrier:enregistrer
│
└─ Stations-service                    referentiel:creer
```

**Quatre compteurs** : anomalies de consommation, cuves sous seuil, visiteurs
présents, courriers à traiter.

#### Ce que chaque rôle voit

| Rôle | Entrées |
| --- | --- |
| **Assistante de Direction** | Tout |
| Gestionnaire de stocks | Nouvelle distribution · Distributions · Cuves |
| Chef de Service Logistique · Chef du Garage | **Consommation** seulement |
| Directeur Technique | Consommation |
| Chef de service | **Courrier à traiter** — les siens |

> Le tableau de consommation est le seul écran ouvert hors de l'Assistanat.
> C'est la Logistique que la surconsommation d'un engin intéresse.

### 4.1 · Formulaire de distribution

Un seul, pour les deux natures.

| Champ | Note |
| --- | --- |
| Demandeur | **Autocomplétation sur les employés** — M2 |
| Matériel | Autocomplétation sur le parc — M13 |
| Type de carburant | Gasoil, super, mélange |
| Quantité | Litres |
| Montant | Optionnel en cuve, requis en station |
| **Compteur** | Kilométrage ou heures selon le type de matériel |
| **Plein complet** | Case à cocher, **cochée par défaut** |
| Nature | **Station-service** ou **Cuve** |
| Station · ou lieu de stockage | Selon la nature |
| Date | Défaut : aujourd'hui |

**Le compteur précédent est rappelé sous le champ** — « dernier relevé :
45 200 km le 12 juin ». C'est ce qui rend une faute de frappe visible à la
saisie.

### 4.2 · Tableau de consommation

L'écran qui donne sa valeur au module.

| Matériel | Type | Dernier plein | Moyenne | Dernier calcul | Écart |
| --- | --- | --- | --- | --- | --- |
| AK-PICK006 | VL | 28/06 · 45 890 km | 8,7 L/100 | 13,0 L/100 | **+49 %** |
| AK-VL102 | VL | 25/06 · 12 340 km | 9,2 L/100 | 9,4 L/100 | +2 % |
| AK-CHG01 | Engin | 20/06 · 1 204 h | 14,2 L/h | 13,8 L/h | −3 % |
| AK-PL004 | PL | 30/06 · 98 200 km | — | — | en attente d'un plein complet |

**C'est l'écart qui a de la valeur.** Une hausse brutale signale une panne, un
vol, ou une saisie fausse.

Seuil d'alerte proposé : **+25 %** par rapport à la moyenne. Paramétrable.

Filtres : type de matériel, période, lieu, anomalies seulement.

### 4.3 · Cuves et stocks

Une ligne par lieu de stockage détenant du carburant, avec son solde calculé
et son seuil d'alerte.

Un bouton **« Réapprovisionner »** crée une demande d'achat dans M14,
pré-remplie.

---

## 5. Modèle de données

`DistributionCarburant` · `StationService` · `TypeCarburant`

Le reste réutilise M13 : `ArticleStock`, `MouvementStock`, `LieuStockage`,
`ReleveCompteur`, `Materiel`.

### 5.1 · La distribution

```prisma
model DistributionCarburant {
  id             String   @id @default(uuid())
  reference      String   @unique      /// DC-2026-0001

  /// Qui est venu — lien vers M2, pas un texte libre
  demandeurId    String
  demandeur      Employe  @relation(fields: [demandeurId], references: [id])

  /// Pour quel matériel — lien vers M13
  materielId     String
  materiel       Materiel @relation(fields: [materielId], references: [id])

  typeCarburantId String
  quantite       Decimal  @db.Decimal(10, 2)   /// Litres
  montant        Decimal? @db.Decimal(12, 0)

  /// Compteur au moment de la demande
  compteur       Decimal  @db.Decimal(10, 2)
  uniteCompteur  UniteCompteur              /// KILOMETRE | HEURE
  pleinComplet   Boolean  @default(true)    /// Borne l'intervalle de calcul
  compteurAnomalie Boolean @default(false)  /// Recul détecté
  motifAnomalie  String?

  /// Nature — deux circuits distincts
  nature         NatureDistribution         /// STATION | CUVE
  stationId      String?                    /// Si STATION
  lieuStockageId String?                    /// Si CUVE
  mouvementStockId String? @unique          /// Si CUVE — le mouvement créé

  /// Qui a servi
  serviParId     String
  dateDistribution DateTime @db.Date

  /// Le relevé de compteur créé dans M13
  releveCompteurId String? @unique

  @@index([materielId, dateDistribution])
  @@index([demandeurId])
  @@map("distributions_carburant")
}

enum NatureDistribution {
  STATION   /// Dépense — aucun stock ITA touché
  CUVE      /// Mouvement de stock — le solde baisse
}
```

### 5.2 · La station-service — référentiel simple

```prisma
model StationService {
  id          String  @id @default(uuid())
  libelle     String  @unique
  libelleNormalise String @unique   /// Création inline sans doublon
  localisation String?
  actif       Boolean @default(true)
}
```

Création inline — R-04.

### 5.3 · Ce qui ne se stocke pas

**La consommation.** Elle se calcule depuis les distributions.

Un chiffre stocké deviendrait faux dès qu'une distribution serait corrigée ou
qu'un plein complet serait ajouté entre deux.

Même raisonnement que le solde de stock en M13 et le solde de congés en M3.

---

## 6. Règles métier

### 6.1 · Une distribution en cuve crée un mouvement de stock

`MouvementStock` de sens `SORTIE`, sur le lieu concerné. Le solde baisse
automatiquement.

**Une distribution en station n'en crée aucun** — le carburant n'a jamais été
chez ITA.

### 6.2 · Toute distribution crée un relevé de compteur

`ReleveCompteur` de source `CARBURANT`, lié à la distribution.

Il apparaît sur la fiche matériel de M13 et alimente le programme de vidange.

### 6.3 · Le compteur en recul est signalé

Comparé au dernier relevé du matériel, toutes sources confondues.

S'il recule : `anomalie = true`, motif demandé, **l'intervalle est exclu du
calcul de consommation**.

### 6.4 · La consommation se calcule entre pleins complets

Deux `pleinComplet = true` consécutifs bornent l'intervalle. Tous les litres
de l'intervalle sont additionnés, y compris ceux des partiels.

**Sans deux pleins complets, aucune consommation n'est affichée.** Un tiret et
la mention « en attente d'un plein complet ».

### 6.5 · Une cuve sous son seuil alerte

Notification à l'Assistante, et affichage au tableau de bord.

Le bouton de réapprovisionnement crée une demande d'achat dans M14,
pré-remplie avec l'article, la quantité manquante et le lieu de livraison.

### 6.6 · Ni plafond, ni validation

Décision 1.3. Le contrôle est dans le tableau de consommation.

### 6.7 · Une distribution se corrige, ne se supprime pas

Une correction crée une ligne rectificative liée à l'originale, avec motif.
Le mouvement de stock et le relevé de compteur sont ajustés en conséquence.

**Motif** : une distribution supprimée fausserait rétroactivement toutes les
consommations calculées depuis.

---

## 7. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `carburant:distribuer` | Saisir une distribution | ADMIN, **Assistante de Direction**, Gestionnaire de stocks |
| `carburant:consulter` | Tableau de consommation | ADMIN, DG, DT, **Chef de Service Logistique**, **Chef du Garage**, Assistante |
| `carburant:reapprovisionner` | Créer la demande d'achat | ADMIN, Assistante de Direction |
| `carburant:parametres` | Seuils, types de carburant | ADMIN |
| `visiteur:enregistrer` | Registre des visiteurs | ADMIN, **Assistante de Direction** |
| `courrier:enregistrer` | Registres du courrier | ADMIN, **Assistante de Direction** |
| `courrier:traiter` | Marquer un courrier traité | ADMIN, Assistante, chefs de service |

> **Le tableau de consommation est ouvert à la Logistique.** C'est elle que la
> surconsommation d'un engin intéresse — décision confirmée.

---

## 8. Critères de recette

### Distribution

- [ ] Saisir une distribution en moins d'une minute
- [ ] Le demandeur se choisit dans la **liste des employés**, pas en texte libre
- [ ] Le matériel se choisit dans le parc M13
- [ ] Le champ compteur affiche **kilométrage** pour un véhicule, **heures** pour un engin
- [ ] **Le dernier relevé est rappelé sous le champ**
- [ ] La case « plein complet » est cochée par défaut
- [ ] Choisir « station » demande une station, pas un lieu
- [ ] Choisir « cuve » demande un lieu, pas une station

### Effets

- [ ] **Une distribution en cuve fait baisser le solde du lieu**
- [ ] Une distribution en station **ne touche aucun stock**
- [ ] Toute distribution crée un `ReleveCompteur` de source `CARBURANT`
- [ ] Le relevé apparaît sur la fiche matériel de M13
- [ ] Un compteur en recul est **signalé, non refusé**
- [ ] Un motif est demandé sur une anomalie

### Consommation

- [ ] Deux pleins complets consécutifs produisent une consommation
- [ ] **Les litres des partiels intermédiaires sont inclus**
- [ ] Un véhicule sans deux pleins complets affiche « en attente »
- [ ] Un intervalle contenant une anomalie de compteur est **exclu**
- [ ] Un véhicule affiche L/100 km, un engin L/h
- [ ] **Les deux unités ne se mélangent jamais dans une colonne**
- [ ] Un écart supérieur à 25 % est signalé, **avec son libellé**

### Stocks

- [ ] Le solde d'une cuve se calcule depuis les mouvements
- [ ] Une cuve sous son seuil apparaît au tableau de bord
- [ ] Le réapprovisionnement crée une demande d'achat M14 pré-remplie
- [ ] Le réapprovisionnement ne crée pas d'entrée de stock — c'est la réception M13 qui le fait

### Corrections

- [ ] Une distribution ne se supprime pas
- [ ] Une correction crée une ligne rectificative avec motif
- [ ] Le mouvement de stock et le relevé sont ajustés

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m16.ts` écrit, exécuté, **vu échouer** une fois

---

## 9. Points de vigilance

1. **Deux natures, deux effets.** Station = dépense, cuve = mouvement de stock.
2. **La consommation se calcule**, jamais stockée.
3. **Le plein complet borne l'intervalle.** Les partiels y sont inclus.
4. **Le compteur en recul est signalé, pas refusé** — et son intervalle est exclu.
5. **Litres par 100 km ou par heure**, jamais mélangés.
6. **Le carburant vit dans `ArticleStock` de M13.** M16 n'a pas sa propre table de stock.
7. **Une distribution ne se supprime pas** — elle fausserait les consommations passées.
8. **Aucune validation, aucun plafond.** Le contrôle est dans le tableau.

---

## 10. Les deux autres blocs

### 10.1 · Registre des visiteurs — **cadré**

Deux gestes : on note l'arrivée, on note le départ.

#### Un seul écran

```
┌─ Visiteurs · aujourd'hui ────────────────────────┐
│                                                   │
│  [ + Nouvelle visite ]        3 présents          │
│                                                   │
│  ● KOUAME Bernard        SOCIMAT CI               │
│    → OUATTARA Marc       arrivé 09 h 12   [Sortie]│
│                                                   │
│  ● DIALLO Fatou          Cabinet Audit CI         │
│    → KONAN Jules         arrivé 10 h 45   [Sortie]│
│                                                   │
│  ○ TRAORÉ Sekou          Livraison                │
│    → Magasin        08 h 30 — 08 h 52             │
└───────────────────────────────────────────────────┘
```

Point plein pour les présents, point vide pour les partis. Le bouton
**Sortie** enregistre l'heure d'un clic.

#### Le formulaire — six champs

| Champ | Note |
| --- | --- |
| Nom et prénom | Texte libre |
| Société | **Autocomplétation créable** — les habitués reviennent |
| **Personne visitée** | **Autocomplétation sur les employés** — M2 |
| Motif | Rendez-vous · livraison · entretien · autre |
| Téléphone | Facultatif |
| Pièce déposée | Case à cocher — CNI, permis, badge |

L'heure d'arrivée est automatique.

#### Modèle

```prisma
model Visite {
  id            String   @id @default(uuid())

  nomVisiteur   String
  societe       String?
  telephone     String?

  /// Qui est visité — lien vers M2
  visiteId      String
  visite        Employe  @relation(fields: [visiteId], references: [id])

  motif         MotifVisite
  pieceDeposee  Boolean  @default(false)

  arriveeLe     DateTime @default(now())
  sortieLe      DateTime?

  saisieParId   String

  @@index([arriveeLe])
  @@index([sortieLe])
  @@map("visites")
}

enum MotifVisite {
  RENDEZ_VOUS
  LIVRAISON
  ENTRETIEN
  AUTRE
}
```

#### Trois règles

**Savoir qui est dans les locaux.** C'est la raison d'être du registre — en
cas d'incendie, la liste des présents doit être immédiate.

**Les habitués se ressaisissent en deux secondes.** Taper « Kouame » propose
la dernière visite avec sa société et sa pièce déposée.

**Une visite sans sortie ressort en anomalie** le lendemain. Soit on a oublié
de la fermer, soit quelqu'un est resté.

#### ⚠️ Données personnelles de tiers

Un registre de visiteurs contient des données de personnes qui ne sont ni
employés ni clients.

`SECURITE.md` § 11 et la déclaration ARTCI s'y appliquent.

| Règle | Valeur |
| --- | --- |
| Conservation | **3 mois**, purge automatique |
| Accès | Assistante de Direction, ADMIN |
| Journalisation | Toute consultation de l'historique |

**Au-delà de trois mois, l'information ne sert plus.** La purge est une étape
de la tâche quotidienne.

> Ne jamais conserver une pièce d'identité en image. La case « pièce
> déposée » enregistre le fait, pas le document.

#### Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Registre du jour | `/assistanat/visiteurs` | `visiteur:enregistrer` |
| Historique | `/assistanat/visiteurs/historique` | `visiteur:enregistrer` |

#### Critères de recette

- [ ] Enregistrer une arrivée en moins de trente secondes
- [ ] La personne visitée se choisit dans la liste des employés
- [ ] Un habitué propose sa dernière société et sa pièce
- [ ] Le bouton Sortie enregistre l'heure d'un clic
- [ ] **Le décompte des présents est juste**
- [ ] Une visite non close la veille apparaît en anomalie
- [ ] **Une visite de plus de trois mois est purgée automatiquement**
- [ ] Aucune image de pièce d'identité n'est stockée
- [ ] La consultation de l'historique est journalisée

### 10.2 · Registre du courrier — **cadré**

Deux registres symétriques : le courrier qui arrive, le courrier qui part.

#### Les mêmes champs, le sens inversé

| Champ | À l'arrivée | Au départ |
| --- | --- | --- |
| Date de passage | **Réception** | **Départ** |
| Date de correspondance | portée sur le courrier | portée sur le courrier |
| Numéro | **Généré** — `ITA-2026-0142` | **Généré** — `ITA-2026-0142` |
| Tiers | **Expéditeur** | **Destinataire** |
| Objet | l'objet | l'objet |
| Service | **destinataire** — qui doit traiter | **expéditeur** — qui envoie |

#### Deux dates, et la différence compte

`dateCorrespondance` est celle portée **sur le courrier** — quand il a été
écrit.

`datePassage` est celle du **passage par l'Assistanat**.

Un courrier daté du 12 juillet reçu le 28 a mis seize jours. **L'écart est
calculé et affiché** — c'est ce qui révèle un acheminement lent ou un
courrier qui a traîné quelque part.

#### Modèle — un seul, deux vues

```prisma
model Courrier {
  id                  String   @id @default(uuid())

  /// Généré : ITA-{ANNEE}-{SEQ:4}, compteur commun aux deux sens
  numero              String   @unique

  sens                SensCourrier          /// ARRIVEE | DEPART

  /// Date portée sur le courrier
  dateCorrespondance  DateTime @db.Date
  /// Date de passage par l'Assistanat
  datePassage         DateTime @db.Date

  /// Expéditeur à l'arrivée, destinataire au départ
  tiers               String
  /// Référence du tiers, s'il en porte une
  referenceTiers      String?

  objet               String

  /// Destinataire à l'arrivée, expéditeur au départ — lien vers M1
  serviceId           String?
  directionId         String?

  /// Scan du courrier
  fichierId           String?

  /// Suivi de traitement — arrivée seulement
  statutTraitement    StatutTraitement @default(A_TRAITER)
  traiteLe            DateTime?
  traiteParId         String?
  commentaireTraitement String?

  saisieParId         String
  creeLe              DateTime @default(now())

  @@index([sens, datePassage])
  @@index([referenceTiers])
  @@index([statutTraitement])
  @@map("courriers")
}

enum SensCourrier {
  ARRIVEE
  DEPART
}

enum StatutTraitement {
  A_TRAITER
  TRAITE
  SANS_SUITE
}
```

> **Un seul modèle, un champ `sens`.** Les deux registres sont des vues
> filtrées, pas deux tables. Le compteur de numérotation est commun — un
> courrier porte un numéro ITA unique, quel que soit son sens.

#### Le numéro se génère

Format `ITA-{ANNEE}-{SEQ:4}` — `ITA-2026-0142`. Séquence annuelle, remise à
zéro au 1er janvier.

**Généré à l'arrivée comme au départ.** À l'arrivée, il tamponne le courrier
reçu ; au départ, il l'identifie chez le destinataire.

La `referenceTiers` garde le numéro que l'expéditeur a porté sur son propre
courrier — c'est ce qui permet de retrouver une correspondance citée dans une
réponse.

#### Le suivi de traitement — arrivée seulement

Un courrier qui arrive au Service Technique doit être traité.

| Statut | Sens |
| --- | --- |
| `A_TRAITER` | par défaut à l'arrivée |
| `TRAITE` | avec la date, l'auteur et un commentaire |
| `SANS_SUITE` | classé sans réponse, avec motif |

**Un courrier départ n'a pas de statut** — il est parti, l'affaire est close
de ce côté.

Le compteur du groupe affiche les courriers `A_TRAITER` — c'est ce qu'on
regarde le matin.

#### Le scan

Chaque courrier porte son scan. Buckets privés, URL signée de courte durée —
même règle que les pièces administratives de M13.

> Un courrier peut contenir des données sensibles — un avis d'inspection du
> travail, un courrier d'avocat. Accès restreint à l'Assistanat et au service
> destinataire.

#### Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Courrier arrivée | `/assistanat/courrier/arrivee` | `courrier:enregistrer` |
| Courrier départ | `/assistanat/courrier/depart` | `courrier:enregistrer` |
| **À traiter** | `/assistanat/courrier/a-traiter` | `courrier:enregistrer` |

Chaque registre : liste paginée serveur, recherche sur numéro, tiers et objet,
filtres par période, service et statut.

#### Critères de recette

- [ ] Le numéro est **généré**, au format `ITA-2026-0142`
- [ ] La séquence est **commune aux deux sens**
- [ ] Elle repart à 1 au 1er janvier
- [ ] Le service se choisit dans la liste de M1, pas en texte libre
- [ ] **L'écart entre date de correspondance et date de passage est affiché**
- [ ] Un scan peut être joint
- [ ] **L'URL du scan est signée et expire**
- [ ] Un courrier arrivée est `A_TRAITER` par défaut
- [ ] Le marquer traité demande une date et un auteur
- [ ] `SANS_SUITE` exige un motif
- [ ] **Un courrier départ n'a pas de statut de traitement**
- [ ] Le compteur du menu affiche les courriers à traiter
- [ ] La recherche trouve un courrier par sa `referenceTiers`

## 11. Ce qui ne se décide pas seul

1. Les règles de calcul de consommation
2. Le seuil d'alerte d'écart — 25 % proposé
3. Le comportement en cas de compteur en recul
4. Toute modification du schéma Prisma
5. Le lien avec M13 et M14
6. Tout écart aux règles R-01 à R-07
