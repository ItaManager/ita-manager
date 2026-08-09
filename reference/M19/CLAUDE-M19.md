# CLAUDE-M19.md — Missions et frais de mission

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
| **Module en cours** | **M19 — Missions**, livraison 1 |
| Modules livrés | M0 · M1 · M2 · M3 partiel · M13 · M14 L1 · M15 · M16 · M17 |
| Groupe de navigation | **Missions** |

---

## Ce module en une phrase

Un employé part en mission. Il demande, on vise, on valide, on avance les
frais. **Il revient, il rend compte, on régularise.**

---

## Le piège central

**Le module ne se termine pas au départ.**

La moitié du travail est au retour : le rapport, les justificatifs, le
contrôle ligne à ligne, et l'argent qui reste à rendre.

Un module qui s'arrêterait au versement de l'avance laisserait l'entreprise
sans trace de ce qu'elle a avancé.

---

## Les neuf pièges de ce module

**1 · Les frais sont AVANCÉS, pas remboursés.**
La DFC verse avant le départ. Il y a donc une **créance sur l'employé**
jusqu'à la régularisation. C'est ce qui structure toute la seconde moitié.

**2 · Le reliquat à rendre est le cas qu'on oublie.**
Si les dépenses justifiées sont inférieures à l'avance, **l'employé doit de
l'argent à l'entreprise**. Il faut un mécanisme pour le récupérer — espèces,
Wave, ou retenue sur salaire.

**3 · Pas de nouvelle mission tant qu'une précédente n'est pas régularisée.**
Contrôle **bloquant** à la soumission. Le message nomme la mission en cause,
avec sa référence et ses dates.

C'est la règle qui fait que les rapports arrivent.

**4 · Le contrôle est ligne à ligne.**
Sans barème, c'est la seule protection. La DFC accepte ou rejette **chaque**
dépense. Le total justifié ne compte que les lignes acceptées.

**5 · Le visa du N+1 passe par le lien de données.**
`Affectation.superieurId`, comme `deciderN1` en M3. **Aucune permission ne le
remplace.**

**6 · M19 ne paie rien.**
Un versement Wave crée une `DemandePaiement` dans M15, qui suit son propre
circuit — autorisation du DG, fenêtre horaire, exécution.

**7 · Le statut se déduit.**
Onze états, aucun champ en base. Voir `M19-MISSIONS.md` § 3.1 pour le code
exact — **l'ordre des tests compte**.

**8 · Les totaux de régularisation sont FIGÉS.**
C'est l'exception à la règle du calcul. Une régularisation est un acte
comptable : elle ne doit pas changer si une ligne est modifiée après coup.

**9 · L'estimation n'engage à rien.**
Une mission qui coûte plus cher que prévu n'est pas une faute. Les lignes
d'estimation ne sont **jamais** comparées aux dépenses réelles pour un
contrôle.

---

## ⚠️ Le point de sécurité du module

**Le paiement en espèces échappe au circuit à quatre yeux.**

M15 impose que le préparateur ne soit pas l'autorisateur, et que
l'autorisateur ne soit pas l'exécutant. Une remise en espèces n'a pas ce
garde-fou.

C'est **le seul endroit du projet où de l'argent sort sans double contrôle**.

D'où le plafond : au-delà de **150 000 F** — à confirmer par la DFC — Wave
devient obligatoire. Le bouton espèces se verrouille, avec sa raison.

Et toute remise en espèces exige un **émargement**. Sans lui, la mission ne
passe pas en `APPROUVEE`.

---

## Documents du module

Dans `reference/M19/`, à lire dans cet ordre :

| # | Fichier | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS-M19.md` | Décisions applicables — **fait foi** |
| 2 | `M19-MISSIONS.md` | Le dossier, avec le modèle Prisma exact |
| 3 | `reference/ApercuMissions.jsx` | Référence visuelle — trois rôles |

L'aperçu porte les écrans de l'**employé**, de la **RH** et de la **DFC**,
plus les quatre modales. Styles en ligne, aucune dépendance shadcn — ne
l'intègre pas, ne le fais pas compiler.

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

*Quatre resets en cinq jours sont partis de ce geste.*

---

## Trois exigences bloquantes du projet

### 1 · Toute Server Action commence par `exigerPermission`

Une Server Action est un **point d'entrée HTTP public**. Être appelée depuis
une page protégée ne la protège pas.

*Dix actions exposées ont été trouvées le 2 août, dont quatre sur les
paiements.*

⚠️ **Exception apparente** : le visa du N+1 n'a pas de permission. Il repose
sur un **contrôle par lien de données** — `Affectation.superieurId`. Ce
contrôle est aussi bloquant qu'une permission, et se fait côté serveur.

### 2 · `getUser()`, jamais `getSession()`

`getSession()` lit le cookie sans le vérifier. Un cookie est falsifiable.

### 3 · Aucune clé secrète n'atteint le client

Jamais de préfixe `NEXT_PUBLIC_` sur une clé, jamais dans un composant
client, jamais dans une réponse.

---

## Sept règles d'interface

**R-01** · Aucune information ne repose sur la seule couleur. Un reliquat
porte le mot « à rendre », jamais un fond ambre seul.

**R-02** · Optimiser pour la lecture, pas pour la modification.

**R-03** · L'infobulle enrichit, elle n'explique jamais l'essentiel. Toute
icône seule porte un `aria-label`.

**R-04** · Tout sélecteur est à autocomplétation.

**R-05** · **Étapes pour créer, onglets pour modifier.** La demande suit trois
étapes, le rapport en suit deux — patron 4 bis.

**R-06** · `tabular-nums` sur tous les montants. Jamais `font-bold`.

**R-07** · États des champs spécifiés. **Une option indisponible est
verrouillée avec sa raison, jamais masquée** — le bouton espèces au-delà du
plafond en est l'exemple.

---

## ⚠️ Sauvegarde — règle absolue

À la fin de **chaque étape validée** :

```bash
git add -A
git commit -m "type(m19): description"
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

⚠️ **Ce module compare beaucoup de dates.** La déduction du statut repose sur
`dateRetour < aujourd'hui`. Un décalage d'un jour ferait apparaître une
mission en `ATTENTE_RAPPORT` la veille du retour.

---

## Ce que tu ne décides pas seul

1. Les sept décisions de `M19-MISSIONS.md` § 2
2. **Le plafond des espèces** — 150 000 F proposé, la DFC tranchera
3. **Le délai de dépôt du rapport** — 7 jours ouvrables proposés
4. **Le seuil de restauration sans reçu** — 5 000 F proposés
5. La place du module dans la navigation
6. Le lien avec M15
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

> Une mission dont le retour est passé, sans rapport déposé, **empêche toute
> nouvelle demande**.
>
> Le message nomme la mission en cause, ses dates, son retard, et rappelle le
> montant de l'avance qui reste due.

Si ce blocage fonctionne, les rapports arriveront. S'il ne fonctionne pas,
ils s'accumuleront — et l'entreprise perdra la trace de ses avances.

C'est la seule règle du module qui produit un comportement, plutôt que
d'enregistrer un fait.
