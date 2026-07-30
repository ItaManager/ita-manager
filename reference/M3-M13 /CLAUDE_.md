# CLAUDE.md — Instructions permanentes du projet

> Lu automatiquement à chaque session. Ces règles s'appliquent sans qu'on
> ait à les rappeler.

---

## Le projet

**ITA Manager** — ERP interne d'ITA SARL, entreprise de BTP en Côte
d'Ivoire. Reconstruction complète.

| Élément | Valeur |
| --- | --- |
| Branche de travail | `dev` |
| Branche de production | `main` — **ancien code, gelée, ne jamais toucher** |
| Fichier d'environnement | `.env.dev` — jamais `.env.local` |
| Base de développement | Supabase `ita-manager-dev` |
| Module en cours | **M0 — Socle** |

---

## Documents de référence

Ordre de préséance. **`DECISIONS.md` l'emporte sur tout autre document.**

| # | Fichier | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS.md` | Registre des décisions — fait foi |
| 2 | `SECURITE.md` | Exigences, dont trois bloquantes |
| 3 | `PATRONS.md` | Patrons et règles d'affichage |
| 4 | `M0-SOCLE.md` | Dossier du module en cours |
| 5 | `GUIDE-ENVIRONNEMENTS.md` | Branches, base, déploiement |
| 6 | `CORRECTION-M0-AUTH.md` | Défauts constatés à corriger |

En cas de contradiction entre un document et le code, **signale l'écart**
plutôt que d'arbitrer seul.

---

## Stack — aucune substitution

Next.js sur Vercel · Supabase · Prisma · shadcn/ui · **Tailwind v4** ·
Resend · Cloudflare

- **Tailwind v4** : configuration en CSS, pas de `tailwind.config.ts`
- **Deux URL de base** : `DATABASE_URL` port 6543 avec `?pgbouncer=true&connection_limit=1`, `DIRECT_URL` port 5432
- **Migrations** : Prisma Migrate uniquement, jamais depuis le tableau de bord Supabase

---

## Trois exigences bloquantes

### 1 · Toute Server Action commence par `exigerPermission`

Une Server Action est un **point d'entrée HTTP public**. Être appelée depuis
une page protégée ne la protège pas.

```ts
// ❌ Interdit
export async function supprimerEmploye(id: string) { … }

// ✅ Attendu
export const supprimerEmploye = actionProtegee(
  PERMISSIONS.EMPLOYE_ARCHIVER,
  async (session, id: string) => { … },
);
```

### 2 · `getUser()`, jamais `getSession()`

`getSession()` lit le cookie sans le vérifier. Un cookie est falsifiable.

### 3 · `SUPABASE_SERVICE_ROLE_KEY` n'atteint jamais le client

Jamais de préfixe `NEXT_PUBLIC_`, jamais dans un composant client.

---

## Quatre règles d'interface

**R-01** · Aucune information ne repose sur la seule couleur. Un statut se
lit par son libellé.

**R-02** · Optimiser pour la lecture, pas pour la modification. Afficher les
valeurs, déporter l'édition derrière un bouton.

**R-03** · L'infobulle enrichit, elle n'explique jamais l'essentiel. Pas de
survol sur tablette. Toute icône seule porte un `aria-label`.

**R-04** · Tout sélecteur est un champ à autocomplétation. Jamais de liste
déroulante fermée sur un référentiel.

---

## ⚠️ Sauvegarde — règle absolue

À la fin de **chaque étape validée**, sans exception :

```bash
git add -A
git commit -m "type(portée): description"
git push origin dev
```

Même si le code est imparfait, même s'il ne compile pas encore.

**Motif** : une première tentative de M0 a été perdue faute d'avoir été
poussée — vingt-quatre heures effacées. Ce n'est pas une commodité.

Si une étape se termine sans push, **signale-le** plutôt que de continuer.

### Format des commits

| Préfixe | Usage |
| --- | --- |
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction |
| `refactor:` | Réécriture sans changement de comportement |
| `chore:` | Dépendances, configuration |
| `docs:` | Documentation |
| `db:` | Migration ou schéma |

Exemple : `feat(m0): écran de connexion et réinitialisation`

**Un commit, une intention.** Un commit qui touche l'authentification, le
thème et une migration est impossible à annuler proprement.

---

## Ce que tu ne décides pas seul

1. **Toute modification du schéma Prisma**, y compris un ajout anodin
2. **La structure de la barre latérale** — arrêtée avec le métier
3. **La matrice de permissions**
4. **Le contenu du seed** — aucun employé réel avant M2
5. **La Build Command Vercel** — la modifier avant la bascule casse la production
6. **Tout écart aux règles R-01 à R-04**

Dans ces cas : signale, propose, attends.

---

## Manière de travailler

**Un plan avant tout code.** Découpé en étapes vérifiables. Pour chacune :
ce que tu produis, ce que je dois vérifier, ce que tu ne dois pas décider
seul. Attends validation.

**Une étape à la fois.** Ne pas ouvrir la suivante avant vérification de la
précédente.

**Signaler les écarts** entre documents et réalité du code, plutôt que
d'arbitrer silencieusement.

---

## Défauts déjà constatés — ne pas reproduire

| # | Défaut | Correctif |
| --- | --- | --- |
| 1 | Code QR non affiché | Générer le SVG côté client depuis `totp.uri` avec `qrcode.react`. Ne pas utiliser l'image de Supabase. |
| 2 | Champ « 6 chiffres » acceptant des lettres | `replace(/\D/g, "")`, `maxLength={6}`, `inputMode="numeric"` |
| 3 | Codes de secours non produits | Dix codes après vérification, affichage unique |
| 4 | Écrans nus au regard du thème | Bloc d'identité, titres de carte, fil de progression, indicateur de robustesse |

Détail dans `CORRECTION-M0-AUTH.md`.

---

## Reprise de compte administrateur

Le compte `ADMIN` porte une double authentification obligatoire. Si le
secret TOTP est perdu — changement de poste, de téléphone — la procédure
est :

1. Supabase → **Authentication** → **Users** → supprimer l'utilisateur
2. `npx prisma migrate reset`
3. Le seed recrée le compte

Le mot de passe initial doit être lisible : soit dans `.env.dev` via une
variable dédiée, soit affiché en clair dans la sortie du seed.

**Ne jamais figer un mot de passe en dur dans le code du seed.**

---

## Quinze règles issues de défauts constatés

Relevés pendant M0 et M1. Aucun n'était une faute de conception : tous
venaient de la manière de travailler. Détail et contexte dans
`M2-EMPLOYES.md` section 11.

### Sur les données

**1 · Lire, jamais se souvenir.** Toute table de référence qui figure dans un
document se lit ligne à ligne dans ce document. Cite le fichier et la section
en commentaire. *Quatre erreurs de hiérarchie sont venues d'une table
réécrite de mémoire.*

**2 · Une seule source pour les permissions.** `lib/auth/guard.ts`. Aucun
autre fichier n'en définit. *Une permission inventée localement fusionnait
trois droits, dont deux réservés au Super Admin.*

### Sur les affirmations

**3 · Prouver, jamais affirmer.** Une affirmation de conformité s'accompagne
de la sortie brute de la commande qui l'établit. *« 24/24 tests passés »
portait sur une lecture de fichier, pas sur la base.*

**4 · Ne jamais donner d'interprétation à la place d'une sortie.** Montre la
sortie, l'humain conclut.

**5 · Le symptôme observé par l'humain est un fait.** Si ton diagnostic le
contredit, c'est ton diagnostic qui est faux.

### Sur les tests

**6 · Un test non exécuté n'existe pas.** On ne commite pas un script sans
avoir montré sa sortie.

**7 · Un test doit avoir été vu échouer.** Casse volontairement une valeur,
montre le code de sortie à 1, remets la bonne valeur.

**8 · Ne pas contourner un obstacle, le signaler.** *Un test HTTP remplacé
par un import direct ne teste plus rien du routage — soit toute la surface à
protéger.*

### Sur la construction

**9 · `npm run build` fait partie du travail.** `npm run dev` compile page par
page ; un écran jamais ouvert n'est jamais compilé. *Le premier build a
révélé une faute de frappe dans un fichier livré et un composant absent
importé par quatre fichiers.*

**10 · Installer les composants avant de les importer.**

```bash
grep -rho "@/components/ui/[a-z-]*" app lib components | sort -u
ls components/ui/
```

**11 · Ne pas mélanger client applicatif et client de script.** `prismaDirect`
vit dans `scripts/lib/`. Une Server Action qui l'importe épuise les
connexions en production.

### Sur le seed

**12 · Le seed nettoie, il n'ajoute pas seulement.** Après `upsert`, supprimer
ce qui n'est plus au catalogue, et journaliser. *Deux permissions retirées
subsistaient en base, attribuées à des rôles — un droit fantôme est une
faille en sommeil.*

**13 · Le seed passe par `DIRECT_URL`,** port 5432. Résoudre les relations en
deux passes plutôt qu'en requêtes imbriquées. *Un seed en série a expiré et
laissé la base à moitié remplie.*

### Sur la méthode

**14 · Suivre le plan validé, dans l'ordre.** Une étape s'ouvre quand la
précédente est vérifiée. *Trois écrans de M0 sont restés absents parce que
des étapes ont été sautées, alors que le module était annoncé complet.*

**15 · Ne pas inventer de travail.** Si un point est déjà conforme, le dire et
passer au suivant.

### Et une règle de propreté

**Aucun résidu de développement.** Tout écran provisoire est remplacé avant
la clôture de l'étape. *La page racine a longtemps contenu la page de test
des jetons de couleur.*

---

## Le critère de recette qui compte le plus

> Appeler une Server Action **hors permission**, par une requête POST
> directe, sans passer par l'interface. Elle doit échouer, et le refus
> doit apparaître au journal d'audit.
