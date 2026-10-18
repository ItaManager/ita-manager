# M5 — Projets et planning

**Statut** : à ouvrir · **Prérequis** : M1, M2 · **Bloque** : M6, M8
**Version cible** : `v0.6.0`

---

## 1. Décisions bloquantes

### 1.1 · Qui autorise l'ouverture d'un projet — **à trancher**

| Option | Effet |
| --- | --- |
| Le Directeur Technique seul | Rapide. Aucun contrôle d'engagement. |
| Le DG valide l'ouverture | Un chantier engage du matériel, des équipes, de la trésorerie. |

**Recommandation** : validation du Directeur Général au-delà d'un montant de
marché à définir. En deçà, le Directeur Technique suffit.

### 1.2 · Qui fixe le cycle de paie d'un chantier — **à trancher**

Hebdomadaire, quinzaine, mensuel. C'est **par projet**, mais qui décide ?

**Recommandation** : le Directeur Technique à l'ouverture, la Direction RH
pouvant le modifier avant la première période. Une fois une période ouverte,
le cycle est figé.

### 1.3 · Jalons validés par un tiers externe — **à trancher**

Le maître d'œuvre et le maître d'ouvrage valident des jalons. Ils n'ont pas
de compte dans l'application.

Qui saisit leur décision, avec quelle pièce justificative ? Un procès-verbal
de réception scanné ?

### 1.4 · L'avancement — déclaratif ou planifié ? — **à trancher**

Le chef de chantier déclare un avancement au relevé d'activité. Le Gantt en
porte une valeur planifiée. **Laquelle fait foi ?**

| Option | Conséquence |
| --- | --- |
| Le déclaratif écrase le planifié | Le terrain a raison. Risque de dérive non arbitrée. |
| Le conducteur arbitre au visa | Un filtre humain. Charge de travail supplémentaire. |

**Recommandation** : le déclaratif alimente une valeur constatée, distincte
de la valeur planifiée. L'écart est visible, et c'est l'écart qui a de la
valeur — pas la fusion des deux.

### 1.5 · Budget de chantier — **à trancher**

Un chantier a-t-il un budget à contrôler, ou seulement un montant de marché ?

S'il y a un budget, les achats et la paie chantier devront s'y imputer, ce
qui étend le périmètre de M7 et du futur module Achats.

---

## 2. Objectif

Créer un chantier, y affecter des équipes et du matériel, suivre son
avancement dans le temps.

**Critère de réussite** : un conducteur de travaux voit d'un coup d'œil quels
chantiers sont en retard, et qui est affecté où cette semaine.

---

## 3. Périmètre

**Dans le périmètre** — fiche projet, tâches et jalons, diagramme de Gantt,
affectation des équipes aux chantiers, planning hebdomadaire, création
automatique du lieu de livraison.

**Hors périmètre** — les relevés d'activité (M6), la paie (M7), les
ressources matérielles (M8), les appels d'offres (M9).

---

## 4. Écrans

| Écran | Route | Permission | Patron |
| --- | --- | --- | --- |
| Liste des projets | `/projets` | `projet:creer` | 3 |
| Fiche projet | `/projets/[id]` | `projet:creer` | 4 |
| Diagramme de Gantt | `/projets/[id]/planning` | `planning:modifier` | 9 |
| Jalons | `/projets/[id]/jalons` | `jalon:valider` | 6 |
| Affectations | `/projets/[id]/equipes` | `planning:modifier` | 6 |
| Planning général | `/planning` | `planning:modifier` | 9 — calendrier |

### 4.1 · Liste des projets

Filtres : statut, direction technique concernée, maître d'ouvrage, période.

Colonne **avancement** : barre de progression, avec l'écart entre planifié et
constaté quand il dépasse dix points.

### 4.2 · Gantt

Patron 9. Tâches, dépendances, jalons. Zoom semaine, mois, trimestre.

**Le Gantt est un outil de lecture avant d'être un outil de saisie.** Le
glisser-déposer est un confort ; la saisie par formulaire reste possible et
doit rester complète.

### 4.3 · Planning général

Vue calendrier de toutes les affectations, par semaine. C'est l'écran qui
répond à « qui est disponible lundi prochain ».

---

## 5. Modèle de données

`Projet` · `Tache` · `Jalon` · `AffectationChantier` · `LieuLivraison`

### 5.1 · La chaîne fonctionnelle naît ici

`AffectationChantier` porte le lien **fonctionnel** — décision A-08 bis.

| Chaîne | Portée | Source |
| --- | --- | --- |
| **Hiérarchique** | Congés, demandes de ressources | `Affectation.superieurId` |
| **Fonctionnelle** | Visa des relevés, planning | `AffectationChantier` — conducteur du chantier |

Le Conducteur de Travaux vise les relevés du chantier qu'il conduit. Il n'est
pas le supérieur hiérarchique des chefs de chantier.

**Le code ne doit jamais confondre les deux.**

### 5.2 · Le lieu de livraison se crée tout seul

À l'ouverture d'un projet, un `LieuLivraison` de type `CHANTIER` est créé
automatiquement. À la clôture, il est désactivé.

Ça évite qu'un magasinier propose une livraison sur un chantier fermé depuis
six mois.

### 5.3 · Avancement

Deux valeurs distinctes sur `Tache` :

```prisma
avancementPlanifie  Int   /// Ce que le planning prévoit à cette date
avancementConstate  Int?  /// Ce que les relevés déclarent
```

L'écart est calculé, jamais stocké.

---

## 6. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `projet:creer` | Créer et modifier un projet | ADMIN, DG, DT |
| `planning:modifier` | Tâches, dépendances, affectations | ADMIN, DT, CT |
| `jalon:valider` | Valider un jalon | ADMIN, DT, DG selon la nature |

---

## 7. Server Actions

| Action | Permission |
| --- | --- |
| `listerProjets` · `obtenirProjet` | `projet:creer` |
| `creerProjet` · `modifierProjet` · `cloturerProjet` | `projet:creer` |
| `creerTache` · `modifierTache` · `supprimerTache` | `planning:modifier` |
| `affecterEquipe` · `retirerAffectation` | `planning:modifier` |
| `validerJalon` | `jalon:valider` |

### `affecterEquipe` — trois contrôles

1. L'employé n'est pas déjà affecté à un autre chantier sur la période
2. L'employé n'est pas en congé validé sur la période
3. L'employé n'est pas archivé

Les deux premiers **avertissent** sans bloquer — un chevauchement peut être
volontaire, une affectation partielle existe.

---

## 8. Règles métier

### 8.1 · Un projet a un cycle de vie

```
BROUILLON → OUVERT → EN_COURS → SUSPENDU ⇄ EN_COURS → CLOTURE
```

Un projet `CLOTURE` n'accepte plus ni relevé, ni affectation, ni achat. Sa
réouverture est journalisée.

### 8.2 · Clôturer exige des conditions

- Tous les relevés d'activité sont visés
- Aucune période de paie n'est ouverte
- Tous les jalons sont soldés ou explicitement abandonnés

Sinon, des heures pointées ne seraient jamais payées.

### 8.3 · Une tâche ne peut pas précéder son prédécesseur

Contrôle de cohérence des dépendances, avec détection de cycle. Même
mécanisme que le contrôle hiérarchique de M1.

### 8.4 · Un jalon validé par un tiers exige une pièce

Procès-verbal, attestation, courrier. Sans pièce, la validation est refusée.

Le saisisseur interne est enregistré comme **auteur de la saisie**, distinct
du validateur externe nommé.

### 8.5 · Le cycle de paie se fige

Une fois la première période de paie ouverte sur un chantier, son cycle ne
change plus. Sinon les périodes se chevauchent et les jours sont payés deux
fois.

---

## 9. Critères de recette

### Projet

- [ ] Créer un projet crée son lieu de livraison
- [ ] Clôturer un projet désactive son lieu de livraison
- [ ] **Clôturer avec des relevés non visés est refusé**
- [ ] Rouvrir un projet clôturé est journalisé
- [ ] Un projet clôturé n'accepte plus d'affectation

### Planning

- [ ] Créer une tâche avec dépendance
- [ ] **Une dépendance circulaire est détectée et refusée**
- [ ] Une tâche ne peut pas commencer avant la fin de son prédécesseur
- [ ] Le Gantt reflète les dates saisies
- [ ] La saisie par formulaire est complète, sans glisser-déposer

### Affectation

- [ ] Affecter un employé à un chantier
- [ ] **Un chevauchement avec un autre chantier avertit sans bloquer**
- [ ] **Un chevauchement avec un congé validé avertit**
- [ ] Un employé archivé ne peut pas être affecté
- [ ] Le planning général montre les affectations de la semaine

### Chaîne fonctionnelle

- [ ] Le conducteur du chantier apparaît comme référent des relevés
- [ ] **Il n'apparaît pas comme supérieur hiérarchique**
- [ ] Un chef de chantier a deux référents distincts, visibles séparément

### Jalons

- [ ] Valider un jalon interne
- [ ] **Valider un jalon externe sans pièce est refusé**
- [ ] Le saisisseur et le validateur externe sont enregistrés séparément

### Avancement

- [ ] L'avancement planifié et l'avancement constaté sont deux valeurs
- [ ] L'écart est calculé, non stocké
- [ ] Un écart supérieur à 10 points est signalé dans la liste

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m5.ts` écrit, exécuté, vu échouer une fois

---

## 10. Points de vigilance

1. **Ne jamais confondre chaîne hiérarchique et chaîne fonctionnelle.** C'est la décision A-08 bis, et le défaut le plus coûteux possible ici.
2. **Le cycle de paie se fige** à la première période ouverte.
3. **Clôturer un projet exige que tous les relevés soient visés.** Sinon des heures ne sont jamais payées.
4. **Le Gantt est d'abord un outil de lecture.** Le glisser-déposer ne remplace pas la saisie.
5. **Détecter les cycles de dépendances**, comme pour la hiérarchie de M1.

### Ce qui ne se décide pas seul

Les cinq décisions de la section 1, le cycle de vie d'un projet, les
conditions de clôture.
