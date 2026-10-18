# DECISIONS-M17.md — Décisions applicables

> **Extrait de `DECISIONS.md`.** Ce fichier ne remplace pas le registre — il
> rassemble ce qui concerne les compétences et taux journaliers.
>
> **En cas de contradiction, `DECISIONS.md` fait foi.**

---

## Propres à ce module

Huit décisions, toutes arrêtées. Détail dans `M17-COMPETENCES.md` § 1.

| # | Décision |
| --- | --- |
| 1.1 | **Un agent, une compétence.** Deux métiers → une compétence composée. |
| 1.2 | **Trois directions, trois gestes.** DT définit, DFC fixe le taux, RH assigne. |
| 1.3 | **Chaque taux est validé par la DFC.** Pas de seuil, pas d'exception. |
| 1.4 | **Une compétence sans taux ne s'assigne pas.** Contrôle bloquant. |
| 1.5 | **Un taux ne se modifie pas, il se remplace.** Date d'effet, historique conservé. |
| 1.6 | **L'affectation est historisée** elle aussi. |
| 1.7 | **Vocabulaire : journalier.** Jamais « intérimaire ». |
| — | **Ce n'est pas la grille salariale de M4.** Deux logiques distinctes. |

---

## Héritées d'autres modules

### A-12 · Trois niveaux de données — **rappel de M2**

| Niveau | Exemple | Accès |
| --- | --- | --- |
| Ordinaire | Nom, poste, service | Selon le rôle |
| **Sensible** | **Taux journalier**, salaire, coût | `employe:donneesSensibles` |
| Particulier | Données de santé, syndicales | Jamais dans l'application |

**Ce que ce module y ajoute** : les montants des taux et le coût journalier
agrégé relèvent du niveau **sensible**.

Un Chef de Chantier voit la compétence d'un agent, **pas son taux**.

Masqué avec un cadenas et le mot « masqué », jamais une cellule vide — R-07.

### A-13 · Un journalier n'ouvre aucun compteur de congés — **rappel de M2**

Un journalier est payé à la journée, via les relevés d'activité. Il n'a ni
solde de congés, ni ancienneté, ni contrat à durée déterminée.

**Ce que ce module y ajoute** : son taux vient de sa compétence. Sans
compétence, il ne peut pas être pointé — donc pas payé.

### A-11 · Un prestataire n'est pas du personnel — **rappel de M2**

ITA ne suit aucun agent de prestataire nominativement.

**Ce que ce module y ajoute** : les compétences ne concernent **que les
journaliers d'ITA**. Un agent de prestataire n'apparaît nulle part ici.

### E-01 · Pagination — **rappel transverse**

Pagination **serveur**, 25 lignes, état dans l'URL.

Les compétences sont peu nombreuses — une dizaine — mais la liste des agents
peut atteindre plusieurs centaines.

### D-06 · Dérogation salariale — **rappel de M4, à ne pas confondre**

M4 permet une dérogation sur le salaire d'un permanent, avec validation du DG.

**Ce mécanisme ne s'applique PAS ici.** Un taux journalier n'a pas de
dérogation individuelle : tous les agents d'une compétence touchent le même
taux.

Si un agent mérite plus, on lui donne une autre compétence.

---

## Règles d'interface applicables

Toutes — `PATRONS.md`, `TYPOGRAPHIE.md`, `CHAMPS.md`.

Trois méritent une attention particulière.

**R-01 · Aucune information par la seule couleur.** Une compétence sans taux
porte le mot « en attente », jamais un fond ambre seul.

**R-04 · Tout sélecteur est à autocomplétation.** Un doublon sur
`libelleNormalise` renvoie l'existant, sans erreur.

**R-07 · Une option indisponible est verrouillée avec sa raison, jamais
masquée.** Une compétence sans taux reste visible dans le sélecteur
d'assignation, avec un cadenas et l'explication.

> Masquer une option laisse l'utilisateur croire qu'elle n'existe pas. La
> verrouiller lui dit ce qu'il faut faire pour la débloquer.

---

## Ce qui bloque en aval

**M7 — la paie chantier** consomme ce référentiel. Elle exige aussi **M6 —
les relevés d'activité**, qui n'est pas construit.

**M17 est autonome.** La Direction Technique définit les métiers, la
Financière fixe les taux, les RH assignent. Le tout est prêt quand M6
arrivera.

---

## Décisions en attente qui touchent ce module

| # | Sujet | Effet |
| --- | --- | --- |
| **Nouvelle** | **Les montants du seed sont des hypothèses** | La Direction Financière doit les confirmer avant toute paie réelle. Le seed porte un bandeau, comme M3. |

**Aucune ne bloque le développement.** Les valeurs se corrigent depuis
l'écran, sans redéploiement — c'est précisément l'intérêt d'un référentiel.
