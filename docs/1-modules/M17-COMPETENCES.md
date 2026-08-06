# M17 — Compétences et taux journaliers

**Statut** : cadré · **Prérequis** : M2 · **Alimente** : M7 — la paie chantier
**Rédigé le** : 2 août 2026

> Le référentiel qui rend la paie chantier possible.
>
> Le pointage donne les **jours**, la compétence donne le **taux**. Sans
> compétence, aucun montant ne se calcule — donc pas de paie.

---

## 1. Décisions — toutes arrêtées

### 1.1 · Un agent, une compétence — **arrêtée**

Un agent porte **une seule** compétence à la fois.

S'il sait faire deux métiers, on ne lui en donne pas deux — **on crée une
compétence composée** : `Maçon-Coffreur`, avec son propre taux.

#### Pourquoi

Deux compétences sur un agent posent une question sans réponse : quel taux
appliquer un jour donné ? Il faudrait savoir ce qu'il a fait ce jour-là, ce
que le relevé d'activité n'enregistre pas.

Une compétence composée règle la question : un taux, quel que soit le travail
du jour.

> C'est plus simple à saisir, plus simple à contrôler, et plus juste — l'agent
> polyvalent est payé pour sa polyvalence, pas pour ce qu'il a fait mardi.

### 1.2 · Trois directions, trois gestes — **arrêtée**

| Geste | Qui | Permission |
| --- | --- | --- |
| **Définir** la compétence | Direction Technique | `competence:gerer` |
| **Fixer** le taux | **Direction Financière** | `taux:definir` |
| **Assigner** à un agent | Direction RH | `competence:assigner` |

#### La séparation est le point structurant

La Direction Technique sait ce qu'est un coffreur. Elle **ne décide pas** ce
qu'il coûte.

La Direction Financière valide le taux — **c'est de l'argent qui sort**.

Les RH assignent, parce qu'elles tiennent les dossiers.

> Un taux fixé par la technique serait une dépense décidée sans contrôle
> financier. C'est exactement ce que la séparation évite.

### 1.3 · Chaque taux est validé — **arrêtée**

Pas de seuil, pas d'exception. **Tout taux passe par la Direction
Financière**, y compris le premier.

Une compétence créée sans taux existe, mais **elle n'est pas assignable**.

### 1.4 · Une compétence sans taux ne s'assigne pas — **arrêtée**

Contrôle **bloquant**, côté serveur.

Sans taux, aucun montant ne se calculerait à la paie. Autoriser l'assignation
reporterait la panne au jour du paiement.

Dans le sélecteur, ces compétences apparaissent **verrouillées avec leur
raison** — jamais masquées. Voir R-07.

### 1.5 · Un taux ne se modifie pas, il se remplace — **arrêtée**

Chaque taux porte une **date d'effet**. Le précédent reste consultable.

```
Maçon
  6 500 F   depuis le 01/01/2024
  7 000 F   depuis le 01/03/2025
  7 500 F   depuis le 01/01/2026   ← en vigueur
```

**Une paie de mars 2025 applique 7 000 F**, quel que soit le taux
d'aujourd'hui.

> C'est ce qui rend une paie passée justifiable. Un taux écrasé rendrait tout
> contrôle impossible six mois plus tard.

### 1.6 · L'affectation d'une compétence est aussi historisée — **arrêtée**

Même raisonnement. Un agent qui passe de manœuvre à maçon garde son historique.

**La paie d'un jour donné applique la compétence en vigueur ce jour-là**, et
le taux en vigueur ce jour-là.

Deux historiques, une seule règle : on lit à la date du jour pointé, jamais à
la date du calcul.

### 1.7 · Vocabulaire : journalier — **arrêtée**

L'application dit **journalier**, jamais « intérimaire », jamais
« temporaire ».

Un seul mot, dans le code, dans l'interface et dans les documents.

---

## 2. Ce que ce référentiel n'est pas

**Ce n'est pas la grille salariale de M4.**

| | M4 · Grille salariale | M7 L1 · Taux journaliers |
| --- | --- | --- |
| Concerne | Permanents | **Journaliers** |
| Unité | Salaire mensuel | **Montant par jour pointé** |
| Structure | Catégories, échelons, ancienneté | **Un métier, un taux** |
| Cadre | Convention collective | Décision interne |

Deux logiques différentes. Les mélanger produirait deux comportements dans une
seule table.

---

## 3. Modèle de données

### 3.1 · La compétence

```prisma
model Competence {
  id               String   @id @default(uuid())

  libelle          String   @unique
  /// Minuscules, sans accent, sans espace superflu — détecte les doublons
  libelleNormalise String   @unique

  categorie        CategorieCompetence

  /// Auto-relation : une composée réunit plusieurs qualifiées
  composantes      Competence[] @relation("Composition")
  composeeDans     Competence[] @relation("Composition")

  actif            Boolean  @default(true)
  motifArchivage   String?

  creeParId        String
  creeLe           DateTime @default(now())
  modifieLe        DateTime @updatedAt

  taux             TauxJournalier[]
  affectations     AffectationCompetence[]

  @@index([actif, categorie])
  @@map("competences")
}

enum CategorieCompetence {
  BASE       /// Manœuvre, aide — sans qualification particulière
  QUALIFIE   /// Un métier — maçon, soudeur, ferrailleur
  COMPOSEE   /// Plusieurs métiers réunis
}
```

> ⚠️ **`composantes` est une auto-relation Prisma.** Elle exige les deux
> champs — `composantes` et `composeeDans` — même si le second ne sert pas
> dans l'interface. Prisma refuse une auto-relation à sens unique.

### 3.2 · Le taux journalier

```prisma
model TauxJournalier {
  id            String   @id @default(uuid())

  competenceId  String
  competence    Competence @relation(fields: [competenceId], references: [id])

  montant       Decimal  @db.Decimal(12, 0)   /// XOF entier
  dateEffet     DateTime @db.Date

  /// Requis dès qu'un taux précédent existe
  motif         String?

  definiParId   String   /// Direction Financière
  definiLe      DateTime @default(now())

  @@unique([competenceId, dateEffet])
  @@index([competenceId, dateEffet])
  @@map("taux_journaliers")
}
```

**Aucun champ `actif` ni `courant`.** Le taux en vigueur se **calcule** :

```ts
const tauxEnVigueur = (competenceId: string, date: Date) =>
  prisma.tauxJournalier.findFirst({
    where: { competenceId, dateEffet: { lte: date } },
    orderBy: { dateEffet: "desc" },
  });
```

> Un champ `courant` deviendrait faux à la première date d'effet future.

### 3.3 · L'affectation

```prisma
model AffectationCompetence {
  id            String   @id @default(uuid())

  employeId     String
  employe       Employe  @relation(fields: [employeId], references: [id])

  competenceId  String
  competence    Competence @relation(fields: [competenceId], references: [id])

  dateEffet     DateTime @db.Date
  /// Renseignée quand une nouvelle affectation prend le relais
  dateFin       DateTime? @db.Date

  motif         String?  /// Requis si l'agent avait déjà une compétence

  assigneeParId String   /// Direction RH
  assigneeLe    DateTime @default(now())

  @@index([employeId, dateEffet])
  @@map("affectations_competence")
}
```

**Une seule affectation ouverte par agent** — contrainte applicative, pas
`@@unique` : plusieurs affectations closes coexistent.

### 3.4 · Le contrôle qui compte

```ts
/** La compétence d'un agent à une date donnée */
async function competenceALaDate(employeId: string, date: Date) {
  return prisma.affectationCompetence.findFirst({
    where: {
      employeId,
      dateEffet: { lte: date },
      OR: [{ dateFin: null }, { dateFin: { gte: date } }],
    },
    include: { competence: true },
  });
}

/** Le montant d'un jour pointé — DEUX lectures historisées */
async function montantDuJour(employeId: string, jour: Date) {
  const aff = await competenceALaDate(employeId, jour);
  if (!aff) return null;                    // pas de compétence ce jour-là

  const taux = await prisma.tauxJournalier.findFirst({
    where: { competenceId: aff.competenceId, dateEffet: { lte: jour } },
    orderBy: { dateEffet: "desc" },
  });
  return taux?.montant ?? null;             // pas de taux ce jour-là
}
```

> **Les deux lectures se font à la date du JOUR POINTÉ**, jamais à la date du
> calcul. C'est la règle la plus facile à manquer, et celle qui fausserait
> toutes les paies rétroactives.

---

## 4. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Compétences et taux | `/personnel/competences` | `competence:lire` |
| Agents et compétences | `/personnel/competences/agents` | `competence:lire` |

Deux écrans, cinq modales.

### 4.0 · Où le module se range

**Groupe Personnel**, aux côtés des employés et des congés.

```
Personnel
├─ Employés                    employe:lire
├─ Organigramme                organisation:lire
├─ Compétences et taux     🔴  competence:lire      ← M17
├─ Agents et compétences       competence:lire      ← M17
└─ Congés                      conge:lire
```

Les deux écrans parlent d'agents, et c'est là que les RH travaillent.

Le compteur 🔴 affiche les **compétences en attente de taux** — ce que la
Direction Financière doit traiter.

### 4.1 · Écran des compétences

#### Quatre indicateurs

| Indicateur | Calcul |
| --- | --- |
| Compétences actives | `actif = true` |
| **En attente de taux** | actives sans aucun `TauxJournalier` |
| Sans compétence | agents journaliers sans affectation ouverte |
| Coût journalier | somme des taux des agents affectés à un chantier |

Le deuxième porte un compteur 🔴 — c'est ce que la Direction Financière doit
traiter.

#### Filtres

`Actives` · `Sans taux` · `Composées` · `Archivées` · `Toutes`

État dans l'URL — E-01.

#### Colonnes

| Colonne | Contenu |
| --- | --- |
| Compétence | Libellé, plus les métiers réunis si composée |
| Catégorie | Base · Qualifiée · Composée |
| **Taux journalier** | Montant, ou `en attente` en ambre |
| Depuis | Date d'effet, ou `créée le …` si sans taux |
| Agents | Nombre d'affectations ouvertes |
| Versions | Nombre de taux, cliquable si > 1 |
| Actions | Fixer le taux · Modifier |

#### Tri

**Les compétences sans taux en tête** — elles appellent une action.
Le reste par taux décroissant.

#### Les montants sont sensibles

Masqués sans `employe:donneesSensibles`, avec un cadenas et le mot
« masqué ». Jamais une cellule vide — R-07.

### 4.2 · Écran des agents

Une ligne par agent journalier : nom, compétence, taux, date d'effet,
chantier.

Un agent **sans compétence** apparaît sur fond ambre, avec le libellé
« aucune compétence » et une infobulle expliquant qu'il ne peut pas être
pointé.

Filtres : `Tous` · `Sans compétence` · `Sur chantier`.

---

## 5. Les cinq modales

### 5.1 · Créer ou modifier une compétence — Direction Technique

| Champ | Note |
| --- | --- |
| Libellé | Unique. Doublon détecté sur `libelleNormalise` |
| Catégorie | Trois choix, avec leur explication |
| Métiers réunis | **Si composée seulement** — au moins deux, cochés |

**Aucun champ de montant.** C'est le point de la décision 1.2.

À la création, un avertissement :

> **La compétence sera créée sans taux.** Elle ne pourra pas être assignée
> tant que la Direction Financière n'aura pas fixé son taux journalier.

### 5.2 · Fixer ou réviser un taux — Direction Financière

| Champ | Note |
| --- | --- |
| Montant par jour | Entier, XOF |
| Date d'effet | Défaut : aujourd'hui |
| Motif | **Requis si un taux existe déjà** — 20 caractères minimum |

#### Deux formes selon le cas

**Première fixation** — un bandeau rappelle qui a créé la compétence et
quand, et que rien ne peut être assigné en attendant.

**Révision** — la variation s'affiche en clair :

> **7 500 F → 8 500 F** par jour, soit 13,3 %. 3 agents concernés.

Le nombre d'agents concernés est ce qui donne la mesure de la décision.

### 5.3 · Historique des taux

Fil vertical, du plus récent au plus ancien. Chaque version porte son montant,
sa période de validité, son motif, et la variation qui a suivi.

Le taux en vigueur est marqué.

En bas, le rappel qui justifie tout le mécanisme :

> Une paie du mois de mars applique le taux en vigueur en mars, quel que soit
> le taux d'aujourd'hui.

### 5.4 · Assigner une compétence — Direction RH

| Champ | Note |
| --- | --- |
| Compétence | **Les compétences sans taux sont verrouillées** |
| À compter du | Les jours pointés avant gardent l'ancienne |
| Motif | **Requis si changement** — 15 caractères minimum |

Si l'agent en avait déjà une, elle est rappelée en tête, et la variation de
taux s'affiche.

Une compétence composée affiche les métiers qu'elle réunit, et le rappel : le
taux est le même quel que soit le travail du jour.

### 5.5 · Archiver une compétence — Direction Technique

Une compétence ne se supprime pas. Elle **se désactive**, avec un motif.

**Contrôle bloquant** : impossible d'archiver une compétence portée par au
moins un agent. Il faut d'abord les réaffecter.

Le message nomme les agents concernés.

---

## 6. Règles métier

### 6.1 · Un agent, une compétence ouverte

Assigner une nouvelle compétence **clôt la précédente** — `dateFin` prend la
veille de la nouvelle `dateEffet`.

Jamais deux affectations ouvertes sur un même agent.

### 6.2 · Une compétence sans taux ne s'assigne pas

Contrôle serveur, bloquant. Décision 1.4.

### 6.3 · Le doublon renvoie l'existant

Sur `libelleNormalise`. Créer « maçon » alors que « Maçon » existe renvoie
l'existant, sans erreur — patron 5.

Normalisation : minuscules, accents retirés, espaces réduits.

### 6.4 · Un taux ne se modifie pas

Publier un taux crée une **nouvelle ligne**. Aucun `UPDATE` sur
`TauxJournalier`.

Un taux publié par erreur se corrige par un second taux à la même date
d'effet — la contrainte `@@unique([competenceId, dateEffet])` l'interdit,
donc c'est un **refus explicite** avec le message :

> Un taux existe déjà à cette date d'effet. Choisissez une autre date, ou
> corrigez le taux existant.

### 6.5 · Une composée réunit au moins deux qualifiées

Contrôle bloquant. Une composée à un seul métier n'a pas de sens.

Les composantes sont des compétences de catégorie `QUALIFIE` et actives.

### 6.6 · Archiver exige zéro agent

Décision 5.5.

### 6.7 · Toute révision est journalisée

`JournalEvenement`, avec l'ancien montant, le nouveau, le motif et l'auteur.

Les affectations aussi.

---

## 7. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `competence:lire` | Consulter les deux écrans | ADMIN, DG, **DT**, **DRH**, RH, **DFC**, CT, CC |
| `competence:gerer` | Créer, modifier, archiver | ADMIN, **DT** |
| `taux:definir` | Fixer et réviser un taux | ADMIN, **DFC** |
| `competence:assigner` | Assigner à un agent | ADMIN, **DRH**, RH |

> Les **montants** suivent `employe:donneesSensibles` — visibles du DG, de la
> DFC et de la DRH, masqués ailleurs avec un cadenas.
>
> Un Chef de Chantier voit la compétence d'un agent, pas son taux.

---

## 8. Seed

### 8.1 · Neuf compétences de départ

| Libellé | Catégorie | Taux | Effet |
| --- | --- | --- | --- |
| Manœuvre | BASE | 5 000 F | 01/01/2026 |
| Aide-maçon | BASE | 6 000 F | 01/01/2026 |
| Maçon | QUALIFIE | 7 500 F | 01/01/2026 |
| Coffreur | QUALIFIE | 8 000 F | 01/01/2026 |
| Ferrailleur | QUALIFIE | 8 500 F | 01/01/2026 |
| Plombier — pose canalisation | QUALIFIE | 9 000 F | 01/01/2026 |
| Soudeur | QUALIFIE | 10 000 F | 01/01/2026 |
| Conducteur d'engins | QUALIFIE | 12 000 F | 01/01/2026 |
| Maçon-Coffreur | COMPOSEE | 9 500 F | 01/01/2026 |

> ⚠️ **Ces montants sont des HYPOTHÈSES.** Le seed porte un bandeau
> d'avertissement, comme les valeurs de M3.
>
> La Direction Financière doit les confirmer avant toute paie réelle.

### 8.2 · Le seed est idempotent

`upsert` sur `libelleNormalise`. Relancer ne crée pas de doublon et ne
réécrit pas un taux existant.

---

## 9. Critères de recette

### Modèle

- [ ] `npx prisma validate` passe
- [ ] L'auto-relation `Composition` porte bien **deux** champs
- [ ] **Aucun champ `actif` ni `courant` sur `TauxJournalier`**
- [ ] `@@unique([competenceId, dateEffet])` existe

### Compétences — Direction Technique

- [ ] Créer une compétence en moins de trente secondes
- [ ] **Aucun champ de montant dans cette modale**
- [ ] Un avertissement annonce qu'elle sera sans taux
- [ ] Créer « maçon » alors que « Maçon » existe **renvoie l'existant**
- [ ] Une composée exige au moins deux métiers
- [ ] Les composantes proposées sont qualifiées et actives
- [ ] Archiver une compétence portée par un agent est **refusé**, avec les noms

### Taux — Direction Financière

- [ ] Une compétence sans taux apparaît **en tête** du tableau
- [ ] Le filtre « Sans taux » les isole
- [ ] Le bouton « Fixer le taux » est visible sur ces lignes
- [ ] La première fixation ne demande **pas** de motif
- [ ] Une révision demande un motif de 20 caractères
- [ ] **La variation s'affiche en clair** — ancien, nouveau, pourcentage
- [ ] Le nombre d'agents concernés est indiqué
- [ ] Deux taux à la même date d'effet sont **refusés**
- [ ] **Aucun `UPDATE` sur `TauxJournalier`** — vérifier dans le code

### Historique

- [ ] Le fil montre toutes les versions, la plus récente en tête
- [ ] Le taux en vigueur est marqué
- [ ] Chaque version porte sa période de validité
- [ ] Le motif est conservé
- [ ] **`tauxEnVigueur(maçon, 15/03/2025)` renvoie 7 000 F**, pas 7 500

### Assignation — Direction RH

- [ ] Les compétences **sans taux sont verrouillées** dans le sélecteur
- [ ] Leur raison s'affiche à l'infobulle
- [ ] Un changement clôt l'affectation précédente
- [ ] **Jamais deux affectations ouvertes** sur un même agent
- [ ] Un changement exige un motif de 15 caractères
- [ ] La variation de taux s'affiche
- [ ] Une composée rappelle les métiers réunis

### Le contrôle qui compte le plus

- [ ] **`montantDuJour(agent, 15/03/2025)` lit la compétence ET le taux du 15/03/2025**
- [ ] Un agent devenu maçon en juin garde son taux de manœuvre pour mai
- [ ] Un agent sans compétence à cette date renvoie `null`, pas zéro

### Permissions

- [ ] La DT ne peut pas fixer un taux
- [ ] La DFC ne peut pas créer une compétence
- [ ] Les RH ne peuvent ni créer ni fixer un taux
- [ ] Un Chef de Chantier voit les compétences, **pas les montants**
- [ ] Les montants masqués portent un cadenas, jamais une cellule vide

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m17.ts` écrit, exécuté, **vu échouer** une fois

---

## 10. Points de vigilance

1. **Un agent, une compétence.** S'il fait deux métiers, on crée une composée.
2. **Trois directions, trois gestes.** La technique ne fixe pas les taux.
3. **Une compétence sans taux ne s'assigne pas.** Contrôle bloquant.
4. **Un taux ne se modifie pas, il se remplace.** Aucun `UPDATE`.
5. **L'affectation est historisée**, comme le taux.
6. **La paie lit à la date du JOUR POINTÉ**, jamais à la date du calcul.
7. **Aucun champ `courant` ni `actif` sur les taux.** Ils se calculent.
8. **Les montants sont sensibles.** Cadenas, jamais cellule vide.

---

## 11. Ce qui ne se décide pas seul

1. Les huit décisions de la section 1
2. Les montants du seed — la DFC les confirmera
3. La liste des compétences de départ
4. Toute modification du schéma Prisma
5. Le rattachement des permissions aux rôles
6. Tout écart aux règles R-01 à R-07

---

## 12. Ce que ce module alimente — M7, la paie chantier

```
Relevé d'activité visé   →   jours pointés
        +
Compétence à cette date  →   taux journalier
        ↓
    Montant dû
```

M7 exige **M6 — les relevés d'activité**, qui n'est pas construit.

> **M17 est autonome.** Il ne dépend que de M2, et sera utilisable bien avant
> la paie. C'est ce qui justifie d'en faire un module à part plutôt qu'une
> livraison de M7.
