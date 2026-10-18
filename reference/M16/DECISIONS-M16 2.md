# DECISIONS-M16.md — Décisions applicables à l'Assistanat

> **Extrait de `DECISIONS.md`.** Ce fichier ne remplace pas le registre — il
> rassemble ce qui concerne M16.
>
> **En cas de contradiction, `DECISIONS.md` fait foi.**

---

## Propres à M16

Toutes arrêtées. Détail dans `M16-ASSISTANAT.md`.

| # | Décision | Section |
| --- | --- | --- |
| 1 | **Le demandeur n'a pas de compte.** Il vient voir l'Assistante, qui saisit pour lui. | § 1.1 |
| 2 | **Deux natures de sortie** — station = dépense, cuve = mouvement de stock. | § 1.2 |
| 3 | **Ni plafond, ni validation.** Le contrôle est dans le tableau de consommation. | § 1.3 |
| 4 | **La consommation se calcule entre deux pleins complets**, partiels inclus. | § 2.1 |
| 5 | **Compteur en recul : signalé, jamais refusé.** L'intervalle est exclu du calcul. | § 2.3 |
| 6 | **Deux unités, jamais mélangées** — L/100 km ou L/h. | § 2.4 |
| 7 | **Le réapprovisionnement passe par M14.** | § 3 |
| 8 | **Visiteurs : trois mois de conservation**, purge automatique. Aucune image de pièce d'identité. | § 10.1 |
| 9 | **Courrier : un seul modèle, un champ `sens`.** Compteur de numérotation commun. | § 10.2 |
| 10 | **Statut de traitement à l'arrivée seulement.** | § 10.2 |

---

## Héritées d'autres modules

### A-12 · Données sensibles — **rappel de M2**

Trois niveaux de classification : ordinaire, sensible, particulier.

**Ce que M16 y ajoute** :

| Donnée | Niveau |
| --- | --- |
| Nom d'un visiteur, sa société | **Tiers** — hors périmètre habituel |
| Scan d'un courrier | **Sensible** — peut contenir un avis d'inspection, un courrier d'avocat |
| Montant d'une distribution | Ordinaire |

Le registre des visiteurs contient des données de personnes qui ne sont **ni
employés ni clients**. `SECURITE.md` § 11 et la déclaration ARTCI s'y
appliquent — décision H-03, toujours ouverte.

### D-09 · Tâches planifiées — **rappel transverse**

Vercel Cron, route protégée par `CRON_SECRET`, exécution quotidienne à 6 h
UTC.

**M16 y ajoute deux étapes** :

  — Purge des visites de plus de trois mois
  — Alerte sur les cuves sous leur seuil

### E-01 · Pagination — **rappel transverse**

Pagination **serveur**, 25 lignes, état dans l'URL.

Les registres de courrier grossissent vite — plusieurs milliers de lignes par
an.

### E-04 à E-06 · Notifications — **rappel transverse**

Trois niveaux : toast immédiat, compteur différé revalidé au retour d'onglet,
courriel externe.

**M16 y ajoute** : une cuve sous son seuil notifie l'Assistante par courriel.
Les courriers à traiter restent un compteur, sans courriel — ils se voient en
ouvrant l'application.

---

## Liens avec les autres modules

### M2 — Employés

  — Le **demandeur** d'une distribution se choisit dans la liste des employés
  — La **personne visitée** aussi

Aucune saisie en texte libre sur ces deux champs.

### M13 — Logistique

C'est le lien le plus étroit. **M16 n'a pas sa propre table de stock.**

| Modèle M13 | Usage en M16 |
| --- | --- |
| `Materiel` | Le véhicule ou l'engin servi |
| `ArticleStock` | Le carburant lui-même |
| `MouvementStock` | La sortie de cuve |
| `LieuStockage` | La cuve |
| **`ReleveCompteur`** | **Le kilométrage saisi à la distribution** |

> ⚠️ `SourceReleve` reçoit une valeur de plus : `CARBURANT`.
>
> **Un seul modèle, deux modules qui l'écrivent** — comme `DemandeRessource`
> entre M8 et M13.

### M14 — Achats

Le réapprovisionnement d'une cuve **crée une demande d'achat**, pré-remplie
avec l'article, la quantité manquante et le lieu de livraison.

M16 n'entre rien en stock : c'est la **réception de M13** qui le fait.

### M1 — Organisation

Le service destinataire ou expéditeur d'un courrier se choisit dans la liste
des huit services et quatre directions.

---

## Règles d'interface applicables

Toutes — `PATRONS.md`, `TYPOGRAPHIE.md`, `CHAMPS.md`.

Trois méritent une attention particulière.

**R-01 · Aucune information par la seule couleur.** Un écart de consommation
porte « +49 % » en toutes lettres, jamais un fond rouge seul.

**R-04 · Tout sélecteur est à autocomplétation.** Employés, matériels,
stations, services — tous. Les stations se créent inline.

**R-06 · `tabular-nums`** sur les litres, les montants et les consommations.
Le tableau compare des chiffres colonne par colonne.

---

## Décisions en attente qui touchent M16

| # | Sujet | Effet |
| --- | --- | --- |
| **H-03** | Déclaration ARTCI | **Le registre des visiteurs traite des données de tiers.** À déclarer avant exploitation. |
| G-08 | Offres payantes Vercel et Supabase | Le stockage des scans de courrier |

**Aucune ne bloque le développement.** H-03 bloque la mise en exploitation du
registre des visiteurs, pas sa construction.
