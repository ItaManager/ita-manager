# M14 — Achats et approvisionnement

**Statut** : à ouvrir · **Prérequis** : M1, M2, **M13 Logistique**
**Version cible** : `v1.1.0` · **Rédigé le** : 30 juillet 2026

> Le module le mieux cadré du projet — le circuit a été décrit pas à pas,
> écran par écran. Ce dossier reprend `M14-ACHATS-NOTE.md` et le complète en
> modèle de données, actions, critères de recette et balises.
>
> ⚠️ **Une dépendance non résolue.** L'étape 6 du circuit — la réception —
> appartient à la Logistique. Sans elle, le circuit s'arrête au bon de
> commande. Voir section 2.

---

## 1. Décisions arrêtées

> Les sept décisions ouvertes sont tranchées. Quatre portent sur des
> **montants** : ce sont des hypothèses de travail, paramétrables, à faire
> confirmer par la Direction Financière avant mise en exploitation.
>
> Les trois autres relèvent de la conception et sont fermes.

### 1.1 · Régularisation — **arrêtée**

Un achat **déjà effectué**, documenté après coup.

C'est une nécessité de terrain : une pompe casse un samedi, on achète, on
régularise lundi. C'est aussi **la seule voie par laquelle un achat échappe
entièrement au circuit** — pas de validation préalable, pas de comité, pas de
mise en concurrence.

Sans garde-fous, elle devient le chemin par défaut.

#### Qui peut en créer une

**Rôles désignés uniquement**, portés par la permission `achat:regulariser` :

| Rôle | Motif |
| --- | --- |
| Directeur Technique | Décide sur chantier |
| Chefs de service | Engagent leur périmètre |
| Chef Chantier et Chef Chantier Adjoint | Seuls présents le week-end |
| Chef du Garage | Panne d'engin |

**Pas tout employé.** Un ouvrier qui achète et régularise contourne toute la
chaîne.

#### Circuit

```
Régularisation → N+1 → DFC
                  ↓
        au-delà du plafond → + Comité
```

Le comité n'intervient qu'au-delà de `achat.plafondRegularisation`. En deçà,
le supérieur et la Direction Financière suffisent — le contrôle porte sur la
justification, non sur l'opportunité, qui n'existe plus.

#### Pièces obligatoires

Trois, sans exception :

| Pièce | Rôle |
| --- | --- |
| **Facture ou reçu** | Preuve de la dépense. Sans elle, rien à rembourser. |
| **Motif de l'achat hors circuit** | 40 caractères minimum. « Urgence » ne dit rien. |
| **Nom de la personne qui a engagé la dépense** | Elle peut différer du demandeur |

Le troisième point compte : c'est souvent le chef de chantier qui avance
l'argent de sa poche. Il faut savoir qui rembourser.

#### Indicateur d'alerte

**Part des régularisations dans le total**, par mois et par service, affichée
au tableau de suivi.

Seuil d'alerte proposé : **15 %**. Au-delà, le circuit d'achat ne contrôle
plus grand-chose et la question devient organisationnelle, pas logicielle.

### 1.2 · Seuils — **hypothèses de travail**

> ⚠️ **Valeurs non confirmées.** Elles doivent être fixées avec la Direction
> Financière au vu des volumes réels d'achat d'ITA. Elles sont paramétrables.

| Paramètre | Valeur proposée | Effet |
| --- | --- | --- |
| `achat.seuilComite` | **1 000 000 F** | Au-delà, comité obligatoire |
| `achat.plafondUrgence` | **3 000 000 F** | Au-delà, l'urgence ne dispense plus du comité |
| `achat.plafondRegularisation` | **500 000 F** | Au-delà, comité exigé même a posteriori |
| `achat.seuilDfcImpose` | **2 000 000 F** | Au-delà, la DFC est validatrice imposée |
| `achat.seuilDgImpose` | **5 000 000 F** | Au-delà, le DG est validateur imposé |

**Raisonnement.**

Le seuil du comité à un million laisse passer les consommables courants —
ciment, gravier, carburant d'appoint — et retient les achats structurants.
Un seuil trop bas envoie tout au comité et le paralyse ; trop haut, il ne
contrôle rien.

Le plafond de régularisation est **volontairement le plus bas**. Une
régularisation d'un demi-million est déjà exceptionnelle ; au-delà, elle doit
s'expliquer devant le comité même si l'argent est déjà sorti.

### 1.3 · Qui déclare l'urgence — **arrêtée**

**Le demandeur signale. Le Chef de Service Achats déclare.**

| Acteur | Geste | Portée |
| --- | --- | --- |
| Demandeur | Coche « besoin urgent », avec motif | **Information** — visible à l'instruction |
| Chef de Service Achats | Déclare l'urgence | **Décision** — dispense du comité sous plafond |

La distinction compte. Signaler est une information de terrain ; déclarer
engage la responsabilité de qui contourne le comité.

Le signalement du demandeur remonte la demande en tête de la file
d'instruction, sans rien dispenser.

Paramètre `achat.urgenceParDemandeur` : **activé**.

### 1.4 · Imputation budgétaire — **arrêtée**

**Pas de contrôle budgétaire dans cette version.**

L'imputation sert à **savoir qui dépense**, non à bloquer une dépense.

**Motif.** Un contrôle budgétaire suppose des budgets établis, tenus et
révisés. Ce n'est ni décidé ni en place chez ITA. Construire le contrôle sans
les budgets produirait des blocages arbitraires ou un contrôle désactivé —
donc inutile.

Ce que le module fournit à la place : le **montant engagé par chantier et par
service**, au tableau de suivi. C'est la matière première d'un budget futur.

Si un budget de chantier est décidé en M5 — sa décision 1.5 — le contrôle
s'ajoutera dans une version ultérieure.

### 1.5 · Colonne « Critères » — **arrêtée**

**Le motif de sélection du fournisseur**, saisi à l'instruction.

Texte libre, avec des propositions fréquentes en autocomplétation :

| Proposition |
| --- |
| Prix le plus bas — N devis |
| Meilleur délai |
| Seul fournisseur agréé |
| Fournisseur habituel |
| Contrat-cadre |
| Prix négocié — remise volume |
| Achat d'urgence |

**Obligatoire dès qu'un comité est saisi.** Le comité doit savoir pourquoi ce
fournisseur-là. Facultatif en dessous du seuil.

C'est aussi ce qui permettra, plus tard, d'analyser les décisions d'achat
autrement qu'au montant.

### 1.6 · Écart avec B-07 sur le refus — **confirmé**

La décision **B-07** pose qu'un refus hiérarchique est **définitif**, sans
recours. Elle vaut pour les congés et les demandes de ressources.

**Les achats font exception.** Une demande refusée revient en correction et se
resoumet.

**Motif.** Refuser un congé, c'est refuser une absence — le besoin disparaît
avec le refus. Refuser un achat, c'est presque toujours en demander un autre :
moins cher, plus tard, d'un autre fournisseur, en quantité moindre.

Obliger à recréer une demande ferait perdre l'historique et le motif du refus.

**À inscrire au registre** — voir D-10, section 16.

### 1.7 · Granularité du tableau de suivi — **arrêtée**

**Une ligne par article commandé.**

Une demande de trois articles répartis sur deux fournisseurs produit **trois
lignes**. Les colonnes de la demande se répètent ; celles de la commande
diffèrent.

**Motif.** C'est ce qui permet de voir qu'un article est livré alors qu'un
autre de la même demande attend encore. Une ligne par demande masquerait le
détail au moment où il devient utile.

Conséquence à assumer : le tableau compte plus de lignes que de demandes, et
la colonne « N° demande » se répète. C'est pourquoi elle est **figée au
défilement**.

---

## 2. La dépendance à la Logistique

L'étape 6 du circuit — le contrôle de conformité à la réception — appartient
au Service Logistique. **Elle n'existe pas.**

Trois voies :

| Voie | Effet |
| --- | --- |
| **Construire M13 Logistique d'abord** | Le circuit est complet. Le plus long. |
| **Intégrer une réception minimale dans M14** | Le circuit fonctionne. Risque de doublon avec M13. |
| **Livrer M14 sans l'étape 6** | Le circuit s'arrête au bon de commande. La facturation reste manuelle. |

**Recommandation : la deuxième.** Une réception minimale — quantité reçue,
issue du contrôle, motif — appartient au bon de commande, pas au magasin. M13
gérera l'entrée en stock, qui est autre chose.

À trancher avant d'ouvrir le module.

---

## 3. Objectif

Suivre une demande d'achat de l'expression du besoin jusqu'au paiement, avec
mise en concurrence, validation proportionnée au montant, et contrôle de
conformité à la réception.

**Critère de réussite** : un chef de chantier exprime un besoin en deux
minutes, le Chef de Service Achats l'instruit avec trois devis, et personne
ne peut payer une livraison qui n'est pas arrivée.

**Référence visuelle** : `reference/ApercuAchats.jsx`.

---

## 4. Circuit

```
1. Demande            Employé — expression du besoin, sans prix
2. Validation N+1     Supérieur du bénéficiaire — opportunité
3. Instruction        Chef de Service Achats — prix, fournisseurs, devis
4. Aiguillage         Sous seuil → étape 6 · Au-dessus → comité
5. Comité             Quatre directions, avis indépendants
6. Bon de commande    Groupé par fournisseur, envoyé
7. Réception          Logistique — contrôle de conformité
8. Facturation        DFC — paiement sur quantité reçue
```

### 4.1 · Deux principes du registre s'appliquent

**B-01** — toute demande passe par le N+1 direct, puis le service compétent.

**B-02** — un seul niveau hiérarchique, pas de cascade.

### 4.2 · Acteurs, rattachés aux postes réels

| Étape | Poste |
| --- | --- |
| Demande | Tout employé enregistré |
| Validation N+1 | Supérieur hiérarchique du **bénéficiaire** |
| Instruction | **Chef de Service Achats** |
| Comité | **Les quatre directions** — DT, DARH, DFC, DG |
| Réception | **Gestionnaire de stocks**, Service Logistique |
| Facturation | **Directeur Financier et Comptable** |

> Les intitulés « Responsable Achat » et « Logisticien » du document d'origine
> ne correspondent à aucun poste du référentiel.

---

## 5. Périmètre

**Dans le périmètre** — demande, validation, instruction avec mise en
concurrence, comité, bon de commande groupé par fournisseur, réception et
reliquat, facturation, tableau de suivi, référentiels articles et
fournisseurs.

**Hors périmètre** — l'entrée en stock et le magasin (M13), la comptabilité
générale, le règlement bancaire lui-même.

---

## 6. Écrans

| Écran | Route | Permission | Compteur | Patron |
| --- | --- | --- | --- | --- |
| Mes demandes | `/achats/demandes` | `achat:demander` | — | 3 |
| Nouvelle demande | modale | `achat:demander` | — | **4 bis — étapes** |
| **À valider** | `/achats/a-valider` | lien de données **ou** `achat:valider` | 🔴 | 3 + 8 |
| À instruire | `/achats/instruction` | `achat:instruire` | 🔴 | 3 |
| Instruction | `/achats/demandes/[id]/instruire` | `achat:instruire` | — | **page dédiée** |
| Bons de commande | `/achats/commandes` | `achat:instruire` | — | 3 |
| Réceptions | `/achats/receptions` | `achat:receptionner` | 🔴 | 3 |
| Facturation | `/achats/facturation` | `achat:facturer` | 🔴 | 3 |
| **Tableau de suivi** | `/achats/suivi` | selon le périmètre | — | 3 — **lecture seule** |
| Bordereau de prix | `/achats/articles` | `referentiel:creer` | — | 3 |
| Fournisseurs | `/achats/fournisseurs` | `referentiel:creer` | — | 3 |

### 6.0 · Arborescence de navigation

```
Achats
├─ Mes demandes           achat:demander
├─ À valider           🔴 lien de données  ou  achat:valider
├─ À instruire         🔴 achat:instruire
├─ Bons de commande       achat:instruire
├─ Réceptions          🔴 achat:receptionner
├─ Facturation         🔴 achat:facturer
├─ Tableau de suivi       selon le périmètre
│
├─ Bordereau de prix      referentiel:creer
└─ Fournisseurs           referentiel:creer
```

Les deux référentiels sont séparés par un trait : ils ne sont pas dans le
flux de traitement.

**Ce que chaque rôle voit réellement :**

| Rôle | Entrées visibles |
| --- | --- |
| Chef de chantier | Mes demandes · Tableau de suivi de ses chantiers |
| Directeur | Mes demandes · À valider · Tableau de suivi de sa direction |
| **Chef de Service Achats** | Tout sauf Réceptions et Facturation |
| Gestionnaire de stocks | Réceptions · Tableau de suivi |
| Directeur Financier | À valider · Facturation · Tableau de suivi complet |

### 6.0 bis · Une seule entrée « À valider » — **arrêté**

Un directeur peut être sollicité à **deux titres** : comme supérieur
hiérarchique d'un de ses agents, et comme membre du comité.

**Une seule liste**, avec une colonne qui dit à quel titre.

| Référence | Demandeur | Montant | Sollicité en tant que |
| --- | --- | --- | --- |
| DA-2026-052 | KOFFI Alain | — | Supérieur hiérarchique |
| DA-2026-047 | DOSSO Christ | 3 026 000 F | **Directeur Général** |
| DA-2026-051 | DIALLO Mariam | 890 000 F | **Directeur Général** — imposé |

Trois règles d'affichage :

**Le poste, non la mention générique.** « Directeur Général » dit pourquoi il
est là ; « membre du comité » ne dit rien.

**Pas le nom de la personne.** C'est le directeur lui-même qui regarde sa
propre file — il sait qui il est.

**La mention « imposé »** quand une règle l'a désigné d'office, au-delà d'un
seuil ou sur un achat de chantier. Elle lui indique qu'il n'a pas été choisi
par le Chef de Service Achats, mais convoqué par une règle.

**Le montant n'apparaît que pour le comité.** Le supérieur hiérarchique juge
l'opportunité sans connaître le prix — règle 8.9.

Deux entrées distinctes forceraient un directeur à regarder deux endroits.
Règle R-02 : optimiser pour la lecture.

### 6.1 · Formulaire de demande — quatre étapes

**Étape 1 — Demandeur.** Nom, direction, service, chantier : **lecture
seule**, issus de la session. Plus « demande pour un autre agent », avec le
bénéficiaire.

> **Routage** : c'est le supérieur du **bénéficiaire** qui valide, non celui
> du saisisseur. Son service consomme, son responsable juge. Le bénéficiaire
> n'est **pas** notifié.

**Étape 2 — Nature.** Type — initiale ou régularisation. Description et
justification. Date de besoin. Lieu de livraison.

**Étape 3 — Articles**, liste répétable. Désignation avec autocomplétion et
création libre, quantité, unité.

> **Prix et fournisseur invisibles du demandeur.** Il exprime un besoin, pas
> une commande.

**Étape 4 — Pièces jointes.** Facultatif en initiale, **obligatoire en
régularisation**.

### 6.1 bis · Fiche de demande — état du comité

Sur la fiche, où l'on voit l'ensemble du comité, **nom et poste** figurent
tous deux. On veut savoir qui relancer, et le poste dit pourquoi il est là.

| Validateur | État |
| --- | --- |
| Serge YAO — Directeur Technique | Favorable · 28/07 |
| Aïcha TRAORÉ — Directrice Administrative et RH | Favorable · 28/07 |
| Marc OUATTARA — Directeur Financier 🔒 | En attente |
| Dr Jules KONAN — Directeur Général | En attente |

Le cadenas marque un validateur **imposé** par une règle, non retirable —
voir 8.6.

L'état se lit **par libellé**, pas seulement par couleur — règle R-01.

### 6.2 · Écran d'instruction

Page dédiée. Pour chaque ligne : les fournisseurs candidats du bordereau avec
leur prix, le fournisseur retenu, le prix figé, les devis joints.

En bas, **les bons de commande prévisionnels** — un par fournisseur retenu —
et l'aiguillage : sous seuil, ou comité avec ses validateurs.

---

## 7. Modèle de données

`DemandeAchat` · `LigneDemandeAchat` · `Article` · `Fournisseur` ·
`PrixFournisseur` · `Devis` · `AvisComite` · `BonCommande` ·
`LigneBonCommande` · `Reception` · `LigneReception` · `FactureFournisseur` ·
`EvenementDemandeAchat`

### 7.1 · Le prix se fige à l'instruction

```prisma
model LigneBonCommande {
  articleId       String?
  designation     String    /// Copie — l'article peut être renommé
  quantite        Decimal
  unite           String
  fournisseurId   String
  prixUnitaire    Decimal   /// FIGÉ. Jamais une référence au bordereau.
  tauxTva         Decimal
  quantiteRecue   Decimal   @default(0)
  /// reliquat = quantite − quantiteRecue, calculé
}
```

> **Motif.** Le prix du bordereau est modifiable à tout moment. Une hausse en
> octobre réécrirait le montant d'une commande d'août, et le rapprochement
> avec la facture deviendrait faux.

### 7.2 · Un avis par validateur, jamais un statut unique

```prisma
model AvisComite {
  demandeAchatId String
  role           String        /// DT, DARH, DFC, DG
  employeId      String
  etat           EtatAvis      /// ATTENTE, FAVORABLE, DEFAVORABLE
  commentaire    String?
  decideLe       DateTime?
  impose         Boolean       /// Ajouté par une règle, non retirable
  @@unique([demandeAchatId, role])
}
```

> ⚠️ **Défaut relevé dans l'application actuelle.** Les statuts y vivent dans
> un champ unique : `approved_by_dt`, `approved_by_rh`, `approved_by_dfc`.
>
> C'est incompatible avec une validation parallèle. Si la Direction Technique
> valide et que les RH n'ont pas répondu, `approved_by_dt` efface
> l'information que les RH attendent. Et une validation RH ultérieure efface
> celle de la DT.
>
> **Une ligne par validateur.** Le statut global se déduit : en attente tant
> qu'un manque, favorable quand tous ont dit oui, défavorable dès qu'un dit
> non.

### 7.3 · Les événements portent l'historique

`EvenementDemandeAchat` enregistre chaque transition avec auteur et
horodatage. Le tableau de suivi n'est **rien d'autre qu'une projection de ces
événements** — voir section 9.

### 7.4 · Référentiels à créer

**`Article`** — le **bordereau de prix**. Désignation, unité, catégorie,
actif. Un article porte **plusieurs prix fournisseur**, jamais un prix unique.

> **Le point d'entrée du travail est l'article, pas le fournisseur.** Le Chef
> de Service Achats reçoit une demande de ciment : elle cherche « ciment » et
> veut voir qui le fournit et à quel prix. L'inverse est rare — on ouvre une
> fiche fournisseur pour vérifier un RCCM, pas pour parcourir son catalogue.
>
> L'écran Bordereau de prix affiche donc, en ouvrant un article, la liste de
> ses fournisseurs avec leur prix et sa date de validité. L'écran
> Fournisseurs affiche l'identité de la société, et ses articles en second
> onglet — une vue de lecture.

**`Fournisseur`** — raison sociale, RCCM, compte contribuable, contact,
téléphone, adresse, **numéro Wave**, conditions habituelles.

> ⚠️ Le **numéro Wave d'un fournisseur** est une donnée sensible, au même
> titre que celui d'un journalier — c'est par lui que l'argent part. Double
> confirmation à la saisie, modification journalisée.

**`PrixFournisseur`** — article × fournisseur × prix × **date de validité**.

La date n'est pas un ornement : sans elle, impossible de suivre les hausses
ni de justifier un montant passé. L'historique permet de dire « ce
fournisseur a augmenté de 12 % en six mois ».

**`Unite`** — sac, tonne, m³, ml, m², litre, unité, paquet.

**`LieuLivraison`** — déjà prévu en M5, réutilisé.

---

## 8. Règles métier

### 8.1 · Croisement libre article-fournisseur

Chaque ligne reçoit **son** fournisseur, indépendamment des autres. Une
demande de trois articles peut donner trois bons de commande.

Le Chef de Service Achats assigne plusieurs candidats par article avec leurs
prix, puis en retient un — devis joints.

### 8.2 · Bon de commande ouvert

Les lignes validées s'accumulent par fournisseur dans un bon **ouvert**. Il
se referme à l'envoi. Une nouvelle ligne pour le même fournisseur ouvrira un
nouveau bon.

### 8.3 · Réception, reliquat, trois issues

Chaque ligne porte **commandée**, **reçue**, **reliquat**.

| Issue | Effet |
| --- | --- |
| **Conforme** | Quantité ajoutée au reçu, facturation ouverte |
| **Conforme avec réserve** | Accepté malgré un défaut mineur. Réserve tracée, paiement possible. |
| **Non conforme** | Refusé. Reliquat maintenu, motif et photo obligatoires. |

> La deuxième issue est celle qu'on oublie toujours. Sur chantier, refuser
> vingt tonnes de gravier légèrement hors calibre bloque la semaine.

**Livraison partielle** : on valide ce qui est reçu, le reliquat reste
ouvert, la ligne reste vivante.

**Solder un reliquat** — trois motifs : renonciation, réattribution à un
autre fournisseur, annulation du besoin.

### 8.4 · Le paiement porte sur la quantité reçue

**Jamais sur la commandée.** C'est le contrôle qui protège la trésorerie : si
la facture porte dix sacs et que huit sont entrés, l'écart est visible avant
le règlement.

Le reliquat reste une **dette du fournisseur**, pas une avance d'ITA.

### 8.5 · Deux cycles de vie distincts

| Objet | Se termine à | Suivi par |
| --- | --- | --- |
| Demande d'achat | Réception complète de toutes ses lignes | Demandeur et N+1 |
| Bon de commande | Paiement du fournisseur | Achats et DFC |

Le demandeur n'attend pas le paiement pour voir sa demande close.

États intermédiaires visibles : *partiellement livrée* · *en attente
fournisseur* — date dépassée · *soldée*.

### 8.6 · Comité — les quatre directions par défaut

Proposées à l'instruction. Le Chef de Service Achats peut en retirer ou en
ajouter selon la nature de l'achat.

**Chacun se prononce indépendamment.** Un seul refus bloque et renvoie en
instruction ; tous doivent valider pour émettre le bon de commande.

#### Validateurs imposés — le garde-fou

Le Chef de Service Achats instruit le dossier — il négocie le prix et retient
le fournisseur — **et désigne ceux qui le contrôlent**.

Ce n'est pas irrégulier, mais la souplesse joue dans les deux sens.

**Règle** : certains validateurs sont **imposés** par une règle et non
retirables.

| Condition | Validateur imposé |
| --- | --- |
| Montant supérieur au seuil DFC | Direction Financière |
| Imputation à un chantier | Direction Technique |
| Montant supérieur au seuil DG | Direction Générale |

Ils s'affichent avec un cadenas — patron 5 bis, `verrouillees`.

### 8.7 · Deux voies de dérogation au comité

| Voie | Déclenchement | Justification |
| --- | --- | --- |
| Montant faible | Automatique, sous `achat.seuilComite` | Aucune |
| Urgence | Déclarée, sous `achat.plafondUrgence` | **Motif obligatoire** |

Au-delà du plafond d'urgence, **aucune urgence ne dispense du comité**.

**Deux garde-fous** : un achat urgent notifie a posteriori les directions qui
auraient validé ; un écran de suivi liste les achats passés en urgence, avec
motif, montant et fournisseur.

### 8.8 · Refus — voir décision 1.6

Un refus ne crée jamais une nouvelle demande. La demande d'origine revient en
correction et se resoumet. **Tous les avis du comité sont réinitialisés** —
pas de fusion partielle.

### 8.9 · Le demandeur ne voit ni prix ni fournisseur

Ni à la saisie, ni au suivi. Il exprime un besoin ; le prix est l'affaire des
Achats.

**Motif** : sinon on raisonne par le prix plutôt que par le besoin, et les
demandes s'autocensurent avant instruction.

---

## 9. Tableau de suivi — lecture seule

Vue d'ensemble de toutes les demandes et de leurs points de validation.

**Aucune saisie n'y est possible.** Chaque colonne se remplit au
franchissement d'une étape. C'est une **projection des événements**, pas une
table que l'on tient à jour.

C'est ce qui garantit qu'il dit vrai : personne ne peut antidater une
transmission ni corriger un délai.

### 9.1 · Granularité — une ligne par article commandé

Une demande de trois articles répartis sur deux fournisseurs produit **trois
lignes**. Les colonnes de la demande se répètent ; celles de la commande
diffèrent.

C'est ce qui permet de suivre un article livré alors qu'un autre attend.

### 9.2 · Correspondance colonne par colonne

| Colonne | Se remplit à | Source |
| --- | --- | --- |
| N° demande | Création | Demande |
| Date réception besoin | Soumission | Événement |
| Date transmission directeurs | Envoi au comité | Événement |
| Date besoin validé | Dernier avis favorable, ou validation N+1 si sous seuil | Événement |
| Désignation | — | Ligne d'article |
| Date émission BC | Génération | Événement |
| **Délai traitement** | **Calculé** — émission BC moins réception besoin | Dérivé |
| N° BC | Génération | Bon de commande |
| Chantier / Service | — | Demande |
| Type | — | Initiale ou régularisation |
| Demandeur | — | **Bénéficiaire**, non le saisisseur |
| Date trans. log./compta | Envoi du BC | Événement |
| **Date livraison** | **Validation de conformité**, non l'arrivée du camion | Événement |
| Fournisseur | — | Retenu à l'instruction |
| Facture | Enregistrement DFC | Facture |
| Montant | — | TTC de la ligne |
| Critères | ⏳ décision 1.5 | — |
| Statut | **Déduit** | Dérivé |

**Deux colonnes ne se stockent pas** : le délai et le statut. Les stocker
créerait un risque de divergence avec les événements.

**La date de livraison est celle de la validation de conformité.** Une
livraison refusée ne remplit pas cette colonne — c'est ce qui rend le tableau
exploitable pour mesurer un fournisseur.

### 9.3 · Ce que le tableau permet de mesurer

Le délai de traitement moyen, par étape — où le circuit ralentit-il ?

La fiabilité d'un fournisseur — écart entre date annoncée et conformité
validée, taux de non-conformité.

**La part des régularisations** — le signal d'alerte de la décision 1.1.

Les demandes bloquées, sans mouvement depuis N jours.

---

## 10. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `achat:demander` | Créer une demande | tous les employés permanents |
| `achat:instruire` | Prix, fournisseurs, bons de commande | ADMIN, Chef de Service Achats |
| `achat:valider` | Se prononcer au comité | ADMIN, DG, DRH, DFC, DT |
| `achat:receptionner` | Contrôle de conformité | ADMIN, Service Logistique |
| `achat:facturer` | Enregistrer facture et paiement | ADMIN, DFC |
| `achat:regulariser` | Créer une régularisation | rôles désignés — décision 1.1 |
| `achat:parametres` | Seuils et plafonds | ADMIN, DFC |

**La validation N+1 ne passe pas par une permission** : elle se déduit de
`Affectation.superieurId` du **bénéficiaire**. Même mécanisme que M3.

---

## 11. Server Actions

| Action | Permission |
| --- | --- |
| `creerDemande` · `modifierDemande` · `soumettreDemande` | `achat:demander` |
| `annulerDemande` | demandeur, avant émission du BC |
| `deciderN1` | **lien de données** — supérieur du bénéficiaire ou délégataire |
| `instruireDemande` · `assignerFournisseur` · `joindreDevis` | `achat:instruire` |
| `transmettreComite` · `emettreBonCommande` | `achat:instruire` |
| `donnerAvisComite` | `achat:valider` + être validateur désigné |
| `envoyerBonCommande` | `achat:instruire` |
| `enregistrerReception` | `achat:receptionner` |
| `soldrerReliquat` | `achat:instruire`, motif obligatoire |
| `enregistrerFacture` · `enregistrerPaiement` | `achat:facturer` |
| `creerArticle` · `creerFournisseur` | `referentiel:creer` |

### 11.1 · `deciderN1` — contrôle par la donnée

```ts
const beneficiaire = await prisma.employe.findUnique({
  where: { id: demande.beneficiaireId },
  include: { affectationActive: true },
});

const autorise =
  beneficiaire.affectationActive.superieurId === session.employeId ||
  await delegationActive(beneficiaire.affectationActive.superieurId, session.employeId);

if (!autorise) throw new PermissionRefusee("achat:demander");
```

**Le supérieur du bénéficiaire**, jamais celui du saisisseur.

### 11.2 · `donnerAvisComite` — deux contrôles

1. L'appelant détient `achat:valider`
2. Il figure parmi les validateurs **désignés pour cette demande**

Un directeur ne peut pas se prononcer sur une demande où il n'a pas été
sollicité.

### 11.3 · Création inline — renvoyer l'existant

`creerArticle` et `creerFournisseur` sont appelées depuis un combobox
créable. En cas de doublon sur le libellé normalisé, **renvoyer l'entité
existante** plutôt qu'une erreur.

Sans cela, le référentiel se remplit de « Ciment CPA 45 », « ciment cpa45 »
et « CIMENT CPA 45 ».

---

## 12. Critères de recette

### Demande

- [ ] Créer une demande avec plusieurs articles
- [ ] L'article se cherche par autocomplétation, se crée s'il n'existe pas
- [ ] **Le demandeur ne voit ni prix ni fournisseur**, ni à la saisie ni au suivi
- [ ] Une demande pour autrui part au supérieur **du bénéficiaire**
- [ ] Le bénéficiaire n'est pas notifié
- [ ] Une régularisation exige une pièce jointe
- [ ] **`deciderN1` appelée par un tiers, en POST direct, est refusée**

### Instruction

- [ ] Chaque ligne reçoit son fournisseur, indépendamment des autres
- [ ] Le bordereau propose les prix connus par article
- [ ] Un fournisseur absent se crée depuis le champ
- [ ] **Le prix est figé sur la ligne de commande**
- [ ] Modifier le bordereau ensuite ne change pas la commande émise
- [ ] Les bons de commande prévisionnels s'affichent, groupés par fournisseur
- [ ] Ouvrir un article du bordereau affiche ses fournisseurs avec leurs prix
- [ ] L'historique des prix d'un article est consultable

### Aiguillage et comité

- [ ] Sous le seuil, le bon de commande part sans comité
- [ ] Au-dessus, le comité est obligatoire
- [ ] **Au-delà du plafond d'urgence, l'urgence ne dispense plus**
- [ ] Les quatre directions sont proposées par défaut
- [ ] **Un validateur imposé par une règle n'est pas retirable**
- [ ] **Un avis par validateur** — valider avec l'un n'efface pas l'autre
- [ ] Un seul refus renvoie en instruction et réinitialise tous les avis
- [ ] Un achat urgent notifie a posteriori les directions écartées
- [ ] **`donnerAvisComite` par un directeur non désigné est refusée**
- [ ] **Une seule entrée « À valider »**, avec la colonne « Sollicité en tant que »
- [ ] Le poste s'affiche, non la mention « membre du comité »
- [ ] Un validateur imposé porte la mention « imposé »
- [ ] **Le montant n'apparaît pas pour une sollicitation hiérarchique**
- [ ] La fiche de demande affiche nom et poste de chaque validateur

### Réception et reliquat

- [ ] Recevoir moins que commandé laisse un reliquat ouvert
- [ ] Les trois issues du contrôle fonctionnent
- [ ] Un refus exige motif et photo
- [ ] **La date de livraison est celle de la validation, pas de l'arrivée**
- [ ] Une livraison refusée ne remplit pas la date de livraison
- [ ] Solder un reliquat exige un motif parmi les trois

### Facturation

- [ ] **Le paiement porte sur la quantité reçue, jamais sur la commandée**
- [ ] Une facture supérieure au reçu est signalée avant règlement
- [ ] Aucune facturation possible avant validation du contrôle

### Clôture

- [ ] Une demande se clôt à la réception complète, non au paiement
- [ ] « Partiellement livrée » apparaît tant qu'une ligne attend
- [ ] « En attente fournisseur » apparaît si la date annoncée est dépassée

### Tableau de suivi

- [ ] **Aucune saisie n'y est possible**
- [ ] Une ligne par article commandé
- [ ] Le délai et le statut sont calculés, non stockés
- [ ] Les filtres fonctionnent, dont le filtre Retards
- [ ] L'export tableur respecte les filtres
- [ ] La part des régularisations s'affiche

### Interface

- [ ] Tous les sélecteurs sont à autocomplétation — R-04
- [ ] Un doublon d'article renvoie l'existant, pas une erreur
- [ ] La modale de création suit le patron 4 bis, avec récapitulatif — R-05
- [ ] Aucun statut lisible à la seule couleur — R-01
- [ ] Chaque icône seule porte un `aria-label` — R-03

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m14.ts` écrit, exécuté, **vu échouer** une fois
- [ ] Ajouté à `verify-all.ts`

---

## 13. Paramètres

> ⚠️ **VALEURS NON CONFIRMÉES** — décision 1.2, en attente de la Direction
> Financière. Ne pas mettre en exploitation sans validation.

| Clé | Sens | Valeur |
| --- | --- | --- |
| `achat.seuilComite` | Au-delà, comité obligatoire | **1 000 000 F** ⚠️ |
| `achat.plafondUrgence` | Au-delà, l'urgence ne dispense plus | **3 000 000 F** ⚠️ |
| `achat.plafondRegularisation` | Au-delà, comité exigé a posteriori | **500 000 F** ⚠️ |
| `achat.seuilDfcImpose` | Au-delà, DFC validatrice imposée | **2 000 000 F** ⚠️ |
| `achat.seuilDgImpose` | Au-delà, DG validateur imposé | **5 000 000 F** ⚠️ |
| `achat.seuilAlerteRegularisation` | Part au-delà de laquelle on alerte | **15 %** ⚠️ |
| `achat.tvaDefaut` | Taux proposé à l'instruction | 18 % |
| `achat.modePaiementDefaut` | Comptant, 30 ou 60 jours | 30 jours |
| `achat.delaiRelanceFournisseur` | Jours avant alerte de retard | 3 |
| `achat.urgenceParDemandeur` | Le demandeur peut-il signaler ? | **activé** |

Comme pour M3, le fichier de seed porte un bandeau explicite et l'écran des
paramètres affiche « Ces valeurs sont des hypothèses de travail, non
validées ».

**Toute modification est journalisée.** Déplacer un seuil de contrôle doit
rester traçable — sinon un achat de trois millions passé sans comité devient
inexplicable six mois plus tard.

---

## 14. Points de vigilance

1. **Un avis par validateur, jamais un statut unique.** C'est le défaut de l'application actuelle, et il produit des comportements erratiques.
2. **Le prix se fige à l'instruction.** Sinon le rapprochement avec la facture devient faux.
3. **Le paiement porte sur la quantité reçue.** C'est le verrou qui protège la trésorerie.
4. **La date de livraison est celle du contrôle**, pas de l'arrivée du camion.
5. **Le tableau de suivi est une projection**, jamais une table tenue à jour.
6. **Le demandeur ne voit ni prix ni fournisseur.**
7. **Des validateurs imposés**, non retirables, sur les achats sensibles.
8. **La régularisation est la seule voie de contournement.** Sans plafond ni pièce, elle devient le chemin par défaut.

---

## 15. Balises d'exécution

Les quinze règles de `CLAUDE.md` s'appliquent. Quatre méritent un rappel :

**Règle 1 — lire, jamais se souvenir.** Le circuit, les acteurs et la
correspondance du tableau de suivi figurent dans ce dossier. Ne les réécris
pas de mémoire.

**Règle 2 — une seule source pour les permissions.** Les sept permissions de
la section 10 s'ajoutent au catalogue de `lib/auth/guard.ts`, nulle part
ailleurs.

**Règle 3 — prouver, jamais affirmer.** Les règles de reliquat, de figeage du
prix et de calcul du délai se vérifient par script.

**Règle 6 — `npm run build` fait partie du travail.**

### Ce qui ne se décide pas seul

1. Les sept décisions de la section 1
2. La voie retenue pour la dépendance Logistique — section 2
3. Toute modification du circuit ou de l'ordre des étapes
4. La liste des validateurs imposés et leurs seuils
5. La classification d'une donnée — le numéro Wave d'un fournisseur est sensible
6. Tout écart aux règles R-01 à R-05

---

## 16. À inscrire au registre des décisions

Deux entrées à ajouter à `DECISIONS.md`, section D.

### D-10 · Le refus d'un achat n'est pas définitif — **arrêtée**

La décision **B-07** pose qu'un refus hiérarchique est définitif, sans
recours. Elle vaut pour les congés et les demandes de ressources.

**Les demandes d'achat font exception.** Une demande refusée revient en
correction et se resoumet, en conservant son historique et le motif du refus.

**Motif.** Refuser un congé, c'est refuser une absence — le besoin disparaît
avec le refus. Refuser un achat, c'est presque toujours en demander un autre :
moins cher, plus tard, d'un autre fournisseur, en quantité moindre.

Obliger à recréer une demande ferait perdre le fil et le motif.

**Conséquence technique** : tous les avis du comité sont **réinitialisés** à
la resoumission. Pas de fusion partielle — un directeur qui avait approuvé une
demande à trois millions doit se prononcer à nouveau sur la version à deux
millions.

### D-11 · Deux gestes distincts sur l'urgence — **arrêtée**

| Acteur | Geste | Portée |
| --- | --- | --- |
| Demandeur | **Signale** un besoin urgent, avec motif | Information — remonte la demande en tête de file |
| Chef de Service Achats | **Déclare** l'urgence | Décision — dispense du comité sous plafond |

Signaler est une information de terrain. Déclarer engage la responsabilité de
qui contourne le comité.

Le signalement ne dispense de rien.
