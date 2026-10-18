# PATRONS-M16.md — Patrons applicables à l'Assistanat

> **Extrait de `PATRONS.md`.** Les neuf écrans du module réutilisent six
> patrons existants. Aucun patron nouveau à produire.
>
> `TYPOGRAPHIE.md` et `CHAMPS.md` s'appliquent en entier.

---

## Correspondance écran par patron

| Écran | Patron | Fichier de référence |
| --- | --- | --- |
| Nouvelle distribution | **4 bis — modale à étapes** | `components/patterns/modale-etapes.tsx` |
| Distributions | 3 — liste avec filtres | — |
| **Consommation** | 3 — **tableau dense** | `reference/ApercuTableauSuiviAchats.jsx` |
| Cuves et stocks | 3 — liste avec indicateurs | — |
| Visiteurs | **2 — liste vivante** | ci-dessous |
| Historique des visites | 3 — liste avec filtres | — |
| Courrier arrivée · départ | 3 — liste avec filtres | — |
| Courrier à traiter | 3 + 8 — circuit | — |
| Stations-service | 6 — référentiel | — |

---

## R-04 · Tout sélecteur est à autocomplétation

Cinq champs du module en dépendent.

| Champ | Source | Création inline |
| --- | --- | --- |
| Demandeur | `Employe` — M2 | ❌ non |
| Personne visitée | `Employe` — M2 | ❌ non |
| Matériel | `Materiel` — M13 | ❌ non |
| Service destinataire | `Service` — M1 | ❌ non |
| **Station-service** | `StationService` | ✅ **oui** |
| **Société du visiteur** | historique des visites | ✅ **oui** |

Les deux derniers se créent depuis le champ. Un doublon sur le libellé
normalisé **renvoie l'existant**, jamais une erreur.

`components/ui/referentiel-combobox.tsx` porte le patron.

---

## Le formulaire de distribution — patron 4 bis

Douze champs, dont trois conditionnels. Une modale à étapes serait excessive :
**une modale simple à deux sections** suffit.

```
┌─ Nouvelle distribution ──────────────────────────┐
│                                                   │
│  Demandeur *          [ autocomplétation M2    ]  │
│  Matériel *           [ autocomplétation M13   ]  │
│                                                   │
│  ── Carburant ─────────────────────────────────   │
│  Type *      [ Gasoil ▾ ]   Quantité * [  60  ] L │
│  Montant                    [        42 000     ] │
│                                                   │
│  ── Compteur ──────────────────────────────────   │
│  Kilométrage *              [      45 890      ]  │
│  Dernier relevé : 45 200 km le 12 juin            │
│                                                   │
│  ☑ Plein complet                                  │
│     Décochez si le réservoir n'a pas été rempli   │
│                                                   │
│  ── Provenance ────────────────────────────────   │
│  ○ Station-service   ● Cuve                       │
│  Lieu *      [ Garage ▾ ]     solde : 1 240 L     │
│                                                   │
│              [ Annuler ]      [ Enregistrer ]     │
└───────────────────────────────────────────────────┘
```

### Trois comportements

**Le libellé du compteur s'adapte au matériel.** « Kilométrage » pour un
véhicule, « Compteur horaire » pour un engin. Le choix du matériel le
détermine.

**Le dernier relevé est rappelé sous le champ.** C'est ce qui rend une faute
de frappe visible à la saisie — et c'est aussi ce qui permet de détecter un
recul avant l'enregistrement.

**Le choix de la provenance change le champ suivant.** Station → sélecteur de
station. Cuve → sélecteur de lieu, avec le solde affiché.

Un champ désactivé porte sa raison — R-07. « Choisissez d'abord un
matériel. »

---

## Le tableau de consommation — patron 3 dense

Même forme que le tableau de suivi des achats.

```
Matériel      Type   Dernier plein        Moyenne      Dernier    Écart
AK-PICK006    VL     28/06 · 45 890 km    8,7 L/100    13,0       +49 %
AK-VL102      VL     25/06 · 12 340 km    9,2 L/100     9,4        +2 %
AK-CHG01      Engin  20/06 ·  1 204 h    14,2 L/h      13,8        −3 %
AK-PL004      PL     30/06 · 98 200 km    —            —      en attente
```

### Quatre règles

**`tabular-nums` sur les quatre colonnes de droite.** Sans lui, les chiffres
ne s'alignent pas et la comparaison devient pénible.

**L'écart porte son signe et son libellé.** `+49 %` en ambre, jamais un fond
coloré seul — R-01.

**Un véhicule sans deux pleins complets affiche « en attente d'un plein
complet »**, pas un tiret. Le tiret laisserait croire à une absence de
données.

**Les unités ne se mélangent pas.** Filtrer sur « Engins » change l'en-tête
de colonne en `L/h`. Les deux ne coexistent jamais.

### Seuil d'alerte

`+25 %` par rapport à la moyenne, paramétrable. Au-delà, la ligne remonte en
tête et compte dans le compteur du menu.

---

## Le registre des visiteurs — patron 2, liste vivante

Ce n'est pas un tableau. C'est une liste de cartes, triée par heure d'arrivée
décroissante.

```
┌─ Visiteurs · aujourd'hui ────────────────────────┐
│  [ + Nouvelle visite ]        3 présents          │
│                                                   │
│  ● KOUAME Bernard        SOCIMAT CI               │
│    → OUATTARA Marc       arrivé 09 h 12   [Sortie]│
│                                                   │
│  ○ TRAORÉ Sekou          Livraison                │
│    → Magasin        08 h 30 — 08 h 52             │
└───────────────────────────────────────────────────┘
```

**Point plein pour les présents, point vide pour les partis.** Doublé du
libellé — R-01 : « présent depuis 2 h 14 » ou « parti à 08 h 52 ».

**Le bouton Sortie enregistre l'heure d'un clic.** Pas de modale, pas de
confirmation. C'est le geste le plus fréquent du module.

**Un habitué se ressaisit en deux secondes.** Taper « Kouame » propose la
dernière visite avec sa société et sa pièce déposée.

---

## Le courrier — deux registres, une forme

Liste avec filtres, patron 3. Les colonnes diffèrent par le sens.

| Colonne | Arrivée | Départ |
| --- | --- | --- |
| Numéro | `ITA-2026-0142` | `ITA-2026-0143` |
| Date de passage | **Reçu le** | **Parti le** |
| Date de correspondance | Daté du | Daté du |
| **Délai** | **calculé** — 16 j | calculé |
| Tiers | **Expéditeur** | **Destinataire** |
| Objet | l'objet | l'objet |
| Service | **destinataire** | **expéditeur** |
| Statut | À traiter · Traité · Sans suite | — |
| Scan | 📎 | 📎 |

**La colonne Délai est calculée**, jamais stockée. Elle porte son libellé —
« 16 jours », pas un nombre nu.

**Un courrier départ n'a pas de statut.** La colonne disparaît sur ce
registre, elle n'affiche pas un tiret.

---

## Les jetons — rappel

`TYPOGRAPHIE.md` et `CHAMPS.md` font foi. Cinq points souvent manqués.

| Élément | Valeur |
| --- | --- |
| Champs de saisie | **`rounded-md`**, jamais `lg` ni `xl` |
| Cartes | `rounded-xl shadow-sm` |
| Boutons | `rounded-full px-4 py-2 text-sm font-medium` |
| En-tête de tableau | **10 px**, majuscules, `tracking-wide` |
| Graisses | normale · `medium` · `semibold`. **Jamais `bold`.** |

**L'erreur remplace l'aide sous un champ**, elle ne s'y ajoute pas. Et elle
n'apparaît qu'au `blur`, jamais pendant la frappe.

**Une valeur masquée par permission porte un cadenas et le mot « masqué »**,
jamais une cellule vide.
