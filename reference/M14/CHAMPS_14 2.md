# CHAMPS.md — Champs, autocomplétation et modales

**Extrait des aperçus de référence.** Complète `TYPOGRAPHIE.md`, qui donne les
jetons ; ce document donne les **états**.

> Un état non spécifié est un état inventé. C'est là que les écrans divergent.

---

## 1. Champ de saisie

### 1.1 · Sept états

| État | Bordure | Fond | Texte |
| --- | --- | --- | --- |
| **Repos** | `--border` `#E5E7EB` | `#fff` | héritée |
| **Survol** | `#D1D5DB` | `#fff` | héritée |
| **Focus** | `--primary` `#1D186C`, 1 px + anneau 3 px à 15 % | `#fff` | héritée |
| **Erreur** | `--destructive` `#DC2626` | `#fff` | héritée |
| **Erreur + focus** | `--destructive` + anneau destructive à 15 % | `#fff` | héritée |
| **Désactivé** | `--border` | `--muted-bg` `#F9FAFB` | `--muted-foreground` |
| **Lecture seule** | `--border` | `--muted-bg` | héritée |

**Désactivé et lecture seule diffèrent.** Désactivé signifie « pas encore
disponible » — le service avant qu'une direction soit choisie. Lecture seule
signifie « connu, non modifiable » — le nom issu de la session.

Le texte grisé du premier le dit ; le second reste lisible.

### 1.2 · Structure

```
[Libellé] [*]
[───────────────── champ ─────────────────]
[texte d'aide]  ou  [message d'erreur]
```

| Élément | Jeton |
| --- | --- |
| Libellé | `text-sm font-medium` en `#374151` |
| Astérisque | `--destructive`, collé au libellé, précédé d'une espace |
| Écart libellé-champ | `gap-1.5` — 6 px |
| Champ | `rounded-md px-3 py-2 text-sm`, hauteur 40 px |
| Aide | `text-xs` en `--muted-foreground`, `leading-snug` |
| Erreur | `text-xs` en `--destructive` |

### 1.3 · L'erreur remplace l'aide

```tsx
{erreur
  ? <span className="text-xs" style={{ color: C.destructive }}>{erreur}</span>
  : aide && <span className="text-xs leading-snug" style={{ color: C.muted }}>{aide}</span>}
```

**Jamais les deux en même temps.** Empilées, elles font sauter la mise en page
et l'utilisateur lit l'aide au lieu de l'erreur.

### 1.4 · Quand afficher l'erreur

**Jamais pendant la frappe.** L'erreur apparaît au `blur`, ou à la tentative
de soumission.

```tsx
onBlur={() => marquer("nom")}
```

Un champ qui devient rouge à la troisième lettre d'un nom de huit lettres est
insupportable.

**Exception** : un compteur de caractères peut s'actualiser en direct — « 12
caractères manquants » — car il informe sans accuser.

### 1.5 · Champ numérique

```tsx
<Saisie type="number" min="0" inputMode="numeric" />
```

Pour un code à chiffres, filtrer à la saisie :

```tsx
onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
inputMode="numeric"
autoComplete="one-time-code"
className="text-center font-mono text-xl tracking-[0.5em]"
```

### 1.6 · Zone de texte

`rows={2}` pour un commentaire, `rows={3}` pour une justification.
`resize-none` toujours — un redimensionnement libre casse la mise en page.

---

## 2. Cas particuliers rencontrés

### 2.1 · Donnée sensible — fond ambre

Le numéro Wave, le RIB, le numéro CNPS.

```tsx
<Saisie style={{ borderColor: C.warningBorder, background: C.warningSoft }} />
```

Bordure `--warning-border` `#FDE68A`, fond `--warning-soft` `#FFFBEB`.

**Motif** : ce sont des données de paiement. Une erreur de saisie envoie
l'argent à un tiers, sans recours. Le fond signale qu'on manipule autre chose
qu'un contact.

### 2.2 · Double confirmation

Deux champs côte à côte. Le second passe en bordure `--success` quand les deux
concordent.

```tsx
<Champ label="Confirmation" requis erreur={err.confirme}
  aide={a && a === b ? "Les deux numéros correspondent." : undefined}>
  <Saisie value={b} erreur={err.confirme}
    style={a && a === b ? { borderColor: C.success } : undefined} />
</Champ>
```

**Le retour positif compte autant que l'erreur.** Sans lui, l'utilisateur
ressaisit sans savoir s'il a réussi.

### 2.3 · Valeur masquée par permission

```tsx
<Infobulle texte="La rémunération relève des données sensibles. Permission employe:donneesSensibles requise.">
  <span className="inline-flex items-center gap-1" style={{ color: C.muted }}>
    <Lock size={11} /> masqué
  </span>
</Infobulle>
```

**Un cadenas et le mot « masqué », jamais une cellule vide.** Une cellule vide
laisse croire à une donnée absente ; le cadenas dit qu'elle existe et qu'on
n'y a pas droit.

### 2.4 · Champ hors norme — fond ambre dynamique

Un salaire hors fourchette de grille :

```tsx
style={horsGrille ? { borderColor: C.warning, background: C.warningSoft } : undefined}
```

La valeur reste saisissable. C'est un avertissement, pas un blocage — décision
M4 §8.

---

## 3. Autocomplétation

### 3.1 · Le champ

Identique à un champ de saisie, plus une icône de recherche à droite.

```tsx
<input className="w-full rounded-md border px-3 py-2 pr-8 text-sm outline-none" />
<Search size={14} className="pointer-events-none absolute right-3 top-2.5"
  style={{ color: C.muted }} />
```

`pr-8` réserve la place de l'icône. `pointer-events-none` évite qu'elle
intercepte le clic.

### 3.2 · Comportement

| Événement | Effet |
| --- | --- |
| `focus` | Ouvre la liste, **vide la recherche**, affiche toutes les options |
| Frappe | Filtre en ignorant accents et casse |
| `mousedown` sur une option | Sélectionne, ferme, vide la recherche |
| `blur` | Ferme après **150 ms** |

> ⚠️ **Deux détails qui font tout.**
>
> La sélection se fait sur `mousedown` avec `preventDefault()`, non sur
> `click`. Sinon le `blur` ferme la liste avant que le clic n'aboutisse.
>
> Le délai de 150 ms au `blur` laisse le temps au `mousedown` de se produire.

```tsx
onFocus={() => { setOuvert(true); setQ(""); }}
onBlur={() => setTimeout(() => setOuvert(false), 150)}
onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setQ(""); setOuvert(false); }}
```

### 3.3 · La liste

| Élément | Jeton |
| --- | --- |
| Conteneur | `absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg` |
| Option | `px-3 py-2 text-sm`, pleine largeur, alignée à gauche |
| Option survolée | `hover:bg-gray-50` |
| Option sélectionnée | fond `--primary-soft` |
| Détail à droite | `text-xs` en `--muted-foreground` |
| Séparateur avant création | `border-t` en `--border` |
| Option de création | `text-sm` en `--success`, icône `Plus size={14}` |
| Option verrouillée | `#9CA3AF`, `cursor-not-allowed`, icône `Lock size={12}` |
| État vide | `px-3 py-3 text-center text-xs` en `--muted-foreground` |

`max-h-56` — 224 px, soit environ sept options avant défilement.

### 3.4 · Normalisation de la recherche

```ts
const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
```

**Obligatoire.** Personne ne saisit les accents. « bouake » doit trouver
« Bouaké ».

### 3.5 · Option de création

Apparaît quand : la création est autorisée, la recherche fait plus d'un
caractère, et aucune option ne correspond exactement.

```tsx
Ajouter «&nbsp;{q.trim()}&nbsp;»
```

Espaces insécables autour du terme — c'est la typographie française, et ça
évite qu'un guillemet se retrouve seul en fin de ligne.

### 3.6 · Option verrouillée

Affichée **désactivée avec sa raison**, jamais masquée.

```tsx
<Infobulle texte="Poste à titulaire unique, occupé par YAO Serge. Clôturez son affectation d'abord.">
  <span className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-sm"
    style={{ color: "#9CA3AF" }}>
    <Lock size={12} className="shrink-0" />
    <span className="truncate">{o.label}</span>
  </span>
</Infobulle>
```

**Masquer une option laisse l'utilisateur la chercher.** La montrer désactivée
lui dit pourquoi il ne peut pas la choisir.

### 3.7 · Sélection multiple

Pastilles au-dessus, champ d'ajout en dessous.

| Élément | Jeton |
| --- | --- |
| Pastille | `rounded-md px-2.5 py-1 text-xs font-medium`, fond `--review-soft` |
| Croix de retrait | `X size={12}`, `aria-label="Retirer"` |
| Pastille verrouillée | icône `Lock size={12}` en tête, **pas de croix** |
| État vide | `text-xs italic` en `--muted-foreground` |
| Écart entre pastilles | `gap-1.5` |

Une valeur verrouillée est **ajoutable mais non retirable** — elle est imposée
par une règle métier. Voir patron 5 bis.

---

## 4. Modale

### 4.1 · Dimensions

| Taille | Largeur | Emploi |
| --- | --- | --- |
| `md` | `max-w-2xl` — 672 px | Moins de six champs par étape |
| `lg` | `max-w-4xl` — 896 px | Formulaire courant |
| `xl` | `max-w-6xl` — 1152 px | Fiche avec tableau |

Hauteur : `max-h-[90vh]`. **En-tête et pied fixes, contenu défilant.**

### 4.2 · Structure

| Zone | Jetons |
| --- | --- |
| Fond de page | `rgba(17,17,17,0.45)` |
| Conteneur | `rounded-xl bg-white shadow-xl` |
| En-tête | `bg-primary-soft px-7 py-5` |
| Titre | `text-lg font-semibold` en `--primary` |
| Sous-titre | `text-sm` en `--muted-foreground` |
| Bouton de fermeture | `rounded-full bg-white p-2 shadow-sm`, `X size={16}`, `aria-label="Fermer"` |
| Contenu | `px-7 py-6` |
| Pied | `border-t px-7 py-4` en `#F3F4F6` |

**Le pied place l'action secondaire à gauche, la principale à droite.**
Annuler à gauche, Créer à droite. Précédent à gauche, Suivant à droite.

### 4.3 · Progression, modale à étapes

```tsx
<ol className="mt-5 flex gap-1.5">
  {etapes.map((e, i) => (
    <li key={e.id} className="h-1.5 flex-1 rounded-full"
      style={{ background: i <= courante ? "var(--success)" : "var(--success-soft)" }} />
  ))}
</ol>
```

Sous-titre : « Étape 2 sur 6 — Affectation ».

### 4.4 · Onglets, modale à onglets

| Élément | Jeton |
| --- | --- |
| Conteneur | `flex gap-2 border-b px-7` |
| Onglet | `border-b-2 px-4 py-3 text-sm font-medium` |
| Actif | bordure `--primary`, texte `--primary` |
| Inactif | bordure transparente, texte `--muted-foreground` |
| Complet | icône `Check size={13}` en `--success` |
| Incomplet | point de 6 px en `#D1D5DB` |

L'indicateur de complétude évite de parcourir les onglets pour trouver ce qui
manque.

### 4.5 · Indicateur de brouillon

En haut à droite, à côté du bouton de fermeture.

| État | Rendu |
| --- | --- |
| Enregistrement | `Loader2` tournant, texte en `--muted-foreground` |
| Enregistré | `Save size={12}`, texte en `--success` |

```tsx
className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm"
```

Deux secondes après la frappe — décision E-03.

### 4.6 · Message de blocage

Dans le pied, à gauche de l'action principale.

```tsx
{blocage && <span className="text-xs" style={{ color: C.muted }}>{blocage}</span>}
```

Exemples : « 3 champs obligatoires à renseigner », « Justification trop
courte ».

**Le bouton reste visible mais à `opacity: .4`.** Le masquer laisserait
l'utilisateur chercher comment valider.

---

## 5. Bloc de section

Regroupe des champs à l'intérieur d'une étape ou d'un onglet.

| Ton | Bordure | Fond | Titre |
| --- | --- | --- | --- |
| Neutre | `--border` | transparent | `--primary` |
| Attention | `--warning-border` | `--warning-soft` | `--warning` |
| Succès | `--success-soft` | `#FBFEFA` | `--success` |

```tsx
<section className="rounded-lg border p-5" style={{ borderColor, background }}>
  <h3 className="text-sm font-semibold">{titre}</h3>
  {aide && <p className="mt-1 text-xs">{aide}</p>}
  <div className="mt-4">{children}</div>
</section>
```

Le ton **attention** sert aux données sensibles et aux avertissements — le
bloc Wave, le bloc de dérogation.

---

## 6. Grille de champs

| Colonnes | Emploi |
| --- | --- |
| 1 | Zone de texte, champ long |
| **2** | **Défaut** — `md:grid-cols-2` |
| 3 | Champs courts — dates, nombres, codes |

**Jamais quatre.** Les libellés deviennent illisibles.

Écart : `gap-5` — 20 px.

---

## 7. Ce qui ne se fait jamais

1. Un champ en `rounded-lg` ou `rounded-xl`
2. L'aide et l'erreur affichées ensemble
3. Une erreur pendant la frappe
4. Une option masquée au lieu d'être désactivée avec sa raison
5. Une recherche sensible aux accents
6. Une sélection sur `click` au lieu de `mousedown` dans une liste
7. Une cellule vide au lieu d'un cadenas quand la permission manque
8. Un bouton d'action masqué au lieu d'être atténué
9. Une grille à quatre colonnes
10. Une modale sans `max-h-[90vh]` — elle déborde sur un portable

---

## 8. Vérification

```bash
# Champs mal arrondis
grep -rn "Input.*rounded-lg\|Input.*rounded-xl\|Saisie.*rounded-lg" app components --include="*.tsx"

# Grilles à quatre colonnes
grep -rn "grid-cols-4" app components --include="*.tsx"

# Modales sans hauteur maximale
grep -rn "DialogContent" app components --include="*.tsx" | grep -v "max-h-"

# Icônes seules sans aria-label
grep -rn "<button" app components --include="*.tsx" -A2 | grep -B1 "size={1[0-9]}" | grep -v "aria-label"
```

À ajouter à `verify-all.ts`, avec les quatre commandes de `TYPOGRAPHIE.md`.
