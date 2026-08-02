# M16 — Assistanat de Direction · Dossier complet

Tout ce qu'il faut pour construire le module. **Dix décisions arrêtées,
aucune en attente.**

---

## Contenu

```
M16/
├─ LISEZ-MOI.md            ce fichier
├─ CLAUDE-M16.md           instructions permanentes, contextualisées
├─ DECISIONS-M16.md        les décisions applicables — fait foi
├─ PATRONS-M16.md          correspondance écran par patron
└─ M16-ASSISTANAT.md       le dossier du module — 740 lignes
```

## Comment déposer

| Fichier | Destination |
| --- | --- |
| `CLAUDE-M16.md` | racine, renommé **`CLAUDE.md`** |
| `DECISIONS-M16.md` | `docs/1-modules/` |
| `PATRONS-M16.md` | `docs/1-modules/` |
| `M16-ASSISTANAT.md` | `docs/1-modules/` |

> Si un `CLAUDE.md` général existe déjà, ne l'écrase pas — donne
> `CLAUDE-M16.md` en tête de session.

**Aucun fichier de référence à déposer.** Contrairement à M13, ce module n'a
ni formulaire papier ni tableur d'origine. Le cadrage vient de la description
du fonctionnement réel.

---

## Le module en trois phrases

Trois activités tenues par la même personne : **le carburant**, **les
visiteurs**, **le courrier**.

Le demandeur n'a pas de compte — il vient voir l'Assistante, qui saisit pour
lui. Pas de circuit, pas de validation.

Ce qui donne sa valeur au module : **le kilométrage saisi à chaque
distribution** produit la consommation aux cent, et alimente les compteurs de
M13.

---

## Ce module dépend de M13

| Modèle M13 | Usage en M16 |
| --- | --- |
| `Materiel` | Le véhicule ou l'engin servi |
| `ArticleStock` | Le carburant lui-même |
| `MouvementStock` | La sortie de cuve |
| `LieuStockage` | La cuve |
| `ReleveCompteur` | **Le kilométrage** |

> ⚠️ **M13 livraison 2 doit être faite** pour les trois modèles de stock.
>
> Le bloc **visiteurs** et le bloc **courrier** n'en dépendent pas — ils
> peuvent être construits avant.

---

## Plan de livraison

### Livraison 1 — visiteurs et courrier

**Aucune dépendance.** Deux blocs simples qui apportent immédiatement.

| # | Étape | Ce que je vérifie |
| --- | --- | --- |
| 1.1 | Modèle et migration — `Visite`, `Courrier` | `npm run verify` passe |
| 1.2 | Permissions et navigation | Un chef de service voit « Courrier à traiter » |
| 1.3 | **Registre des visiteurs** | Enregistrer une arrivée en 30 secondes |
| 1.4 | Sortie d'un clic, décompte des présents | Le décompte est juste |
| 1.5 | **Courrier arrivée et départ** | Le numéro est généré, séquence commune |
| 1.6 | Suivi de traitement | Un courrier départ n'a pas de statut |
| 1.7 | Purge automatique des visites | Étape de la tâche quotidienne |

### Livraison 2 — carburant

**Exige M13 L2.**

| # | Étape |
| --- | --- |
| 2.1 | Modèle — `DistributionCarburant`, `StationService` |
| 2.2 | `SourceReleve` reçoit `CARBURANT` |
| 2.3 | Formulaire de distribution — deux natures |
| 2.4 | **Calcul de consommation** entre pleins complets |
| 2.5 | Tableau de consommation avec écarts |
| 2.6 | Cuves, seuils et réapprovisionnement vers M14 |

---

## Le prompt de démarrage — livraison 1

```
On ouvre M16 — Assistanat de Direction, livraison 1.

Lis, dans cet ordre :

  1. CLAUDE.md                              instructions permanentes
  2. docs/1-modules/DECISIONS-M16.md        décisions applicables — fait foi
  3. docs/1-modules/M16-ASSISTANAT.md       le dossier
  4. docs/1-modules/PATRONS-M16.md          écran par patron

LA DÉCISION QUI SIMPLIFIE TOUT

Le demandeur n'a pas de compte. Il vient voir l'Assistante de Direction, qui
saisit pour lui.

Pas de circuit de validation. Pas d'écran de suivi personnel. Pas de
notification. Un seul type d'utilisateur : celui qui saisit.

PÉRIMÈTRE — VISITEURS ET COURRIER SEULEMENT

Le bloc CARBURANT est en livraison 2 : il dépend de M13 L2 pour les stocks.
Ne le commence pas.

  1.1  modèle et migration — Visite, Courrier
  1.2  permissions et navigation
  1.3  registre des visiteurs
  1.4  sortie d'un clic, décompte des présents
  1.5  courrier arrivée et départ
  1.6  suivi de traitement
  1.7  purge automatique des visites

QUATRE POINTS DE VIGILANCE

  1. Un seul modèle Courrier, un champ `sens`. Arrivée et départ sont deux
     VUES FILTRÉES, pas deux tables. Le compteur de numérotation est COMMUN.

  2. Le numéro se génère : ITA-{ANNEE}-{SEQ:4}. Séquence annuelle, remise à
     zéro au 1er janvier.

  3. Le statut de traitement existe À L'ARRIVÉE SEULEMENT. Sur le registre
     départ, la colonne disparaît — elle n'affiche pas un tiret.

  4. Le registre des visiteurs contient des données de TIERS. Trois mois de
     conservation, purge automatique, AUCUNE image de pièce d'identité.

UN PIÈGE TECHNIQUE DÉJÀ RENCONTRÉ

Les dates @db.Date sont stockées à minuit UTC. Utilise lib/dates.ts —
formaterDateCivile() et joursEntre(). Jamais toLocaleDateString directement.

Ce défaut a produit « périmé depuis 274 jours » au lieu de 273 sur M13.

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

## Les critères qui comptent

**Livraison 1** — enregistrer une arrivée de visiteur en trente secondes, et
voir le décompte des présents se mettre à jour.

**Livraison 2** — saisir deux distributions sur un même véhicule, avec deux
pleins complets, et voir la consommation apparaître :

```
12 juin   45 200 km   60 L   plein complet
28 juin   45 890 km   55 L   plein complet
          ────────────
          690 km avec 60 L   →   8,7 L / 100 km
```

---

## Une action hors application

**H-03 — déclaration ARTCI**, toujours ouverte.

Le registre des visiteurs traite des données de personnes qui ne sont ni
employés ni clients. Cela relève de la déclaration.

Ça ne bloque pas la construction, mais **ça bloque la mise en exploitation**
de ce bloc.
