# M19 — Missions et frais de mission

**Statut** : cadré · **Prérequis** : M2, M1 · **Lié à** : M15 pour le paiement Wave
**Rédigé le** : 2 août 2026

> Un employé part en mission. Il demande, on vise, on valide, on avance les
> frais. Il revient, il rend compte, on régularise.
>
> **Le module ne se termine pas au départ.** Ce qui le rend délicat, c'est le
> retour : le rapport, les justificatifs, et l'argent qui reste à rendre.

---

## 1. Le circuit

```
Employé                    remplit la demande
    ↓
Supérieur direct           vise                      B-01
    ↓
Direction RH               valide ou refuse
    ↓
Direction Financière       verse l'avance            si frais
    ↓
                           ── MISSION ──
    ↓
Employé                    dépose le rapport et les justificatifs
    ↓
Direction Financière       contrôle et régularise
    ↓
                           clôturée
```

**Sept étapes, quatre acteurs.** Aucune n'est optionnelle, sauf le versement
d'avance quand la mission n'engage aucun frais.

---

## 2. Décisions arrêtées

### 2.1 · Les frais sont AVANCÉS, pas remboursés — **arrêtée**

La Direction Financière verse **avant le départ**. On régularise au retour,
sur justificatifs.

#### Ce que ça implique

Un employé ne finance pas la mission de sa poche. C'est juste, et c'est ce
qui rend possible d'envoyer quelqu'un qui n'a pas d'avance de trésorerie.

Mais cela crée une **créance sur l'employé** tant que la mission n'est pas
régularisée. C'est ce qui structure toute la seconde moitié du module.

### 2.2 · Saisie libre, avec justificatifs obligatoires — **arrêtée**

Pas de barème. L'employé estime ses frais à la demande, dépense ce qu'il
dépense, et **justifie chaque ligne au retour**.

#### Le contrôle est ligne à ligne

La Direction Financière accepte ou rejette **chaque dépense**, avec motif si
rejet.

Une dépense rejetée ne compte pas dans le justifié — elle augmente donc le
reliquat dû par l'employé.

> Sans barème, le contrôle a posteriori est la seule protection. Il doit être
> réel, pas une formalité.

### 2.3 · Le supérieur direct vise d'abord — **arrêtée**

**Aucune exception.** Décision B-01 : toute demande passe par le N+1 direct,
puis par le service compétent.

Le visa du N+1 dit : « cette mission a lieu d'être, et je peux me passer de
cette personne pendant ces jours-là ».

La RH ne le sait pas. Le supérieur, oui.

#### Contrôle par lien de données, pas par permission

Comme `deciderN1` en M3 : le viseur est celui dont `Affectation.superieurId`
pointe vers lui. Aucune permission ne le remplace.

### 2.4 · Le rapport de mission justifie les frais — **arrêtée**

Pas de rapport, pas de régularisation. Pas de régularisation, **pas de
nouvelle mission**.

C'est la règle qui fait que les rapports arrivent. Voir 5.6.

### 2.5 · Deux moyens de paiement — **arrêtée**

| Moyen | Circuit | Trace |
| --- | --- | --- |
| **Wave** | Passe par M15 — autorisation DG, exécution DFC | Complète |
| **Espèces** | La DFC enregistre la remise, l'employé émarge | Déclarative |

#### ⚠️ Le paiement en espèces échappe au circuit à quatre yeux

M15 impose que le préparateur ne soit pas l'autorisateur, et que
l'autorisateur ne soit pas l'exécutant. Une remise en espèces n'a pas ce
garde-fou.

**Proposition — à confirmer par la Direction Financière :**

> Les espèces sont autorisées **jusqu'à 150 000 F**. Au-delà, Wave est
> obligatoire.
>
> Motif : c'est le montant qu'une mission ordinaire de trois jours consomme.
> Au-delà, la traçabilité vaut la contrainte.

### 2.6 · Le statut se déduit, il ne se stocke pas — **arrêtée**

Même règle que M14 et M5. Onze états, tous déductibles des événements
horodatés.

Un statut stocké diverge dès qu'un événement est corrigé.

### 2.7 · Une mission ne se supprime pas — **arrêtée**

Elle s'annule, avec motif. Une mission dont l'avance a été versée ne peut
plus être annulée : il faut la régulariser.

---

## 3. Les onze états

```
BROUILLON              l'employé n'a pas encore soumis
ATTENTE_N1             soumise, en attente du visa du supérieur
ATTENTE_RH             visée, en attente de la Direction RH
ATTENTE_AVANCE         validée, frais à verser
APPROUVEE              prête — avance versée, ou mission sans frais
EN_COURS               entre la date de départ et la date de retour
ATTENTE_RAPPORT        retour passé, rapport non déposé
ATTENTE_CONTROLE       rapport déposé, la DFC doit contrôler
CLOTUREE               contrôlée et régularisée
REFUSEE                refusée par le N+1 ou la RH
ANNULEE                annulée avant versement de l'avance
```

### 3.1 · La déduction

```ts
function statutMission(m: Mission, aujourdhui = new Date()): StatutMission {
  if (m.annuleeLe)        return "ANNULEE";
  if (m.refuseeLe)        return "REFUSEE";
  if (m.clotureeLe)       return "CLOTUREE";
  if (m.rapportDeposeLe)  return "ATTENTE_CONTROLE";

  if (m.dateRetour < aujourdhui && !m.rapportDeposeLe) return "ATTENTE_RAPPORT";
  if (m.dateDepart <= aujourdhui && aujourdhui <= m.dateRetour) return "EN_COURS";

  if (m.avanceVerseeLe)   return "APPROUVEE";
  if (m.valideeRhLe)      return m.fraisEstimes > 0 ? "ATTENTE_AVANCE" : "APPROUVEE";
  if (m.viseeN1Le)        return "ATTENTE_RH";
  if (m.soumiseLe)        return "ATTENTE_N1";
  return "BROUILLON";
}
```

> **L'ordre des tests compte.** Une mission annulée reste annulée même si sa
> date de départ est passée. Une mission clôturée ne redevient jamais
> `ATTENTE_RAPPORT`.

---

## 4. Modèle de données

`Mission` · `LigneFrais` · `RapportMission` · `VersementAvance` ·
`Regularisation`

### 4.1 · La mission

```prisma
model Mission {
  id             String   @id @default(uuid())
  reference      String   @unique              /// MIS-2026-0042

  demandeurId    String
  demandeur      Employe  @relation(fields: [demandeurId], references: [id])

  /// Objet et destination
  objet          String
  destination    String
  paysId         String?                       /// Null si mission nationale
  moyenTransport MoyenTransport

  dateDepart     DateTime @db.Date
  dateRetour     DateTime @db.Date

  /// Estimation à la demande — non contractuelle
  fraisEstimes   Decimal  @db.Decimal(12, 0) @default(0)

  /// Le projet auquel imputer, s'il y en a un — CIA
  projetId       String?

  /// ── Événements, dans l'ordre du circuit ──
  soumiseLe      DateTime?

  viseeN1Le      DateTime?
  viseeN1ParId   String?

  valideeRhLe    DateTime?
  valideeRhParId String?

  avanceVerseeLe DateTime?

  rapportDeposeLe DateTime?

  clotureeLe     DateTime?
  clotureeParId  String?

  refuseeLe      DateTime?
  refuseeParId   String?
  motifRefus     String?
  etapeRefus     EtapeRefus?                   /// N1 ou RH

  annuleeLe      DateTime?
  annuleeParId   String?
  motifAnnulation String?

  lignesFrais    LigneFrais[]
  rapport        RapportMission?
  versements     VersementAvance[]
  regularisation Regularisation?

  creeLe         DateTime @default(now())
  modifieLe      DateTime @updatedAt

  @@index([demandeurId, dateDepart])
  @@index([dateRetour])
  @@map("missions")
}

enum MoyenTransport {
  VEHICULE_ITA      /// Un matériel de M13
  TRANSPORT_COMMUN
  VEHICULE_PERSONNEL
  AVION
  AUTRE
}

enum EtapeRefus { N1  RH }
```

> **Aucun champ `statut`.** Il se déduit — décision 2.6.

### 4.2 · Les lignes de frais

Une même table sert à l'**estimation** avant départ et aux **dépenses
réelles** au retour. Le champ `nature` les distingue.

```prisma
model LigneFrais {
  id           String   @id @default(uuid())
  missionId    String
  mission      Mission  @relation(fields: [missionId], references: [id], onDelete: Cascade)

  moment       MomentFrais            /// ESTIMATION | DEPENSE_REELLE
  categorie    CategorieFrais
  libelle      String
  montant      Decimal  @db.Decimal(12, 0)

  /// Justificatif — obligatoire sur une dépense réelle
  fichierId    String?
  dateDepense  DateTime? @db.Date

  /// Contrôle de la Direction Financière — dépenses réelles seulement
  controleLe   DateTime?
  controleParId String?
  acceptee     Boolean?
  motifRejet   String?

  @@index([missionId, moment])
  @@map("lignes_frais")
}

enum MomentFrais {
  ESTIMATION       /// Saisie à la demande, indicative
  DEPENSE_REELLE   /// Saisie au retour, avec justificatif
}

enum CategorieFrais {
  TRANSPORT
  HEBERGEMENT
  RESTAURATION
  CARBURANT
  PEAGE
  COMMUNICATION
  AUTRE
}
```

### 4.3 · Le rapport de mission

```prisma
model RapportMission {
  id             String   @id @default(uuid())
  missionId      String   @unique
  mission        Mission  @relation(fields: [missionId], references: [id])

  objetRealise   String   /// Ce qui a été fait
  resultats      String   /// Ce qui en ressort
  personnesRencontrees String?
  difficultes    String?
  suiteADonner   String?

  deposeParId    String
  deposeLe       DateTime @default(now())

  @@map("rapports_mission")
}
```

### 4.4 · Le versement d'avance

```prisma
model VersementAvance {
  id            String   @id @default(uuid())
  missionId     String
  mission       Mission  @relation(fields: [missionId], references: [id])

  montant       Decimal  @db.Decimal(12, 0)
  moyen         MoyenPaiement

  /// Si WAVE — la demande de paiement créée dans M15
  demandePaiementId String? @unique

  /// Si ESPECES — la remise déclarée
  remisLe       DateTime? @db.Date
  remisParId    String?
  emargement    Boolean  @default(false)

  creeLe        DateTime @default(now())

  @@index([missionId])
  @@map("versements_avance")
}

enum MoyenPaiement { WAVE  ESPECES }
```

### 4.5 · La régularisation

```prisma
model Regularisation {
  id             String   @id @default(uuid())
  missionId      String   @unique
  mission        Mission  @relation(fields: [missionId], references: [id])

  /// Calculés au moment du contrôle, puis figés
  totalAvance    Decimal  @db.Decimal(12, 0)
  totalJustifie  Decimal  @db.Decimal(12, 0)
  /// Positif = à verser à l'employé · Négatif = à rendre par l'employé
  solde          Decimal  @db.Decimal(12, 0)

  sens           SensRegularisation

  /// Comment le solde a été apuré
  apureLe        DateTime?
  apureParId     String?
  moyenApurement MoyenApurement?
  demandePaiementId String? @unique   /// Si complément versé par Wave

  controleParId  String
  controleLe     DateTime @default(now())

  @@map("regularisations")
}

enum SensRegularisation {
  COMPLEMENT_DU      /// Les dépenses dépassent l'avance
  RELIQUAT_A_RENDRE  /// L'avance dépasse les dépenses
  EQUILIBRE          /// Solde nul
}

enum MoyenApurement {
  WAVE
  ESPECES
  RETENUE_SUR_SALAIRE   /// Reliquat retenu sur la paie du mois
}
```

> **`totalAvance`, `totalJustifie` et `solde` sont figés au contrôle.** C'est
> l'exception à la règle du calcul : une régularisation est un acte
> comptable, elle ne doit pas changer si une ligne est modifiée après coup.

---

## 5. Règles métier

### 5.1 · Le visa du N+1 passe par le lien de données

Le viseur est celui dont `Affectation.superieurId` pointe vers lui. Aucune
permission ne le remplace.

Un employé sans supérieur — le Directeur Général — passe directement à la RH.

### 5.2 · L'estimation n'engage à rien

Les lignes de `moment = ESTIMATION` servent à dimensionner l'avance. Elles ne
sont **jamais** comparées aux dépenses réelles pour un contrôle.

> Une mission qui coûte plus cher que prévu n'est pas une faute. Ce qui
> compte, c'est que chaque dépense soit justifiée.

### 5.3 · Une dépense réelle sans justificatif est refusée

Contrôle **bloquant** au dépôt du rapport.

Exception : les frais de restauration en dessous d'un seuil — **à confirmer**,
proposition 5 000 F — peuvent être déclarés sans reçu.

### 5.4 · Le contrôle est ligne à ligne

La Direction Financière accepte ou rejette **chaque** dépense.

Un rejet exige un motif de vingt caractères minimum. L'employé le lit.

Le total justifié ne compte que les lignes **acceptées**.

### 5.5 · Le solde décide de la suite

| Cas | Solde | Suite |
| --- | --- | --- |
| Dépenses > avance | positif | **Complément dû à l'employé** — Wave ou espèces |
| Dépenses < avance | négatif | **Reliquat à rendre** — espèces, ou retenue sur salaire |
| Égalité | nul | Clôture directe |

Le second cas est celui qu'on oublie. **L'employé doit de l'argent à
l'entreprise**, et il faut un mécanisme pour le récupérer.

### 5.6 · Pas de nouvelle mission tant qu'une précédente n'est pas régularisée

**Contrôle bloquant**, à la soumission.

Le message nomme la mission en cause :

> Votre mission MIS-2026-0031 du 12 au 15 juillet attend encore son rapport.
> Déposez-le avant de demander une nouvelle mission.

> C'est la règle qui fait que les rapports arrivent. Sans elle, ils
> s'accumulent et l'entreprise perd la trace de ses avances.

### 5.7 · Délai de dépôt du rapport

**Sept jours ouvrables** après la date de retour — à confirmer.

Au-delà, la mission apparaît en anomalie, et une relance part au demandeur et
à son supérieur.

### 5.8 · Une mission ne se supprime pas

Elle s'annule, avec motif. **Une mission dont l'avance est versée ne s'annule
plus** — il faut la régulariser, ce qui produira un reliquat intégral à
rendre.

### 5.9 · Le paiement Wave passe par M15

Créer un versement de moyen `WAVE` crée une `DemandePaiement` dans M15, de
catégorie `URGENT`.

Elle suit alors le circuit complet : autorisation du DG, fenêtre horaire,
exécution par la DFC.

> **M19 ne paie rien lui-même.** Il déclenche, M15 exécute.

### 5.10 · Le paiement en espèces exige un émargement

Le champ `emargement` passe à vrai quand l'employé a signé. Sans lui, le
versement reste incomplet et la mission ne peut pas passer en `APPROUVEE`.

---

## 6. Écrans

| Écran | Route | Permission | Compteur |
| --- | --- | --- | --- |
| Mes missions | `/missions` | `mission:demander` | — |
| **À viser** | `/missions/a-viser` | lien de données | 🔴 |
| **À traiter** | `/missions/a-traiter` | `mission:traiter` | 🔴 |
| **À payer** | `/missions/a-payer` | `mission:payer` | 🔴 |
| **À contrôler** | `/missions/a-controler` | `mission:controler` | 🔴 |
| Toutes les missions | `/missions/toutes` | `mission:lire` | — |

### 6.1 · Arborescence

Un groupe **Missions**, six entrées.

```
Missions
├─ Mes missions              mission:demander       tous les permanents
├─ À viser              🔴   lien de données        supérieurs
├─ À traiter            🔴   mission:traiter        DRH, RH
├─ À payer              🔴   mission:payer          DFC
├─ À contrôler          🔴   mission:controler      DFC
└─ Toutes les missions       mission:lire           DG, DRH, DFC
```

> **Question à trancher** : groupe à part, ou entrée du groupe
> « Temps & Absences » aux côtés des congés ?
>
> Une mission est une absence, mais elle porte des frais — ce que les congés
> n'ont pas. Ma proposition : un groupe à part.

### 6.2 · Nouvelle demande — patron 4 bis, trois étapes

**Étape 1 · La mission**
Objet, destination, dates, moyen de transport, projet à imputer.

**Étape 2 · Les frais estimés**
Lignes par catégorie. Le total s'affiche à mesure.

Si le total est nul, l'étape suivante annonce que la mission ne passera pas
par la DFC.

**Étape 3 · Récapitulatif**
Tout est rappelé, avec le circuit qui suit :

> Votre supérieur — YAO Serge — visera d'abord. Puis la Direction RH. Si
> elle valide, la Direction Financière versera l'avance avant votre départ.

### 6.3 · Dépôt du rapport — patron 4 bis, deux étapes

**Étape 1 · Le rapport**
Objet réalisé, résultats, personnes rencontrées, difficultés, suite à donner.

**Étape 2 · Les dépenses réelles**
Une ligne par dépense, avec sa catégorie, son montant, sa date et **son
justificatif**.

Le total se compare à l'avance en direct :

```
Avance reçue        180 000 F
Dépenses déclarées  147 500 F
────────────────────────────
Reliquat à rendre    32 500 F
```

L'employé sait ce qu'il devra avant de valider.

### 6.4 · Écran de contrôle — Direction Financière

Une ligne par dépense, avec son justificatif consultable.

Trois gestes par ligne : **accepter**, **rejeter avec motif**, ou laisser en
attente.

Le solde se recalcule à mesure. Le bouton de clôture n'apparaît que quand
**toutes** les lignes sont tranchées.

---

## 7. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `mission:demander` | Créer une demande, déposer un rapport | Tous les permanents |
| `mission:traiter` | Valider ou refuser | ADMIN, **DRH**, RH |
| `mission:payer` | Verser l'avance | ADMIN, **DFC** |
| `mission:controler` | Contrôler les justificatifs, régulariser | ADMIN, **DFC** |
| `mission:lire` | Consulter toutes les missions | ADMIN, DG, DRH, DFC |
| `mission:parametres` | Seuils, délais | ADMIN |

> **Le visa du N+1 n'a pas de permission.** Il repose sur
> `Affectation.superieurId` — décision 2.3.

> **Les montants** suivent `employe:donneesSensibles` sur l'écran « Toutes
> les missions ». Un employé voit toujours les siens.

---

## 8. Critères de recette

### Demande

- [ ] Créer une demande en moins d'une minute
- [ ] Le supérieur est **déduit**, jamais choisi
- [ ] Un employé sans supérieur passe directement à la RH
- [ ] Le total estimé s'affiche à mesure de la saisie
- [ ] Une mission sans frais annonce qu'elle ne passera pas par la DFC
- [ ] Le récapitulatif nomme le circuit à venir

### Le blocage qui compte

- [ ] **Une nouvelle demande est refusée si une mission précédente attend son rapport**
- [ ] Le message **nomme la mission en cause**, avec sa référence et ses dates
- [ ] Une mission clôturée ne bloque pas
- [ ] Une mission refusée ou annulée ne bloque pas

### Circuit

- [ ] Le visa du N+1 précède la RH, sans exception
- [ ] Un refus exige un motif de 20 caractères
- [ ] Le refus enregistre **à quelle étape** il a eu lieu
- [ ] Une mission validée sans frais passe directement en `APPROUVEE`
- [ ] Une mission validée avec frais attend le versement

### Versement

- [ ] Un versement Wave crée une `DemandePaiement` dans M15
- [ ] **M19 n'exécute aucun paiement lui-même**
- [ ] Un versement en espèces exige l'émargement
- [ ] Sans émargement, la mission ne passe pas en `APPROUVEE`
- [ ] Au-delà du plafond espèces, Wave est imposé

### Rapport et dépenses

- [ ] Le rapport exige objet réalisé et résultats
- [ ] Une dépense réelle sans justificatif est **refusée**
- [ ] Sauf restauration sous le seuil
- [ ] Le solde s'affiche à l'employé **avant** validation
- [ ] Après sept jours ouvrables sans rapport, la mission est en anomalie
- [ ] Une relance part au demandeur **et à son supérieur**

### Contrôle

- [ ] Chaque dépense s'accepte ou se rejette **individuellement**
- [ ] Un rejet exige un motif de 20 caractères
- [ ] **Le total justifié ne compte que les lignes acceptées**
- [ ] La clôture est impossible tant qu'une ligne est en attente
- [ ] Un rejet augmente le reliquat, et l'employé voit le motif

### Régularisation

- [ ] Dépenses > avance → **complément dû**, Wave ou espèces
- [ ] Dépenses < avance → **reliquat à rendre**, espèces ou retenue sur salaire
- [ ] Solde nul → clôture directe
- [ ] Les trois totaux sont **figés** au contrôle
- [ ] Modifier une ligne après clôture ne change pas la régularisation

### États

- [ ] **Aucun champ `statut` en base**
- [ ] Une mission annulée reste annulée, même après sa date de départ
- [ ] Une mission clôturée ne redevient jamais `ATTENTE_RAPPORT`
- [ ] Les onze états se déduisent correctement

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m19.ts` écrit, exécuté, **vu échouer** une fois

---

## 9. Points de vigilance

1. **Le module ne se termine pas au départ.** La moitié du travail est au retour.
2. **Les frais sont AVANCÉS.** Il y a une créance sur l'employé jusqu'à la régularisation.
3. **Le reliquat à rendre est le cas qu'on oublie.** Il faut un mécanisme pour le récupérer.
4. **Pas de nouvelle mission sans rapport.** C'est ce qui fait que les rapports arrivent.
5. **Le contrôle est ligne à ligne.** Sans barème, c'est la seule protection.
6. **Le visa du N+1 passe par le lien de données**, jamais par une permission.
7. **M19 ne paie rien.** Il déclenche M15.
8. **Le statut se déduit.** Aucun champ en base.
9. **Les totaux de régularisation sont FIGÉS.** C'est l'exception à la règle du calcul.

---

## 10. Plan de livraison

### Livraison 1 — le circuit sans les frais

Une mission sans frais suit tout le circuit : demande, visa, validation,
rapport, clôture.

| # | Étape |
| --- | --- |
| 1.1 | Modèle et migration |
| 1.2 | Permissions et navigation |
| 1.3 | Demande — patron 4 bis, trois étapes |
| 1.4 | Visa du N+1 et validation RH |
| 1.5 | Rapport de mission |
| 1.6 | Clôture, blocage de nouvelle demande |

### Livraison 2 — les frais et la régularisation

| # | Étape |
| --- | --- |
| 2.1 | Lignes de frais estimées |
| 2.2 | Versement d'avance — espèces |
| 2.3 | Versement d'avance — Wave, vers M15 |
| 2.4 | Dépenses réelles et justificatifs |
| 2.5 | **Écran de contrôle ligne à ligne** |
| 2.6 | Régularisation et apurement |
| 2.7 | Relances et anomalies |

> Découper ainsi permet de mettre le circuit en service pendant que les frais
> se construisent. Et la livraison 1 ne dépend de rien.

---

## 11. Ce qui ne se décide pas seul

1. Les sept décisions de la section 2
2. **Le plafond des espèces** — 150 000 F proposé
3. **Le délai de dépôt du rapport** — 7 jours ouvrables proposé
4. **Le seuil de restauration sans reçu** — 5 000 F proposé
5. La place du module dans la navigation
6. Toute modification du schéma Prisma
7. Le lien avec M15
8. Tout écart aux règles R-01 à R-07

---

## 12. Trois questions pour la Direction Financière

Les trois seuils proposés en section 11 lui reviennent.

**Le plafond des espèces.** Au-delà de quel montant Wave devient-il
obligatoire ? Le paiement en espèces échappe au circuit à quatre yeux de M15
— c'est le seul endroit du projet où de l'argent sort sans double contrôle.

**Le délai de dépôt du rapport.** Sept jours ouvrables, ou davantage pour une
mission longue ?

**Le reliquat à rendre.** Accepte-t-elle la retenue sur salaire, ou exige-t-elle
un remboursement en espèces ? La retenue est plus sûre mais suppose l'accord
de l'employé — à vérifier au regard du droit du travail ivoirien.
