# CLAUDE-M16.md — Instructions pour le module Assistanat de Direction

> **À déposer à la racine du dépôt sous le nom `CLAUDE.md`**, ou à donner en
> tête de session si un `CLAUDE.md` général existe déjà.

---

## Le projet

**ITA Manager** — ERP interne d'ITA SARL, entreprise de BTP en Côte d'Ivoire.

| Élément | Valeur |
| --- | --- |
| Branche de travail | `dev` |
| Branche de production | `main` — **ancien code, gelée, ne jamais toucher** |
| Fichier d'environnement | `.env.dev` — jamais `.env.local` |
| Base de développement | Supabase `ita-manager-dev` |
| **Module en cours** | **M16 — Assistanat**, livraison 1 |
| Modules livrés | M0 · M1 · M2 · M3 partiel · M13 L1 · M14 L1 · M15 L1 |

---

## Ce module est plus simple qu'il n'en a l'air

Trois activités sans rapport entre elles, tenues par la même personne :
**le carburant**, **les visiteurs**, **le courrier**.

### La décision qui simplifie tout

**Le demandeur n'a pas de compte.** Il vient voir l'Assistante de Direction,
qui saisit pour lui.

Pas de circuit de validation. Pas d'écran de suivi personnel. Pas de
notification au demandeur.

Un seul type d'utilisateur : celui qui saisit.

---

## Les huit pièges de ce module

**1 · Deux natures de sortie de carburant, deux effets.**
Station-service = une **dépense**, aucun stock ITA touché.
Cuve = un **mouvement de stock**, le solde baisse.
Le formulaire est le même ; ce qui se passe derrière diffère.

**2 · La consommation se CALCULE, jamais stockée.**
Entre deux pleins complets consécutifs, en additionnant tous les litres de
l'intervalle — partiels inclus.

**3 · Le plein complet borne l'intervalle.**
Sans deux pleins complets, aucune consommation n'est affichée. Un tiret et la
mention « en attente d'un plein complet », jamais un chiffre faux.

**4 · Compteur en recul : signalé, jamais refusé.**
Motif demandé, `anomalie = true`, et **l'intervalle est exclu du calcul**.

**5 · Deux unités, jamais mélangées.**
Véhicule → L/100 km. Engin → L/h. Le tableau filtre par type et ne les
mélange pas dans une colonne.

**6 · M16 n'a PAS sa propre table de stock.**
Le carburant vit dans `ArticleStock` de M13. M16 enregistre les sorties, il ne
duplique rien.

**7 · Le kilométrage alimente M13.**
Chaque distribution crée un `ReleveCompteur` de source `CARBURANT`. Un seul
modèle, deux modules qui l'écrivent.

**8 · Une distribution ne se supprime pas.**
Une correction crée une ligne rectificative. Supprimer fausserait
rétroactivement toutes les consommations calculées depuis.

---

## Documents du module

Dans `reference/M16/`, à lire dans cet ordre :

| # | Fichier | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS-M16.md` | Décisions applicables — **fait foi** |
| 2 | `M16-ASSISTANAT.md` | Le dossier du module |
| 3 | `PATRONS-M16.md` | Correspondance écran par patron |

### Documents généraux du projet

`DECISIONS.md` · `SECURITE.md` · `PATRONS.md` · `TYPOGRAPHIE.md` ·
`CHAMPS.md` · `GUIDE-ENVIRONNEMENTS.md`

En cas de contradiction entre un document et le code, **signale l'écart**
plutôt que d'arbitrer seul.

---

## Stack — aucune substitution

Next.js sur Vercel · Supabase · Prisma · shadcn/ui · **Tailwind v4** ·
Resend · Cloudflare

- **Tailwind v4** : configuration en CSS, pas de `tailwind.config.ts`
- **Deux URL de base** : `DATABASE_URL` port 6543 avec `?pgbouncer=true&connection_limit=1`, `DIRECT_URL` port 5432
- **`prismaDirect` vit dans `scripts/lib/`**, jamais dans le code applicatif

### ⚠️ Migrations — règle 16

**Un fichier de migration appliquée ne se modifie, ne se supprime et ne se
déplace JAMAIS.**

Prisma en stocke une empreinte. Toute édition provoque un drift qui ne se
répare que par un reset.

Si une migration est fausse, **on en écrit une seconde qui corrige**.

Et ne jamais lancer `resolve --rolled-back` sur une migration dont les effets
sont en base : l'historique et la structure divergent alors définitivement.

*Quatre resets en cinq jours sont partis de ce geste.*

---

## Trois exigences bloquantes du projet

### 1 · Toute Server Action commence par `exigerPermission`

Une Server Action est un **point d'entrée HTTP public**. Être appelée depuis
une page protégée ne la protège pas.

### 2 · `getUser()`, jamais `getSession()`

`getSession()` lit le cookie sans le vérifier. Un cookie est falsifiable.

### 3 · Aucune clé secrète n'atteint le client

Jamais de préfixe `NEXT_PUBLIC_` sur une clé, jamais dans un composant
client, jamais dans une réponse.

---

## Sept règles d'interface

**R-01** · Aucune information ne repose sur la seule couleur. Un écart de
consommation porte « +49 % » en toutes lettres.

**R-02** · Optimiser pour la lecture, pas pour la modification.

**R-03** · L'infobulle enrichit, elle n'explique jamais l'essentiel. Toute
icône seule porte un `aria-label`.

**R-04** · Tout sélecteur est à autocomplétation. Stations et sociétés de
visiteurs se créent inline ; un doublon renvoie l'existant.

**R-05** · Étapes pour créer, onglets pour modifier. Champs en `rounded-md`.

**R-06** · Jetons typographiques verrouillés. `tabular-nums` sur les litres,
montants et consommations. Jamais `font-bold`.

**R-07** · États des champs spécifiés. L'erreur remplace l'aide et n'apparaît
qu'au `blur`. Une valeur masquée par permission porte un cadenas.

---

## ⚠️ Sauvegarde — règle absolue

À la fin de **chaque étape validée** :

```bash
git add -A
git commit -m "type(m16): description"
git push origin dev
```

Même si le code est imparfait.

---

## Seize règles issues de défauts constatés

Relevées pendant M0, M1, M13, M14 et M15.

### Sur les données

**1 · Lire, jamais se souvenir.** Toute table de référence qui figure dans un
document se lit **ligne à ligne** dans ce document.
*Quatre erreurs de hiérarchie sont venues d'une table réécrite de mémoire.*

**2 · Une seule source pour les permissions.** `lib/auth/guard.ts`.

### Sur les affirmations

**3 · Prouver, jamais affirmer.** Une affirmation de conformité s'accompagne
de la **sortie brute** de la commande qui l'établit.
*« Formats relevés du tableur » a été écrit deux fois sans qu'aucun tableur
ait été lu.*

**4 · Ne jamais donner d'interprétation à la place d'une sortie.**

**5 · Le symptôme observé par l'humain est un fait.** Si ton diagnostic le
contredit, c'est ton diagnostic qui est faux.

### Sur les tests

**6 · Un test non exécuté n'existe pas.**

**7 · Un test doit avoir été vu échouer.** Casse volontairement une valeur,
montre le code de sortie à 1, remets.
*Il a fallu cinq demandes pour l'obtenir sur `verify-m13.ts`.*

**8 · Ne pas contourner un obstacle, le signaler.**
*Un `data: any` a masqué une contrainte de base réelle.*

### Sur la construction

**9 · `npm run build` fait partie du travail.** `npm run dev` compile page par
page ; un écran jamais ouvert n'est jamais compilé.

**10 · Installer les composants avant de les importer.**

```bash
grep -rho "@/components/ui/[a-z-]*" app lib components | sort -u
ls components/ui/
```

**11 · Ne pas mélanger client applicatif et client de script.**

### Sur le seed

**12 · Le seed nettoie, il n'ajoute pas seulement.**

**13 · Le seed passe par `DIRECT_URL`**, port 5432.

### Sur la méthode

**14 · Suivre le plan validé, dans l'ordre.**

**15 · Ne pas inventer de travail.**

**16 · Un fichier de migration appliquée ne se touche jamais.** Voir
ci-dessus.

**Aucun résidu de développement.**

---

## Un piège technique déjà rencontré

### Les dates `@db.Date` et le fuseau horaire

Prisma stocke une `@db.Date` à **minuit UTC**. `toLocaleDateString()` sans
fuseau forcé affiche **un jour en moins** hors UTC, et les calculs de jours
sont décalés d'autant.

`lib/dates.ts` porte les fonctions à utiliser :

```ts
formaterDateCivile(date)   // 01/11/2025, UTC forcé
joursEntre(a, b)           // dates civiles, pas instants
```

**Ne jamais appeler `toLocaleDateString` sur une `@db.Date`.**

*Ce défaut a produit « périmé depuis 274 jours » au lieu de 273 sur l'écran
des échéances de M13.*

---

## Ce que tu ne décides pas seul — spécifique M16

1. Les règles de calcul de consommation
2. Le seuil d'alerte d'écart — 25 % proposé
3. Le comportement en cas de compteur en recul
4. **La durée de conservation du registre des visiteurs** — 3 mois
5. Le format de numérotation du courrier
6. Le lien avec M13 et M14
7. Toute modification du schéma Prisma
8. Tout écart aux règles R-01 à R-07

Dans ces cas : **signale, propose, attends.**

---

## Manière de travailler

**Un plan avant tout code.** Découpé en étapes vérifiables. Attends
validation.

**Une étape à la fois.** À chaque étape, sans qu'on te le demande :
`npx tsc --noEmit`, `npm run build`, commit, push.

**Un commit, une intention.** Format `type(portée): description`.

**Signale les écarts** entre documents et réalité du code.

---

## Le critère de recette qui compte le plus

> Saisir deux distributions sur un même véhicule, avec deux pleins complets,
> et voir la consommation apparaître au tableau.
>
> ```
> 12 juin   45 200 km   60 L   plein complet
> 28 juin   45 890 km   55 L   plein complet
>           ────────────
>           690 km avec 60 L   →   8,7 L / 100 km
> ```
>
> Si ce calcul est juste, le module a rempli son office.
