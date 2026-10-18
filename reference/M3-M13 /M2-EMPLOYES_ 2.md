# M2 — Employés

**Statut** : à ouvrir · **Prérequis** : M0, M1 · **Bloque** : M3, M4, M6, M7
**Version cible** : `v0.3.0` · **Rédigé le** : 29 juillet 2026

> Le module le plus lourd du projet. Une quarantaine de champs, six écrans,
> et trois règles qui n'existent nulle part ailleurs : le dossier allégé du
> journalier, la cascade d'affectation, la dérogation salariale.
>
> Tout le reste en dépend. Une erreur ici se paie en M3 par des congés mal
> routés, et en M7 par des paies fausses.

---

## 1. Objectif

Créer et tenir le dossier des personnes qui travaillent pour ITA, avec leur
affectation, leur contrat, leur rémunération et leurs pièces justificatives.

**Critère de réussite** : la Direction RH peut créer un employé permanent en
moins de trois minutes, un journalier en moins de trente secondes, et voir
d'un coup d'œil quels dossiers sont incomplets.

**Référence visuelle** : `reference/ApercuRH.jsx`.

---

## 2. Périmètre

### Dans le périmètre

- Profil employé — identité, contact, situation familiale
- **Deux dossiers distincts** : permanent complet, journalier allégé
- Affectation en cascade Direction → Service → Poste, avec supérieur
- Contrat — type, dates, échéances, avenants
- Rémunération et **dérogation salariale** au-delà de la grille
- Dépôt de pièces justificatives, avec suivi de complétude
- Archivage d'un employé sortant

### Hors périmètre

Les congés — M3. La grille salariale elle-même — M4. Les affectations de
chantier — M5. Les relevés d'activité — M6.

M2 crée l'employé et son contrat. Il ne calcule rien.

---

## 3. Écrans

| Écran | Route | Permission | Patron |
| --- | --- | --- | --- |
| Liste des employés | `/employes` | `employe:lire` | 3 — liste avec filtres |
| Fiche employé | `/employes/[id]` | `employe:lire` | 4 — onglets |
| Créer un employé | modale | `employe:creer` | 4 — onglets |
| Contrats | `/contrats` | `employe:lire` | 3 |
| Documents | `/documents` | `employe:lire` | 7 — dépôt |
| Dérogations | `/remuneration/derogations` | `employe:donneesSensibles` | 8 — circuit |

### 3.1 · Liste des employés

Pagination **serveur**, 25 lignes, état dans l'URL — décision E-01.

Filtres : recherche libre — nom, prénom, matricule — direction, service,
type de main-d'œuvre, statut du dossier, type de contrat.

Colonnes : employé, matricule, poste, service, type, rémunération,
complétude du dossier, statut.

**La rémunération est masquée** sans `employe:donneesSensibles`. Un cadenas
et une infobulle expliquent pourquoi, plutôt qu'une colonne vide.

### 3.2 · Fiche employé — trois onglets

Une modale à trois onglets, conformément à E-02.

| Onglet | Contenu |
| --- | --- |
| **Identité** | Nom, prénom, matricule, naissance, nationalité, situation familiale, contact, CNPS |
| **Affectation et contrat** | Cascade, supérieur, type de contrat, dates, rémunération, mode de paiement |
| **Documents** | Pièces attendues selon le type, dépôt, suivi de complétude |

### 3.3 · Dérogations salariales

Liste des salaires hors grille, avec le circuit de validation par la
Direction Financière. Visualisation de la grille par niveau, avec un point
par employé — les points hors fourchette ressortent.

---

## 4. Modèle de données

`Employe` · `Affectation` · `Contrat` · `Avenant` · `DocumentEmploye` ·
`DerogationSalariale` · `Nationalite` · `TypeContrat`

### 4.1 · Le champ qui décide de tout

```prisma
enum TypeMainOeuvre {
  PERMANENT
  JOURNALIER
}
```

**Deux valeurs, pas trois.** Le prestataire n'est pas du personnel : ITA ne
suit aucun de ses agents nominativement. C'est un fournisseur, traité par
`Prestataire` et `ContratPrestation` — circuit totalement séparé, décision
A-11.

`Employe.typeMainOeuvre` pilote : les champs obligatoires, la liste des
pièces attendues, l'accès au module Congés, et le mode de rémunération.

### 4.2 · Deux liens de hiérarchie, jamais confondus

| Champ | Porte quoi |
| --- | --- |
| `Poste.superieurPosteId` | Le supérieur **par défaut**, au niveau du poste |
| `Affectation.superieurId` | Le supérieur **réel**, personne par personne |

À la création d'une affectation, le second est **proposé** depuis le premier,
et reste modifiable. Un chef de chantier relève normalement du Directeur
Technique ; on doit pouvoir en désigner un autre pour un agent donné sans
toucher au référentiel.

`superieurId` est **obligatoire**, sauf pour le Directeur Général — décision
B-09.

### 4.3 · Classification des données

Trois niveaux, conformément à `SECURITE.md` § 2.

| Niveau | Champs | Accès |
| --- | --- | --- |
| Ordinaire | Nom, prénom, poste, service, téléphone professionnel | `employe:lire` |
| **Sensible** | Salaire, numéro CNPS, RIB, **numéro Wave**, adresse personnelle | `employe:donneesSensibles` |
| **Particulier** | Pièces médicales | Direction RH seule, consultation journalisée |

**Le numéro Wave est une donnée de paiement, pas un contact.** Il est
distinct du téléphone : les deux peuvent différer. Une erreur de saisie
envoie l'argent à un tiers, sans recours.

→ Double confirmation à la saisie, toute modification journalisée.

---

## 5. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `employe:lire` | Consulter la liste et les fiches | ADMIN, DG, DRH, RH, DFC, DT, CT |
| `employe:creer` | Créer un profil | ADMIN, DRH, RH |
| `employe:modifier` | Modifier un profil | ADMIN, DRH, RH |
| `employe:archiver` | Archiver un sortant | ADMIN, DRH |
| `employe:donneesSensibles` | Voir salaire, CNPS, RIB, Wave | ADMIN, DG, DRH, DFC |
| `derogation:valider` | Statuer sur une dérogation | ADMIN, DFC |
| `posteDirection:affecter` | Affecter un poste réservé | ADMIN seul |

> **L'Assistant RH crée et modifie, mais ne voit pas les rémunérations.**
> C'est le partage qui compte dans une structure où une même personne saisit
> les dossiers sans avoir à connaître les salaires.

---

## 6. Server Actions attendues

Toutes enveloppées dans `actionProtegee`.

| Action | Permission |
| --- | --- |
| `listerEmployes` · `obtenirEmploye` | `employe:lire` |
| `creerEmploye` · `modifierEmploye` | `employe:creer` / `employe:modifier` |
| `archiverEmploye` | `employe:archiver` |
| `creerAffectation` · `cloturerAffectation` | `employe:modifier` |
| `creerContrat` · `creerAvenant` | `employe:modifier` |
| `deposerDocument` · `supprimerDocument` | `employe:modifier` |
| `demanderDerogation` | `employe:modifier` |
| `deciderDerogation` | `derogation:valider` |
| `obtenirUrlDocument` | `employe:lire` + contrôle du type de pièce |

### 6.1 · `obtenirUrlDocument` — le point à ne pas rater

Les buckets sont **privés**. L'accès passe par une URL signée de 5 à 15
minutes, jamais par une URL publique.

Trois contrôles avant de signer :

1. L'appelant détient `employe:lire`
2. Si la pièce est **médicale**, l'appelant est la Direction RH ou l'employé lui-même
3. La consultation d'une pièce médicale est **journalisée**

---

## 7. Règles métier

### 7.1 · Deux dossiers, pas un formulaire à trous

**Journalier — quatre éléments.** Décision A-12.

| Champ | Obligatoire |
| --- | --- |
| Nom, prénom | ✅ |
| Téléphone | ✅ |
| Pièce d'identité | ✅ |
| Numéro Wave | ✅ si payé par Wave |

**Permanent — dossier complet.** Identité, naissance, nationalité, situation
familiale, enfants, CNPS, contact d'urgence, adresse, diplôme.

> **Motif.** Un journalier est recruté pour trois semaines, parfois sur le
> chantier même. Exiger treize champs rendrait la saisie impossible et
> pousserait à tenir un carnet parallèle. Le formulaire s'adapte au type
> **dès sa première question**, il ne masque pas des champs après coup.

### 7.2 · Pièces attendues selon le type

| Journalier — 2 pièces | Permanent — 7 pièces |
| --- | --- |
| Pièce d'identité | Pièce d'identité |
| Photo | Extrait de naissance |
| | Diplôme le plus élevé |
| | Certificat de travail |
| | Attestation CNPS |
| | Visite médicale |
| | Contrat signé |

Un dossier incomplet **n'empêche pas** la création — sinon on perd
l'information. Mais il **bloque** l'édition du contrat et la déclaration
CNPS, et il apparaît en tête de l'accueil RH.

### 7.3 · Cascade d'affectation

Direction → Service → Poste. Chaque niveau filtre le suivant.

**Un poste peut n'avoir aucun service** — quatorze cas, décision A-05. Le
sélecteur affiche alors « rattaché directement à la direction », pas un
champ vide.

Deux contrôles à la validation :

| Contrôle | Message attendu |
| --- | --- |
| Poste à titulaire unique déjà occupé | « Ce poste est occupé par X. Clôturez son affectation d'abord. » |
| Poste réservé au Super Admin | Option **désactivée avec sa raison**, non masquée |

### 7.4 · Contrat et échéances

| Type | Règle |
| --- | --- |
| `CDI` | Pas de date de fin |
| `CDD` | Date de fin obligatoire. **Alerte à 60 et 30 jours.** |
| `INTERIM` | Journalier. Pas de date de fin, pas de compteur de congés. |
| `STAGE` | Date de fin, pas de compteur de congés |

> ⚠️ **Un CDD non renouvelé se transforme en CDI par tacite reconduction.**
> L'alerte n'est pas un confort : c'est ce qui évite une requalification non
> voulue. Elle apparaît à l'accueil RH et part par courriel — E-06.

Une modification de poste ou de salaire donne lieu à un **avenant**, jamais à
une réécriture du contrat. L'historique doit rester lisible.

### 7.5 · Dérogation salariale

Un salaire hors de la fourchette du niveau ne se refuse pas en dur — il
déclenche un circuit.

```
1. Saisie hors grille   → la RH renseigne un motif obligatoire
2. Demande              → DerogationSalariale créée, statut EN_ATTENTE
3. Décision             → Direction Financière valide ou refuse
4. Effet                → validée, le salaire entre dans les exports de paie
```

**Tant que la décision n'est pas rendue, l'employé est exclu des exports de
paie.** C'est le point important : sans ce verrou, un salaire hors grille
non validé partirait en paie sans que personne ne l'ait autorisé.

Le motif doit être **substantiel** — « recrutement en tension, seul candidat
titulaire du CACES 4 » — non « décision de la direction ». Minimum 40
caractères.

### 7.6 · Matricule

Format `ITA-AAAA-NNNN`. Généré par le serveur, jamais saisi. `AAAA` est
l'année d'embauche, `NNNN` un compteur continu.

Il reste attaché à la personne, y compris après archivage. Un employé
réembauché conserve son matricule d'origine.

### 7.7 · Unicité

| Champ | Contrainte |
| --- | --- |
| `matricule` | Unique, généré |
| `numeroCnps` | Unique parmi les permanents non archivés |
| Nom + prénom + date de naissance | **Avertissement**, non blocage |

Le troisième contrôle est important en contexte ivoirien : les homonymes
sont fréquents. Un avertissement invite à vérifier, sans empêcher la saisie.

### 7.8 · Archivage, jamais suppression

Un employé sortant est archivé, avec sa date et son motif — démission,
licenciement, fin de contrat, décès.

Ses affectations sont clôturées, son accès applicatif désactivé, son
matricule conservé. Aucune donnée n'est supprimée : les paies antérieures
doivent rester justifiables.

**Durée de conservation** : cinq ans après la sortie pour les données
sensibles, dix ans pour les éléments de paie — voir `SECURITE.md` § 11.

### 7.9 · Journalier et congés

**Un journalier n'ouvre aucun compteur de congés.** Décision A-13.

Il est exclu du module M3. Un jour non pointé est un jour non payé — c'est la
seule règle d'absence qui s'applique à lui.

Le formulaire ne doit pas afficher de champ de dotation pour un journalier :
mieux vaut son absence qu'un zéro qui laisserait croire à un compteur vide.

---

## 8. Critères de recette

### Création — permanent

- [ ] Créer un employé permanent avec tous les champs obligatoires
- [ ] Le matricule est généré au format `ITA-2026-NNNN`
- [ ] Un champ obligatoire manquant bloque la soumission, avec le message sur le champ concerné
- [ ] Le formulaire à onglets conserve les valeurs en changeant d'onglet
- [ ] **Le brouillon automatique se déclenche 2 s après la frappe** — E-03
- [ ] Fermer puis rouvrir la modale restaure le brouillon

### Création — journalier

- [ ] Le formulaire ne demande que quatre éléments
- [ ] Aucun champ de dotation de congés n'apparaît
- [ ] Le numéro Wave exige une **double confirmation**
- [ ] Le numéro Wave est distinct du téléphone de contact
- [ ] Créer un journalier prend moins de trente secondes

### Cascade d'affectation

- [ ] Choisir une direction filtre les services
- [ ] Choisir un service filtre les postes
- [ ] Un poste sans service affiche « rattaché directement à la direction »
- [ ] Le supérieur est **proposé automatiquement** depuis `superieurPosteId`
- [ ] Le supérieur proposé reste modifiable
- [ ] **Affecter un poste à titulaire unique déjà occupé est refusé**, avec le nom de l'occupant
- [ ] Un poste réservé apparaît **désactivé avec sa raison**, non masqué

### Documents

- [ ] Les pièces attendues diffèrent entre permanent et journalier
- [ ] La barre de complétude reflète le nombre réel de pièces
- [ ] Un dossier incomplet apparaît à l'accueil RH
- [ ] **L'URL de consultation est signée et expire**
- [ ] Une URL expirée renvoie une erreur, pas le fichier
- [ ] **La consultation d'une pièce médicale est journalisée**
- [ ] Un rôle sans habilitation ne peut pas ouvrir une pièce médicale

### Rémunération et dérogation

- [ ] Un rôle sans `employe:donneesSensibles` ne voit ni salaire, ni CNPS, ni Wave
- [ ] **Appeler `obtenirEmploye` par requête POST directe, sans cette permission, ne renvoie pas les champs sensibles**
- [ ] Saisir un salaire hors grille déclenche la demande de dérogation
- [ ] Un motif de moins de 40 caractères est refusé
- [ ] L'employé est **exclu des exports de paie** tant que la dérogation est en attente
- [ ] La Direction Financière peut valider ou refuser
- [ ] Un refus exige un commentaire
- [ ] La décision apparaît au journal d'audit

### Contrat

- [ ] Un CDD sans date de fin est refusé
- [ ] Une alerte apparaît à 60 jours de l'échéance
- [ ] Une alerte renforcée apparaît à 30 jours
- [ ] Un courriel de rappel part à 30 jours
- [ ] Une modification de poste crée un avenant, pas une réécriture

### Unicité et archivage

- [ ] Un numéro CNPS en doublon est refusé
- [ ] Un homonyme déclenche un **avertissement**, non un blocage
- [ ] Archiver un employé clôture ses affectations
- [ ] Archiver désactive son accès applicatif **immédiatement**
- [ ] Un employé archivé n'apparaît plus dans les sélecteurs
- [ ] Ses données restent lisibles dans l'historique

### Interface

- [ ] Pagination serveur, 25 lignes, état dans l'URL
- [ ] La recherche ignore les accents
- [ ] Tous les sélecteurs sont des champs à autocomplétation — R-04
- [ ] Créer un service depuis le formulaire fonctionne sans le quitter
- [ ] Un doublon de libellé renvoie l'entité existante
- [ ] Aucun statut lisible à la seule couleur — R-01
- [ ] Chaque icône seule porte un `aria-label` — R-03

### Build et vérification

- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `npm run build` réussit
- [ ] `npm run verify` passe au vert
- [ ] Un script `verify-m2.ts` contrôle les invariants du module

---

## 9. Points de vigilance

1. **Ne pas faire un formulaire unique avec des champs masqués.** Le type de main-d'œuvre est la **première** question, et il change la nature du formulaire.
2. **Le numéro Wave n'est pas un téléphone.** Deux champs distincts, double confirmation, modification journalisée.
3. **Une dérogation non validée bloque la paie.** Sans ce verrou, le circuit ne sert à rien.
4. **`superieurId` obligatoire sauf pour le Directeur Général.** Sans lui, une demande de congé ne part nulle part.
5. **Buckets privés, URL signées courtes.** Prisma contourne les RLS ; l'autorisation est applicative. Le stockage est le seul endroit où les RLS s'appliquent.
6. **Aucune donnée sensible au journal.** Des identifiants, jamais des valeurs — ni salaire, ni CNPS, ni numéro Wave.
7. **Ce module conditionne M3 à M7.** Une affectation fausse produit des congés mal routés et des paies fausses.

---

## 10. Décisions à trancher avant d'ouvrir

| # | Sujet | Bloque |
| --- | --- | --- |
| 1 | **Titulaires réels des rôles** DRH, RH, DFC, DT, CT, CC, CE — nom, prénom, adresse électronique (G-01) | les tests de circuit |
| 2 | Le taux journalier d'un permanent : salaire ÷ 26 ? (G-06) | le calcul de M7 |
| 3 | Liste des nationalités à charger au référentiel | mineur |
| 4 | Durée de conservation après sortie : 5 ans confirmés ? | la politique d'archivage |

---

## 11. Balises d'exécution — défauts constatés sur M0 et M1

> Dix-neuf défauts ont été relevés pendant M0 et M1. Aucun n'était une faute
> de conception : tous venaient de la **manière de travailler**.
>
> Cette section les liste avec leur contre-règle. Elle n'est pas indicative —
> chaque ligne a coûté du temps réel.

### 11.1 · Ne jamais écrire de mémoire une donnée qui figure dans un document

**Constaté** : la table de hiérarchie des postes a été réécrite de mémoire.
Quatre erreurs, dont une — `RELAIS_QHSE` — détectée seulement par un script
de comparaison.

**Règle** : toute table de référence se lit **ligne à ligne** dans son
document source. Quand tu l'écris dans le code, cite le fichier et la section
en commentaire.

Concerné pour M2 : les pièces attendues par type, la matrice des permissions,
les niveaux de la grille, les types de contrat, la classification des données.

### 11.2 · Ne jamais inventer une permission

**Constaté** : `organisation:modifier`, déclarée localement dans un fichier
d'actions, absente du catalogue. Elle fusionnait trois permissions distinctes
— dont deux réservées au Super Admin. Résultat : n'importe quel détenteur
pouvait créer une direction.

**Règle** : `lib/auth/guard.ts` est la **seule** source. Aucun autre fichier
ne définit de permission. Le type `CodePermission` doit rendre l'invention
impossible à la compilation.

Vérification : `grep -rn "as const" lib/actions/` ne doit rien renvoyer qui
ressemble à une permission.

### 11.3 · Prouver, jamais affirmer

**Constaté à trois reprises** :

- « 24/24 tests passés » — sur une lecture du fichier de seed, pas de la base
- « R-04 respectée » — sans avoir ouvert un seul sélecteur
- « superieurPosteId présent et renseigné » — non vérifié

**Règle** : une affirmation de conformité s'accompagne de la **sortie brute**
de la commande qui l'établit. Pas d'interprétation, pas de résumé.

### 11.4 · Un test non exécuté n'existe pas

**Constaté** : `test-protection.ts` écrit, commité, annoncé — jamais lancé.
Quatre messages d'affilée.

**Règle** : on ne commite pas un script sans avoir montré sa sortie. Et un
test doit avoir été **vu échouer** au moins une fois : casse volontairement
une valeur, montre le code de sortie à 1, remets la bonne valeur.

Un test qu'on n'a jamais vu échouer n'est pas un test.

### 11.5 · Ne pas contourner un obstacle, le signaler

**Constaté** : le test HTTP échouant, tentative de le remplacer par un import
direct de la Server Action. Un import direct est un appel de fonction — il ne
teste **rien** du routage HTTP, qui est précisément la surface à protéger.

**Règle** : un obstacle se signale. Un contournement qui vide un contrôle de
son sens est plus grave que l'obstacle.

### 11.6 · `npm run build` fait partie du travail

**Constaté** : le build n'avait jamais été lancé, ni sur M0 ni sur M1. Il a
révélé d'un coup une faute de frappe dans un fichier livré — `const horsP DF`
— et un composant `form.tsx` absent alors que quatre fichiers l'importaient.

Cause : `npm run dev` compile page par page, à la demande. Un écran jamais
ouvert n'est jamais compilé.

**Règle** : un module n'est pas fini si `npx tsc --noEmit` et `npm run build`
ne passent pas. C'est un critère de recette, pas une formalité.

### 11.7 · Installer les composants avant de les importer

**Constaté** : `alert-dialog`, `card`, `form` importés sans être installés.
Découverts un par un, à l'exécution.

**Règle** : avant d'écrire un écran, vérifier les composants requis.

```bash
grep -rho "@/components/ui/[a-z-]*" app lib components | sort -u
ls components/ui/
```

### 11.8 · Ne pas mélanger client applicatif et client de script

**Constaté** : `prismaDirect` placé dans `lib/db/prisma.ts`. Une Server
Action l'important par mégarde contournerait pgBouncer et épuiserait les
connexions en production.

**Règle** : le client direct vit dans `scripts/lib/`. Vérification :

```bash
grep -rn "prismaDirect" app lib --include="*.ts" --include="*.tsx"
```

Ne doit rien renvoyer.

### 11.9 · Le seed doit nettoyer, pas seulement ajouter

**Constaté** : le seed n'utilisant que `upsert`, deux permissions retirées du
catalogue subsistaient en base — attribuées à des rôles, sans qu'aucune
action ne les lise. Un droit fantôme est une faille en sommeil.

**Règle** : après avoir upserté, supprimer ce qui n'est plus au catalogue, et
**journaliser** la suppression. Ne jamais toucher aux profils ni aux comptes.

### 11.10 · Le seed passe par `DIRECT_URL`

**Constaté** : seed expiré après deux minutes, base laissée dans un état
partiel. Cause : `connection_limit=1` sur la connexion mutualisée, et une
requête par poste en série.

**Règle** : le seed et les scripts utilisent la connexion directe, port 5432.
Résoudre les relations en **deux passes** — créer, puis lier en une
transaction — plutôt qu'en requêtes imbriquées.

### 11.11 · Pousser après chaque étape

**Constaté** : `git push` omis à répétition. Une première version de M0 —
vingt-quatre heures de travail — a été perdue faute d'avoir été poussée.

**Règle** : `git add -A && git commit && git push origin dev` à la fin de
chaque étape validée. Même si le code est imparfait.

### 11.12 · Ne pas inventer de travail

**Constaté** : demande de vérifier un écran déjà conforme, suivie d'une
« amélioration » cosmétique non demandée d'un autre écran.

**Règle** : si un point est déjà conforme, le dire et passer au suivant. Le
plan validé fixe le périmètre.

### 11.13 · Suivre le plan validé, dans l'ordre

**Constaté** : les étapes 4, 5 et 6 d'un plan validé sautées pour aller
directement aux finitions visuelles. Trois écrans de M0 — page 403, journal
d'audit, administration des utilisateurs — sont restés absents alors que le
module était annoncé complet.

**Règle** : une étape s'ouvre quand la précédente est vérifiée. Un changement
d'ordre se demande, il ne se décide pas.

### 11.14 · Le symptôme observé par l'humain est un fait

**Constaté** : « le serveur démarre, aucune erreur » alors qu'une erreur 500
s'affichait à l'écran. « La page redirige vers `/connexion` » alors qu'une
page de test s'affichait en session ouverte.

**Règle** : quand un symptôme est décrit, il est vrai. Si le diagnostic le
contredit, c'est le diagnostic qui est faux.

### 11.15 · Ne pas laisser de résidu de développement

**Constaté** : la page racine contenait encore la page de test des jetons de
couleur de l'étape 0.1, hors de la mise en page applicative.

**Règle** : tout écran provisoire est remplacé avant la clôture de l'étape.
Aucune page hors du groupe `(app)` sauf les écrans publics d'authentification.

---

## 12. Protocole d'exécution de M2

### Avant d'écrire une ligne

- [ ] Lire `DECISIONS.md` sections A et E, puis ce dossier en entier
- [ ] Lire `reference/ApercuRH.jsx` — référence visuelle, **pas** du code à intégrer
- [ ] `npm run verify` passe au vert avant de commencer
- [ ] Proposer un plan découpé, attendre validation

### À chaque étape

- [ ] Vérifier les composants shadcn requis **avant** d'écrire l'écran
- [ ] Écrire le code
- [ ] `npx tsc --noEmit` puis `npm run build`
- [ ] Montrer la **sortie brute** de ce qui établit la conformité
- [ ] `git add -A && git commit && git push origin dev`
- [ ] Attendre la validation avant l'étape suivante

### Avant de clore M2

- [ ] Les 68 critères de la section 8, un par un, avec preuve
- [ ] `scripts/verify-m2.ts` écrit, exécuté, **vu échouer** une fois
- [ ] Ajouté à `verify-all.ts`
- [ ] Le test de protection passe sur au moins une action de M2
- [ ] Aucun écran provisoire ne subsiste
- [ ] Version `v0.3.0` marquée et poussée

### Ce qui ne se décide pas seul

1. Toute modification du schéma Prisma
2. La matrice de permissions
3. La liste des pièces attendues par type
4. Le seuil de déclenchement d'une dérogation
5. La classification d'une donnée en sensible
6. Tout écart aux règles R-01 à R-04
7. Tout écart à l'ordre du plan validé
