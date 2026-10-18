# CLAUDE-M15.md — Instructions pour le module ItaPay

> **À déposer à la racine du dépôt sous le nom `CLAUDE.md`**, ou à donner en
> tête de session si un `CLAUDE.md` général existe déjà.
>
> Ce fichier contextualise le module M15. Il reprend les règles permanentes du
> projet et y ajoute ce qui est propre aux paiements.

---

## Le projet

**ITA Manager** — ERP interne d'ITA SARL, entreprise de BTP en Côte d'Ivoire.

| Élément | Valeur |
| --- | --- |
| Branche de travail | `dev` |
| Branche de production | `main` — **ancien code, gelée, ne jamais toucher** |
| Fichier d'environnement | `.env.dev` — jamais `.env.local` |
| Base de développement | Supabase `ita-manager-dev` |
| **Module en cours** | **M15 — ItaPay**, livraison 1 |
| Modules livrés | M0 · M1 · M2 · M3 partiel · M14 livraison 1 |

---

## ⚠️ Ce module fait sortir de l'argent

C'est le seul du projet qui **exécute des paiements réels**. Tous les autres
produisent des données ; une erreur s'y corrige.

Ici, une erreur envoie de l'argent à quelqu'un, et devient irrécupérable en
trois jours — souvent avant, si le destinataire retire les fonds.

### Les cinq erreurs qui coûteraient de l'argent

**1 · Générer la clé d'idempotence au moment de l'appel.**
Chaque tentative devient un transfert. Elle se génère à la **création de la
ligne** — `@default(uuid())` sur le modèle Prisma.

**2 · Écrire `ECHOUE` sur une réponse `5xx`.**
L'état est *inconnu*, pas échoué. Le rejeu envoie l'argent une seconde fois.

**3 · Rejouer sans chercher d'abord.**
Toujours `GET /v1/payouts/search?client_reference=…` avant tout renvoi.

**4 · Sauter `verify_recipient`.**
C'est le seul contrôle qui rattrape un chiffre inversé dans un numéro.

**5 · Laisser une même personne préparer et autoriser.**
Le principe des quatre yeux, vérifié en dur.

---

## Documents du module

Dans `M15/`, à lire dans cet ordre :

| # | Fichier | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS-M15.md` | Décisions applicables — **fait foi** |
| 2 | **`SECURITE-M15.md`** | **Huit interdits en dur — obligatoire** |
| 3 | `M15-ITAPAY.md` | Le dossier du module |
| 4 | `reference/ApercuItaPay.jsx` | Référence visuelle |
| 5 | `reference/wave/` | Documentation de l'API, copie locale |

`SECURITE-M15.md` n'est pas optionnel. C'est le document qui dit ce qui ne
doit jamais arriver.

### Documents généraux du projet

`DECISIONS.md` · `SECURITE.md` · `PATRONS.md` · `TYPOGRAPHIE.md` ·
`CHAMPS.md` · `GUIDE-ENVIRONNEMENTS.md`

En cas de contradiction entre un document et le code, **signale l'écart**
plutôt que d'arbitrer seul.

---

## API Wave — ne pas s'appuyer sur la mémoire

| Ressource | Adresse |
| --- | --- |
| **Payout API** — la page qui compte | `https://docs.wave.com/payout` |
| Business API — référence générale | `https://docs.wave.com/business#api-reference` |
| Portail marchand — clés, signature, liste blanche | `https://business.wave.com/dev-portal` |
| Copie locale | `M15/reference/wave/` |

**C'est une API africaine, peu représentée dans tes données d'entraînement.**
Tout champ, tout endpoint, tout code d'erreur doit venir de la documentation
lue — jamais de ce que tu crois savoir.

C'est la règle 1 ci-dessous, appliquée à une API plutôt qu'à une table.

`M15-ITAPAY.md` § 3 contient les éléments déjà vérifiés contre la
documentation, le 31 juillet 2026. Si elle dit autre chose, **signale
l'écart**.

---

## Stack — aucune substitution

Next.js sur Vercel · Supabase · Prisma · shadcn/ui · **Tailwind v4** ·
Resend · Cloudflare

- **Tailwind v4** : configuration en CSS, pas de `tailwind.config.ts`
- **Deux URL de base** : `DATABASE_URL` port 6543 avec `?pgbouncer=true&connection_limit=1`, `DIRECT_URL` port 5432
- **Migrations** : Prisma Migrate uniquement, jamais depuis le tableau de bord Supabase
- **`prismaDirect` vit dans `scripts/lib/`**, jamais dans le code applicatif

---

## Trois exigences bloquantes du projet

### 1 · Toute Server Action commence par `exigerPermission`

Une Server Action est un **point d'entrée HTTP public**. Être appelée depuis
une page protégée ne la protège pas.

### 2 · `getUser()`, jamais `getSession()`

`getSession()` lit le cookie sans le vérifier. Un cookie est falsifiable.

### 3 · Aucune clé secrète n'atteint le client

Ni `SUPABASE_SERVICE_ROLE_KEY`, ni `WAVE_API_KEY`, ni le secret de signature.

Jamais de préfixe `NEXT_PUBLIC_`, jamais dans un composant client, jamais
dans une réponse.

**Contrôle après build :**

```bash
grep -r "wave_ci_\|WAVE_API_KEY\|SUPABASE_SERVICE_ROLE_KEY" .next/static/ 2>/dev/null \
  && echo "⛔ CLÉ EXPOSÉE" || echo "✅ absente du bundle client"
```

---

## Sept règles d'interface

**R-01** · Aucune information ne repose sur la seule couleur. Un montant en
rouge porte toujours un libellé.

**R-02** · Optimiser pour la lecture, pas pour la modification.

**R-03** · L'infobulle enrichit, elle n'explique jamais l'essentiel. Toute
icône seule porte un `aria-label`.

**R-04** · Tout sélecteur est un champ à autocomplétation.

**R-05** · Étapes pour créer, onglets pour modifier. Champs en `rounded-md`.

**R-06** · Jetons typographiques verrouillés — `TYPOGRAPHIE.md`. Inter avec
`tabular-nums`, jamais `font-bold`.

**R-07** · États des champs spécifiés — `CHAMPS.md`. L'erreur remplace
l'aide et n'apparaît qu'au `blur`. Une valeur masquée par permission porte un
cadenas, jamais une cellule vide.

---

## ⚠️ Sauvegarde — règle absolue

À la fin de **chaque étape validée** :

```bash
git add -A
git commit -m "type(m15): description"
git push origin dev
```

M�me si le code est imparfait. Une première version de M0 a été perdue faute
d'avoir été poussée — vingt-quatre heures effacées.

---

## Quinze règles issues de défauts constatés

Relevées pendant M0, M1 et M14. Aucune n'était une faute de conception :
toutes venaient de la manière de travailler.

### Sur les données

**1 · Lire, jamais se souvenir.** Toute table de référence qui figure dans un
document se lit **ligne à ligne** dans ce document. Cite le fichier et la
section en commentaire.
*Quatre erreurs de hiérarchie sont venues d'une table réécrite de mémoire.*

**2 · Une seule source pour les permissions.** `lib/auth/guard.ts`. Aucun
autre fichier n'en définit.
*Une permission inventée localement fusionnait trois droits, dont deux
réservés au Super Admin.*

### Sur les affirmations

**3 · Prouver, jamais affirmer.** Une affirmation de conformité s'accompagne
de la **sortie brute** de la commande qui l'établit.

**4 · Ne jamais donner d'interprétation à la place d'une sortie.**

**5 · Le symptôme observé par l'humain est un fait.** Si ton diagnostic le
contredit, c'est ton diagnostic qui est faux.

### Sur les tests

**6 · Un test non exécuté n'existe pas.** On ne commite pas un script sans
avoir montré sa sortie.

**7 · Un test doit avoir été vu échouer.** Casse volontairement une valeur,
montre le code de sortie à 1, remets la bonne valeur.

**8 · Ne pas contourner un obstacle, le signaler.**
*Un test HTTP remplacé par un import direct ne teste plus rien du routage.*

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

**12 · Le seed nettoie, il n'ajoute pas seulement.** Un droit fantôme est une
faille en sommeil.

**13 · Le seed passe par `DIRECT_URL`**, port 5432. Résoudre les relations en
deux passes.

### Sur la méthode

**14 · Suivre le plan validé, dans l'ordre.** Une étape s'ouvre quand la
précédente est vérifiée.

**15 · Ne pas inventer de travail.** Si un point est déjà conforme, le dire et
passer au suivant.

**Aucun résidu de développement.** Tout écran provisoire est remplacé avant la
clôture de l'étape.

---

## Ce que tu ne décides pas seul — spécifique M15

1. **Toute modification du circuit d'autorisation**
2. **Le classement d'un code d'erreur Wave** en `ECHOUE` ou `EN_ATTENTE`
3. **Tout ce qui touche à la génération ou au stockage de la clé d'idempotence**
4. **Le retrait ou l'assouplissement d'un des huit interdits** de `SECURITE-M15.md`
5. Les horaires et la durée de fenêtre
6. L'ajout d'une catégorie de paiement
7. La voie de déploiement en production
8. Toute modification du schéma Prisma
9. Tout écart aux règles R-01 à R-07

Dans ces cas : **signale, propose, attends.**

---

## Manière de travailler

**Un plan avant tout code.** Découpé en étapes vérifiables. Pour chacune : ce
que tu produis, ce que je dois vérifier, ce que tu ne dois pas décider seul.
Attends validation.

**Une étape à la fois.**

**Un commit, une intention.** Format `type(portée): description`.

**Signaler les écarts** entre documents et réalité du code.

---

## Le critère de recette qui compte le plus

> `scripts/test-idempotence.ts`, contre le portefeuille de **test** :
>
> 1. Créer un paiement, noter sa clé
> 2. Le rejouer avec **la même clé**
> 3. Compter les transferts chez Wave → **il doit y en avoir un seul**

Et le test doit avoir été **vu échouer** : génère volontairement une clé à
l'appel, vérifie qu'il détecte deux transferts, puis remets.

⚠️ Ce test ne tourne **jamais** contre le portefeuille de production. Refus en
dur si la clé contient `_prod_`.
