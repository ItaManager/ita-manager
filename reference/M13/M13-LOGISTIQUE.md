# M13 — Logistique et Parc

**Statut** : à cadrer · **Prérequis** : M2 · **Bloque** : l'étape 6 de M14
**Version cible** : `v1.0.0` · **Rédigé le** : 1er août 2026

> Le module le plus large du projet en surface : sept types de matériel, neuf
> blocs fonctionnels, environ trois mille objets à reprendre.
>
> Mais aussi le plus mûr — le Service Logistique tient déjà tout cela dans
> des tableurs et six formulaires du système qualité. Ce dossier ne crée pas
> un processus, il en reprend un.
>
> **Le module est autonome.** Il n'attend ni M5 ni M6 : les compteurs viennent
> des inspections, et les lieux de chantier se rattachent à M5 s'il existe,
> restent des lieux libres sinon.

---

## 1. Décisions — **toutes arrêtées**

> Sept décisions posées au cadrage, sept tranchées. Les délais d'alerte de la
> section 1.4 sont des valeurs par défaut paramétrables : elles n'empêchent
> pas d'ouvrir le module.

### 1.1 · Codification — **arrêtée**

Quatre formats coexistent dans les fichiers du Service Logistique :

| Format | Exemple | Où |
| --- | --- | --- |
| Code AK court | `AK-BUL01` · `AK-PICK006` | Suivi de disponibilité |
| Ancien N° Parc | `A10CI1` · `A11157` | Contrôle réglementaire |
| Code AK long | `AK-VL0004-PICK006-2022` | Patentes |
| Code ITA long | `ITA-VE0001-BE/22` | Véhicules légers |

Une même machine porte parfois deux codes sur la même ligne.

#### Trois champs, pas un

| Champ | Rôle | Unicité |
| --- | --- | --- |
| `codeIta` | **Référence.** Format AK court | ✅ Unique |
| `numeroParcAncien` | Ancien N° Parc — retrouver documents et factures | ✅ Unique si renseigné |
| `codeLong` | Format long, si des documents le portent | ✅ Unique si renseigné |

**La recherche du registre interroge les trois.** C'est ce qui permet de
retrouver un matériel depuis n'importe quel document papier.

#### Le code est saisissable, ou généré

C'est le seul choix qui permet la reprise sans réécrire trois mille
étiquettes.

À la **reprise**, on importe `AK-PICK006` tel quel — il est déjà peint sur le
véhicule.

À la **création** d'un matériel neuf, le champ est pré-rempli avec le code
suivant disponible, et reste modifiable.

```
Code ITA
[ AK-PICK007                              ]
Laissez tel quel pour accepter le code proposé, ou saisissez
le code figurant déjà sur le matériel.
```

Le code proposé suit `AK-{FAMILLE}{NNN}`, le compteur reprenant après le plus
grand existant de la famille.

#### Trois contrôles

| Cas | Effet |
| --- | --- |
| Code déjà pris | **Refus**, avec le nom du matériel qui le porte |
| Code hors format | **Avertissement**, pas blocage — l'ancien parc porte `A10CI1` |
| Champ vidé | Le système régénère |

Le deuxième point compte : bloquer sur le format rendrait la reprise
impossible.

#### Conséquence sur l'import

Le script n'a plus à trancher entre les quatre formats. Il prend le code AK
court quand il existe, place les autres dans leurs champs respectifs, et
signale les lignes où aucun code n'apparaît.

### 1.2 · Petit matériel — **arrêtée : individuel**

Chaque objet porte son code. `AK-MV02`, `AK-MV11`, `AK-MV05` sont trois
moteurs vibreurs distincts.

**Le tableur le fait déjà**, et c'est ce qui donne l'information utile :

| Code | Lieu | État |
| --- | --- | --- |
| `AK-MV02` | Garage | Panne |
| `AK-MV11` | Assinie PK17 | Panne |
| `AK-MV07` | Agboville | Bon — neuf |

Compter « 3 moteurs vibreurs » perdrait cette distinction — précisément celle
qui sert au Chef du Garage.

**Le formulaire `EN-GEL-17` le confirme** : il porte une colonne `Référence`
par ligne. On sort un objet identifié, pas une quantité.

#### La colonne QUANTITES garde son sens

Pour les **lots indissociables** : un jeu de clés, une caisse à outils
complète, un lot de vingt cônes de signalisation.

Elle vaut 1 dans la grande majorité des cas.

#### Le coût

438 fiches. Mais elles existent déjà dans le tableur — c'est de l'import, pas
de la saisie.

### 1.3 · Relevé des compteurs — **arrêtée : l'inspection d'abord**

C'est la donnée qui pilote tout l'entretien. Sans relevé régulier, les
alertes de vidange ne valent rien.

#### Trois sources, par ordre de priorité

| Source | Quand | Disponible |
| --- | --- | --- |
| **Inspection** | À chaque entrée et sortie | **Livraison 2** |
| Saisie au garage | À chaque passage | Livraison 1 |
| Relevé d'activité — M6 | Quotidien | Quand M6 existera |

#### L'inspection est la source principale

**Les fiches `EN-GEL-15` et `EN-GEL-16` portent déjà le compteur** :
`Kilométrage à l'Arrivée`, `Compteur Départ`, `Compteur Retour`.

Un engin qui part et revient donne donc **deux relevés, sans saisie
supplémentaire**.

C'est suffisant pour piloter les vidanges : un engin qui ne sort pas ne
s'use pas.

#### M6 affine, il n'est pas indispensable

Le relevé d'activité enregistre `UtilisationMateriel` avec les heures de
fonctionnement par jour. Plus fin, mais M6 n'existe pas encore.

> **Ce choix découple M13 de M6.** Le module devient autonome — il n'attend
> aucun autre développement pour fonctionner.

#### Un contrôle à prévoir

Un compteur qui **recule** entre deux relevés est signalé. C'est le signe
d'une erreur de saisie, ou d'un compteur trafiqué.

Le relevé n'est pas refusé — il est enregistré avec une anomalie.

### 1.4 · Délais d'alerte — **valeurs par défaut, paramétrables**

Le tableur affiche des retards à **−273 jours**. Personne n'est prévenu.

| Échéance | Alerte proposée |
| --- | --- |
| Assurance | J−60 puis J−30 |
| Visite technique | J−45 puis J−15 |
| Patente, vignette, stationnement | J−30 |
| Permis de conduire | J−90 puis J−30 |
| Vidange | 500 km ou 20 heures avant |
| Contrôle de levage, VGP | J−45 |

Paramétrables. Destinataire : le Chef de Service Logistique, plus le Chef du
Garage pour l'entretien.

### 1.5 · Les inspections — **arrêtée**

Véhicules, engins et conteneurs. Pas le petit matériel courant, pas les
consommables.

Une inspection au départ et au retour sur une caisse à outils immobiliserait
le magasin.

**L'inspection porte aussi l'entretien** — voir 1.8.

### 1.6 · Demandes de transport — **arrêtée**

Le formulaire `EN-GEL-08` porte **deux natures** en cases à cocher :

  - `DEMANDE DE TRANSPORT — TRANSFERT`
  - `MISE À DISPOSITION VÉHICULE — ENGIN — MATÉRIEL`

Un seul formulaire, un champ `nature`. Circuit conforme à B-01 : visa du
demandeur, puis visa logistique.

**Le CIA est le projet.** Le champ « Centre d'Imputation Analytique » du
formulaire est un lien vers `Projet` de M5, non un texte libre.

Conséquence utile : le coût d'un transport s'impute au chantier, et M5 pourra
afficher le coût logistique par chantier.

### 1.7 · L'étape 6 de M14 — **arrêtée**

Le contrôle de conformité à la réception d'un achat appartient à ce module.

Le Gestionnaire de stocks constate la conformité dans M13 — formulaire
`EN-GEL-04`, bon d'entrée et de réception — et cette validation ouvre le droit
à facturation dans M14.

**Une seule saisie, deux modules qui s'en servent.**

---

### 1.8 · Ce que les formulaires du système qualité ont tranché

Six formulaires reçus, tous référencés au système qualité `SMQ-SST`. Ils
arbitrent quatre points que j'avais laissés ouverts.

#### Les chauffeurs viennent de M2 — pas de table séparée

Un employé porte son permis et ses habilitations. C'est une `Habilitation`
sur `Employe`, pas une entité logistique.

L'écran « Chauffeurs » du groupe est une **vue filtrée** sur les employés
habilités à conduire, avec l'échéance de leur permis. Le CACES suit la même
logique.

L'affectation d'un conducteur **interroge M2**, elle ne duplique rien.

#### L'entretien passe par l'inspection

Pas de formulaire de demande d'intervention distinct.

**Une ligne d'inspection `MAUVAIS` ou `ABSENT` est le fait générateur.** Le
pare-brise fêlé relevé au retour devient l'intervention à programmer.

Les vidanges restent proposées sur compteur — le système signale, le Chef du
Garage décide.

#### L'inventaire n'est pas construit

Aucun formulaire d'inventaire n'existe. Le solde calculé et les mouvements
suffisent.

> Construire un écran d'inventaire que personne ne pratique aujourd'hui, ce
> serait construire un écran vide. Il s'ajoutera quand le besoin apparaîtra.

#### Le carnet de bord reste un objet physique

Il figure dans la grille « Documents de suivi » de chaque fiche d'inspection.
On contrôle sa **présence**, comme celle du cric ou de l'extincteur.

Ce n'est pas un écran du module.

---

## 2. Objectif

Savoir ce que l'entreprise possède, où c'est, dans quel état, et ce qui va
l'immobiliser.

**Critère de réussite** : le Chef de Service Logistique ouvre l'application le
matin et voit en trois lignes ce qui expire ce mois-ci, ce qui est en panne,
et ce qu'on lui demande.

---

## 3. Deux natures de matériel

C'est la décision structurante du module.

### 3.1 · Le matériel individuel

Six types, portant un **code unique**. Un objet est ici ou là, jamais en deux
exemplaires.

| Type | Volume estimé | Particularités |
| --- | --- | --- |
| `VEHICULE_LEGER` | ~90 | Immatriculation, CT, assurance, patente |
| `VEHICULE_LOURD` | ~40 | Idem + vignette de transport, carte de transport |
| `ENGIN` | ~165 | Compteur horaire, levage, VGP |
| `PETIT_MATERIEL` | ~440 | Ni immatriculation ni pièce administrative |
| `CONTENEUR` | ~30 | Localisation, pas de compteur |
| `MOBILIER` | ~1 800 | Inventaire seul |

### 3.2 · Le consommable

Une **quantité** qui monte et descend. Pas de « ce sac-là ».

Ciment, gravier, carburant, huiles, filtres, consommables de bureau.

```
Stock initial   +200 sacs
Entrée achat    +500 sacs
Sortie chantier −180 sacs
─────────────────────────
Solde            520 sacs
```

### 3.3 · Pourquoi deux modèles, pas un

Une table unique produirait un numéro de série sur du ciment et une quantité
sur une pelle mécanique. Les champs vides deviendraient la règle.

```prisma
model Materiel {                      /// Individuel — code unique
  /// Référence. Saisi à la reprise, généré à la création. Décision 1.1.
  codeIta          String   @unique

  /// Ancien N° Parc — retrouver documents papier et factures
  numeroParcAncien String?  @unique

  /// Format long, si des documents le portent
  codeLong         String?  @unique

  type             TypeMateriel
  familleId        String
  statut           StatutMateriel
  // …
}

model ArticleStock {      /// Consommable — quantité
  reference      String   @unique
  unite          String
  seuilAlerte    Decimal?
  // le solde se CALCULE depuis les mouvements
}
```

---

## 4. Neuf blocs fonctionnels

| # | Bloc | Contenu |
| --- | --- | --- |
| 1 | **Registre du matériel** | Fiche par objet, trois niveaux de saisie |
| 2 | **Stocks** | Solde calculé, inventaire, alertes de seuil |
| 3 | **Entrées et sorties** | Bon d'entrée, bon de sortie |
| 4 | **Inspections** | État constaté au départ et au retour |
| 5 | **Pièces administratives** | Échéances et alertes |
| 6 | **Entretien** | Programme de vidange, interventions |
| 7 | **Chauffeurs** | Permis, habilitations, échéances |
| 8 | **Demandes de transport** | Circuit de demande et d'affectation |
| 9 | **Réceptions** | Contrôle de conformité — ferme le circuit M14 |

---

## 5. Le registre — trois niveaux de saisie

**Décision arrêtée.** Un formulaire de cent champs produit un parc de cent
champs vides.

Le tableur actuel le prouve : sur 333 lignes, la plupart des colonnes valent
`NC`.

### 5.1 · Niveau 1 — enregistrement

Les colonnes que le Service Logistique tient réellement, relevées dans la
feuille `PETIT MATERIEL` du classeur d'inventaire :

```
N° MATERIEL/CODE · DESIGNATION · MARQUE · QUANTITES
LIEU · EMPLACEMENT · DATE D'ENTREE · ETAT · CATEGORIE
DATE DEPART · DATE D'ACQUISITION · OBSERVATION
DATE DE DEMOBILISE · PROCHAIN CHANTIER
```

**Quatorze colonnes, pas cent sept.**

| Champ | Note |
| --- | --- |
| Code ITA | **Pré-rempli, modifiable** — décision 1.1 |
| Type de matériel | Détermine tout le reste du formulaire |
| Désignation | Texte libre |
| Marque · Modèle | Autocomplétion créable |
| Numéro de série | Unique si renseigné |
| Immatriculation | Si véhicule — unique |
| Date d'acquisition | |
| Coût d'acquisition | Donnée sensible |
| Lieu de base | Autocomplétation sur `LieuStockage` |
| Statut | `DISPONIBLE` par défaut |

**Trente secondes.** Le reste se complète à mesure.

### 5.2 · Niveau 2 — enrichissement progressif

Caractéristiques techniques, pneumatiques, batterie, fluides, filtres,
dimensions, photos.

Regroupées en sections repliables sur la fiche, chacune avec son taux de
complétude.

### 5.3 · Niveau 3 — vie du matériel

Compteurs, mouvements, inspections, entretiens, pièces administratives,
affectations. Ce ne sont pas des champs mais des **tables liées**.

### 5.4 · La complétude est visible

Comme le dossier employé de M2 : une barre par fiche, et une liste des
matériels incomplets à l'accueil du module.

> Un dossier incomplet **n'empêche pas** l'enregistrement — sinon on perd
> l'information. Mais il **bloque** l'affectation à un chantier si une pièce
> administrative obligatoire manque.

---

## 6. Écrans

| Écran | Route | Permission | Compteur | Livraison |
| --- | --- | --- | --- | --- |
| Tableau de bord | `/logistique` | `materiel:lire` | — | 1 |
| **Échéances** | `/logistique/echeances` | `materiel:lire` | 🔴 | **1** |
| **Pièces administratives** | `/logistique/pieces` | `materiel:lire` | — | **1** |
| Demandes reçues | `/logistique/demandes` | `ressource:arbitrer` | 🔴 | 3 |
| Registre du matériel | `/logistique/materiel` | `materiel:lire` | — | 1 |
| Fiche matériel | `/logistique/materiel/[id]` | `materiel:lire` | — | 1 |
| Stocks | `/logistique/stocks` | `stock:lire` | 🔴 seuils | 2 |
| Bons de mouvement | `/logistique/mouvements` | `stock:mouvementer` | — | 2 |
| Inspections | `/logistique/inspections` | `materiel:inspecter` | 🔴 | 2 |
| **Réceptions** | `/logistique/receptions` | `reception:controler` | 🔴 | **2** |
| Entretien | `/logistique/entretien` | `entretien:planifier` | 🔴 | 3 |
| Demandes de transport | `/logistique/transport` | `transport:demander` | 🔴 | 3 |
| Chauffeurs | `/logistique/chauffeurs` | `materiel:lire` | 🔴 permis | 3 |
| Lieux de stockage | `/logistique/lieux` | `referentiel:creer` | — | 2 |
| Articles de stock | `/logistique/articles` | `referentiel:creer` | — | 2 |

### 6.0 · Arborescence de navigation

Quinze entrées, en quatre blocs. Le trait sépare le quotidien du patrimoine,
puis de l'activité, puis des référentiels.

```
Logistique
├─ Tableau de bord             materiel:lire                    L1
├─ Échéances               🔴  materiel:lire                    L1
├─ Pièces administratives      materiel:lire                    L1
├─ Demandes reçues         🔴  ressource:arbitrer               L3
│
├─ Parc matériel               materiel:lire                    L1
├─ Stocks                  🔴  stock:lire                       L2
├─ Bons de mouvement           stock:mouvementer                L2
│
├─ Inspections             🔴  materiel:inspecter               L2
├─ Réceptions              🔴  reception:controler              L2
├─ Entretien               🔴  entretien:planifier              L3
├─ Demandes de transport   🔴  transport:demander               L3
├─ Chauffeurs              🔴  materiel:lire                    L3
│
├─ Lieux de stockage           referentiel:creer                L2
└─ Articles de stock           referentiel:creer                L2
```

**Huit compteurs sur quinze entrées.** C'est la nature du module : le Chef
de Service Logistique ouvre l'application pour voir ce qui attend, non pour
consulter un catalogue.

#### Ce que chaque rôle voit réellement

| Rôle | Entrées visibles |
| --- | --- |
| Chef de chantier | Demandes de transport · Parc en lecture. Ses demandes de ressources restent dans **Technique › Ressources** |
| **Chef de Service Logistique** | Tout |
| Chef du Garage | Parc · Échéances · Pièces · Inspections · Entretien · Chauffeurs · **exécute** les mises à disposition |
| Gestionnaire de stocks | Stocks · Bons · Réceptions · Inspections |
| Directeur Technique | Tableau de bord · Parc · Transport |
| Directeur Financier | Stocks · Réceptions · Pièces avec les montants |

#### Deux entrées distinctes sur les échéances — **arrêté**

| Écran | Répond à |
| --- | --- |
| **Échéances** | Qu'est-ce qui expire bientôt ? Trié par urgence, filtré. |
| **Pièces administratives** | Où en est chaque véhicule sur chaque pièce ? Vue complète. |

Les fusionner obligerait à choisir entre une liste d'alertes et un tableau de
suivi. Ce sont deux gestes différents : le premier se consulte le matin, le
second au moment de renouveler.

#### M8 et M13 se partagent la demande de ressources — **arrêté**

**M8 reste dans le groupe Technique.** C'est là que le demandeur va : un chef
de chantier a besoin d'une bétonnière, il ouvre **Ressources**.

**M13 reçoit la demande.** Le Service Logistique arbitre, affecte le matériel,
et exécute.

```
Technique                          Logistique
├─ Projets                         ├─ Tableau de bord
├─ Appels d'offres                 ├─ Échéances
└─ Ressources          ─────────►  ├─ Demandes reçues        🔴
   demander, suivre                ├─ Parc matériel
                                   ...
```

**Une seule table `DemandeRessource`, deux écrans.** Le demandeur voit les
siennes, le Service Logistique voit celles qui attendent.

Même schéma que M14 : le demandeur est chez lui, l'instructeur est chez lui,
et une seule demande circule entre les deux.

> Ne pas dupliquer la table. Une demande vue de deux endroits reste une
> demande.

#### L'incohérence B-08 — **tranchée**

La décision **B-08** envoie les demandes de ressources logistiques au **Chef
du Garage**. Elle a été écrite **avant** la création du poste de **Chef de
Service Logistique** en A-06.

Aujourd'hui, le Chef du Garage encadre l'équipe technique sous l'autorité du
Chef de Service.

**Correction retenue :**

| Étape | Qui |
| --- | --- |
| Demande | Chef de chantier, ou tout employé |
| Visa hiérarchique | Supérieur du demandeur — B-01 |
| **Arbitrage** | **Chef de Service Logistique** — il décide de l'affectation du parc |
| **Exécution** | **Chef du Garage** — il met à disposition |

Le premier arbitre, le second exécute. C'est la structure réelle depuis A-06.

→ Décision **G-09** du registre, close.

### 6.1 · Écran des demandes reçues

Liste des demandes de ressources en attente d'arbitrage, avec pour chacune :
le demandeur, le chantier, ce qui est demandé, la période, et l'urgence.

Trois issues, comme le circuit d'achat :

| Issue | Effet |
| --- | --- |
| **Affecter** | Choisir le matériel disponible, créer le bon de sortie |
| **Proposer une alternative** | Un autre matériel, ou une autre période |
| **Refuser** | Motif obligatoire — indisponibilité, matériel en panne |

**Le contrôle de disponibilité est affiché**, non imposé. Si l'engin demandé
est déjà affecté ailleurs, le conflit apparaît avec le chantier concurrent —
c'est au Chef de Service d'arbitrer, pas au système.

## 7. Modèle de données

`Materiel` · `TypeMateriel` · `FamilleMateriel` · `LieuStockage` ·
`PieceAdministrative` · `TypePieceAdministrative` · `ReleveCompteur` ·
`MouvementMateriel` · `Inspection` · `LigneInspection` · `Entretien` ·
`ArticleStock` · `MouvementStock` · `Inventaire` · `LigneInventaire` ·
`Chauffeur` · `Habilitation` · `DemandeTransport` · `Reception` ·
`LigneReception`

### 7.1 · Les types de pièce sont un référentiel, pas un enum — **arrêté**

Une nouvelle obligation peut apparaître à tout moment. Un enum exigerait une
migration ; une table se complète depuis l'écran.

```prisma
model TypePieceAdministrative {
  id                String   @id @default(uuid())
  libelle           String   @unique
  libelleNormalise  String   @unique   /// Création inline sans doublon

  /// Périodicité en mois — sert à PROPOSER l'expiration, jamais à l'imposer
  periodiciteMois   Int?

  /// Délai d'alerte propre au type : 60 j pour l'assurance, 45 j pour le CT
  delaiAlerteJours  Int      @default(30)

  /// Types de matériel concernés — un engin n'a pas de patente
  typesMateriel     TypeMateriel[]

  /// Une pièce périmée bloque-t-elle la sortie, ou avertit-elle seulement ?
  bloquante         Boolean  @default(false)

  actif             Boolean  @default(true)
  ordreAffichage    Int      @default(0)   /// Ordre des colonnes du tableau

  pieces            PieceAdministrative[]
}
```

**Création inline**, règle R-04. Le Chef de Service Logistique tape
« Attestation ARTCI », ne la trouve pas, la crée sans quitter le formulaire.

Un doublon sur le libellé normalisé renvoie l'existant — patron 5.

> Une obligation supprimée se **désactive**, elle ne s'efface pas. Les pièces
> historiques doivent rester lisibles.

### 7.1 bis · La pièce elle-même

```prisma
model PieceAdministrative {
  id             String   @id @default(uuid())
  materielId     String
  typeId         String

  numero         String?      /// N° de police, de PV, de patente
  emetteur       String?      /// Compagnie, centre de contrôle
  dateEdition    DateTime     /// Date d'établissement
  dateExpiration DateTime     /// LE champ qui pilote tout
  montant        Decimal?     @db.Decimal(12, 0)   /// Un montant par pièce

  fichierId      String?      /// Scan

  /// Renouvellement — la pièce précédente n'est jamais écrasée
  remplaceId     String?  @unique
  remplace       PieceAdministrative? @relation("Renouvellement", fields: [remplaceId], references: [id])

  @@index([materielId, dateExpiration])
}
```

> **L'état ne se stocke pas.** `VALIDE`, `ALERTE`, `PERIME` se déduisent de
> `dateExpiration` et du `delaiAlerteJours` du type. Un état stocké serait
> faux dès le lendemain.

### 7.1 ter · Douze types chargés au seed

Relevés dans les fichiers du Service Logistique. Modifiables, désactivables.

| Libellé | Périodicité | Alerte | Bloquante | Types concernés |
| --- | --- | --- | --- | --- |
| Assurance | 12 mois | 60 j | **Oui** | VL · PL · ENGIN |
| Visite technique | 6 mois | 45 j | **Oui** | VL · PL |
| Contrôle de levage | 12 mois | 45 j | **Oui** | ENGIN |
| VGP | 6 mois | 45 j | **Oui** | ENGIN |
| Contrôle AIR | 12 mois | 45 j | Non | ENGIN |
| Patente de transport | 12 mois | 30 j | Non | PL |
| Vignette de transport | 12 mois | 30 j | Non | PL |
| Carte de stationnement | 12 mois | 30 j | Non | VL · PL |
| Carte de transport | 12 mois | 30 j | Non | PL |
| Autorisation hors gabarit | 12 mois | 30 j | Non | PL · ENGIN |
| Certificat CE | — | — | Non | ENGIN |
| Carte grise | — | — | Non | VL · PL |
| **Autorisation d'enfûtage** | 12 mois | 30 j | Non | PL |
| **Documents d'achat — douanes** | — | — | Non | ENGIN |

Les deux derniers figurent sur les fiches d'inspection `EN-GEL-15` et
`EN-GEL-16`, et manquaient à la liste initiale.

### 7.1 quater · La périodicité propose, elle n'impose pas

À la saisie d'une `dateEdition`, le système **propose** une `dateExpiration`
selon la périodicité du type.

**Le champ reste modifiable.** Une assurance souscrite pour six mois au lieu
de douze doit pouvoir être saisie telle quelle.

Un type sans périodicité — carte grise, certificat CE — ne propose rien.

### 7.1 quinquies · Le renouvellement conserve l'historique

Renouveler une pièce **crée une nouvelle ligne** qui pointe vers l'ancienne
par `remplaceId`. L'ancienne reste consultable.

Le tableur actuel porte trois jeux de colonnes — trois années successives,
écrasées à chaque renouvellement au-delà. La chaîne de renouvellement remplace
cela sans limite.

### 7.2 · Le solde de stock se calcule

Même principe que le solde de congés en M3.

```prisma
model MouvementStock {
  articleStockId String
  sens           SensMouvement  /// ENTREE | SORTIE | AJUSTEMENT
  quantite       Decimal
  lieuStockageId String
  bonMouvementId String?
  motif          String
  // …
}
```

Le solde d'un article dans un lieu = somme des entrées − somme des sorties.

**Un total stocké diverge toujours** — un mouvement annulé, un inventaire
mal saisi, et les deux ne se retrouvent plus.

### 7.3 · Les compteurs sont un historique

```prisma
model ReleveCompteur {
  materielId  String
  valeur      Decimal
  unite       UniteCompteur   /// KILOMETRE | HEURE
  releveLe    DateTime
  source      SourceReleve    /// INSPECTION | SAISIE_GARAGE | RELEVE_ACTIVITE
  inspectionId String?        /// Si issu d'une inspection
  anomalie    Boolean @default(false)   /// Compteur en recul
  releveParId String
  @@index([materielId, releveLe])
}
```

La valeur courante est le dernier relevé. L'historique permet de calculer une
consommation, une intensité d'usage, et de détecter un compteur qui recule —
signe de trafic ou d'erreur.

### 7.4 · L'inspection — d'après `EN-GEL-15` et `EN-GEL-16`

Même grille à l'entrée et à la sortie. Seuls l'en-tête et les signataires
changent.

| | Entrée | Sortie |
| --- | --- | --- |
| Points contrôlés | identiques | identiques |
| Documents contrôlés | identiques | identiques |
| Champ propre | `Provenance`, `Kilométrage à l'arrivée` | `Destination` |
| Vérificateur | **Réceptionnaire** | **Remettant** |

Une seule table, un champ `moment`.

#### Trois états, pas un booléen

```prisma
enum EtatPoint {
  BON
  MAUVAIS
  ABSENT
}
```

> **`ABSENT` est distinct de `MAUVAIS`.** Un rétroviseur cassé n'est pas un
> rétroviseur manquant : le premier est un dommage, le second un vol ou un
> oubli. Le formulaire papier les sépare depuis toujours.

#### Deux grilles distinctes

**Points physiques** — 30 pour un véhicule léger, 27 pour un engin.

**Documents** — 10 pour un véhicule, 4 pour un engin.

La seconde contrôle la **présence physique du document dans le véhicule**,
non sa validité en base. Ce sont deux choses différentes : une assurance
valide jusqu'en mars peut ne pas être dans la boîte à gants.

#### Les points sont un référentiel

Même raisonnement que les types de pièce administrative — 7.1.

```prisma
model PointInspection {
  libelle        String
  grille         GrilleInspection   /// PHYSIQUE | DOCUMENT
  typesMateriel  TypeMateriel[]     /// « Chenilles » ne vaut pas pour un VL
  ordre          Int
  actif          Boolean  @default(true)
}
```

Ajouter un point de contrôle ne demande pas de migration.

#### Le modèle

```prisma
model Inspection {
  materielId      String
  moment          MomentInspection   /// ENTREE | SORTIE
  mouvementId     String?
  demandeTransportId String?

  dateHeure       DateTime
  lieuId          String
  provenance      String?            /// À l'entrée
  destination     String?            /// À la sortie

  compteur        Decimal?           /// Km ou heures
  niveauCarburant NiveauCarburant?   /// Huitièmes — voir ci-dessous

  conducteurId    String?            /// → Employe
  transporteur    String?            /// Remorqueur, externe possible
  verificateurId  String             /// Réceptionnaire ou remettant

  etatGeneral     EtatPoint
  observations    String?

  lignes          LigneInspection[]
}

model LigneInspection {
  inspectionId String
  pointId      String
  etat         EtatPoint
  observation  String?
  photoId      String?      /// Localise le dommage — voir 7.5
}
```

#### Le niveau de carburant, en huitièmes

```prisma
enum NiveauCarburant {
  VIDE  UN_HUITIEME  UN_QUART  TROIS_HUITIEMES
  MOITIE  CINQ_HUITIEMES  TROIS_QUARTS  SEPT_HUITIEMES  PLEIN
}
```

C'est ce que la jauge dessinée sur le formulaire permet de lire honnêtement.

Comparé entre sortie et retour, il dit ce qui a été consommé.

### 7.5 · La photo localise le dommage

Le formulaire papier porte des schémas de véhicule où l'inspecteur entoure la
zone abîmée.

**Équivalent retenu : une photo attachée à la ligne d'inspection.**

Les trente points couvrent déjà la localisation — « Portière avant droit »,
« Pare-brise avant ». Le schéma ferait doublon pour la plupart des cas, et
une photo de rayure vaut mieux qu'un point sur un dessin.

> Un schéma cliquable ne devient utile que pour un dommage sans point
> correspondant — une bosse au milieu du capot. À prévoir plus tard si le
> besoin se confirme.

### 7.6 · L'inventaire de bord — `EN-GEL-08`

Neuf points, contrôlés au **départ** et au **retour**, sur le formulaire de
transport.

```
Cric · Manivelle · Démonte-roue · Pneu secours · Extincteur
Triangle de présignalisation · Équipement GPS · Sangles · Chaînes
```

C'est ce qui permet de dire qu'un extincteur a disparu pendant la mission.

Même modèle que l'inspection : des `PointInspection` de grille `EQUIPEMENT`,
avec deux relevés par mission.

### 7.7 · La demande de transport porte deux matériels

Le formulaire `EN-GEL-08` réserve **deux blocs distincts** :

| Bloc | Compteurs |
| --- | --- |
| `VÉHICULE AFFECTÉ` | Départ et retour |
| `ENGIN — MATÉRIEL OCTROYÉ` | Départ et retour, immatriculation, référence ITA |

Un même bon peut donc affecter un véhicule **et** un engin transporté, chacun
avec ses propres relevés et visas.

```prisma
model DemandeTransport {
  reference      String   @unique
  nature         NatureTransport  /// TRANSPORT_TRANSFERT | MISE_A_DISPOSITION
  projetId       String?          /// CIA — Centre d'Imputation Analytique
  demandeurId    String
  description    String
  dateDebut      DateTime
  dateFin        DateTime?

  viseDemandeurLe   DateTime?
  viseLogistiqueLe  DateTime?
  viseLogistiqueParId String?

  affectations   AffectationTransport[]   /// Véhicule ET engin
}

model AffectationTransport {
  demandeTransportId String
  materielId         String
  role               RoleAffectation   /// VEHICULE | ENGIN_OCTROYE

  departLe           DateTime?
  compteurDepart     Decimal?
  conducteurDepartId String?
  viseDepartParId    String?

  retourLe           DateTime?
  compteurRetour     Decimal?
  conducteurRetourId String?
  viseRetourParId    String?
}
```

### 7.8 · Lieu et emplacement — deux niveaux

Le tableur porte les deux : `LIEU` vaut `CHANTIER` ou `SITE` ;
`EMPLACEMENT` vaut `GARAGE`, `ASSINIE PK17`, `PORTEO PK22`.

```prisma
model LieuStockage {
  libelle    String
  nature     NatureLieu    /// SITE | CHANTIER | GARAGE | MAGASIN | BUREAU
  projetId   String?       /// Si nature = CHANTIER
  actif      Boolean  @default(true)
}
```

Un lieu de nature `CHANTIER` **pointe vers un projet de M5**. C'est ce qui
permet de dire ce qu'un chantier détient, et de désactiver ses lieux à la
clôture.

### 7.9 · Deux états que le tableur porte et qu'il faut garder

| Champ | Sens |
| --- | --- |
| `dateDemobilise` | Le matériel a quitté son chantier |
| `prochainChantier` | Où il ira ensuite |

Un matériel démobilisé **attend une affectation**. C'est un état à part
entière — ni disponible au garage, ni en mission.

```prisma
enum StatutMateriel {
  DISPONIBLE
  EN_MISSION
  DEMOBILISE      /// Quitté le chantier, en attente d'affectation
  EN_MAINTENANCE
  EN_PANNE
  HORS_SERVICE
  REFORME
}
```

## 8. Règles métier

### 8.1 · Un matériel ne peut pas sortir avec une pièce périmée

Contrôle **bloquant** à la sortie et à l'affectation, pour les véhicules et
engins soumis à la réglementation.

| Pièce périmée | Effet |
| --- | --- |
| Assurance | **Blocage** — non négociable |
| Visite technique | **Blocage** |
| Contrôle de levage, VGP | **Blocage** sur un engin de levage |
| Patente, vignette, stationnement | Avertissement |

Un blocage se contourne uniquement par le Chef de Service Logistique, avec
motif et journalisation.

### 8.2 · Un chauffeur ne conduit pas sans permis valide

Contrôle à l'affectation. Le permis vit dans `Habilitation`, avec sa date
d'expiration.

Le type de véhicule détermine la catégorie requise — un poids lourd exige un
permis C.

**Le CACES suit la même logique** pour les engins.

### 8.3 · La disponibilité se calcule, elle ne se saisit pas

**C'est le changement le plus important du module.**

Aujourd'hui : un tableau mensuel, une ligne par engin, un `1` par jour. Sur
165 engins, cinq mille cellules par mois, saisies à la main.

Demain : le **statut du matériel est horodaté**. La disponibilité se déduit.

```
Disponibilité du mois = jours en DISPONIBLE ou EN_MISSION
                        ÷ jours du mois
```

Le Chef du Garage saisit un changement d'état — « la pelle 2 est en panne
depuis ce matin » — et le taux se calcule seul.

**Une saisie par événement, au lieu de cinq mille par mois.**

### 8.4 · Un mouvement change le lieu, jamais l'inverse

Le lieu d'un matériel n'est pas un champ modifiable à la main. Il résulte du
dernier mouvement validé.

Sinon on aurait deux vérités : ce que dit la fiche, et ce que disent les bons.

### 8.5 · Une sortie exige une inspection

Pour les véhicules, engins et conteneurs — décision 1.5.

Pas d'inspection, pas de bon de sortie. C'est ce qui donne sa valeur au
constat de retour.

### 8.6 · L'entretien naît de l'inspection — **arrêté**

Il n'existe pas de formulaire de demande d'intervention. L'inspection est le
point d'entrée.

| Signal | Effet |
| --- | --- |
| **Ligne d'inspection `MAUVAIS` ou `ABSENT`** | Crée une intervention à programmer |
| Compteur atteignant le seuil de vidange | **Signale**, sans créer |
| Date d'échéance d'un contrôle périodique | Signale |

**Le premier est le fait générateur.** Une anomalie relevée au retour ne doit
pas rester dans une case « observations » — elle crée une ligne de travail.

Les deux autres proposent : le système signale, le Chef du Garage décide.

> C'est le point le plus important du module côté entretien. Aujourd'hui, un
> pare-brise fêlé constaté au retour se note sur un papier qui se range.

### 8.7 · Un article sous son seuil alerte

`ArticleStock.seuilAlerte` déclenche une notification au Gestionnaire de
stocks, et apparaît au tableau de bord.

C'est le point de départ naturel d'une demande d'achat — M14.

### 8.8 · L'inventaire compare, il n'écrase pas

Un inventaire produit un **écart** entre le solde théorique et le comptage
physique. L'écart se justifie et donne lieu à un `AJUSTEMENT` motivé.

Jamais de remplacement direct du solde : on perdrait la trace de l'écart, qui
est précisément l'information utile.

---

## 9. Reprise des données existantes

Environ trois mille objets à importer. C'est un chantier à part entière.

### 9.1 · Ce que l'analyse des fichiers a révélé

| Problème | Ampleur |
| --- | --- |
| Quatre codifications concurrentes | Toutes les feuilles |
| États en texte libre | `BON`, `PANNE`, `PANNE `, `BON-NEUF`, `B`, `2B 2M`, `7B 5M` |
| Lieux en texte libre | `CHANTIER`, `chANTIER`, `CHANTIER ` |
| `NC` en guise de valeur absente | Partout |
| Dates au format texte | Fréquent |

### 9.2 · La reprise se fait en trois passes

**Passe 1 — normalisation.** Un script qui produit un rapport : combien de
codes en doublon, combien d'états non reconnus, combien de dates illisibles.
**Aucune écriture.**

**Passe 2 — tables de correspondance.** Le Service Logistique valide les
correspondances : `B` → `BON`, `2B 2M` → à ventiler, `chANTIER` → `CHANTIER`.

**Passe 3 — import.** Avec journal des lignes rejetées et motif.

> **Aucun import sans validation humaine des correspondances.** Deviner
> `2B 2M` produirait des données fausses qu'on ne saurait plus distinguer des
> vraies.

---

## 10. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `materiel:lire` | Consulter le registre et les échéances | ADMIN, DG, DT, CT, CC, LOG |
| `materiel:creer` · `materiel:modifier` | Fiches matériel | ADMIN, Chef Service Logistique, Chef du Garage |
| `materiel:inspecter` | Inspections d'entrée et de sortie | ADMIN, Chef du Garage, Gestionnaire de stocks |
| `materiel:affecter` | Affecter à un chantier | ADMIN, Chef Service Logistique |
| `stock:lire` | Consulter les stocks | ADMIN, DFC, LOG, DT |
| `stock:mouvementer` | Bons d'entrée et de sortie | ADMIN, Gestionnaire de stocks |
| `stock:inventaire` | Ouvrir et clore un inventaire | ADMIN, Chef Service Logistique |
| `entretien:planifier` | Programmer une intervention | ADMIN, Chef du Garage |
| `reception:controler` | Contrôle de conformité — M14 | ADMIN, Gestionnaire de stocks |
| `transport:demander` | Demande de transport | tous les employés permanents |
| `transport:affecter` | Affecter véhicule et chauffeur | ADMIN, Chef Service Logistique |
| `ressource:arbitrer` | **Arbitrer une demande de ressource** — B-08 corrigée | ADMIN, **Chef de Service Logistique** |
| `ressource:mettreADisposition` | Exécuter la mise à disposition | ADMIN, **Chef du Garage** |
| `materiel:coutsAdministratifs` | Montants des pièces, total annuel | ADMIN, DG, DFC, Chef Service Logistique |
| `typePiece:gerer` | Créer et désactiver un type de pièce | ADMIN, Chef Service Logistique |
| `logistique:parametres` | Seuils, délais d'alerte | ADMIN |

> **Le coût d'acquisition est une donnée sensible.** Il suit
> `employe:donneesSensibles` — visible du DG, de la DFC et du Chef de Service
> Logistique, masqué ailleurs avec un cadenas.

---

## 11. Critères de recette

### Compteurs

- [ ] Une inspection enregistre un relevé de compteur
- [ ] Deux relevés par mission — sortie et retour
- [ ] Une saisie manuelle au garage est possible
- [ ] **Un compteur en recul est signalé, sans être refusé**
- [ ] La valeur courante est le dernier relevé
- [ ] L'historique permet de calculer une intensité d'usage
- [ ] Une vidange se signale sur le compteur, sans M6

### Petit matériel

- [ ] Chaque objet porte son propre code — 438 fiches
- [ ] Deux moteurs vibreurs ont des états et des lieux distincts
- [ ] `QUANTITES` vaut 1 sauf pour un lot indissociable
- [ ] Un bon de sortie porte une référence par ligne

### Registre

- [ ] Créer un véhicule en douze champs, moins de trente secondes
- [ ] Le code ITA est **pré-rempli et modifiable** — décision 1.1
- [ ] Vider le champ régénère le code proposé
- [ ] Un code déjà pris est refusé, avec le nom du matériel qui le porte
- [ ] Un code hors format **avertit sans bloquer**
- [ ] Le formulaire change selon le type de matériel
- [ ] Un conteneur ne demande ni immatriculation ni visite technique
- [ ] La fiche affiche un taux de complétude et ce qui manque
- [ ] **La recherche interroge les trois codes** — AK court, ancien N° Parc, format long
- [ ] Chercher `A11246` trouve le matériel dont le code ITA est `AK-PICK006`

### Échéances

- [ ] Une pièce périmée apparaît en rouge, **avec le nombre de jours**
- [ ] Une échéance proche apparaît en ambre, avec le délai
- [ ] L'état n'est **pas stocké** — il se recalcule
- [ ] Modifier une date d'échéance change l'état immédiatement
- [ ] Les alertes partent selon les délais paramétrés
- [ ] Le destinataire est le Chef de Service Logistique

### Pièces administratives

- [ ] Le tableau affiche une ligne par matériel, une colonne par type actif
- [ ] **Les colonnes s'adaptent au filtre** — un engin n'affiche pas patente
- [ ] Une cellule sans objet affiche `s.o.`, pas un tiret
- [ ] Une cellule périmée affiche le nombre de jours, pas seulement une couleur
- [ ] **Créer un type de pièce fait apparaître une colonne, sans redéploiement**
- [ ] Un doublon de libellé renvoie le type existant
- [ ] Désactiver un type le retire du tableau, sans effacer les pièces
- [ ] La date d'expiration est **proposée** depuis la périodicité, et reste modifiable
- [ ] Un type sans périodicité ne propose rien
- [ ] **Renouveler crée une nouvelle pièce**, l'ancienne reste consultable
- [ ] La chaîne des renouvellements est visible sur la fiche
- [ ] Le total annuel somme les pièces en cours de validité
- [ ] **Le total est masqué avec un cadenas** sans `materiel:coutsAdministratifs`
- [ ] La colonne Matériel reste figée au défilement horizontal

### Blocages

- [ ] **Un véhicule dont l'assurance est périmée ne peut pas sortir**
- [ ] Un engin de levage sans VGP valide ne peut pas être affecté
- [ ] Une patente périmée avertit sans bloquer
- [ ] Le contournement exige le Chef de Service Logistique, un motif, et est journalisé
- [ ] **Un chauffeur au permis expiré ne peut pas être affecté**
- [ ] Un poids lourd exige un permis C

### Stocks

- [ ] Le solde est **calculé**, jamais stocké
- [ ] Une entrée augmente le solde du lieu concerné
- [ ] Une sortie le diminue
- [ ] Un article sous son seuil apparaît au tableau de bord
- [ ] Un inventaire produit un **écart**, pas un remplacement
- [ ] Un écart exige un motif

### Mouvements et inspections

- [ ] Le lieu d'un matériel résulte du dernier mouvement
- [ ] **Le lieu n'est pas modifiable à la main sur la fiche**
- [ ] Une sortie de véhicule sans inspection est refusée
- [ ] L'inspection de retour compare à celle de sortie
- [ ] **Les trois états fonctionnent** — `BON`, `MAUVAIS`, `ABSENT`
- [ ] `ABSENT` est distinct de `MAUVAIS` dans les relevés
- [ ] Les deux grilles sont séparées — physique et documents
- [ ] La grille documents contrôle la **présence**, pas la validité en base
- [ ] Les points d'inspection s'ajoutent **sans migration**
- [ ] Un point ne s'affiche que pour les types de matériel concernés
- [ ] **Une ligne `MAUVAIS` ou `ABSENT` crée une intervention à programmer**
- [ ] Une photo peut être jointe à une ligne
- [ ] Le niveau de carburant se saisit en huitièmes
- [ ] L'écart de carburant entre sortie et retour est calculé

### Inventaire de bord et transport

- [ ] Les neuf points d'équipement sont relevés au départ et au retour
- [ ] Un équipement présent au départ et absent au retour est signalé
- [ ] Une demande de transport porte les deux natures du formulaire
- [ ] **Le CIA est un lien vers un projet**, pas un texte libre
- [ ] Un même bon peut affecter **un véhicule et un engin octroyé**
- [ ] Chacun porte ses propres compteurs départ et retour
- [ ] Le visa du demandeur précède le visa logistique

### Chauffeurs — depuis M2

- [ ] L'écran Chauffeurs est une **vue filtrée sur les employés**
- [ ] **Aucune table Chauffeur distincte n'existe**
- [ ] Le permis et sa date viennent de `Habilitation` sur `Employe`
- [ ] Un permis expiré empêche l'affectation

### Navigation

- [ ] Quatorze entrées, dans l'ordre de la section 6.0
- [ ] **Un chef de chantier ne voit que deux entrées**
- [ ] Le Gestionnaire de stocks ne voit ni Entretien ni Chauffeurs
- [ ] Les entrées non livrées apparaissent désactivées, avec « M13 »
- [ ] **L'entrée Ressources reste dans le groupe Technique**
- [ ] Une demande créée en M8 apparaît dans « Demandes reçues » de M13
- [ ] **Une seule table `DemandeRessource`** — vérifier qu'elle n'est pas dupliquée
- [ ] L'arbitrage exige `ressource:arbitrer` — Chef de Service Logistique
- [ ] La mise à disposition exige `ressource:mettreADisposition` — Chef du Garage
- [ ] Les compteurs se mettent à jour au retour d'onglet

### Lieux

- [ ] Un lieu porte une nature et un libellé — deux niveaux
- [ ] Un lieu de nature CHANTIER pointe vers un projet de M5
- [ ] Clôturer un projet désactive ses lieux
- [ ] Le statut DEMOBILISE existe, distinct de DISPONIBLE

### Disponibilité

- [ ] Le changement de statut est horodaté
- [ ] Le taux mensuel se calcule depuis l'historique
- [ ] **Aucune saisie quotidienne n'est nécessaire**
- [ ] Le taux par famille correspond au calcul manuel sur un mois témoin

### Entretien

- [ ] Une vidange s'annonce 500 km ou 20 heures avant
- [ ] Le compteur alimenté par M6 déclenche l'alerte
- [ ] Une intervention consomme du stock — pièces, huiles
- [ ] L'historique d'entretien est consultable par matériel

### Réception — ferme le circuit M14

- [ ] Une ligne de bon de commande apparaît en réception attendue
- [ ] Les trois issues fonctionnent — conforme, avec réserve, non conforme
- [ ] Un refus exige motif et photo
- [ ] **La validation ouvre le droit à facturation dans M14**
- [ ] Une réception conforme crée le mouvement d'entrée en stock

### Reprise

- [ ] La passe 1 produit un rapport sans écrire
- [ ] Les correspondances sont validées avant import
- [ ] Les lignes rejetées sont journalisées avec leur motif
- [ ] Un code en doublon est signalé, jamais fusionné automatiquement

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m13.ts` écrit, exécuté, **vu échouer** une fois

---

## 12. Points de vigilance

1. **Deux natures, deux modèles.** Individuel et consommable ne se mélangent pas.
2. **L'état d'une pièce se calcule.** Stocké, il serait faux dès le lendemain.
2 bis. **Les types de pièce sont un référentiel, pas un enum.** Une obligation nouvelle se crée depuis l'écran, sans migration.
3. **Le solde de stock se calcule.** Même raisonnement.
4. **La disponibilité se déduit du statut horodaté**, jamais d'une saisie quotidienne.
5. **Le lieu résulte des mouvements.** Sinon deux vérités.
6. **Une assurance périmée bloque.** C'est le seul blocage non négociable.
7. **Douze champs à l'enregistrement.** Cent champs produisent cent champs vides.
8. **Aucun import sans validation humaine** des correspondances.
9. **Trois états d'inspection**, jamais un booléen. `ABSENT` n'est pas `MAUVAIS`.
10. **Une ligne d'inspection non conforme crée une intervention.** C'est le seul fait générateur d'entretien.
11. **Les chauffeurs viennent de M2.** Aucune table distincte.
12. **Le CIA est un projet**, pas un texte.

---

## 13. Plan de livraison

### Livraison 1 — le registre et les échéances

C'est ce qui apporte le plus, immédiatement.

| # | Étape |
| --- | --- |
| 1.1 | Modèle et migration — matériel, lieux, pièces administratives |
| 1.2 | Registre, trois niveaux de saisie |
| 1.3 | **Écran des échéances**, avec états calculés |
| 1.4 | Alertes par courriel, tâche quotidienne |
| 1.5 | Reprise des données — trois passes |

### Livraison 2 — mouvements, stocks, inspections

| # | Étape |
| --- | --- |
| 2.1 | Lieux de stockage, articles, mouvements |
| 2.2 | Bons d'entrée et de sortie |
| 2.3 | Points d'inspection — référentiel |
| 2.4 | Inspections d'entrée et de sortie — deux grilles, trois états |
| 2.5 | **Réceptions — ferme le circuit M14** |

### Livraison 3 — entretien, chauffeurs, transport

| # | Étape |
| --- | --- |
| 3.1 | Compteurs, alimentés par M6 |
| 3.2 | Programme d'entretien et interventions |
| 3.3 | Vue chauffeurs — depuis M2, sans table distincte |
| 3.4 | Demandes de transport |
| 3.5 | Disponibilité calculée et tableau de bord |

---

## 14. Ce qui ne se décide pas seul

1. Toute modification des décisions arrêtées en section 1
2. La liste des types de pièces administratives
3. Les délais d'alerte
4. Ce qui bloque une sortie et ce qui avertit
5. Les correspondances de reprise des données
6. La formule de calcul de disponibilité
7. Toute modification du schéma Prisma
8. Tout écart aux règles R-01 à R-07
