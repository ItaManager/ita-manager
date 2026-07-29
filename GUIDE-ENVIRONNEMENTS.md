# Guide — Mise en place des environnements

> À réaliser avant l'étape 0.1 de M0. Compter 30 à 45 minutes.
>
> Chaque partie se termine par un **point de vérification**. Ne passe pas à
> la suivante sans l'avoir validé, et signale-moi tout écart.

---

## Contexte de départ

| Élément | État |
| --- | --- |
| Branche `main` | Contient l'ancien code, **déployé et intact** sur `app.itamanager.cloud` |
| Branches `dev` et `test` | À créer — aucune n'existe, tout a été fait sur `main` |
| Vercel | Projet déjà relié au dépôt |
| Système | macOS |

**Principe** : `main` n'est pas touchée. La reconstruction vit sur `dev`,
se fige sur `test` pour la recette, et ne rejoint `main` qu'à la bascule.

---

## Cible

| Branche | Rôle | Déploiement | Base |
| --- | --- | --- | --- |
| `main` | Production actuelle · gelée | `app.itamanager.cloud` | base existante |
| `test` | Recette · état figé d'un module terminé | URL Vercel de la branche | `ita-manager-dev` |
| `dev` | Travail quotidien | URL Vercel de la branche | `ita-manager-dev` |
| `feat/*` | Une étape de module | aperçu à la demande | `ita-manager-dev` |

### ⚠️ Ce que ce découpage donne, et ce qu'il ne donne pas

**Il donne** une séparation du code : `test` reste stable pendant que `dev`
avance, ce qui te permet de dérouler une recette sans être perturbé.

**Il ne donne pas** de séparation des données. Sur le plan Hobby de Vercel,
`dev` et `test` relèvent toutes deux de la portée *Preview* et partagent
donc les mêmes variables d'environnement, donc la même base. Le plan gratuit
de Supabase, limité à deux projets actifs, ne permet pas d'en créer une
troisième.

Conséquence pratique : une migration lancée depuis `dev` affecte aussi ce
que voit `test`. Tiens-en compte au moment des recettes.

Pour une étanchéité réelle, il faudrait Vercel Pro — environnements
personnalisés — et Supabase Pro. À arbitrer plus tard, pas maintenant.

---

## Partie A — Branches Git

### A.1 · Créer `dev` et vider l'arborescence

```bash
cd ~/chemin/vers/le/depot
git checkout main
git pull origin main
git status          # doit être propre avant de continuer

git checkout -b dev
```

`dev` est pour l'instant une copie exacte de `main`. On la vide de l'ancien
code, tout en conservant l'historique commun — ce qui rendra la bascule
simple le moment venu.

```bash
rm -rf app components lib public styles src pages node_modules .next
rm -f package.json package-lock.json pnpm-lock.yaml yarn.lock
rm -f next.config.* tailwind.config.* postcss.config.* tsconfig.json

ls -a
```

> Arrête-toi sur le résultat de `ls -a`. Il ne doit rester que `.`, `..`,
> `.git`, et éventuellement `.gitignore` ou `README.md`. Si tu vois autre
> chose que tu veux garder, ne continue pas et dis-le-moi.

```bash
git add -A
git commit -m "Réinitialisation de la branche dev — reconstruction complète"
git push -u origin dev
```

### A.2 · Créer `test` à partir de `dev`

```bash
git checkout -b test
git push -u origin test
git checkout dev          # revenir travailler sur dev
```

`test` part de `dev` déjà nettoyée : les deux branches démarrent au même
point, sans trace de l'ancien code.

### A.3 · Protéger `main` et `test`

Dépôt GitHub → **Settings** → **Branches** → **Add branch protection rule**

Règle sur `main` :

| Réglage | Valeur |
| --- | --- |
| Branch name pattern | `main` |
| Require a pull request before merging | ✅ |
| Require approvals | 0 — tu es seul |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

Règle sur `test` : mêmes réglages. Elle empêche de pousser un correctif
directement dans une recette en cours — ce qui invaliderait la recette.

`dev` reste libre : c'est ta branche de travail.

### A.4 · Cycle de travail

```
feat/m0-01-amorcage  →  dev  →  test  →  main
     étape                jour   recette   bascule
```

**Au quotidien**, sur `dev` :

```bash
git checkout dev
git checkout -b feat/m0-01-amorcage
# … travail …
git add -A
git commit -m "M0.1 — amorçage du projet"
git checkout dev
git merge feat/m0-01-amorcage
git push origin dev
git branch -d feat/m0-01-amorcage
```

Tant que tu es seul et que M0 n'est pas fini, tu peux aussi committer
directement sur `dev`. Les branches `feat/*` prennent leur intérêt quand
une étape s'étale sur plusieurs jours ou qu'il faut pouvoir l'abandonner.

**À la fin d'un module**, promotion vers la recette :

```bash
git checkout test
git merge dev
git push origin test
git checkout dev
```

Tu déroules alors les critères de recette du dossier de module sur l'URL de
`test`. Si un défaut apparaît, tu le corriges sur `dev` et tu promeus à
nouveau. `test` ne se corrige jamais directement.

**À la bascule**, une seule fois, quand tout est prêt :

```bash
git checkout main
git merge test
git push origin main
git tag -a v1.0.0 -m "Première mise en exploitation"
git push origin v1.0.0
```

### ✅ Point de vérification A

- [ ] `git branch -a` affiche `main`, `dev` et `test`
- [ ] Sur `dev`, `ls` ne montre que `.git`, `.gitignore` et `README.md`
- [ ] Sur `main`, `ls` montre toujours l'ancien code
- [ ] `app.itamanager.cloud` répond encore normalement

---

## Partie B — Seconde base Supabase

### B.1 · Créer le projet de développement

Tableau de bord Supabase → **New project**

| Champ | Valeur |
| --- | --- |
| Name | `ita-manager-dev` |
| Database Password | générer, **conserver dans un gestionnaire de mots de passe** |
| Region | la même que la production — `eu-west-3` ou `eu-central-1` |
| Plan | Free |

L'initialisation prend deux à trois minutes.

> **Limite du plan gratuit** : deux projets actifs au maximum. Avec la
> production, tu es exactement à la limite — aucune place pour un troisième.
>
> **Mise en veille** : un projet gratuit sans activité pendant 7 jours est
> suspendu. Il se réveille en un clic, mais ne t'inquiète pas si la base de
> développement ne répond plus après une pause.

### B.2 · Récupérer les chaînes de connexion

Projet `ita-manager-dev` → **Settings** → **Database** → **Connection string**

Deux chaînes sont nécessaires, et elles ne sont **pas** interchangeables.

| Variable | Onglet à copier | Port | Usage |
| --- | --- | --- | --- |
| `DATABASE_URL` | Transaction pooler | 6543 | Requêtes de l'application |
| `DIRECT_URL` | Session pooler | 5432 | Migrations Prisma |

**Copie-les depuis le tableau de bord, ne les reconstruis pas à la main.**
Supabase a modifié le format et l'adressage de ses connexions à plusieurs
reprises ; le tableau de bord affiche toujours la forme valide du moment.

Ajoute ensuite à `DATABASE_URL`, à la suite de l'URL :

```
?pgbouncer=true&connection_limit=1
```

Sans ce paramètre, Prisma tente de préparer des requêtes que pgBouncer ne
sait pas gérer, et les erreurs apparaissent de façon intermittente — donc
difficiles à diagnostiquer.

Remplace `[YOUR-PASSWORD]` par le mot de passe défini en B.1.

### B.3 · Récupérer les clés d'API

Projet `ita-manager-dev` → **Settings** → **API**

| Clé | Variable | Exposée au client |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | oui |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **non, jamais** |

⚠️ La clé `service_role` contourne toutes les protections. Elle ne porte
jamais le préfixe `NEXT_PUBLIC_` et n'apparaît jamais dans un composant
client.

### B.4 · Fichier d'environnement local

Crée `.env.local` à la racine — il pointe sur la base de **développement**.

```bash
# --- Supabase · ita-manager-dev ---
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# --- Base de données ---
DATABASE_URL="postgresql://postgres.xxxxx:MOTDEPASSE@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxxxx:MOTDEPASSE@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"

# --- Courriel ---
RESEND_API_KEY="re_..."

# --- Application ---
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Vérifie que `.gitignore` contient bien :

```
.env
.env.local
.env*.local
```

**Ne commite jamais un fichier `.env`.** Si cela arrive, considère les clés
comme compromises et fais-les tourner immédiatement — l'historique Git les
conserve même après suppression.

### ✅ Point de vérification B

- [ ] Le projet `ita-manager-dev` est actif
- [ ] `.env.local` est rempli et absent de `git status`
- [ ] Les deux ports diffèrent : 6543 pour `DATABASE_URL`, 5432 pour `DIRECT_URL`
- [ ] `DATABASE_URL` se termine par `?pgbouncer=true&connection_limit=1`

---

## Partie C — Vercel

Le projet est déjà relié au dépôt et sert la production depuis `main`.
Objectif : ajouter une URL de développement sur la branche `dev`, **sans
rien casser**.

### ⚠️ Deux réglages à ne surtout pas toucher

Certains paramètres Vercel valent pour **tout le projet**, pas par branche.

| Réglage | Pourquoi ne pas y toucher maintenant |
| --- | --- |
| **Build Command** | Y mettre `prisma migrate deploy` casserait les déploiements de `main`, dont l'ancien code n'utilise pas Prisma |
| **Variables d'environnement de portée Production** | Elles alimentent `app.itamanager.cloud`, qui tourne |

Tant que la bascule n'a pas eu lieu, les migrations Prisma se lancent
**depuis ton poste** contre la base de développement. On modifiera la
commande de build le jour de la bascule.

### C.1 · Variables d'environnement — portée Preview uniquement

Projet Vercel → **Settings** → **Environment Variables**

Pour chaque variable ci-dessous : coche **Preview** seulement.
**Décoche Production. Décoche Development.**

| Variable | Valeur |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | projet `ita-manager-dev` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | projet `ita-manager-dev` |
| `SUPABASE_SERVICE_ROLE_KEY` | projet `ita-manager-dev` |
| `DATABASE_URL` | dev · port 6543 · `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | dev · port 5432 |
| `RESEND_API_KEY` | ta clé Resend |
| `NEXT_PUBLIC_APP_URL` | `https://dev.itamanager.cloud` |

> La portée Preview s'applique à **toutes** les branches hors `main`.
> Comme `dev` sera la seule, c'est sans conséquence ici.

### C.2 · Domaine de développement

Projet Vercel → **Settings** → **Domains** → **Add**

1. Saisir `dev.itamanager.cloud`
2. Vercel demande à quoi le rattacher → choisir **Git Branch** → `dev`
3. Vercel affiche l'enregistrement DNS à créer

Puis dans Cloudflare → `itamanager.cloud` → **DNS** :

| Type | Nom | Contenu | Proxy |
| --- | --- | --- | --- |
| CNAME | `dev` | `cname.vercel-dns.com` | **DNS only** — nuage gris |

**Le nuage doit rester gris.** Avec le proxy Cloudflare actif, la
vérification du domaine par Vercel échoue souvent. Tu pourras l'activer
plus tard si tu le souhaites ; ce n'est pas nécessaire pour une URL de
développement.

Compte 2 à 10 minutes de propagation.

> **Solution de repli** : si le sous-domaine pose problème, Vercel fournit
> une URL stable par branche, du type
> `ita-manager-digital-git-dev-<compte>.vercel.app`. Elle fonctionne
> immédiatement, sans configuration DNS.

### C.3 · Supabase — URL de redirection

C'est l'oubli classique : sans cette étape, la connexion échouera en ligne
avec une erreur de redirection.

Projet `ita-manager-dev` → **Authentication** → **URL Configuration**

| Champ | Valeur |
| --- | --- |
| Site URL | `https://dev.itamanager.cloud` |
| Redirect URLs | `https://dev.itamanager.cloud/**`<br>`http://localhost:3000/**` |

Ajoute aussi l'URL Vercel de repli si tu l'utilises.

### ✅ Point de vérification C

- [ ] Les variables de portée Preview sont saisies, Production décochée
- [ ] La Build Command du projet n'a pas été modifiée
- [ ] `dev.itamanager.cloud` est rattaché à la branche `dev`
- [ ] Le CNAME Cloudflare est en DNS only
- [ ] Les URL de redirection Supabase sont enregistrées
- [ ] **`app.itamanager.cloud` répond toujours normalement**

---

## Partie D — Bascule, plus tard

À ne faire que lorsque la reconstruction est complète et vérifiée sur
`dev.itamanager.cloud`. C'est ici pour mémoire, pas pour maintenant.

Le jour venu :

1. Sauvegarder la base de production actuelle
2. Créer le projet Supabase `ita-manager-prod`, y appliquer les migrations
3. Reprendre les données existantes si nécessaire
4. Renseigner les variables de portée **Production** dans Vercel
5. Modifier la Build Command : `prisma generate && prisma migrate deploy && next build`
6. Fusionner `dev` dans `main`
7. Vérifier `app.itamanager.cloud`
8. Marquer la version : `git tag -a v1.0.0`

L'étape 5 est celle qui casse `main` si elle est faite trop tôt. C'est la
raison de la mise en garde de la partie C.

---

## Ce qu'il ne faut jamais faire

| Interdit | Pourquoi |
| --- | --- |
| Commiter un `.env` | Les clés restent dans l'historique Git après suppression |
| Modifier la Build Command avant la bascule | Casse les déploiements de `main`, donc la production |
| Cocher Production sur une variable de développement | Fait écrire la nouvelle application dans les données réelles |
| Exécuter `prisma migrate dev` sur la base de production | Elle peut réinitialiser le schéma |
| Modifier le schéma depuis le tableau de bord Supabase | Prisma perdrait la trace — décision D-04 |
| Pousser sur `main` pendant la reconstruction | La production tourne encore dessus |

---

## Diagnostic des erreurs fréquentes

| Message | Cause probable | Correction |
| --- | --- | --- |
| `prepared statement "s0" already exists` | `?pgbouncer=true` absent de `DATABASE_URL` | Ajouter le paramètre |
| `Can't reach database server` | Projet gratuit en veille, ou mot de passe erroné | Réveiller le projet, vérifier le mot de passe |
| `P3014: shadow database` | `DIRECT_URL` manquante ou incorrecte | Copier la chaîne Session pooler |
| `Environment variable not found: DATABASE_URL` | `.env.local` absent ou mal nommé | Vérifier le nom exact du fichier |
| Migration réussie en local, échouée sur Vercel | `DIRECT_URL` non définie dans Vercel | L'ajouter dans les deux portées |
