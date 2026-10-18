# M19 — Missions et frais de mission

Tout ce qu'il faut pour construire le module. **Sept décisions arrêtées,
trois seuils à confirmer.**

---

## Contenu

```
M19/
├─ LISEZ-MOI.md              ce fichier
├─ CLAUDE-M19.md             instructions permanentes, contextualisées
├─ DECISIONS-M19.md          les décisions applicables — fait foi
├─ M19-MISSIONS.md           le dossier, avec le modèle Prisma exact
└─ reference/
   └─ ApercuMissions.jsx     trois rôles, quatre modales
```

## Comment déposer

| Fichier | Destination |
| --- | --- |
| `CLAUDE-M19.md` | racine, renommé **`CLAUDE.md`** |
| `DECISIONS-M19.md` | `docs/1-modules/` |
| `M19-MISSIONS.md` | `docs/1-modules/` |
| `reference/ApercuMissions.jsx` | `reference/M19/` |

> Si un `CLAUDE.md` général existe déjà, ne l'écrase pas — donne
> `CLAUDE-M19.md` en tête de session.

---

## Le module en trois phrases

Un employé part en mission. Il demande, son supérieur vise, la RH valide, la
Direction Financière avance les frais.

**Il revient, il rend compte, on régularise.**

Le module ne se termine pas au départ — la moitié du travail est au retour.

---

## Ce qui le rend délicat

**Il y a une créance sur l'employé.** Les frais sont avancés, pas remboursés.
Tant qu'une mission n'est pas régularisée, l'entreprise a de l'argent dehors.

**Le reliquat à rendre est le cas qu'on oublie.** Si les dépenses justifiées
sont inférieures à l'avance, l'employé doit rendre la différence. Il faut un
mécanisme pour la récupérer.

**Le contrôle est ligne à ligne.** Sans barème, c'est la seule protection —
et une ligne rejetée augmente le reliquat.

## Ce qui le rend faisable

**Aucune dépendance bloquante.** M2 pour les employés, M1 pour la hiérarchie.
M15 seulement pour les versements Wave, en livraison 2.

**L'aperçu couvre les trois rôles** — employé, RH, Direction Financière — et
les quatre modales.

**Toutes les décisions structurantes sont prises.** Trois seuils restent à
confirmer, mais ce sont des paramètres.

---

## Plan de livraison

### Livraison 1 — le circuit, sans les frais

Une mission sans frais suit tout le circuit : demande, visa, validation,
rapport, clôture.

| # | Étape | Ce que je vérifie |
| --- | --- | --- |
| 1.1 | Modèle et migration | `prisma validate` passe, aucun champ `statut` |
| 1.2 | Permissions et navigation | Le visa passe par le lien de données |
| 1.3 | Demande — trois étapes | Le récapitulatif nomme le circuit à venir |
| 1.4 | Visa du N+1 | Un employé sans supérieur passe à la RH |
| 1.5 | **Écran RH** — validation ou refus | Les chevauchements de congé sont signalés |
| 1.6 | Rapport de mission | 30 caractères sur l'objet réalisé |
| 1.7 | **Blocage de nouvelle demande** | Le message nomme la mission en cause |

### Livraison 2 — les frais et la régularisation

**Exige M15 pour les versements Wave.**

| # | Étape |
| --- | --- |
| 2.1 | Lignes de frais estimées |
| 2.2 | **Écran DFC** — versement de l'avance |
| 2.3 | Versement en espèces, avec plafond et émargement |
| 2.4 | Versement Wave, vers M15 |
| 2.5 | Dépenses réelles et justificatifs |
| 2.6 | **Écran de contrôle ligne à ligne** |
| 2.7 | Régularisation et apurement |
| 2.8 | Relances et anomalies |

> La livraison 1 ne dépend de rien. Elle met le circuit en service pendant
> que les frais se construisent.

---

## Le prompt de démarrage — livraison 1

```
On ouvre M19 — Missions, livraison 1.

Lis, dans cet ordre :

  1. CLAUDE.md                              instructions permanentes
  2. docs/1-modules/DECISIONS-M19.md        décisions — fait foi
  3. docs/1-modules/M19-MISSIONS.md         le dossier, modèle Prisma exact
  4. reference/M19/ApercuMissions.jsx       référence visuelle, trois rôles

L'aperçu porte les écrans de l'employé, de la RH et de la DFC. Styles en
ligne, aucune dépendance shadcn — ne l'intègre pas, ne le fais pas compiler.

LE PIÈGE CENTRAL

Le module ne se termine pas au départ. La moitié du travail est au retour :
le rapport, les justificatifs, le contrôle, et l'argent qui reste à rendre.

PÉRIMÈTRE — LIVRAISON 1 SEULEMENT

Le circuit complet, mais SANS les frais. Une mission sans frais suit toutes
les étapes : demande, visa, validation, rapport, clôture.

  1.1  modèle et migration
  1.2  permissions et navigation
  1.3  demande — trois étapes
  1.4  visa du N+1
  1.5  écran RH — validation ou refus
  1.6  rapport de mission
  1.7  blocage de nouvelle demande

Les lignes de frais, le versement d'avance et la régularisation sont en
livraison 2. Ne les commence pas.

⚠️ Le MODÈLE PRISMA, lui, se crée en entier à l'étape 1.1 — LigneFrais,
VersementAvance et Regularisation compris. Une seule migration vaut mieux
que deux.

SEPT PIÈGES

  1. Les frais sont AVANCÉS, pas remboursés — créance sur l'employé.
  2. Le reliquat à rendre est le cas qu'on oublie.
  3. Pas de nouvelle mission tant qu'une précédente n'est pas régularisée.
  4. Le visa du N+1 passe par le LIEN DE DONNÉES, jamais par une permission.
  5. M19 ne paie rien — il déclenche M15.
  6. Le statut se déduit. Aucun champ en base. L'ORDRE DES TESTS COMPTE.
  7. Les totaux de régularisation sont FIGÉS au contrôle.

UN PIÈGE TECHNIQUE DÉJÀ RENCONTRÉ

Les dates @db.Date sont stockées à minuit UTC. Utilise lib/dates.ts.
Jamais toLocaleDateString directement.

Ce module compare beaucoup de dates. La déduction du statut repose sur
`dateRetour < aujourd'hui` — un décalage d'un jour ferait apparaître une
mission en ATTENTE_RAPPORT la veille du retour.

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

> Une mission dont le retour est passé, sans rapport déposé, **empêche toute
> nouvelle demande**.
>
> Le message nomme la mission en cause, ses dates, son retard, et rappelle le
> montant de l'avance qui reste due.

C'est la seule règle du module qui **produit un comportement**, plutôt que
d'enregistrer un fait. Si elle fonctionne, les rapports arriveront.

Écris le test à l'étape 1.7, avec trois cas :

| Cas | Attendu |
| --- | --- |
| Mission dont le retour est passé, sans rapport | **Bloque** |
| Mission clôturée | Ne bloque pas |
| Mission refusée ou annulée | Ne bloque pas |

---

## Trois questions pour la Direction Financière

Les trois seuils lui reviennent. Aucun ne bloque le développement — ce sont
des paramètres.

**Le plafond des espèces — 150 000 F proposé.**

C'est la question la plus importante. Le paiement en espèces échappe au
circuit à quatre yeux de M15 : c'est le seul endroit du projet où de l'argent
sort sans double contrôle.

**Le délai de dépôt du rapport — 7 jours ouvrables proposés.**

Faut-il davantage pour une mission longue ?

**Le reliquat à rendre.**

Accepte-t-elle la retenue sur salaire, ou exige-t-elle un remboursement en
espèces ? La retenue est plus sûre, mais suppose l'accord écrit de l'employé
— à vérifier au regard du droit du travail ivoirien.
