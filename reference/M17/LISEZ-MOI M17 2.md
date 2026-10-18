# M17 — Compétences et taux journaliers

Tout ce qu'il faut pour construire le référentiel. **Huit décisions arrêtées,
aucune en attente.**

---

## Contenu

```
M17/
├─ LISEZ-MOI.md                ce fichier
├─ CLAUDE-M17.md             instructions permanentes, contextualisées
├─ DECISIONS-M17.md          les décisions applicables — fait foi
├─ M17-COMPETENCES.md        le dossier, avec le modèle Prisma exact
└─ reference/
   └─ ApercuCompetences.jsx    les deux écrans et les cinq modales
```

## Comment déposer

| Fichier | Destination |
| --- | --- |
| `CLAUDE-M17.md` | racine, renommé **`CLAUDE.md`** |
| `DECISIONS-M17.md` | `docs/1-modules/` |
| `M17-COMPETENCES.md` | `docs/1-modules/` |
| `reference/ApercuCompetences.jsx` | `reference/M17/` |

> Si un `CLAUDE.md` général existe déjà, ne l'écrase pas — donne
> `CLAUDE-M17.md` en tête de session.

---

## Le module en trois phrases

Le référentiel qui rend la paie chantier possible : **le pointage donne les
jours, la compétence donne le taux.**

Un agent porte **une** compétence. S'il fait deux métiers, on crée une
compétence composée.

Trois directions se partagent le travail : la **Technique** définit le métier,
la **Financière** fixe le taux, les **RH** assignent.

---

## Ce qui rend ce module facile

**Petit en surface.** Deux écrans, cinq modales, trois tables.

**Autonome.** Ni M6, ni M7, ni M13. Seulement M2 pour la liste des agents.

**Toutes les décisions sont prises.** Aucune question à trancher en cours de
route.

**L'aperçu couvre tout** — les deux écrans, les cinq modales, tous les états.

## Ce qui le rend délicat

**Deux historiques à tenir juste.** Le taux et l'affectation portent chacun
une date d'effet, et la paie lit les deux **à la date du jour pointé**.

Une erreur ici fausserait toutes les paies rétroactives, et ne se verrait
qu'au premier contrôle.

---

## Plan de livraison — six étapes

| # | Étape | Ce que je vérifie |
| --- | --- | --- |
| 1 | Modèle et migration | `prisma validate` passe, l'auto-relation est bilatérale |
| 2 | Permissions et navigation | La DT ne peut pas fixer un taux |
| 3 | Écran des compétences | Les sans-taux en tête, avec leur bouton |
| 4 | Modales DT et DFC | La modale DT n'a aucun champ de montant |
| 5 | Écran des agents et assignation | Les sans-taux sont verrouillées |
| 6 | Seed et vérification | `montantDuJour` lit à la bonne date |

---

## Le prompt de démarrage

```
On ouvre M17 — Compétences et taux journaliers.

Lis, dans cet ordre :

  1. CLAUDE.md                                   instructions permanentes
  2. docs/1-modules/DECISIONS-M17.md           décisions — fait foi
  3. docs/1-modules/M17-COMPETENCES.md         le dossier, modèle Prisma exact
  4. reference/M17/ApercuCompetences.jsx       référence visuelle

L'aperçu porte les deux écrans et les cinq modales. Styles en ligne, aucune
dépendance shadcn — ne l'intègre pas, ne le fais pas compiler.

CE MODULE EN UNE PHRASE

Le référentiel qui rend la paie chantier possible : le pointage donne les
jours, la compétence donne le taux.

HUIT PIÈGES

  1. Un agent porte UNE compétence. Deux métiers → une compétence composée.
  2. Trois directions, trois gestes SÉPARÉS. La modale de création de
     compétence n'a AUCUN champ de montant.
  3. Une compétence sans taux ne s'assigne pas — contrôle bloquant.
  4. Un taux ne se modifie pas, il se remplace. Aucun UPDATE sur
     TauxJournalier.
  5. L'affectation est historisée elle aussi.
  6. La paie lit à la date du JOUR POINTÉ, jamais à la date du calcul.
  7. Aucun champ `courant` ni `actif` sur les taux — ils se calculent.
  8. Ce n'est PAS la grille salariale de M4. Deux logiques distinctes.

UN PIÈGE PRISMA PROPRE À CE MODULE

Competence.composantes est une auto-relation many-to-many. Prisma exige les
DEUX champs :

  composantes  Competence[] @relation("Composition")
  composeeDans Competence[] @relation("Composition")

Le second ne sert pas dans l'interface, mais Prisma refuse une auto-relation
à sens unique.

UN PIÈGE DÉJÀ RENCONTRÉ

Les dates @db.Date sont stockées à minuit UTC. Utilise lib/dates.ts —
formaterDateCivile() et joursEntre(). Jamais toLocaleDateString directement.

Ce module manipule beaucoup de dates d'effet. Un décalage d'un jour fausserait
le taux appliqué à une paie.

AVANT DE PROPOSER LE PLAN

  npm run verify

Montre-moi la sortie brute et dis-moi ce que tu constates.

PUIS PROPOSE UN PLAN DÉCOUPÉ

Pour chaque étape : ce que tu produis, ce que je vérifie, ce que tu ne
décides pas seul.

Pas de code avant validation.

ENSUITE, ENCHAÎNE SANS ME REDEMANDER

À chaque étape : npx tsc --noEmit, npm run build, commit, push.

Arrête-toi seulement si une règle manque aux documents, si le build casse
sans que tu voies pourquoi, ou si tu dois trancher un point de la section 11.
```

---

## Le critère qui compte le plus

```ts
await montantDuJour(agentId, new Date("2025-03-15"))
```

Doit renvoyer **le taux en vigueur le 15 mars 2025**, pour **la compétence
que l'agent portait ce jour-là**.

Pas le taux d'aujourd'hui. Pas la compétence d'aujourd'hui.

Écris ce test à l'étape 6, avec un agent qui a changé de compétence entre
temps. C'est le seul qui prouve que les deux historiques fonctionnent
ensemble.

---

## Une chose à faire de ton côté

**Les montants du seed sont des hypothèses.**

| Compétence | Taux proposé |
| --- | --- |
| Manœuvre | 5 000 F |
| Aide-maçon | 6 000 F |
| Maçon | 7 500 F |
| Coffreur | 8 000 F |
| Ferrailleur | 8 500 F |
| Plombier | 9 000 F |
| Maçon-Coffreur | 9 500 F |
| Soudeur | 10 000 F |
| Conducteur d'engins | 12 000 F |

À confirmer avec la Direction Financière avant toute paie réelle. Le seed
portera un bandeau d'avertissement, comme les valeurs de M3.

**Ça ne bloque pas le développement** — les valeurs se corrigent depuis
l'écran, sans redéploiement.

---

## Ce qui suit

**M7 — la paie chantier**, qui exige aussi **M6 — les relevés d'activité**,
non construit.

**M17 est autonome.** Il ne dépend que de M2. Les métiers se définissent, les
taux se fixent, les agents s'assignent — tout sera prêt quand M6 arrivera.
