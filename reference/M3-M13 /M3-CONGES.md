# M3 — Congés et permissions

**Statut** : à ouvrir · **Prérequis** : M2 · **Bloque** : M7 partiellement
**Version cible** : `v0.4.0` · **Rédigé le** : 30 juillet 2026

> ⚠️ **Cinq décisions bloquent l'ouverture de ce module.** Elles figurent en
> section 1. Ce sont des règles de droit et de convention collective, pas des
> choix techniques — elles ne peuvent pas être arbitrées par le développement.
>
> Les valeurs proposées ci-dessous sont des **hypothèses de travail** à faire
> confirmer par la Direction RH, et à vérifier contre le Code du travail
> ivoirien et la convention collective du BTP.

---

## 1. Décisions bloquantes

### 1.1 · Dotation annuelle — **à confirmer**

**Proposition** : 2,2 jours ouvrables par mois de service effectif, soit
**26 jours ouvrables** par an pour une année complète.

C'est le régime que je crois être celui du Code du travail ivoirien, mais
**la convention collective du BTP peut être plus favorable**. À vérifier avant
de figer.

**Majoration d'ancienneté — proposition, à confirmer :**

| Ancienneté | Jours supplémentaires |
| --- | --- |
| 5 ans | +1 |
| 10 ans | +2 |
| 15 ans | +3 |
| 20 ans | +5 |
| 25 ans | +7 |

**Majoration pour enfants** : le Code prévoit des jours supplémentaires par
enfant à charge, sous conditions d'âge du parent et de l'enfant. Règle exacte
à obtenir.

> Tout cela doit être **paramétrable**, jamais en dur. La convention change,
> la loi change.

### 1.2 · Jours ouvrables ou calendaires — **à confirmer**

**Proposition : jours ouvrables.** Un congé du lundi au vendredi consomme 5
jours, non 7.

Conséquence : il faut un calendrier des jours fériés et une règle sur le
samedi — ouvrable ou non chez ITA ?

### 1.3 · Jours fériés ivoiriens — **liste à fournir**

**Fériés fixes** — à vérifier :

| Date | Fête |
| --- | --- |
| 1er janvier | Jour de l'An |
| 1er mai | Fête du Travail |
| 7 août | Fête de l'Indépendance |
| 15 août | Assomption |
| 1er novembre | Toussaint |
| 15 novembre | Journée nationale de la Paix |
| 25 décembre | Noël |

**Fériés mobiles** — chrétiens : lundi de Pâques, Ascension, lundi de
Pentecôte. Musulmans : Aïd el-Fitr, Aïd el-Kébir, Maouloud, Lendemain de la
Nuit du Destin.

> ⚠️ **Les fêtes musulmanes suivent le calendrier lunaire et sont fixées par
> décret chaque année.** Elles ne peuvent pas être calculées : elles doivent
> être **saisies manuellement** chaque année dans les paramètres.
>
> Prévoir une alerte en décembre : « Les jours fériés de l'année prochaine ne
> sont pas renseignés. »

### 1.4 · Report du solde — **à trancher**

Trois options :

| Option | Effet |
| --- | --- |
| **Report intégral** | Le solde s'accumule sans limite. Risque : une dette de congés qui devient impayable. |
| **Report plafonné** | Report limité — par exemple 10 jours — le reste est perdu au 31 décembre. |
| **Perte totale** | Solde remis à zéro chaque année. Simple, mais souvent mal accepté. |

**Recommandation** : report plafonné, avec une date limite de consommation —
par exemple le 31 mars de l'année suivante.

### 1.5 · Permissions exceptionnelles — **durées à fournir**

Le Code du travail prévoit des absences payées pour événements familiaux.
Durées **à confirmer** :

| Événement | Proposition |
| --- | --- |
| Mariage du salarié | 4 jours |
| Mariage d'un enfant | 2 jours |
| Naissance | 2 jours |
| Décès du conjoint ou d'un enfant | 5 jours |
| Décès d'un parent au premier degré | 3 jours |
| Décès d'un parent au second degré | 2 jours |
| Déménagement | 1 jour |

**Ces permissions ne décomptent pas du solde annuel.** Elles exigent en
revanche une pièce justificative.

---

## 2. Objectif

Permettre à un employé de demander une absence, à son supérieur de se
prononcer sur l'opportunité, et à la Direction RH de vérifier le droit.

**Critère de réussite** : un chef de chantier demande un congé depuis son
téléphone, son directeur le valide en deux clics, et la RH voit
immédiatement si le solde le permet.

---

## 3. Le principe qui structure tout le module

**Deux appréciations distinctes, jamais confondues.**

| Étape | Qui | Juge quoi | Refus |
| --- | --- | --- | --- |
| 1 | Supérieur hiérarchique | **L'opportunité** — le service peut-il se passer de la personne ? | **Définitif** |
| 2 | Direction RH | **Le droit** — le solde le permet-il, les règles sont-elles respectées ? | Définitif |

Un refus hiérarchique arrête le circuit — décision B-07. Motif obligatoire,
lisible par le demandeur.

> **Pourquoi c'est important.** La plupart des outils fusionnent les deux et
> demandent à la RH d'arbitrer une charge de travail qu'elle ne connaît pas,
> ou au supérieur de vérifier un solde qu'il ne voit pas. Chacun juge ce
> qu'il sait.

---

## 4. Périmètre

### Dans le périmètre

- Demande d'absence — congé annuel, maladie, maternité, permissions
- Circuit à deux étapes, avec délégation nommée
- Compteurs de solde, calculés et non saisis
- Calendrier des absences, par service et par chantier
- Jours fériés et règles paramétrables
- Pièces justificatives — certificat médical, acte de décès

### Hors périmètre

L'absence non payée d'un journalier — elle se constate au relevé d'activité,
M6. Les congés ne s'appliquent pas à lui.

---

## 5. Écrans

| Écran | Route | Permission | Patron |
| --- | --- | --- | --- |
| Mes demandes | `/conges` | `absence:demander` | 3 |
| Nouvelle demande | modale | `absence:demander` | 4 — 2 onglets |
| À valider — supérieur | `/conges/a-valider` | déduit de `superieurId` | 3 + 8 |
| À valider — RH | `/conges/controle` | `absence:valider` | 3 + 8 |
| Calendrier | `/conges/calendrier` | `employe:lire` | 9 |
| Soldes | `/conges/soldes` | `employe:lire` | 3 |
| Règles et fériés | `/parametres/conges` | `reglesConges:modifier` | 6 |

### 5.1 · Mes demandes

En tête, **le solde disponible** — c'est ce qu'on vient voir. Puis la liste
des demandes avec leur avancement.

### 5.2 · Nouvelle demande

Deux onglets seulement : nature et période, puis justificatif si requis.

Le solde restant s'affiche **en temps réel** pendant la saisie des dates. Une
demande qui dépasse le solde ne se bloque pas — elle avertit.

### 5.3 · Écrans de validation

Patron 8, circuit de validation. Le supérieur voit la charge de son équipe
sur la période ; la RH voit le solde et l'historique.

### 5.4 · Calendrier

Vue mensuelle par service ou par chantier. C'est l'outil qui permet au
supérieur de dire « trois chauffeurs sont déjà absents cette semaine ».

---

## 6. Modèle de données

`Absence` · `TypeAbsence` · `SoldeConge` · `RegleConge` · `JourFerie` ·
`Delegation`

### 6.1 · Le solde ne se stocke pas, il se calcule

**Règle** : `SoldeConge` porte les **mouvements**, non un total.

```
dotation acquise    +26,4 j   (2,2 j × 12 mois)
majoration          +2 j      (10 ans d'ancienneté)
report N−1          +8 j      (plafonné)
consommé            −12 j
────────────────────────────
disponible           24,4 j
```

Un total stocké diverge toujours de la réalité — une validation annulée, une
dotation recalculée, et les deux ne se retrouvent plus. Le calcul est la
seule source fiable.

### 6.2 · Ce que porte une absence

| Champ | Rôle |
| --- | --- |
| `typeAbsenceId` | Détermine si le solde est décompté et si une pièce est requise |
| `dateDebut`, `dateFin` | Bornes incluses |
| `nombreJours` | **Calculé**, non saisi — exclut fériés et non-ouvrables |
| `statut` | `BROUILLON` · `ATTENTE_N1` · `ATTENTE_RH` · `VALIDEE` · `REFUSEE` · `ANNULEE` |
| `superieurId` | **Figé à la soumission** — voir 7.2 |
| `pieceId` | Justificatif, classification particulière si médical |

---

## 7. Règles métier

### 7.1 · Un journalier est exclu du module

Décision A-13. Aucun compteur, aucune demande possible. Un jour non pointé
est un jour non payé.

L'écran ne doit pas afficher un solde à zéro — mieux vaut son absence qu'un
zéro qui laisserait croire à un compteur vide.

### 7.2 · Le supérieur est figé à la soumission

Si l'employé change de service pendant l'instruction, la demande reste chez
le supérieur qui l'a reçue. Sinon elle disparaîtrait de sa liste sans
explication.

### 7.3 · Délégation nommée

Décision B-03. Un responsable désigne son délégataire **à l'avance**, pour
une période. Pendant celle-ci, les demandes lui parviennent aussi.

Indispensable pour le Directeur Technique : onze postes lui remontent
directement.

**La délégation ne se substitue pas, elle s'ajoute.** Le titulaire garde la
main s'il est disponible.

### 7.4 · Solde insuffisant — avertir, ne pas bloquer

Une demande dépassant le solde reste soumettable. L'écran de validation RH
l'affiche en rouge, avec le déficit chiffré.

**Motif** : la RH peut avoir une raison d'accorder — congé anticipé,
situation exceptionnelle. Bloquer en dur enlèverait cette latitude et
pousserait à contourner l'outil.

### 7.5 · Le congé maladie ne se demande pas

Il se **déclare**, après coup, avec un certificat. Il n'y a pas d'étape
d'opportunité : un arrêt de travail ne s'approuve pas.

Circuit : déclaration → contrôle RH de la pièce → enregistrement.

Le certificat est une **pièce médicale** — classification particulière,
`SECURITE.md` § 2. Accès Direction RH seule, consultation journalisée.

### 7.6 · Annulation

| Statut | Annulable par | Effet |
| --- | --- | --- |
| `ATTENTE_N1` ou `ATTENTE_RH` | Le demandeur | Retrait simple |
| `VALIDEE`, congé non commencé | Le demandeur, avec accord RH | Solde recrédité |
| `VALIDEE`, congé commencé | Direction RH seule | Solde recrédité au prorata |

Toute annulation d'une demande validée est **journalisée**.

### 7.7 · Chevauchement d'exercice

Un congé du 28 décembre au 5 janvier s'impute **sur l'exercice de la date de
début**. Règle simple, à afficher dans l'aide.

### 7.8 · Alertes de fin d'année

À partir du 1er novembre, un employé dont le solde dépasse le plafond de
report reçoit un rappel. La Direction RH voit la liste consolidée.

C'est ce qui évite la ruée de décembre, où tout le monde pose ses congés en
même temps.

---

## 8. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `absence:demander` | Créer une demande pour soi | tous sauf journaliers |
| `absence:valider` | Contrôle RH | ADMIN, DRH |
| `reglesConges:modifier` | Dotations, fériés, plafonds | ADMIN |
| `employe:lire` | Calendrier et soldes de son périmètre | ADMIN, DG, DRH, RH, DFC, DT, CT |

La validation du supérieur ne passe pas par une permission : elle se déduit
de `Affectation.superieurId`. C'est le lien de données qui fait le droit.

---

## 9. Server Actions

| Action | Permission |
| --- | --- |
| `creerDemande` · `modifierDemande` · `annulerDemande` | `absence:demander` |
| `soumettreDemande` | `absence:demander` |
| `deciderN1` | contrôle sur `superieurId` **ou** délégation active |
| `deciderRH` | `absence:valider` |
| `calculerSolde` | `employe:lire` |
| `definirDelegation` | connecté, sur soi seulement |
| `chargerJoursFeries` · `modifierRegles` | `reglesConges:modifier` |

### `deciderN1` — le contrôle qui n'est pas une permission

```ts
const autorise =
  demande.superieurId === session.employeId ||
  await delegationActive(demande.superieurId, session.employeId, new Date());

if (!autorise) throw new PermissionRefusee("absence:valider");
```

Un rôle ne suffit pas : il faut être **le supérieur de cette demande-là**.

---

## 10. Critères de recette

### Calcul du solde

- [ ] La dotation se calcule au prorata des mois travaillés
- [ ] La majoration d'ancienneté s'applique à la date anniversaire
- [ ] Le report N−1 est plafonné selon le paramètre
- [ ] Le solde affiché correspond au calcul, non à une valeur stockée
- [ ] Annuler une demande validée recrédite le solde

### Décompte des jours

- [ ] Un congé du lundi au vendredi compte 5 jours, non 7
- [ ] Un jour férié dans la période n'est pas décompté
- [ ] Un congé à cheval sur deux exercices s'impute sur celui de la date de début
- [ ] Le nombre de jours est **calculé**, jamais saisi

### Circuit

- [ ] Une demande part au supérieur défini dans l'affectation
- [ ] **Un refus du supérieur arrête le circuit** — pas de recours
- [ ] Un refus sans motif est impossible
- [ ] Le demandeur voit le motif du refus
- [ ] Changer de service pendant l'instruction ne déplace pas la demande
- [ ] Un délégataire actif reçoit les demandes de son mandant
- [ ] **`deciderN1` appelée par un tiers, par requête POST directe, est refusée**

### Solde insuffisant

- [ ] Une demande dépassant le solde reste soumettable
- [ ] L'écran RH l'affiche en rouge, avec le déficit chiffré
- [ ] La validation reste possible, avec confirmation explicite

### Journalier

- [ ] Un journalier ne peut pas créer de demande
- [ ] Aucun compteur n'apparaît sur sa fiche
- [ ] Il n'apparaît pas dans l'écran des soldes

### Pièces

- [ ] Un congé maladie sans certificat ne peut pas être enregistré
- [ ] **Le certificat médical n'est consultable que par la Direction RH**
- [ ] Chaque consultation d'une pièce médicale est journalisée
- [ ] L'URL de consultation est signée et expire

### Paramètres

- [ ] Les jours fériés fixes sont chargés
- [ ] Les fériés mobiles se saisissent manuellement
- [ ] Une alerte apparaît si l'année suivante n'est pas renseignée
- [ ] Modifier une règle est journalisé

### Build et vérification

- [ ] `npx tsc --noEmit` passe
- [ ] `npm run build` réussit
- [ ] `npm run verify` passe au vert
- [ ] `scripts/verify-m3.ts` écrit, exécuté, **vu échouer** une fois

---

## 11. Points de vigilance

1. **Le solde se calcule, il ne se stocke pas.** Un total stocké finit toujours par diverger.
2. **Le refus hiérarchique est définitif.** Pas de recours, pas de renvoi — décision B-07.
3. **Le supérieur est figé à la soumission.**
4. **Le certificat médical est une donnée particulière.** Direction RH seule, consultation journalisée.
5. **Les fériés musulmans ne se calculent pas.** Saisie manuelle annuelle, avec alerte de rappel.
6. **Rien en dur.** Dotations, plafonds, durées de permission : tout en paramètres.
7. **`deciderN1` ne se protège pas par un rôle** mais par le lien de données.

---

## 12. Balises d'exécution

Les quinze règles de `CLAUDE.md` s'appliquent. Trois méritent un rappel pour
ce module :

**Règle 1 — lire, jamais se souvenir.** Les durées de permission, les jours
fériés et la table de majoration figurent en section 1 de ce dossier. Ne les
réécris pas de mémoire.

**Règle 3 — prouver, jamais affirmer.** Les calculs de solde et de jours
ouvrables se vérifient par script, avec des cas de test explicites : congé à
cheval sur un férié, sur deux exercices, employé de six mois d'ancienneté.

**Règle 6 — `npm run build` fait partie du travail.**

### Ce qui ne se décide pas seul

1. Toute valeur de la section 1 — dotations, durées, plafonds
2. La règle de décompte des jours ouvrables
3. La classification d'une pièce en médicale
4. Le comportement en cas de solde insuffisant
5. Tout écart aux règles R-01 à R-05
