# CLAUDE-M17.md — Compétences et taux journaliers

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
| **Module en cours** | **M17 — Compétences et taux journaliers** |
| Modules livrés | M0 · M1 · M2 · M3 partiel · M13 · M14 L1 · M15 L1 · M16 |
| Groupe de navigation | **Personnel** |

---

## Ce module en une phrase

Le référentiel qui rend la paie chantier possible : **le pointage donne les
jours, la compétence donne le taux.**

Deux écrans, cinq modales, trois tables. Petit en surface, mais il porte huit
règles qu'on ne peut pas se permettre de manquer.

---

## Les huit pièges de ce module

**1 · Un agent porte UNE compétence.**
S'il sait faire deux métiers, on crée une compétence **composée** —
`Maçon-Coffreur`, avec son propre taux. Jamais deux compétences sur un agent :
on ne saurait pas quel taux appliquer un jour donné.

**2 · Trois directions, trois gestes SÉPARÉS.**
La Direction Technique **définit** la compétence. La Direction Financière
**fixe** le taux. Les RH **assignent**.

⚠️ La modale de création de compétence n'a **AUCUN champ de montant**. Un taux
fixé par la technique serait une dépense décidée sans contrôle financier.

**3 · Une compétence sans taux ne s'assigne pas.**
Contrôle **bloquant**, côté serveur. Sans taux, aucun montant ne se
calculerait — autoriser l'assignation reporterait la panne au jour du
paiement.

**4 · Un taux ne se modifie pas, il se remplace.**
Chaque taux porte une `dateEffet`. **Aucun `UPDATE` sur `TauxJournalier`.**
Publier crée une nouvelle ligne.

**5 · L'affectation est historisée elle aussi.**
Un agent qui passe de manœuvre à maçon garde son historique. Une seule
affectation ouverte à la fois.

**6 · La paie lit à la date du JOUR POINTÉ.**
Pas à la date du calcul. Un jour de mars 2025 applique la compétence de mars
2025 et le taux de mars 2025.

C'est la règle la plus facile à manquer, et celle qui fausserait toutes les
paies rétroactives.

**7 · Aucun champ `courant` ni `actif` sur les taux.**
Le taux en vigueur se **calcule** : le plus récent dont la `dateEffet` est
passée. Un champ stocké deviendrait faux à la première date d'effet future.

**8 · Ce n'est PAS la grille salariale de M4.**
M4 concerne les permanents — salaire mensuel, catégories, échelons,
convention collective. Ici : les journaliers, un montant par jour pointé.

Deux logiques différentes, deux modules.

---

## Documents du module

Dans `reference/M17/`, à lire dans cet ordre :

| # | Fichier | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS-M17.md` | Décisions applicables — **fait foi** |
| 2 | `M17-COMPETENCES.md` | Le dossier, avec le modèle Prisma exact |
| 3 | `reference/ApercuCompetences.jsx` | Référence visuelle |

L'aperçu porte les deux écrans et les cinq modales. **Styles en ligne, aucune
dépendance shadcn** — ne l'intègre pas, ne le fais pas compiler. Il donne la
densité, les libellés et les états.

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
sont en base.

*Quatre resets en cinq jours sont partis de ce geste.*

### Un piège Prisma propre à ce module

`Competence.composantes` est une **auto-relation many-to-many**. Prisma exige
les **deux** champs :

```prisma
composantes  Competence[] @relation("Composition")
composeeDans Competence[] @relation("Composition")
```

Le second ne sert pas dans l'interface, mais Prisma refuse une auto-relation à
sens unique.

---

## Trois exigences bloquantes du projet

### 1 · Toute Server Action commence par `exigerPermission`

Une Server Action est un **point d'entrée HTTP public**. Être appelée depuis
une page protégée ne la protège pas.

*Dix actions exposées ont été trouvées le 2 août, dont quatre sur les
paiements.*

### 2 · `getUser()`, jamais `getSession()`

`getSession()` lit le cookie sans le vérifier. Un cookie est falsifiable.

### 3 · Aucune clé secrète n'atteint le client

Jamais de préfixe `NEXT_PUBLIC_` sur une clé, jamais dans un composant
client, jamais dans une réponse.

---

## Sept règles d'interface

**R-01** · Aucune information ne repose sur la seule couleur. Une compétence
sans taux porte le mot « en attente ».

**R-02** · Optimiser pour la lecture, pas pour la modification.

**R-03** · L'infobulle enrichit, elle n'explique jamais l'essentiel. Toute
icône seule porte un `aria-label`.

**R-04** · Tout sélecteur est à autocomplétation. Un doublon renvoie
l'existant.

**R-05** · Étapes pour créer, onglets pour modifier. Champs en `rounded-md`.

**R-06** · Jetons typographiques verrouillés. `tabular-nums` sur tous les
montants. Jamais `font-bold`.

**R-07** · États des champs spécifiés. L'erreur remplace l'aide et n'apparaît
qu'au `blur`. **Une option indisponible est verrouillée avec sa raison,
jamais masquée.**

Le dernier point compte ici : une compétence sans taux reste visible dans le
sélecteur, avec un cadenas et l'explication.

---

## ⚠️ Sauvegarde — règle absolue

À la fin de **chaque étape validée** :

```bash
git add -A
git commit -m "type(m17): description"
git push origin dev
```

Même si le code est imparfait.

---

## Seize règles issues de défauts constatés

### Sur les données

**1 · Lire, jamais se souvenir.** Toute table de référence qui figure dans un
document se lit **ligne à ligne** dans ce document.

**2 · Une seule source pour les permissions.** `lib/auth/guard.ts`.
*Trois permissions inventées ont été trouvées le 2 août — elles refusaient
tout le monde.*

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

**9 · `npm run build` fait partie du travail.**

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

**16 · Un fichier de migration appliquée ne se touche jamais.**

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

⚠️ **Ce module manipule beaucoup de dates d'effet.** Un décalage d'un jour
fausserait le taux appliqué à une paie.

---

## Ce que tu ne décides pas seul

1. Les huit décisions de `M17-COMPETENCES.md` § 1
2. Les montants du seed — ce sont des hypothèses, la DFC les confirmera
3. La liste des compétences de départ
4. Le rattachement des permissions aux rôles
5. Toute modification du schéma Prisma
6. Tout écart aux règles R-01 à R-07

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

> ```ts
> await montantDuJour(agentId, new Date("2025-03-15"))
> ```
>
> Doit renvoyer **le taux en vigueur le 15 mars 2025**, pour **la compétence
> que l'agent portait ce jour-là**.
>
> Pas le taux d'aujourd'hui. Pas la compétence d'aujourd'hui.
>
> Si ce calcul est juste, le module a rempli son office. S'il est faux, toutes
> les paies rétroactives le seront aussi.
