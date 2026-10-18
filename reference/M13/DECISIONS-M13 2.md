# DECISIONS-M13.md — Décisions applicables à la Logistique

> **Extrait de `DECISIONS.md`.** Ce fichier ne remplace pas le registre — il
> rassemble ce qui concerne M13 pour éviter d'en lire cinquante entrées.
>
> **En cas de contradiction, `DECISIONS.md` fait foi.**

---

## Propres à M13 — dans `M13-LOGISTIQUE.md` § 1

Sept décisions, toutes arrêtées. Rappelées ici en une ligne chacune.

| # | Décision |
| --- | --- |
| 1.1 | **Trois champs de code** — `codeIta` référence, `numeroParcAncien`, `codeLong`. Saisissable à la reprise, généré à la création. |
| 1.2 | **Petit matériel individuel** — chaque objet porte son code. `QUANTITES` sert aux lots indissociables. |
| 1.3 | **Compteurs relevés par l'inspection** — deux relevés par mission. M6 affine, il n'est pas requis. |
| 1.4 | **Délais d'alerte paramétrables** — valeurs par défaut au seed. |
| 1.5 | **Inspections sur véhicules, engins, conteneurs** — pas le petit matériel. |
| 1.6 | **Deux natures de demande de transport**, un formulaire. Le CIA est un projet. |
| 1.7 | **L'étape 6 de M14 est portée par M13** — le Gestionnaire de stocks constate, la DFC facture. |

---

## B-08 bis · Arbitrage des demandes de ressources — **Arrêtée**

Corrige **B-08**, écrite avant la création du poste de Chef de Service
Logistique en A-06.

| Étape | Qui |
| --- | --- |
| Demande | Chef de chantier, ou tout employé — **écran M8, groupe Technique** |
| Visa hiérarchique | Supérieur du demandeur — B-01 |
| **Arbitrage** | **Chef de Service Logistique** — écran M13 |
| **Exécution** | **Chef du Garage** — mise à disposition |

**Le premier arbitre, le second exécute.**

### M8 reste dans le groupe Technique

**Le demandeur va chez lui.** Un chef de chantier a besoin d'une bétonnière,
il ouvre Technique › Ressources.

**M13 reçoit la demande.** Le Service Logistique arbitre et affecte.

**Une seule table `DemandeRessource`, deux écrans.** Ne pas la dupliquer —
une demande vue de deux endroits reste une demande.

Même schéma que M14 : le demandeur est chez lui, l'instructeur est chez lui.

---

## Héritées d'autres modules

### A-08 bis · Deux chaînes distinctes — **rappel de M1**

| Chaîne | Portée | Source |
| --- | --- | --- |
| **Hiérarchique** | Congés, demandes | `Affectation.superieurId` |
| **Fonctionnelle** | Visa des relevés, planning | `AffectationChantier` |

**Ce que M13 y ajoute** : une demande de transport suit la chaîne
**hiérarchique** — visa du supérieur du demandeur, puis visa logistique.

Elle ne passe **pas** par le conducteur de travaux.

### B-01 · Supérieur direct puis service compétent — **rappel transverse**

Toute demande passe par le N+1 direct, puis le service compétent.

Pour une demande de transport : visa du demandeur, puis visa logistique. Le
formulaire `EN-GEL-08` porte les deux cases.

### B-02 · Un seul niveau hiérarchique — **rappel transverse**

Pas de cascade. Le supérieur direct suffit.

### B-06 · Relances par courriel selon l'urgence — **rappel transverse**

| Urgence | Délai |
| --- | --- |
| Critique | 24 h |
| Haute | 3 jours |
| Normale | 5 jours |

**Ce que M13 y ajoute** : une pièce administrative **périmée** est critique —
elle immobilise un véhicule.

### D-09 · Tâches planifiées — **rappel transverse**

Vercel Cron, route protégée par `CRON_SECRET`, exécution quotidienne à 6 h
UTC.

**M13 y ajoute une étape** : le contrôle des échéances de pièces
administratives et de permis.

### E-01 · Pagination — **rappel transverse**

Pagination **serveur**, 25 lignes, état dans l'URL.

Le registre du matériel compte environ 3 000 lignes — la pagination serveur
n'est pas optionnelle.

---

## Règles d'interface applicables

Toutes — `PATRONS.md`, `TYPOGRAPHIE.md`, `CHAMPS.md`.

Quatre méritent une attention particulière sur ce module.

**R-01 · Aucune information par la seule couleur.** Une échéance périmée
porte « périmé depuis 273 jours », jamais un simple fond rouge. Sur un écran
d'échéances, c'est la règle la plus exposée.

**R-02 · Optimiser pour la lecture.** Le Chef de Service Logistique consulte
bien plus qu'il ne saisit.

**R-04 · Tout sélecteur est un champ à autocomplétation.** Marques, modèles,
lieux, types de pièce, points d'inspection — tous créables inline.

**R-06 · Jetons typographiques.** Le tableau des pièces administratives est
dense — quatorze colonnes possibles. `tabular-nums` sur les montants,
colonne figée sur le matériel.

---

## Décisions en attente qui touchent M13

| # | Sujet | Effet |
| --- | --- | --- |
| G-05 | Organigramme officiel corrigé et signé | Aucun sur M13 |
| G-08 | Offres payantes Vercel et Supabase | Le stockage des scans de pièces |

**Aucune ne bloque.** Le module peut être construit et mis en service.
