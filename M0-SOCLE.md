# M0 — Socle

**Statut** : ouvert · **Prérequis** : aucun · **Bloque** : tous les modules
**Version cible** : `v0.1.0` · **Dernière révision** : 27 juillet 2026

> Ce dossier est autonome : périmètre, écrans, modèle de données,
> permissions, critères de recette, guide de déploiement et de versionnage.
> Il se lit avec `DECISIONS.md`, `SECURITE.md` et `PATRONS.md`.
>
> Pour la mise en œuvre, voir la **section 9** et le fichier
> `BRIEF-CLAUDE-CODE.md`.

---

## 1. Objectif

Livrer une application déployée sur `app.itamanager.cloud`, dans laquelle un
utilisateur se connecte, voit une navigation conforme à son rôle, et ne peut
rien faire qu'il n'ait le droit de faire.

Aucun écran métier. Le socle sert à ce que tout le reste s'y branche sans
réinventer l'authentification, les permissions ou la mise en production.

**Critère de réussite** : le Directeur Général se connecte en production,
voit un menu différent de celui de l'assistant RH, et une Server Action
appelée hors permission échoue proprement.

---

## 2. Périmètre

### Dans le périmètre

- Projet Next.js, Tailwind v4, shadcn/ui, thème ITA
- Prisma relié à Supabase, migrations opérationnelles
- Modèles `Profil`, `Role`, `Permission`, `JournalEvenement`, `Parametre`
- Seed des rôles et permissions
- Authentification : connexion, déconnexion, mot de passe oublié, invitation
- Double authentification TOTP pour les rôles privilégiés
- **Verrouillage de session après 20 minutes d'inactivité** — décision D-07
- Garde d'autorisation et enveloppe d'action
- Mise en page : barre latérale, en-tête, fil d'Ariane, menu utilisateur
- Navigation filtrée par permission
- États de chargement, d'erreur, vides — composants réutilisables
- Application des règles d'affichage R-01 à R-03 de `PATRONS.md`
- Notifications applicatives (toasts)
- Page 403 et page 404
- Journal d'audit : écriture, et écran de consultation réservé à l'admin
- En-têtes de sécurité, configuration Cloudflare
- Chaîne de déploiement complète

### Hors périmètre

Tout écran métier. La page d'accueil affiche un tableau de bord vide avec
un message d'attente. Les entrées de menu des modules non livrés sont
visibles mais désactivées, avec la mention « bientôt disponible ».

---

## 3. Écrans

| Écran | Route | Accès |
| --- | --- | --- |
| Connexion | `/connexion` | public |
| Mot de passe oublié | `/mot-de-passe-oublie` | public |
| Réinitialisation | `/reinitialiser` | jeton |
| Activation de compte | `/activer` | jeton d'invitation |
| Configuration 2FA | `/securite/2fa` | connecté |
| Session verrouillée | `/verrouille` | connecté |
| Accueil | `/` | connecté |
| Mon profil | `/mon-profil` | connecté |
| Utilisateurs et rôles | `/administration/utilisateurs` | `admin:utilisateurs` |
| Journal d'audit | `/administration/journal` | `admin:journal` |
| Accès refusé | `/403` | — |

### Barre latérale

Structure complète dès M0, entrées désactivées si le module n'est pas livré.

| Groupe | Entrées | Module |
| --- | --- | --- |
| Pilotage | Tableau de bord · Notifications · Calendrier RH | M0 · M10 |
| Personnel | Employés · Organigramme · Services & Équipes · Contrats | M1 · M2 |
| Temps & Absences | Congés & Permissions · Planning chantier · Relevés d'activité · Présences bureau | M3 · M5 · M6 · M12 |
| Technique | Projets · Appels d'offres · Ressources | M5 · M8 · M9 |
| Administration | Documents · Paie & Rémunération · Annonces · Rapports | M2 · M4 · M10 |
| Bas de menu | Utilisateurs · Journal d'audit · Paramètres · Aide | M0 |

**Deux règles d'affichage :**

- Une entrée n'apparaît que si l'utilisateur détient au moins une permission de lecture sur le module.
- Une entrée dont le module n'est pas livré reste **visible mais désactivée**, avec son numéro de module affiché. La navigation est ainsi stable dès le premier jour, et chacun voit ce qui arrive.

---

## 4. Modèle de données

Modèles Prisma concernés — se référer à `schema.prisma` :

| Modèle | Rôle en M0 |
| --- | --- |
| `Profil` | Compte applicatif, lié à `auth.users` par UUID |
| `Role` · `Permission` | Habilitations |
| `RolePermission` · `ProfilRole` | Tables de liaison |
| `JournalEvenement` | Audit — écrit dès M0, consulté par l'écran journal |
| `Parametre` | Seuils applicatifs, alimenté au fil des modules |
| `Brouillon` | Créé en M0, utilisé à partir de M2 — décision E-03 |
| `Notification` | Créée en M0 pour que les modules suivants puissent y écrire — décision E-05 |

Les deux derniers ne sont pas exploités par un écran de M0. Ils sont créés
maintenant parce qu'une migration ajoutant une table est sans risque, alors
qu'un module bloqué faute de table coûte un aller-retour.

**Ajout requis à `Profil`** — décision B-03 :

```
delegataireId      String?   @db.Uuid
delegationDebut    DateTime? @db.Date
delegationFin      DateTime? @db.Date
```

**Trigger Postgres à créer** — hors Prisma, en migration SQL :
à l'insertion dans `auth.users`, créer la ligne `profils` correspondante avec
le même UUID.

---

## 5. Permissions à créer

Catalogue complet dès M0, même pour les modules non livrés : le seed est
plus simple à maintenir en une fois qu'en douze.

Reprendre l'objet `PERMISSIONS` de `lib/auth/guard.ts`.

### Matrice rôle × permission

| Permission | ADMIN | DG | DRH | RH | DFC | DT | CT | CC | CE |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| `employe:lire` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| `employe:creer` | ✓ | | ✓ | ✓ | | | | | |
| `employe:modifier` | ✓ | | ✓ | ✓ | | | | | |
| `employe:archiver` | ✓ | | ✓ | | | | | | |
| `employe:donneesSensibles` | ✓ | ✓ | ✓ | | ✓ | | | | |
| `referentiel:creer` | ✓ | | ✓ | | | ✓ | | | |
| `direction:creer` | ✓ | | | | | | | | |
| `posteDirection:affecter` | ✓ | | | | | | | | |
| `absence:demander` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `absence:valider` | ✓ | | ✓ | | | | | | |
| `reglesConges:modifier` | ✓ | | | | | | | | |
| `grille:modifier` | ✓ | | | | ✓ | | | | |
| `derogation:valider` | ✓ | | | | ✓ | | | | |
| `paie:ouvrirPeriode` | ✓ | | ✓ | ✓ | | | | | |
| `paie:validerDT` | ✓ | | | | | ✓ | | | |
| `paie:validerDFC` | ✓ | | | | ✓ | | | | |
| `paie:exporter` | ✓ | | | | ✓ | | | | |
| `ao:creer` | ✓ | ✓ | | | | ✓ | | | ✓ |
| `ao:soumettre` | ✓ | ✓ | | | | ✓ | | | |
| `ao:validerDG` | ✓ | ✓ | | | | | | | |
| `projet:creer` | ✓ | ✓ | | | | ✓ | | | |
| `planning:modifier` | ✓ | | | | | ✓ | ✓ | | |
| `jalon:valider` | ✓ | ✓ | | | | ✓ | | | |
| `releve:saisir` | ✓ | | | | | | ✓ | ✓ | |
| `releve:viser` | ✓ | | | | | ✓ | ✓ | | |
| `ressource:demander` | ✓ | | | | | ✓ | ✓ | ✓ | |
| `admin:utilisateurs` | ✓ | | ✓ | | | | | | |
| `admin:parametres` | ✓ | | | | | | | | |
| `admin:journal` | ✓ | | | | | | | | |

---

## 6. Server Actions attendues

Toutes enveloppées dans `actionProtegee`.

| Action | Permission | Effet |
| --- | --- | --- |
| `inviterUtilisateur` | `admin:utilisateurs` | Crée le compte Supabase, envoie l'invitation Resend |
| `attribuerRole` | `admin:utilisateurs` | Ajoute un rôle, journalise |
| `retirerRole` | `admin:utilisateurs` | Retire un rôle, journalise |
| `desactiverProfil` | `admin:utilisateurs` | `actif = false`, effet immédiat |
| `reactiverProfil` | `admin:utilisateurs` | Rétablit l'accès, journalise |
| `definirDelegation` | connecté | Le responsable désigne son délégataire |
| `consulterJournal` | `admin:journal` | Lecture paginée et filtrée |

`connexion` et `deconnexion` passent par le client Supabase, pas par une
Server Action.

### 6.1 · Garde-fous de l'administration des accès

Trois interdits **en dur**, vérifiés côté serveur avant toute écriture. Ils
ne relèvent pas d'une permission : ils protègent l'application d'un
verrouillage irréversible.

| Interdit | Motif |
| --- | --- |
| Retirer le rôle `ADMIN` à son dernier détenteur | Plus personne ne pourrait attribuer de rôle ni modifier une règle. Seule une intervention directe en base débloquerait la situation. |
| Se désactiver soi-même | Même conséquence, par fausse manœuvre. |
| Se retirer son propre rôle `ADMIN` | Même conséquence. |

Message attendu, explicite : « Vous êtes le dernier administrateur. Désignez
un autre administrateur avant de retirer ce rôle. »

> Ces contrôles justifient à eux seuls la décision C-03 — prévoir un second
> administrateur nominatif. Tant qu'il n'y en a qu'un, le garde-fou l'empêche
> de se retirer, ce qui est protecteur mais rigide.

### 6.2 · Étendue de l'administration

**Attribution par rôle, non par permission.** L'écran attribue et retire des
rôles entiers. Il n'expose pas les permissions unitaires.

Le modèle le permettrait — `RolePermission` est une table — mais une
attribution à la carte double la surface d'erreur sans usage réel dans une
structure de cette taille. Si le besoin apparaît, un écran d'édition des
rôles sera ajouté comme module d'administration distinct.

**Deux détenteurs de `admin:utilisateurs`** : le Super Admin et la Direction
RH. Cette dernière crée les profils employés ; elle doit pouvoir leur ouvrir
un accès sans passer par un tiers.

**Réservé au seul Super Admin** : `admin:parametres` — règles de congés,
grille salariale, seuils — et `admin:journal`.

## 7. Critères de recette

À dérouler par toi, dans cet ordre, avant de clore le module.

### Authentification
- [ ] Connexion avec identifiants valides → arrivée sur l'accueil
- [ ] Connexion avec mauvais mot de passe → message générique, pas d'indication sur ce qui est faux
- [ ] Six tentatives échouées → limitation active
- [ ] Mot de passe oublié → courriel Resend reçu, réinitialisation effective
- [ ] Déconnexion → retour à `/connexion`, retour arrière navigateur n'expose rien
- [ ] Session expirée → redirection propre, pas d'écran blanc

### Double authentification
- [ ] Un compte ADMIN, DG, DRH, DFC ou DT est contraint de configurer TOTP à la première connexion
- [ ] Le QR code s'affiche et se scanne avec Google Authenticator
- [ ] **Dix codes de secours sont générés et affichés une seule fois**
- [ ] Un code de secours utilisé ne fonctionne pas une seconde fois
- [ ] Le Super Admin peut réinitialiser le second facteur d'un tiers
- [ ] **Cette réinitialisation apparaît au journal d'audit**
- [ ] Un compte de rôle terrain — CC, CT — n'y est pas contraint
- [ ] **L'activation TOTP est proposée dans le menu utilisateur**, pas enfouie dans les paramètres

### Verrouillage de session
- [ ] Après 20 minutes sans interaction, l'écran de verrouillage s'affiche
- [ ] Le déverrouillage se fait au mot de passe, sans reconnexion complète
- [ ] Un formulaire en cours n'est pas perdu au déverrouillage
- [ ] Après 8 heures, la déconnexion est complète

### Administration des accès
- [ ] Inviter un utilisateur → courriel Resend reçu, activation effective
- [ ] Attribuer puis retirer un rôle → menu de l'intéressé modifié, journal alimenté
- [ ] Désactiver un profil → accès perdu **immédiatement**, sans attendre l'expiration du jeton
- [ ] **Tenter de retirer le rôle `ADMIN` à son dernier détenteur → refusé, message explicite**
- [ ] **Tenter de se désactiver soi-même → refusé**
- [ ] La Direction RH peut inviter et attribuer des rôles ; elle ne peut pas modifier les paramètres

### Autorisation
- [ ] Deux comptes de rôles différents voient deux menus différents
- [ ] Accès direct à une URL non autorisée → page 403, pas d'erreur technique
- [ ] **Appel d'une Server Action hors permission via requête POST directe → refus** ⚠️ le test le plus important
- [ ] Le refus apparaît dans le journal d'audit
- [ ] Un profil désactivé perd l'accès immédiatement, sans attendre l'expiration du jeton

### Interface
- [ ] Les états de chargement s'affichent, pas d'écran vide
- [ ] Une erreur réseau affiche un message compréhensible et une action de reprise
- [ ] Les entrées de menu des modules non livrés sont désactivées et signalées
- [ ] Le thème correspond à `globals.css` — indigo, vert, densité bureau
- [ ] Navigation au clavier possible sur toute la barre latérale

### Sécurité
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absente du bundle client — vérifié après build
- [ ] En-têtes de sécurité présents — vérifiés avec un outil externe
- [ ] Aucune donnée personnelle dans les logs Vercel
- [ ] HTTPS forcé, HSTS actif

### Déploiement et versionnage
- [ ] La branche `dev` existe et `main` porte toujours l'ancien code
- [ ] `app.itamanager.cloud` répond normalement — la production n'a pas bougé
- [ ] Un push sur `dev` déclenche un déploiement Vercel
- [ ] Les variables d'environnement de portée Preview pointent sur `ita-manager-dev`
- [ ] La Build Command du projet n'a pas été modifiée
- [ ] `CHANGELOG.md` existe et décrit la version
- [ ] La version `v0.1.0` est marquée et poussée
- [ ] `git show v0.1.0` renvoie bien le contenu du module

---

## 8. Guide de déploiement

### Environnements — pendant la reconstruction

`main` porte l'ancien code et sert la production actuelle. Elle reste
**intacte** jusqu'à la bascule.

| Environnement | Branche | Domaine | Base Supabase |
| --- | --- | --- | --- |
| Local | branche de travail | `localhost:3000` | `ita-manager-dev` |
| Développement en ligne | `dev` | URL Vercel de branche | `ita-manager-dev` |
| Production actuelle | `main` | `app.itamanager.cloud` | base existante, **gelée** |

**Deux projets Supabase distincts.** Ne jamais faire pointer le
développement sur la base de production : une migration en cours de mise au
point détruirait des données réelles.

> ⚠️ **Ne pas modifier la Build Command du projet Vercel avant la bascule.**
> Ce réglage vaut pour tout le projet, pas par branche. Y placer
> `prisma migrate deploy` casserait les déploiements de `main`, dont
> l'ancien code n'utilise pas Prisma. En attendant, les migrations se
> lancent depuis le poste local.

### Environnements — après la bascule

| Environnement | Branche | Domaine | Base Supabase |
| --- | --- | --- | --- |
| Local | branche de travail | `localhost:3000` | `ita-manager-dev` |
| Préproduction | `dev` et pull requests | URL Vercel générée | `ita-manager-dev` |
| Production | `main` | `app.itamanager.cloud` | `ita-manager-prod` |

### Variables d'environnement

À définir dans Vercel, par environnement.

| Variable | Dév | Préprod | Prod |
| --- | :-: | :-: | :-: |
| `NEXT_PUBLIC_SUPABASE_URL` | dév | dév | prod |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dév | dév | prod |
| `SUPABASE_SERVICE_ROLE_KEY` | dév | dév | prod |
| `DATABASE_URL` | dév · port 6543 | dév | prod |
| `DIRECT_URL` | dév · port 5432 | dév | prod |
| `RESEND_API_KEY` | test | test | prod |
| `CRON_SECRET` | — | — | prod |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL générée | `https://app.itamanager.cloud` |

### Cycle de travail et versionnage

#### Créer la branche `dev`

À faire une seule fois, avant l'étape 0.1.

```bash
cd ~/chemin/vers/le/depot
git checkout main
git status                 # doit être propre
git pull origin main

git checkout -b dev
```

`dev` est pour l'instant une copie de `main`, ancien code compris. On vide
l'arborescence tout en conservant l'historique commun — ce qui rendra la
bascule simple.

```bash
rm -rf app components lib public styles src pages node_modules .next
rm -f package.json package-lock.json pnpm-lock.yaml yarn.lock
rm -f next.config.* tailwind.config.* postcss.config.* tsconfig.json

ls -a                      # ne doit rester que . .. .git .gitignore README.md

git add -A
git commit -m "chore: réinitialisation de la branche dev"
git push -u origin dev
```

**Vérification** : `git checkout main && ls` doit réafficher l'ancien code,
et `app.itamanager.cloud` répondre normalement. Si ce n'est pas le cas,
arrête-toi.

#### Protéger `main`

Dépôt GitHub → **Settings** → **Branches** → **Add rule**

| Réglage | Valeur |
| --- | --- |
| Branch name pattern | `main` |
| Require a pull request before merging | ✅ |
| Require approvals | 0 — tu travailles seul |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

L'obligation de pull request est le point important : elle empêche de
pousser par accident sur la production pendant la reconstruction.

Ne protège pas `dev` — tu dois pouvoir y pousser librement.

#### Modèle de branches

```
main                       ancien code · production · gelée
dev                        reconstruction · branche de travail
 └── feat/m0-01-amorcage    une branche par étape de module
 └── feat/m0-02-base
 └── fix/…                  correctif isolé
```

Pendant M0, tu peux pousser directement sur `dev` : c'est ta branche de
travail, pas une production. À partir du moment où `dev` est déployée et
consultée par d'autres, repasse par des branches d'étape.

#### Nommage des commits

Format court, préfixé par la nature du changement. Il rend l'historique
lisible et permet de générer le journal des versions automatiquement.

| Préfixe | Usage |
| --- | --- |
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction d'un défaut |
| `refactor:` | Réécriture sans changement de comportement |
| `chore:` | Dépendances, configuration, outillage |
| `docs:` | Documentation seule |
| `db:` | Migration ou modification de schéma |

Exemples :

```
feat(m0): écran de connexion et réinitialisation du mot de passe
db(m0): tables profils, roles et permissions
fix(m0): la désactivation d'un profil ne prenait effet qu'après expiration du jeton
chore: mise à jour de shadcn/ui
```

**Un commit, une intention.** Un commit qui touche l'authentification, le
thème et une migration est impossible à annuler proprement.

#### Numérotation des versions

Format `vMAJEUR.MINEUR.CORRECTIF`.

| Position | S'incrémente quand | Exemple |
| --- | --- | --- |
| **Majeur** | Mise en exploitation, puis changement de rupture | `v1.0.0` |
| **Mineur** | Un module est livré | `v0.3.0` |
| **Correctif** | Un défaut est corrigé sans nouveauté | `v0.3.1` |

Feuille de version prévue :

| Version | Contenu |
| --- | --- |
| `v0.1.0` | M0 — Socle |
| `v0.2.0` | M1 — Organisation |
| `v0.3.0` | M2 — Employés |
| `v0.4.0` | M3 — Congés |
| … | un module par version mineure |
| **`v1.0.0`** | **Bascule en exploitation réelle** |
| `v1.1.0` | Modules livrés après la mise en service |

`v1.0.0` marque le passage en exploitation, pas la fin du développement.

#### Poser une version

À la fin d'un module, une fois la recette passée.

```bash
git checkout dev
git pull origin dev

# Renseigner CHANGELOG.md avant de marquer
git add CHANGELOG.md
git commit -m "docs: journal de la version v0.1.0"
git push

git tag -a v0.1.0 -m "M0 — Socle : authentification, permissions, déploiement"
git push origin v0.1.0
```

Une version marquée ne se déplace jamais. Si une erreur est découverte
après coup, on publie `v0.1.1` — on ne réécrit pas `v0.1.0`.

#### Journal des versions

Un fichier `CHANGELOG.md` à la racine, mis à jour à chaque version.

```markdown
# Journal des versions — ITA Manager

## v0.1.0 — M0 Socle · 12 août 2026

### Ajouté
- Authentification Supabase : connexion, réinitialisation, invitation
- Double authentification TOTP imposée aux rôles privilégiés
- Verrouillage de session après 20 minutes d'inactivité
- Matrice de 9 rôles et 30 permissions
- Administration des utilisateurs, avec garde-fous
- Journal d'audit en ajout seul

### Sécurité
- Garde d'autorisation sur toute Server Action
- En-têtes de sécurité et règles Cloudflare

### Connu
- Le tableau de bord est un espace réservé jusqu'à M10
```

Trois rubriques suffisent : **Ajouté**, **Corrigé**, **Sécurité**. Plus une
rubrique **Connu** pour les limites assumées — elle évite qu'on te signale
dix fois le même écran vide.

#### Retrouver une version

```bash
git tag                            # lister les versions
git show v0.1.0                    # ce que contient une version
git diff v0.1.0 v0.2.0 --stat      # ce qui a changé entre deux
git checkout v0.1.0                # revenir à l'état d'une version
git checkout dev                   # en repartir
```

### Migrations Prisma

```bash
# En développement
npx prisma migrate dev --name description_courte
npx prisma generate

# Vérifier avant de fusionner
npx prisma migrate status

# En production — via le script de build Vercel
npx prisma migrate deploy
```

Script de build Vercel :

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

**Règles de migration :**

- Une migration ne se modifie jamais après avoir été appliquée en production.
- Une suppression de colonne se fait en deux temps : d'abord cesser de l'écrire et de la lire, déployer, puis supprimer à la version suivante.
- Toute migration touchant `Profil`, `Role` ou `Permission` demande une relecture explicite.
- Sauvegarde vérifiée avant toute migration destructive.

### Retour arrière

| Problème | Action |
| --- | --- |
| Code défectueux, base intacte | Vercel → déploiement précédent → « Promote to Production » |
| Défaut découvert après une version | Corriger sur `dev`, publier `v0.x.y+1`. **Ne jamais réécrire une version marquée.** |
| Migration défectueuse | Restauration PITR Supabase, puis redéploiement du commit précédent |
| Fuite de secret | Rotation immédiate de la clé, redéploiement, journal à examiner |

**Le retour arrière du code ne défait pas une migration.** C'est la raison
de la règle en deux temps ci-dessus.

### Cloudflare

- Mode SSL : `Full (strict)`
- Toujours utiliser HTTPS : activé
- HSTS : activé, `max-age` deux ans, sous-domaines inclus, preload
- WAF : jeu de règles géré activé
- Limitation de débit : 10 requêtes / 10 min / IP sur `/connexion`
- Bot Fight Mode : activé
- Proxy activé sur `app.itamanager.cloud`

### Resend

- Domaine d'envoi : `mail.itamanager.cloud`
- SPF, DKIM et DMARC vérifiés — **DMARC en `p=quarantine` minimum**
- Expéditeur : `notifications@mail.itamanager.cloud`
- Aucune donnée sensible dans le corps des courriels : un lien vers
  l'application, jamais un montant ni un motif médical

### Vérifications avant chaque mise en production

- [ ] `npm run build` passe en local
- [ ] `npx prisma migrate status` sans écart
- [ ] Aucune variable d'environnement manquante
- [ ] La préproduction a été parcourue
- [ ] Aucune donnée de démonstration dans la base de production
- [ ] Sauvegarde récente confirmée

---

## 9. Mise en œuvre avec Claude Code

### Répartition

| Qui | Fait quoi |
| --- | --- |
| **Claude Code** | Écrit le code, lance les commandes, corrige les erreurs |
| **Toi** | Valides le rendu, tranches les questions métier, exécutes la recette |
| **Claude web** | Relit le plan d'exécution, arbitre les écarts, produit les dossiers de module |

### Documents à déposer à la racine du dépôt

Ordre de lecture imposé — le premier fait foi en cas de contradiction.

```
DECISIONS.md              registre des décisions — source de vérité
SECURITE.md               exigences, dont trois bloquantes
PATRONS.md                catalogue des patrons et règles d'affichage
M0-SOCLE.md               ce dossier
GUIDE-ENVIRONNEMENTS.md   branches, base, déploiement
prisma/schema.prisma      modèle de données
app/globals.css           thème — jetons verrouillés
```

Plus les **implémentations de référence** :

```
lib/auth/guard.ts
lib/actions/employe.ts
lib/schemas/employe.ts
lib/workflow/periode-paie.ts
components/ui/referentiel-combobox.tsx
components/ui/referentiel-combobox-multiple.tsx
components/employes/employes-table.tsx
components/employes/employe-dialog.tsx
components/paie/periode-paie-detail.tsx
components/projets/gantt-projet.tsx
components/patterns/liste-repetable.tsx
components/patterns/depot-fichiers.tsx
components/patterns/calendrier-planning.tsx
components/patterns/etats.tsx
```

> Ces fichiers ne font pas partie de M0 : ils sont fournis comme
> **références de style et de structure**. Claude Code ne doit pas les
> intégrer au socle, seulement s'y conformer quand il écrira les modules
> suivants. Seul `lib/auth/guard.ts` est requis dès M0.

### Prompt initial

> Nous démarrons **ITA Manager**, un ERP interne pour ITA SARL, entreprise
> de BTP en Côte d'Ivoire. Le projet part de zéro sur la branche `dev` ;
> `main` porte l'ancien code et sert la production, elle ne doit pas être
> touchée.
>
> Lis, dans cet ordre : `DECISIONS.md`, `SECURITE.md`, `PATRONS.md`,
> `M0-SOCLE.md`, `GUIDE-ENVIRONNEMENTS.md`, `schema.prisma`.
>
> `DECISIONS.md` fait foi en cas de contradiction avec tout autre document.
>
> Nous construisons **M0 — Socle**, périmètre défini en section 2 du
> dossier. **Aucun écran métier** : authentification, permissions, mise en
> page, déploiement. Les entrées de menu des modules non livrés restent
> visibles mais désactivées.
>
> Stack imposée, déjà configurée : Next.js sur Vercel, Supabase pour la
> base et l'authentification, Prisma, shadcn/ui, Tailwind v4, Resend,
> Cloudflare.
>
> **Trois exigences non négociables**, détaillées dans `SECURITE.md` :
>
> 1. Toute Server Action commence par `exigerPermission`. Une Server Action
>    est un point d'entrée HTTP public : être appelée depuis une page
>    protégée ne la protège pas.
> 2. `supabase.auth.getUser()` partout, jamais `getSession()` pour une
>    décision d'accès.
> 3. `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais atteindre le client.
>
> **Quatre règles d'interface**, détaillées dans `PATRONS.md` : aucune
> information ne repose sur la seule couleur (R-01) · optimiser pour la
> lecture, pas la modification (R-02) · l'infobulle enrichit sans jamais
> porter l'essentiel (R-03) · tout sélecteur est un champ à
> autocomplétation (R-04).
>
> Commence par me proposer un **plan d'exécution découpé en étapes
> vérifiables**, sans écrire de code. Pour chaque étape : ce que tu
> produis, ce que je dois vérifier, et les décisions que tu ne dois pas
> prendre seul.
>
> Attends ma validation du plan avant d'écrire quoi que ce soit.

### Découpage attendu

Sept étapes. Si son plan s'en écarte sensiblement, demande-lui pourquoi
avant de valider.

| # | Étape | Ce que tu vérifies |
| --- | --- | --- |
| 0.1 | Amorçage — Next.js, Tailwind v4, shadcn, thème | `npm run dev` démarre, les couleurs sont les bonnes |
| 0.2 | Base — Prisma, migration, trigger `auth.users` | `prisma migrate dev` passe, tables visibles dans Supabase |
| 0.3 | Seed — rôles, permissions, compte Super Admin | Tables `roles` et `permissions` peuplées |
| 0.4 | Authentification — connexion, invitation, TOTP, verrouillage | Connexion, courriel Resend reçu, 2FA imposée aux rôles privilégiés |
| 0.5 | Autorisation — guard, Server Actions, page 403 | **Action hors permission refusée par requête POST directe** |
| 0.6 | Mise en page — barre latérale, états, toasts | Deux rôles voient deux menus différents |
| 0.7 | Déploiement — Vercel, en-têtes, Cloudflare, version `v0.1.0` | L'application répond sur l'URL de la branche `dev` |

### Ce qu'il ne doit pas décider seul

1. **Toute modification du schéma Prisma**, y compris un ajout qui paraît anodin. Une migration appliquée ne se défait pas.
2. **La structure de la barre latérale** — celle de la section 3 a été arrêtée avec le métier.
3. **La matrice de permissions** — section 5.
4. **Le contenu du seed** — M0 ne crée aucun employé réel.
5. **La Build Command Vercel** — la modifier avant la bascule casse la production.
6. **Tout écart aux règles R-01 à R-04.** S'il pense devoir s'en écarter, il le signale et attend.

### Ce que tu lui demandes à chaque étape

- Ce qui a été produit, et où
- Ce que tu dois vérifier toi-même
- Ce qu'il n'a pas pu faire, et pourquoi
- Les écarts constatés entre les documents et la réalité du code

**Reviens me voir avec son plan avant de le valider**, puis à la clôture
du module. C'est là que la relecture a le plus de valeur — pas sur les
écrans répétitifs.

## 10. Points de vigilance

Rappels valables à chaque étape, à ne pas perdre de vue :

1. **Le compte `ADMIN`** est nominatif — Armel Gnakpa, accès technique sans employé lié. Aucun compte administrateur générique.
2. **M0 ne crée aucun employé réel.** Le seul compte est celui de l'administrateur. Les employés arrivent en M2.
3. **Politique de mot de passe** : 12 caractères, vérification contre les fuites connues, conformément à `SECURITE.md`.
4. **La barre latérale de la section 3 fait foi.** Elle a été arrêtée avec le métier, ne pas la réinterpréter.
5. **Toute modification du schéma Prisma** se discute avant d'être appliquée, y compris un ajout qui paraît anodin. Une migration appliquée en production ne se défait pas.
6. **Rien de sensible dans les journaux** : ni RIB, ni numéro CNPS, ni contenu médical. Des identifiants, pas des valeurs.
7. **Aucune information ne repose sur la seule couleur** — règle R-01 de `PATRONS.md`. Un statut se lit par son libellé.
8. **Une infobulle enrichit, elle n'explique jamais l'essentiel** — règle R-03. Il n'y a pas de survol sur tablette.
9. **Une version marquée ne se déplace jamais.** Un défaut découvert après coup donne lieu à une version corrective.
