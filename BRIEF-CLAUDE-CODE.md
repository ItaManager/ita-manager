# Brief de passation — Claude Code

> Document unique à donner en début de session. Il ne remplace pas les
> autres : il dit lesquels lire, dans quel ordre, et ce qui est
> non négociable.
>
> Révision du 28 juillet 2026. **Toute version antérieure de ce fichier
> est caduque** — elle décrivait une intégration de maquette sur un code
> existant, approche abandonnée au profit d'une reconstruction complète.

---

## Le projet

**ITA Manager** — ERP interne d'ITA SARL, entreprise de BTP en Côte
d'Ivoire. Reconstruction complète à partir de zéro.

Une première application existe. Elle est abandonnée : pas d'état
centralisé, pas de modèle de données, formulaires sans soumission. Elle
reste déployée sur `main` jusqu'à la bascule, et **ne doit pas être
modifiée**.

| Élément | Valeur |
| --- | --- |
| Branche de travail | `dev` — vidée de l'ancien code |
| Branche de production | `main` — **gelée, ne pas toucher** |
| Base de développement | Projet Supabase `ita-manager-dev` |
| Module en cours | **M0 — Socle** |
| Version cible | `v0.1.0` |

---

## Stack imposée

Déjà configurée. Aucune substitution.

Next.js sur Vercel · Supabase — base, authentification, stockage ·
Prisma · shadcn/ui · Tailwind v4 · Resend · Cloudflare

- **Tailwind v4** : configuration en CSS, pas de `tailwind.config.ts`. Si tu proposes ce fichier, tu travailles sur la v3.
- **Prisma sur Supabase** : deux URL — `DATABASE_URL` en connexion mutualisée port 6543 avec `?pgbouncer=true&connection_limit=1`, `DIRECT_URL` en direct port 5432 pour les migrations.
- **Migrations** : Prisma Migrate exclusivement. Jamais de modification de schéma depuis le tableau de bord Supabase.

---

## Ordre de lecture

| # | Document | Rôle |
| --- | --- | --- |
| 1 | `DECISIONS.md` | **Fait foi en cas de contradiction** |
| 2 | `SECURITE.md` | Exigences, dont trois bloquantes |
| 3 | `PATRONS.md` | Patrons et règles d'affichage |
| 4 | `M0-SOCLE.md` | Périmètre du module en cours |
| 5 | `GUIDE-ENVIRONNEMENTS.md` | Branches, base, déploiement |
| 6 | `prisma/schema.prisma` | Modèle de données |

---

## Trois exigences bloquantes

Elles interdisent la mise en production si elles ne sont pas satisfaites.
Détail dans `SECURITE.md`.

### 1 · Toute Server Action commence par `exigerPermission`

Une Server Action est un **point d'entrée HTTP public**. Être appelée
depuis une page protégée ne la protège pas : une requête POST directe sur
son identifiant suffit à la déclencher.

```ts
// ❌ Interdit — ouverte à tous
export async function supprimerEmploye(id: string) {
  await prisma.employe.delete({ where: { id } });
}

// ✅ Attendu
export const supprimerEmploye = actionProtegee(
  PERMISSIONS.EMPLOYE_ARCHIVER,
  async (session, id: string) => { /* … */ },
);
```

### 2 · `getUser()`, jamais `getSession()`

`getSession()` lit le cookie sans le vérifier auprès du serveur
d'authentification. Un cookie est falsifiable. `getUser()` valide le JWT
côté Supabase.

### 3 · `SUPABASE_SERVICE_ROLE_KEY` n'atteint jamais le client

Jamais de préfixe `NEXT_PUBLIC_`, jamais dans un composant client. Cette
clé contourne toutes les protections.

**À vérifier après build** : la clé ne doit apparaître dans aucun fichier
du bundle client.

---

## Quatre règles d'interface

Détail dans `PATRONS.md`.

**R-01 · Aucune information ne repose sur la seule couleur.** Un statut se
lit par son libellé. Une pastille verte sans texte ne dit rien à qui
imprime l'écran ou distingue mal les couleurs.

**R-02 · Optimiser pour la lecture, pas pour la modification.** On lit cent
fois plus souvent qu'on ne modifie. Afficher les valeurs, déporter
l'édition derrière un bouton.

**R-03 · L'infobulle enrichit, elle n'explique jamais l'essentiel.** Il n'y
a pas de survol sur tablette. Toute icône seule porte un `aria-label`.

**R-04 · Tout sélecteur est un champ à autocomplétation.** Jamais de liste
déroulante fermée sur un référentiel. Voir patrons 5 et 5 bis.

---

## Implémentations de référence

Quatorze fichiers sont fournis. **Suis ces patrons, ne les réinvente pas** —
espacements, densité, formulation des libellés et des textes d'aide.

Si un écran ressemble à l'un d'eux, il doit lui ressembler à l'identique.

> Attention : **ces fichiers ne font pas partie de M0.** Ils servent de
> référence pour les modules suivants. Seul `lib/auth/guard.ts` est requis
> dès maintenant. Ne les intègre pas au socle.

`PATRONS.md` indique quel patron s'applique à quel écran, module par
module.

---

## Périmètre de M0

**Dans le périmètre** — authentification Supabase, double authentification
TOTP, verrouillage de session, matrice de rôles et permissions, garde
d'autorisation, administration des utilisateurs, journal d'audit, mise en
page et navigation, états vide et chargement et erreur, en-têtes de
sécurité, chaîne de déploiement.

**Hors périmètre** — tout écran métier. La page d'accueil affiche un espace
réservé. Les entrées de menu des modules non livrés restent visibles mais
désactivées, avec leur numéro de module.

---

## Ce que tu ne décides pas seul

1. **Toute modification du schéma Prisma**, y compris un ajout qui paraît anodin
2. **La structure de la barre latérale** — arrêtée avec le métier
3. **La matrice de permissions**
4. **Le contenu du seed** — M0 ne crée aucun employé réel
5. **La Build Command Vercel** — la modifier avant la bascule casse la production
6. **Tout écart aux règles R-01 à R-04**

Dans ces cas : signale, propose, attends.

---

## Manière de travailler

**Un plan avant tout code.** Découpé en étapes vérifiables. Pour chacune :
ce que tu produis, ce que je dois vérifier, ce que tu ne dois pas décider
seul. Attends validation.

**Une étape à la fois.** Ne pas ouvrir la suivante avant que la précédente
soit vérifiée.

**Un commit, une intention.** Format `type(portée): description` —
`feat(m0): écran de connexion`, `db(m0): tables profils et rôles`,
`fix(m0): la désactivation ne prenait pas effet immédiatement`.

**Signaler les écarts.** Si un document décrit une chose et que le code ou
la stack impose autre chose, dis-le plutôt que d'arbitrer silencieusement.

---

## Le critère de recette qui compte le plus

> Appeler une Server Action **hors permission**, par une requête POST
> directe, sans passer par l'interface. Elle doit échouer, et le refus
> doit apparaître au journal d'audit.

C'est le test que presque personne ne fait, et c'est exactement la faille
que cette architecture rend possible si le guard est oublié une seule fois.

---

## Premier message attendu

Un plan d'exécution. Pas de code.
