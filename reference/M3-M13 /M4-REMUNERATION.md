# M4 — Rémunération

**Statut** : à ouvrir · **Prérequis** : M2 · **Bloque** : M7
**Version cible** : `v0.5.0`

> M4 ne calcule aucune paie. Il définit les **bornes** — la grille, les
> dérogations, l'historique. Le calcul appartient à M7.

---

## 1. Décisions bloquantes

### 1.1 · Fourchettes de la grille — **valeurs à fournir**

Une fourchette par niveau hiérarchique. Les valeurs ci-dessous sont des
**hypothèses de travail** utilisées dans les aperçus. Elles doivent être
fixées avec la Direction Financière.

| Niveau | Minimum | Médiane | Maximum |
| --- | --- | --- | --- |
| Direction | 1 500 000 | 2 200 000 | 3 000 000 |
| Cadre | 450 000 | 750 000 | 1 200 000 |
| Support | 200 000 | 320 000 | 480 000 |
| Opérationnel | 90 000 | 145 000 | 260 000 |

**Question annexe** : la grille distingue-t-elle les journaliers, ou leur
taux est-il libre ?

### 1.2 · Primes structurelles — **à trancher**

Y a-t-il des primes attachées au poste ou à l'ancienneté — transport,
logement, sujétion, panier de chantier ?

Si oui, entrent-elles dans la fourchette de grille, ou s'y ajoutent-elles ?
La réponse change le contrôle de dérogation.

### 1.3 · Rétroactivité — **à trancher**

Une nouvelle version de grille s'applique-t-elle :

| Option | Effet |
| --- | --- |
| À la période suivante | Simple. Les paies en cours ne bougent pas. |
| Rétroactivement au 1er janvier | Génère des rappels à verser. Complexe. |

**Recommandation** : à la période suivante, avec une date d'effet explicite.

---

## 2. Objectif

Tenir la grille salariale, la faire évoluer sans perdre l'historique, et
arbitrer les salaires qui en sortent.

**Critère de réussite** : la Direction Financière peut publier une nouvelle
grille, et justifier six mois plus tard le salaire versé en mars.

---

## 3. Périmètre

**Dans le périmètre** — grille par niveau, versionnement, dérogations et leur
circuit, historique des versions, visualisation de la distribution des
salaires.

**Hors périmètre** — le calcul de paie, les cotisations, les bulletins. Tout
cela relève de M7 et des outils comptables.

---

## 4. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Grille en vigueur | `/remuneration/grille` | `employe:donneesSensibles` |
| Éditer une version | modale | `grille:modifier` |
| Historique des versions | `/remuneration/grille/versions` | `grille:modifier` |
| Dérogations | `/remuneration/derogations` | `employe:donneesSensibles` |

### 4.1 · Grille en vigueur

Une barre par niveau, avec un point par employé. Les points hors fourchette
ressortent en ambre — voir `reference/ApercuRH.jsx`, onglet Rémunération.

C'est la vue qui répond à la vraie question : **combien de salaires sortent
de la grille, et de combien ?**

### 4.2 · Historique

Liste des versions avec leur date d'effet, leur auteur et le motif du
changement. Comparaison possible entre deux versions.

---

## 5. Modèle de données

`GrilleSalariale` · `EchelonGrille` · `DerogationSalariale`

### Une grille se versionne, elle ne se modifie pas

```prisma
model GrilleSalariale {
  id          String   @id @default(uuid())
  version     Int      @unique
  dateEffet   DateTime
  motif       String   /// Pourquoi cette révision
  publieeLe   DateTime?
  publieePar  String?
  echelons    EchelonGrille[]
}
```

**Une version publiée est immuable.** Une correction donne lieu à une
nouvelle version, jamais à une réécriture.

**Motif** : justifier le salaire versé en mars exige la grille de mars. Si
elle a été écrasée en juin, la justification disparaît.

Une version non publiée reste modifiable — c'est le brouillon de travail de
la Direction Financière.

---

## 6. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `employe:donneesSensibles` | Consulter la grille et les dérogations | ADMIN, DG, DRH, DFC |
| `grille:modifier` | Créer et publier une version | ADMIN, DFC |
| `derogation:valider` | Statuer sur une dérogation | ADMIN, DFC |

La Direction RH **voit** la grille mais ne la modifie pas. Elle demande une
dérogation ; la Direction Financière tranche.

---

## 7. Server Actions

| Action | Permission |
| --- | --- |
| `obtenirGrilleEnVigueur` · `listerVersions` | `employe:donneesSensibles` |
| `creerVersionGrille` · `modifierEchelon` | `grille:modifier` |
| `publierVersion` | `grille:modifier` |
| `listerDerogations` | `employe:donneesSensibles` |
| `deciderDerogation` | `derogation:valider` |

### `publierVersion` — le point sensible

Trois contrôles avant de publier :

1. Tous les niveaux ont une fourchette cohérente — `min < med < max`
2. La date d'effet n'est pas antérieure à la dernière version publiée
3. **Un décompte des employés qui sortiraient de la nouvelle grille** est présenté, avec confirmation explicite

Le troisième évite une publication qui mettrait quinze personnes en
dérogation sans que personne l'ait vu.

---

## 8. Règles métier

### 8.1 · Une dérogation bloque la paie

Tant qu'une dérogation est `EN_ATTENTE`, l'employé est **exclu des exports de
paie** de M7.

C'est le seul verrou qui donne du sens au circuit. Sans lui, un salaire hors
grille non validé partirait quand même.

### 8.2 · Motif substantiel

Quarante caractères minimum. « Décision de la direction » ne dit rien ;
« recrutement en tension, seul candidat titulaire du CACES 4 » dit tout.

Un refus exige lui aussi un motif, **avec le montant retenu à la place**.

### 8.3 · Une dérogation suit l'employé, pas le poste

Si l'employé change de poste, la dérogation est **réévaluée** contre la
nouvelle fourchette. Elle peut devenir sans objet — ou s'aggraver.

### 8.4 · Effet d'une nouvelle version

À la publication, tous les salaires sont recontrôlés. Ceux qui sortent de la
nouvelle grille passent en dérogation **automatique**, avec pour motif
« mise en conformité — publication de la version N ».

Ils ne bloquent pas la paie tant qu'ils étaient conformes à la version
précédente. C'est une régularisation, pas une sanction.

---

## 9. Critères de recette

### Versionnement

- [ ] Créer une version, modifier ses échelons, la publier
- [ ] **Une version publiée n'est plus modifiable**
- [ ] Une correction crée une nouvelle version
- [ ] L'historique affiche toutes les versions avec leur date d'effet
- [ ] La grille de mars reste consultable en juin

### Publication

- [ ] Une fourchette incohérente — `min > max` — est refusée
- [ ] Une date d'effet antérieure à la version courante est refusée
- [ ] **Le décompte des employés hors nouvelle grille est présenté avant confirmation**
- [ ] Après publication, ces employés sont en dérogation automatique

### Dérogations

- [ ] Un motif de moins de 40 caractères est refusé
- [ ] Un refus sans montant de remplacement est refusé
- [ ] Une dérogation en attente exclut l'employé des exports
- [ ] Changer de poste réévalue la dérogation
- [ ] La décision apparaît au journal d'audit

### Permissions

- [ ] La Direction RH voit la grille mais ne peut pas la modifier
- [ ] **`publierVersion` appelée sans `grille:modifier`, par requête POST directe, est refusée**
- [ ] Un rôle sans `employe:donneesSensibles` n'accède pas à l'écran

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m4.ts` écrit, exécuté, vu échouer une fois

---

## 10. Points de vigilance

1. **Une version publiée est immuable.** C'est ce qui rend une paie justifiable.
2. **Une dérogation en attente bloque l'export.** Sans ce verrou, le circuit ne sert à rien.
3. **Le décompte avant publication** évite de mettre quinze personnes en dérogation à l'aveugle.
4. **La grille est une donnée sensible.** Pas de valeur au journal — des identifiants de version.

### Ce qui ne se décide pas seul

Les fourchettes, l'existence de primes, la règle de rétroactivité, le
comportement à la publication.
