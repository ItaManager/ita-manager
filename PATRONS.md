# Catalogue des patrons — ITA Manager

> Neuf implémentations de référence. Chaque écran de l'application se
> compose de ces patrons.
>
> **Règle de contribution** : si un écran ressemble à l'un d'eux, il doit
> lui ressembler à l'identique — espacements, densité, formulation des
> libellés et des textes d'aide. On ne réinvente pas un patron, on l'étend.

---

## Les neuf patrons

| # | Patron | Fichier | Ce qu'il fixe |
| --- | --- | --- | --- |
| 1 | Garde d'autorisation | `lib/auth/guard.ts` | Session, permissions, journal, enveloppe d'action |
| 2 | Server Action | `lib/actions/employe.ts` | Validation, règles, transaction, audit, retour typé |
| 3 | Liste avec filtres | `components/employes/employes-table.tsx` | Recherche, filtres, colonnes, actions de ligne |
| 4 | Formulaire à onglets | `components/employes/employe-dialog.tsx` | Cascade, validation, dérogation, blocage |
| 5 | Combobox créable — **simple** | `components/ui/referentiel-combobox.tsx` | Recherche sans accent, création inline, verrouillage |
| 5 bis | Combobox créable — **multiple** | `components/ui/referentiel-combobox-multiple.tsx` | Pastilles, bornes, valeurs imposées non retirables |
| 6 | Liste répétable | `components/patterns/liste-repetable.tsx` | `useFieldArray`, confirmation, bornes |
| 7 | Dépôt de fichiers | `components/patterns/depot-fichiers.tsx` | Storage privé, contrôles, documents libres |
| 8 | Circuit de validation | `lib/workflow/periode-paie.ts` + `components/paie/periode-paie-detail.tsx` | Machine à états, fil de progression, historique |
| 9 | Visualisations | `components/projets/gantt-projet.tsx`<br>`components/patterns/calendrier-planning.tsx` | Échelle continue · grille discrète |

Plus un utilitaire transverse : `components/patterns/etats.tsx` — états
vide, chargement et erreur, à utiliser sur **tous** les écrans.

---

## Correspondance écran par écran

### M1 — Organisation

| Écran | Patrons |
| --- | --- |
| Services & Équipes | 3 (trois colonnes) · 5 · 2 |
| Organigramme | 9 (arborescence) · utilitaire états |

### M2 — Employés

| Écran | Patrons |
| --- | --- |
| Liste des employés | 3 · utilitaire états |
| Création et modification | 4 · 5 · 6 · 7 · 2 |
| Fiche détail | 3 (sections) · 7 en lecture seule |
| Contrats | 3 · 2 |

### M3 — Congés

| Écran | Patrons |
| --- | --- |
| Liste des demandes | 3 |
| Détail et décision | 8 · 7 en lecture seule |
| Nouvelle demande | 4 · 5 · 7 |
| Règles de congés | 2 · utilitaire états |

### M4 — Rémunération

| Écran | Patrons |
| --- | --- |
| Grille salariale | 3 · 2 · 8 (révision) |
| Dérogations | 8 |

### M5 — Projets

| Écran | Patrons |
| --- | --- |
| Liste des projets | 3 |
| Planning et Gantt | 9 · 6 (tâches) |
| Jalons | 8 |

### M6 — Relevés d'activité

| Écran | Patrons |
| --- | --- |
| Saisie du relevé | 4 · 6 (pointage, travaux, matériaux) |
| Visa | 8 |

### M7 — Paie chantier

| Écran | Patrons |
| --- | --- |
| Cycles par chantier | 3 · 2 |
| Période de paie | 8 — référence directe |

### M8 — Ressources

| Écran | Patrons |
| --- | --- |
| Demandes RH et logistiques | 3 · 4 · 8 |
| Parc matériel | 3 · 2 |

### M9 — Appels d'offres

| Écran | Patrons |
| --- | --- |
| Liste et suivi | 3 |
| Dossier | 4 · 6 (pièces) · 7 · 8 |

### M10 — Pilotage

| Écran | Patrons |
| --- | --- |
| Tableau de bord | *à produire — voir ci-dessous* |
| Notifications | 3 |

---

## Conventions arrêtées

Les quatre questions laissées ouvertes ont été tranchées. Elles sont
détaillées en section F de `DECISIONS.md`.

| Convention | Choix | Effet sur les patrons |
| --- | --- | --- |
| Pagination | **Serveur**, 25 lignes, état dans l'URL | ⚠️ Patron 3 à réviser |
| Création et modification | **Modale** jusqu'à 3 onglets | Conforme au patron 4 |
| Brouillons | **Automatiques**, 2 s après la frappe | ⚠️ Patrons 4 et 6 à compléter |
| Notifications | **Trois niveaux** — toast, compteurs, courriel | Aucun patron nouveau |

Les notifications ne demandent pas de patron dédié : le toast existe déjà
dans les patrons 2 et 8, les compteurs sont un calcul serveur dans la mise
en page, et le courriel est une Server Action qui suit le patron 2.

---

## Révisions à opérer avant M2

Deux patrons déjà produits ne respectent pas ces conventions. Ce n'est pas
un défaut de conception : les conventions ont été arrêtées après eux.

### Patron 3 — Liste avec filtres

Le fichier `employes-table.tsx` filtre **en mémoire**, sur un tableau complet
reçu en propriété. Incompatible avec la pagination serveur : un filtre en
mémoire sur une page paginée ne filtrerait que la page affichée, et
renverrait un résultat faux sans le signaler.

À reprendre :

- Recherche, filtres, tri et page pilotés par `searchParams`
- Le composant reçoit une page de résultats et un total, plus le tableau complet
- Recherche différée de 300 ms avant de modifier l'URL
- Navigation par `router.replace` avec `scroll: false`, pour ne pas empiler l'historique à chaque frappe
- Composant de pagination : première, précédente, suivante, dernière, plus le choix de la taille

### Patrons 4 et 6 — Formulaire et liste répétable

L'enregistrement automatique du brouillon manque. À ajouter :

- Un hook `useBrouillon(entite, entiteId)` qui observe le formulaire, temporise 2 secondes et appelle une Server Action
- Un indicateur discret « Enregistré à 14 h 32 » près du titre
- À l'ouverture, si un brouillon existe : proposer de le reprendre ou de repartir de zéro
- Un schéma zod partiel pour le brouillon, distinct du schéma de soumission

---

## Un dixième patron, à produire en M6

**Saisie tablette hors ligne** — le relevé d'activité de chantier.

C'est le seul écran de l'application saisi hors du bureau : tablette, jusqu'à
vingt agents à pointer, réseau faible. Voir décision E-07.

Il ne réutilise ni le patron 4, conçu pour la modale de bureau, ni le patron
6 tel quel. Trois spécificités :

- Cibles tactiles de 44 px, aucun survol porteur d'information, deux colonnes maximum
- Pointage **par exception** : tous présents par défaut, seuls les écarts se saisissent
- Brouillon local `IndexedDB` d'abord, synchronisation en arrière-plan, indicateur d'état permanent

Produit en M6, quand l'écran sera construit. L'anticiper maintenant figerait
des choix que seul l'usage réel pourra valider.

---

## Ce qui n'a pas de patron, et pourquoi

Trois écrans n'en reçoivent pas. Ce n'est pas un oubli.

**Le tableau de bord.** Des cartes d'indicateurs cliquables et des listes
d'alerte. Chacune est une variation triviale des patrons 3 et 9. Un patron
figerait un choix d'indicateurs qui doit rester ouvert : on ne saura ce que
la direction regarde vraiment qu'après quelques semaines d'usage.

**Les écrans de paramétrage.** Ce sont des formulaires simples, couverts par
le patron 4 sans sa cascade. Rien de structurant.

**Le journal d'audit.** C'est le patron 3, mais en pagination par curseur —
les événements s'ajoutent en continu, et le décalage y produirait des
doublons ou des sauts. Traité en M0, où le journal est livré.

---

## Règle de saisie · R-04 · Tout sélecteur est un champ à autocomplétation

**RÈGLE ABSOLUE** : Tous les champs de sélection doivent être des champs d'autocomplétation (Combobox).
Aucune liste déroulante fermée (`<select>`) sur un référentiel. Le patron 5, simple ou
multiple, s'emploie partout, sans exception.

**Trois raisons.** Un bordereau d'articles compte plusieurs centaines de
lignes, une liste déroulante y est inutilisable. La recherche doit ignorer
les accents, personne ne les saisit. Et un besoin bloqué faute de valeur
référencée pousse à contourner le circuit — c'est ainsi qu'on obtient des
opérations hors système.

### Où la création est autorisée, où elle ne l'est pas

| Autorisée | Interdite |
| --- | --- |
| Service, poste | Direction — réservée au Super Admin |
| Compétence, organisme de formation | Employé — doit être enregistré |
| Nationalité, unité de mesure | Chantier — le référentiel projet fait foi |
| Article, fournisseur, lieu de livraison | Type de contrat, mode de paiement — listes fermées pilotant la paie |
| Maître d'ouvrage | Matériel — doit exister au parc |

**Critère de partage** : la création est interdite là où le référentiel est
**structurant** — s'il pilote un calcul, une déclaration légale, ou un
rattachement organisationnel.

### Contrôle d'unicité — le point qui saute toujours

Le composant ne peut pas l'assurer seul : deux personnes peuvent créer
« Service Topographie » au même instant.

**Règle serveur** : la création renvoie **l'entité existante** si le libellé
normalisé est déjà pris, au lieu d'une erreur. Le client la sélectionne
comme si elle venait d'être créée.

Sans cela, le référentiel se remplit de « Topographie », « topographie » et
« Service topographie ».

### Valeurs imposées, dans la variante multiple

Certaines valeurs sont exigées par une règle métier : au-delà d'un montant,
la Direction Financière est validatrice obligatoire. Elles s'affichent avec
un cadenas, **ajoutables mais non retirables**.

C'est ce qui permet une souplesse encadrée plutôt qu'une liberté totale.

---

## Règles d'affichage transverses

Trois règles valables sur **tous** les écrans. Elles viennent de défauts
constatés sur l'aperçu de M0.

### R-01 · Aucune information ne repose sur la seule couleur

Un statut se lit par son **libellé**, pas par sa teinte. Une pastille verte
sans texte ne dit rien à qui imprime l'écran, le copie en texte brut, ou
distingue mal les couleurs.

Constaté sur l'aperçu M0 : une colonne de neuf bascules par ligne, où seul
le vert distinguait les rôles attribués des rôles disponibles. Copiée en
texte, la liste devenait illisible.

**Correctif appliqué** : n'afficher que les valeurs actives, en toutes
lettres, et déporter la modification derrière un bouton.

### R-02 · Optimiser pour la lecture, pas pour la modification

On lit un écran cent fois plus souvent qu'on ne le modifie. Exposer tous les
contrôles d'édition en permanence encombre la lecture au bénéfice d'une
action rare.

**Forme retenue** : afficher les valeurs, un bouton « Modifier » ouvre le
sélecteur. Un clic de plus pour l'action rare, une lecture immédiate pour
l'usage courant.

### R-03 · L'infobulle enrichit, elle n'explique jamais l'essentiel

Toute action, tout statut et tout marqueur porte une infobulle au survol —
mais son contenu doit rester **complémentaire**.

| Autorisé dans l'infobulle | Interdit |
| --- | --- |
| La conséquence d'une action | Le nom de l'action |
| Une précision de règle métier | Le sens d'une icône seule |
| La raison d'un verrouillage | Une information indispensable à la décision |

**Motif** : il n'y a pas de survol sur tablette. Une action dont le sens
n'existe que dans l'infobulle est inaccessible au doigt — voir décision
E-07 pour l'écran de chantier.

Toute icône seule porte donc aussi un `aria-label`, pour les lecteurs
d'écran et la navigation au clavier.

---

## Erreurs à ne pas répéter

Elles viennent toutes du projet précédent.

1. **Un tableau dans un `useState` pour une liste répétable.** La copie superficielle mute l'objet d'origine. Utiliser `useFieldArray`.
2. **L'index comme clé de rendu.** Supprimer une ligne du milieu décale les valeurs saisies. Utiliser `field.id`.
3. **Une Server Action sans `exigerPermission`.** C'est un point d'entrée public.
4. **Des couleurs en dur.** Tout passe par les jetons de `globals.css`.
5. **Des données de démonstration dispersées.** Un seul bloc en tête de fichier, supprimable d'un coup.
6. **Un état vide sans explication.** Dire pourquoi c'est vide et quoi faire.
7. **Une valeur sensible dans le journal.** Des identifiants, jamais de RIB ni de numéro CNPS.
8. **Un statut lisible seulement à la couleur.** Voir R-01.
9. **Une icône sans `aria-label`.** Voir R-03.
10. **Une liste déroulante fermée sur un référentiel.** Voir R-04.
11. **Une création inline qui renvoie une erreur sur doublon** au lieu de l'entité existante.
