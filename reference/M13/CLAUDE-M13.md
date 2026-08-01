# CLAUDE-M13.md — Instructions pour le module Logistique

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
| **Module en cours** | **M13 — Logistique**, livraison 1 |
| Modules livrés | M0 · M1 · M2 · M3 partiel · M14 L1 · M15 L1 |

---

## Ce module reprend un processus existant

Le Service Logistique tient déjà tout cela : quatre tableurs et **six
formulaires du système qualité**, référencés `EN-GEL-04` à `EN-GEL-17`.

**Tu ne conçois pas un processus — tu le transcris.**

Quand un formulaire dit quelque chose, il fait foi. S'il te paraît étrange,
signale-le : il y a probablement une raison de terrain.

### Les six formulaires

| Référence | Objet |
| --- | --- |
| `EN-GEL-08` | Demande de transport et mise à disposition |
| `EN-GEL-04` | Bon d'entrée et de réception |
| `EN-GEL-17` | Bon de sortie et transfert |
| `EN-GEL-15` | Inspection véhicules légers et poids lourds |
| `EN-GEL-16` | Inspection engins |

---

## Les sept pièges de ce module

**1 · Deux natures de matériel, deux modèles.**
Six types individuels avec un code unique. Les consommables portent une
quantité. Une table unique produirait un numéro de série sur du ciment.

**2 · L'état d'une pièce administrative se CALCULE.**
`VALIDE`, `ALERTE`, `PERIME` se déduisent de `dateExpiration`. Stocké, l'état
serait faux dès le lendemain.

**3 · Le solde de stock se CALCULE.**
Somme des entrées moins somme des sorties. Un total stocké diverge toujours.

**4 · Les types de pièce et les points d'inspection sont des RÉFÉRENTIELS.**
Pas des enums. Une obligation nouvelle se crée depuis l'écran, sans
migration.

**5 · Trois états d'inspection, jamais un booléen.**
`BON`, `MAUVAIS`, `ABSENT`. Un rétroviseur cassé n'est pas un rétroviseur
manquant.

**6 · Le lieu résulte des mouvements.**
Jamais un champ modifiable sur la fiche. Sinon deux vérités : ce que dit la
fiche, ce que disent les bons.

**7 · M8 reste dans le groupe Technique.**
Le demandeur y ouvre « Ressources », M13 arbitre depuis « Demandes reçues ».
**Une seule table `DemandeRessource`, deux écrans** — ne pas la dupliquer.
Voir `DECISIONS-M13.md`, B-08 bis.

---

## Documents du module

Dans `reference/M13/`, à lire dans cet ordre :

| # | Fichier | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS-M13.md` | Décisions applicables — **fait foi** |
| 2 | `M13-LOGISTIQUE.md` | Le dossier du module |
| 3 | `reference/` | Formulaires et tableurs d'origine |

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
- **Migrations** : Prisma Migrate uniquement. **Une migration appliquée ne se supprime jamais** — si elle est fausse, on en écrit une seconde qui corrige.
- **`prismaDirect` vit dans `scripts/lib/`**, jamais dans le code applicatif

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

**R-01** · Aucune information ne repose sur la seule couleur. Une échéance
périmée porte « périmé depuis 273 jours ».

**R-02** · Optimiser pour la lecture, pas pour la modification.

**R-03** · L'infobulle enrichit, elle n'explique jamais l'essentiel. Toute
icône seule porte un `aria-label`.

**R-04** · Tout sélecteur est un champ à autocomplétation, avec création
inline. Un doublon renvoie l'existant.

**R-05** · Étapes pour créer, onglets pour modifier. Champs en `rounded-md`.

**R-06** · Jetons typographiques verrouillés — `TYPOGRAPHIE.md`. Inter avec
`tabular-nums`, jamais `font-bold`.

**R-07** · États des champs spécifiés — `CHAMPS.md`. L'erreur remplace l'aide
et n'apparaît qu'au `blur`. Une valeur masquée par permission porte un
cadenas, jamais une cellule vide.

---

## ⚠️ Sauvegarde — règle absolue

À la fin de **chaque étape validée** :

```bash
git add -A
git commit -m "type(m13): description"
git push origin dev
```

Même si le code est imparfait.

---

## Quinze règles issues de défauts constatés

Relevées pendant M0, M1, M14 et M15.

### Sur les données

**1 · Lire, jamais se souvenir.** Toute table de référence qui figure dans un
document se lit **ligne à ligne** dans ce document.
*Quatre erreurs de hiérarchie sont venues d'une table réécrite de mémoire.*

**2 · Une seule source pour les permissions.** `lib/auth/guard.ts`.
*Une permission inventée localement fusionnait trois droits.*

### Sur les affirmations

**3 · Prouver, jamais affirmer.** Une affirmation de conformité s'accompagne
de la **sortie brute** de la commande qui l'établit.

**4 · Ne jamais donner d'interprétation à la place d'une sortie.**

**5 · Le symptôme observé par l'humain est un fait.** Si ton diagnostic le
contredit, c'est ton diagnostic qui est faux.

### Sur les tests

**6 · Un test non exécuté n'existe pas.**

**7 · Un test doit avoir été vu échouer.** Casse volontairement une valeur,
montre le code de sortie à 1, remets.

**8 · Ne pas contourner un obstacle, le signaler.**

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

**13 · Le seed passe par `DIRECT_URL`**, port 5432. Résoudre les relations en
deux passes.

### Sur la méthode

**14 · Suivre le plan validé, dans l'ordre.**

**15 · Ne pas inventer de travail.** Si un point est déjà conforme, le dire et
passer au suivant.

**Aucun résidu de développement.**

---

## Ce que tu ne décides pas seul — spécifique M13

1. Toute modification des sept décisions de `M13-LOGISTIQUE.md` § 1
2. La liste des types de pièce administrative
3. La liste des points d'inspection
4. **Ce qui bloque une sortie et ce qui avertit seulement**
5. Les correspondances de reprise des données
6. La formule de calcul de disponibilité
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

> Ouvrir l'écran des échéances et voir, en une ligne, qu'une assurance est
> **périmée depuis 273 jours**.
>
> C'est exactement ce que le tableur actuel affiche sans que personne soit
> prévenu. Si cet écran fonctionne, la livraison 1 a rempli son office.
