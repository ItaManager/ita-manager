# TYPOGRAPHIE.md — Jetons de rendu

**Extrait des aperçus de référence.** Ces valeurs sont **verrouillées** :
elles ne se renégocient pas d'un écran à l'autre.

> Quand un aperçu et ce document divergent, ce document fait foi.
> Quand un écran s'écarte de ce document, c'est l'écran qui a tort.

---

## 1. Police

### 1.1 · Deux familles, pas trois

| Usage | Police | Motif |
| --- | --- | --- |
| **Interface** | **Inter** | Chiffres tabulaires — les montants s'alignent en colonne |
| **Montants, codes, matricules** | **JetBrains Mono** | Chasse fixe, pour comparer des chiffres à la verticale |

**Pourquoi Inter plutôt que Geist**, la police par défaut de Next.js : ses
chiffres à chasse tabulaire alignent `1 218 000 F` sous `696 000 F`. Sur un
tableau à seize colonnes, la différence est nette.

### 1.2 · Installation

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

<html lang="fr" className={`${inter.variable} ${mono.variable}`}>
```

```css
/* app/globals.css */
@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}

/* Chiffres tabulaires par défaut dans les tableaux et les montants */
table, .montant, .tabulaire {
  font-variant-numeric: tabular-nums;
}
```

> ⚠️ **`font-variant-numeric: tabular-nums` n'est pas un détail.** Sans lui,
> le chiffre 1 est plus étroit que le 8, et les colonnes de montants
> s'écartent ligne après ligne.

---

## 2. Échelle typographique

Trois tailles suffisent à toute l'application. Plus, et l'écran devient
bruyant.

| Jeton | Taille | Interligne | Emploi |
| --- | --- | --- | --- |
| `text-2xl` | 24 px | 32 px | **Titre de page** — un seul par écran |
| `text-lg` | 18 px | 28 px | **Titre de modale**, titre de carte importante |
| `text-sm` | 14 px | 20 px | **Corps** — libellés, valeurs, boutons, paragraphes |
| `text-xs` | 12 px | 16 px | **Secondaire** — aide, sous-titres, cellules de tableau dense |
| `10 px` | en dur | — | **En-tête de tableau**, marqueurs |
| `9 px` | en dur | — | Marqueur ƒ des colonnes calculées, uniquement |

**Jamais `text-base` ni `text-xl`.** Ils n'apportent rien entre les paliers
existants et brouillent la hiérarchie.

### 2.1 · Correspondance par élément

| Élément | Jeton | Graisse | Couleur |
| --- | --- | --- | --- |
| Titre de page | `text-2xl` | `font-semibold` | `--primary` |
| Sous-titre de page | `text-sm` | normale | `--muted-foreground` |
| Titre de modale | `text-lg` | `font-semibold` | `--primary` |
| Titre de carte | `text-sm` | `font-semibold` | `--primary` |
| Libellé de champ | `text-sm` | `font-medium` | `#374151` |
| Valeur de champ | `text-sm` | normale | héritée |
| Texte d'aide | `text-xs` | normale | `--muted-foreground` |
| Message d'erreur | `text-xs` | normale | `--destructive` |
| Bouton | `text-sm` | `font-medium` | selon variante |
| **En-tête de tableau** | **10 px** | `font-semibold` | `--muted-foreground` |
| Cellule de tableau | `text-xs` | normale | héritée |
| Cellule mise en avant | `text-xs` | `font-medium` | héritée |
| Pastille de statut | `text-xs` | `font-medium` | selon statut |
| Indicateur — valeur | `text-2xl` | `font-semibold` | `--primary` ou `--warning` |
| Indicateur — libellé | `text-xs` | `font-medium` | `--muted-foreground` |

### 2.2 · En-têtes de tableau

```tsx
className="whitespace-nowrap border-b px-3 py-3 text-left font-semibold uppercase tracking-wide"
style={{ fontSize: 10, color: "var(--muted-foreground)" }}
```

**Majuscules et `tracking-wide`.** À 10 px, les majuscules espacées se lisent
mieux que les minuscules, et se distinguent nettement du contenu.

> Attention : dans une infobulle placée sur un en-tête, remettre
> `normal-case`, `font-normal` et `letterSpacing: 0`. Sinon le texte d'aide
> hérite des majuscules et devient illisible.

---

## 3. Graisses

Trois seulement.

| Graisse | Emploi |
| --- | --- |
| Normale — 400 | Corps, valeurs, aide |
| `font-medium` — 500 | Libellés, boutons, cellules mises en avant, pastilles |
| `font-semibold` — 600 | Titres, en-têtes de tableau, valeurs d'indicateur |

**Jamais `font-bold`.** À 700, une graisse crie plutôt qu'elle ne hiérarchise.
Un back-office n'a rien à crier.

---

## 4. Couleurs de texte

| Jeton | Valeur | Emploi |
| --- | --- | --- |
| `--primary` | `#1D186C` | Titres, valeurs importantes, références |
| `#374151` | gris 700 | Libellés de champ |
| héritée | gris 900 | Corps de texte |
| `--muted-foreground` | `#6B7280` | Aide, sous-titres, valeurs absentes |
| `#9CA3AF` | gris 400 | Éléments désactivés |
| `#D1D5DB` | gris 300 | Tirets d'absence, séparateurs |
| `--success` | `#16850C` | Valeurs positives, états conformes |
| `--warning` | `#B45309` | Alertes, valeurs à surveiller |
| `--destructive` | `#DC2626` | Erreurs, refus, retards |
| `--review` | `#7C3AED` | Marqueurs particuliers, chaîne fonctionnelle |

### 4.1 · Une règle absolue — R-01

**Aucune information ne repose sur la seule couleur.** Une valeur en rouge
porte toujours un libellé : « retard 12 j », non un simple nombre rouge.

---

## 5. Bordures et rayons

| Jeton | Valeur | Emploi |
| --- | --- | --- |
| `rounded-md` | 6 px | **Champs de saisie**, pastilles, cellules d'aide |
| `rounded-lg` | 8 px | Cartes internes, blocs de section, bandeaux |
| `rounded-xl` | 12 px | **Cartes de premier niveau**, modales |
| `rounded-full` | — | **Boutons**, filtres, badges de compteur |

> **Les champs sont en `rounded-md`, jamais `rounded-lg` ni `rounded-xl`.**
> C'est le jeton le plus souvent violé — voir règle R-05.

### 5.1 · Épaisseurs

| Emploi | Valeur |
| --- | --- |
| Bordure de champ | `1px solid var(--border)` — `#E5E7EB` |
| Bordure de carte | aucune — l'ombre suffit |
| Séparateur de ligne de tableau | `1px solid #F3F4F6` |
| Séparateur de section | `1px solid var(--border)` |
| Champ en erreur | `1px solid var(--destructive)` |
| Bloc d'attention | `1px solid var(--warning-border)` — `#FDE68A` |
| Accent latéral de carte | `3px solid` la couleur du ton |

### 5.2 · Ombres

| Emploi | Valeur |
| --- | --- |
| Carte | `shadow-sm` |
| Carte survolée, cliquable | `shadow-md` |
| Modale | `shadow-xl` |
| Infobulle, liste déroulante | `shadow-lg` |
| Colonne figée d'un tableau | `boxShadow: "2px 0 0 var(--border)"` |

Le dernier n'est pas une ombre décorative : c'est le trait qui montre où
s'arrête la partie figée.

---

## 6. Icônes

**lucide-react**, exclusivement.

| Taille | Emploi |
| --- | --- |
| `size={11}` | Marqueur dans une pastille |
| `size={13}` | Icône dans un texte d'aide, une infobulle |
| `size={14}` | Icône dans un bouton compact |
| `size={15}` | Icône d'action dans un tableau |
| `size={16}` | **Défaut** — boutons, en-têtes, bandeaux |
| `size={18}` | Zone de dépôt de fichier |
| `size={22}` | Icône d'état vide, dans un cercle de 56 px |
| `size={24}` | Icône de module à venir |

### 6.1 · Trois règles

**Une icône seule porte toujours un `aria-label`.** Règle R-03.

**Une icône ne remplace jamais un libellé** dans un tableau ou un menu. Elle
l'accompagne.

**Une icône d'action est cliquable sur 32 px minimum** — `rounded p-1.5`
autour d'une icône de 15 px. Sur tablette, 44 px — décision E-07.

---

## 7. Espacements

| Contexte | Valeur |
| --- | --- |
| Padding de carte | `p-5` — 20 px |
| Padding de modale, contenu | `px-7 py-6` |
| Padding de modale, en-tête et pied | `px-7 py-5` / `px-7 py-4` |
| Cellule de tableau | `px-3 py-3` |
| En-tête de tableau | `px-3 py-3` |
| Champ de saisie | `px-3 py-2` |
| Bouton | `px-4 py-2` |
| Bouton compact | `px-3 py-1.5` |
| Pastille | `px-2 py-0.5` |
| Écart entre champs d'une grille | `gap-5` — 20 px |
| Écart entre cartes | `gap-4` — 16 px |
| Écart entre sections | `space-y-5` ou `space-y-6` |
| État vide | `py-14` |

---

## 8. Tableaux denses

Les règles propres à un tableau de plus de dix colonnes.

| Élément | Valeur |
| --- | --- |
| Taille de police | `text-xs` — 12 px |
| En-tête | 10 px, majuscules, `tracking-wide` |
| Hauteur de ligne | `py-3` — soit 40 px environ |
| Largeur de colonne | déclarée en pixels, `width` et `minWidth` |
| Colonne figée | `position: sticky`, décalage cumulé, `z-index: 1` |
| En-tête figé | même chose avec `z-index: 2` |
| Survol de ligne | `hover:bg-gray-50` |
| Séparateur | `border-b` en `#F3F4F6` |
| Cellule vide | tiret `—` en `--muted-foreground` |

### 8.1 · Colonne figée — le détail qui compte

```tsx
style={{
  position: "sticky",
  left: decalageCumule,
  background: "#fff",         // opaque, sinon le contenu défile dessous
  zIndex: 1,
  boxShadow: "2px 0 0 var(--border)",
}}
```

**Une seule colonne figée.** En figer deux mange le tiers de l'écran sur un
tableau de 2 300 px.

---

## 9. Ce qui ne se fait jamais

1. `font-bold` — trop lourd pour un back-office
2. `text-base` ou `text-xl` — paliers inutiles
3. Un champ en `rounded-lg` ou `rounded-xl`
4. Une couleur en dur qui n'est pas dans la table de la section 4
5. Une icône seule sans `aria-label`
6. Une information portée par la seule couleur
7. Un tableau sans `tabular-nums` sur ses colonnes de montants
8. Plus de deux colonnes figées
9. Une police autre qu'Inter ou JetBrains Mono

---

## 10. Vérification

```bash
# Aucune graisse interdite
grep -rn "font-bold" app components --include="*.tsx"

# Aucun palier interdit
grep -rn "text-base\|text-xl\b" app components --include="*.tsx"

# Aucun champ mal arrondi
grep -rn "Input.*rounded-lg\|Input.*rounded-xl" app components --include="*.tsx"

# Aucune couleur en dur hors palette
grep -rnoE "#[0-9A-Fa-f]{6}" app components --include="*.tsx" | \
  grep -vE "#1D186C|#EBEAF2|#16850C|#E2FAE0|#B45309|#FFFBEB|#FDE68A|#DC2626|#FEF2F2|#7C3AED|#F5F3FF|#6B7280|#F9FAFB|#E5E7EB|#F7F7FB|#374151|#9CA3AF|#D1D5DB|#F3F4F6|#111827|#fff|#FBFEFA"
```

Ces quatre commandes ne doivent rien renvoyer. À ajouter à `verify-all.ts`.
