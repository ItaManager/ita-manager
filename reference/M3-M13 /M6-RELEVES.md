# M6 — Relevés d'activité

**Statut** : à ouvrir · **Prérequis** : M2, M5 · **Bloque** : M7
**Version cible** : `v0.7.0`

> **Le module le plus risqué du projet.** Pas techniquement — humainement.
>
> Si un chef de chantier abandonne le relevé au bout de trois jours et revient
> au carnet papier, la paie chantier s'effondre : elle en dépend entièrement.
>
> Chaque décision de ce dossier est prise contre ce risque.

---

## 1. Décisions bloquantes

### 1.1 · Périodicité du relevé — **à trancher**

| Option | Effet |
| --- | --- |
| **Quotidien** | Un relevé par jour. Précis, mais 22 saisies par mois. |
| **Hebdomadaire** | Un relevé par semaine, avec une ligne par jour. Moins de saisies, mémoire sollicitée. |

**Recommandation : quotidien, saisi le jour même.** Le pointage par exception
rend la saisie quotidienne quasi gratuite — voir 4.2. Un relevé hebdomadaire
rempli le vendredi de mémoire est faux.

### 1.2 · Relevé non saisi — **à trancher**

Que se passe-t-il si le chef de chantier ne saisit rien un jour ?

| Option | Effet |
| --- | --- |
| Rien | Le jour n'est pas payé. Injuste si l'équipe a travaillé. |
| Alerte au conducteur | Il relance. Charge de suivi. |
| Blocage de la période de paie | Radical, mais garantit l'exhaustivité. |

**Recommandation** : alerte au conducteur à J+1, blocage de la clôture de
période s'il manque un relevé sur un jour ouvré déclaré travaillé.

### 1.3 · Pouvoir du visa — **à trancher**

Le conducteur de travaux peut-il **modifier** les quantités au visa, ou
seulement accepter ou refuser ?

**Recommandation : refuser avec motif, jamais modifier.** Si le conducteur
corrige silencieusement, le chef de chantier ne sait pas que son relevé était
faux, et l'erreur se reproduit. Un refus motivé enseigne.

### 1.4 · Rouvrir un relevé visé — **à trancher**

Qui peut, et jusqu'à quand ? Le Directeur Technique tant que la période de
paie n'est pas ouverte ?

---

## 2. Objectif

Enregistrer le travail réellement effectué sur chantier : pointage de
l'équipe, travaux réalisés, matériel et matériaux consommés, incidents.

**Critère de réussite** : un chef de chantier saisit son relevé quotidien en
moins de deux minutes, sur tablette, avec un réseau instable.

---

## 3. Les trois contraintes — décision E-07

| Contrainte | Valeur | Conséquence |
| --- | --- | --- |
| Appareil | **Tablette**, jamais téléphone | Largeur minimale 768 px, cibles tactiles 44 px |
| Effectif | **Jusqu'à 20 agents** | Pointage **par exception** |
| Réseau | **Faible sur chantier** | Brouillon local d'abord, synchronisation différée |

### 3.1 · Tablette

- Cibles tactiles de **44 px minimum**, contre 32 ailleurs
- **Aucun survol porteur d'information** — il n'y a pas de survol au doigt
- Deux colonnes au maximum, jamais trois
- Les infobulles deviennent des lignes d'aide sous le champ

### 3.2 · Pointage par exception — le point décisif

Vingt agents représentent une soixantaine d'interactions si chaque ligne
demande un état, des heures et des heures supplémentaires.

**Principe : tous présents par défaut.** À l'ouverture, chaque agent affecté
au chantier est présent, avec les heures théoriques du jour. Le chef ne
saisit que les **écarts**.

- Les lignes conformes restent visuellement discrètes
- Les exceptions — retard, absence — ressortent en couleur **et en libellé**
- Une action « tous présents » rétablit l'état initial

**Sur une journée normale, la saisie du pointage tombe à zéro interaction.**

### 3.3 · Réseau faible

Le brouillon est écrit **localement** avant toute tentative d'envoi, dans
`IndexedDB`. Synchronisation en arrière-plan dès que le réseau le permet.

| État affiché | Sens |
| --- | --- |
| `Enregistré localement` | La saisie est sauvée sur la tablette |
| `Synchronisé à 14 h 32` | Le serveur a la version |
| `En attente de réseau` | Sauvé localement, envoi différé |

- **La perte de connexion n'interrompt jamais la saisie**
- La soumission pour visa exige d'être en ligne, et le dit clairement
- Un relevé ouvert sur deux appareils : dernière écriture retenue, avec avertissement

---

## 4. Écrans

| Écran | Route | Permission | Forme |
| --- | --- | --- | --- |
| Mes relevés | `/releves` | `releve:saisir` | liste |
| Saisie du relevé | `/releves/[id]` | `releve:saisir` | **page dédiée** — E-02 |
| À viser | `/releves/a-viser` | `releve:viser` | liste |
| Relevés du chantier | `/projets/[id]/releves` | `planning:modifier` | liste |

### 4.1 · Page de saisie — cinq blocs

| Bloc | Contenu |
| --- | --- |
| **Pointage** | Un agent par ligne, tous présents par défaut |
| **Travaux réalisés** | Tâche, avancement déclaré, observation |
| **Matériel utilisé** | Engin, heures de fonctionnement, carburant |
| **Matériaux consommés** | Article, quantité, unité |
| **Incidents** | Facultatif — nature, description, photo |

Les blocs sont **repliables**. Seul le pointage est ouvert par défaut : c'est
le seul obligatoire.

### 4.2 · Un patron à produire

**Saisie tablette hors ligne.** Il ne réutilise ni le patron 4, conçu pour la
modale de bureau, ni le patron 6 tel quel.

À produire au moment d'ouvrir M6, pas avant.

---

## 5. Modèle de données

`ReleveActivite` · `Pointage` · `TravauxRealises` · `UtilisationMateriel` ·
`ConsommationMateriau` · `Incident`

### 5.1 · Statuts

```
BROUILLON → SOUMIS → VISE
              ↓
           REFUSE → BROUILLON
```

Un relevé `VISE` alimente la paie. Un relevé `REFUSE` revient au chef avec le
motif.

### 5.2 · Le pointage porte l'état, pas seulement les heures

```prisma
enum EtatPointage {
  PRESENT
  ABSENT_JUSTIFIE
  ABSENT_NON_JUSTIFIE
  RETARD
  REPOS
}
```

`ABSENT_NON_JUSTIFIE` sur un journalier signifie **jour non payé** — c'est la
seule règle d'absence qui le concerne, décision A-13.

---

## 6. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `releve:saisir` | Créer et modifier ses relevés | ADMIN, DT, CT, CC |
| `releve:viser` | Viser un relevé | ADMIN, DT, CT |

### Le visa se contrôle par la donnée, pas seulement par le rôle

```ts
const autorise =
  session.roles.includes("ADMIN") ||
  session.roles.includes("DT") ||
  await estConducteurDuChantier(session.employeId, releve.projetId);

if (!autorise) throw new PermissionRefusee("releve:viser");
```

Un conducteur de travaux ne vise que **les relevés de ses chantiers**. C'est
la chaîne fonctionnelle de A-08 bis appliquée.

---

## 7. Server Actions

| Action | Permission |
| --- | --- |
| `ouvrirReleve` | `releve:saisir` |
| `enregistrerBrouillon` | `releve:saisir`, sur son propre relevé |
| `soumettreReleve` | `releve:saisir`, sur son propre relevé |
| `viserReleve` · `refuserReleve` | `releve:viser` + conducteur du chantier |
| `rouvrirReleve` | `planning:modifier`, si aucune période de paie ouverte |

### `ouvrirReleve` — préremplissage

À l'ouverture, l'action charge :

- Les agents affectés au chantier ce jour-là
- Les heures théoriques du jour
- Le matériel affecté au chantier
- Les tâches en cours

**Tout est prérempli. Le chef corrige, il ne saisit pas.**

---

## 8. Règles métier

### 8.1 · Un relevé par chantier et par jour

Contrainte d'unicité. Deux relevés le même jour sur le même chantier
produiraient un double paiement.

### 8.2 · Le visa ne modifie pas

Décision 1.3. Le conducteur accepte ou refuse avec motif. Il ne corrige pas
les quantités.

### 8.3 · Un relevé visé est figé

Sauf réouverture explicite, journalisée, et seulement si aucune période de
paie n'est ouverte sur le chantier.

### 8.4 · L'avancement déclaré ne remplace pas le planifié

Il alimente `Tache.avancementConstate`. L'écart avec le planifié est calculé
et visible — c'est l'écart qui a de la valeur.

### 8.5 · Le carburant est enregistré, pas contrôlé

M6 note les litres consommés par engin. Le rapprochement avec les bons de
carburant et la détection d'écarts relèvent d'un module ultérieur.

Enregistrer maintenant permettra d'analyser plus tard.

### 8.6 · Une photo d'incident est une pièce ordinaire

Pas de classification particulière — sauf si elle montre une blessure, auquel
cas elle devient une pièce médicale. **À signaler à la saisie.**

---

## 9. Critères de recette

### Saisie sur tablette

- [ ] La page s'affiche correctement à 768 px de large
- [ ] **Toutes les cibles tactiles font au moins 44 px**
- [ ] Aucune information n'est accessible uniquement au survol
- [ ] Les blocs se replient et se déplient au doigt

### Pointage par exception

- [ ] À l'ouverture, tous les agents affectés sont présents avec les heures théoriques
- [ ] **Une journée normale se valide sans aucune interaction sur le pointage**
- [ ] Marquer une absence la fait ressortir visuellement **et par libellé**
- [ ] L'action « tous présents » rétablit l'état initial
- [ ] Vingt agents s'affichent sans défilement horizontal

### Hors ligne

- [ ] Couper le réseau pendant la saisie n'interrompt rien
- [ ] L'indicateur passe à « En attente de réseau »
- [ ] Rétablir le réseau déclenche la synchronisation
- [ ] **Fermer l'onglet et le rouvrir restaure la saisie**
- [ ] La soumission hors ligne est refusée, avec un message explicite
- [ ] Deux appareils sur le même relevé : dernière écriture, avec avertissement

### Circuit

- [ ] Soumettre envoie au conducteur du chantier
- [ ] **Un conducteur ne voit que les relevés de ses chantiers**
- [ ] Refuser exige un motif
- [ ] Un refus renvoie le relevé en brouillon, avec le motif visible
- [ ] **Le visa ne permet pas de modifier les quantités**
- [ ] Un relevé visé n'est plus modifiable
- [ ] **`viserReleve` appelée par un tiers, par requête POST directe, est refusée**

### Cohérence

- [ ] Deux relevés le même jour sur le même chantier sont impossibles
- [ ] Un relevé sur un projet clôturé est impossible
- [ ] Un agent en congé validé apparaît en absence justifiée, préremplie
- [ ] L'avancement déclaré alimente `avancementConstate`, pas `avancementPlanifie`

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m6.ts` écrit, exécuté, vu échouer une fois

---

## 10. Points de vigilance

1. **Le risque est l'abandon, pas la panne.** Chaque friction ajoutée rapproche du carnet papier.
2. **Pointage par exception, jamais par saisie.** C'est la décision qui rend le module utilisable.
3. **Local d'abord, réseau ensuite.** Jamais l'inverse.
4. **Le visa ne modifie pas.** Un refus motivé enseigne ; une correction silencieuse cache l'erreur.
5. **Un relevé par chantier et par jour.** Sinon double paiement.
6. **44 px, pas de survol, deux colonnes.** Ce n'est pas du confort, c'est ce qui rend la saisie possible au doigt.

### Ce qui ne se décide pas seul

Les quatre décisions de la section 1, la stratégie de synchronisation, le
comportement en cas de conflit entre appareils.
