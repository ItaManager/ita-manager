# ITA Manager — Système de Design

> Guide de référence pour tous les modules de l'application
> Basé sur le module **Compétences** (M17)

---

## 1. Structure de Page Standard

Chaque module utilise le composant `ModuleLayout` :

```tsx
import { ModuleLayout } from "@/components/layouts/module-layout";

<ModuleLayout
  titre="Nom du Module"
  description="Description courte du module"
  helpText="Explication détaillée du workflow"
  indicateurs={<IndicateursModule />}
  taches={{
    titre: <TitreTaches />,
    contenu: <ListeTaches />,
  }}
>
  <ListePrincipale />
</ModuleLayout>
```

---

## 2. Bloc des Indicateurs (Stats)

### Composant : `CardIndicateur`

**Localisation** : `@/components/indicateurs`

**Structure** :
```tsx
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <CardIndicateur
    label="Label de l'indicateur"
    helpText="Explication détaillée pour l'utilisateur"
    value={42} // ou "42 000 F"
    valueColor="#18181a" // optionnel (défaut: noir)
    chart={<MiniGraphBarres values={[...]} />}
  />
</div>
```

**Types de graphiques** :
- `<MiniGraphBarres values={[...]} />` — Évolution temporelle
- `<MiniGraphCirculaire percentage={0.75} />` — Pourcentage (0 à 1)
- `<MiniGraphProgression percentage={75} />` — Progression (0 à 100)

**Couleurs pour valeurs** :
- Normal : `#18181a` (noir)
- Attention : `#f59e0b` (orange)
- Erreur : `#dc2626` (rouge)
- Succès : `#10b981` (vert)

---

## 3. Bloc des Tâches

### Structure :
```tsx
taches={{
  titre: (
    <Suspense fallback={<h2>Vos tâches</h2>}>
      <TitreTaches />
    </Suspense>
  ),
  contenu: (
    <Suspense fallback={<div>Chargement...</div>}>
      <ListeTaches />
    </Suspense>
  ),
}}
```

### Composant TitreTaches :
Affiche le nombre de tâches en attente.

```tsx
export async function TitreTaches() {
  const count = await compterTaches();
  return (
    <h2 className="text-lg font-semibold text-[#18181a]">
      Vos tâches {count > 0 && `(${count})`}
    </h2>
  );
}
```

### Composant ListeTaches :
Liste des actions à effectuer.

---

## 4. Filtres et Recherche

### Barre de Recherche

**Container** :
```tsx
<div className="flex items-center justify-between gap-4 flex-wrap">
  {/* Recherche */}
  <div className="flex-1 min-w-[300px]">
    <Input
      placeholder="Rechercher..."
      className="w-full"
    />
  </div>

  {/* Filtres */}
  <div className="flex items-center gap-2">
    <Button variant={filtre === "actives" ? "default" : "outline"}>
      Actives (12)
    </Button>
    <Button variant={filtre === "toutes" ? "default" : "outline"}>
      Toutes (45)
    </Button>
  </div>

  {/* Actions */}
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Nouveau
  </Button>
</div>
```

**Classes importantes** :
- Container : `flex items-center justify-between gap-4 flex-wrap`
- Input recherche : `flex-1 min-w-[300px]`
- Zone filtres : `flex items-center gap-2`

---

## 5. Tableau Standard

### Container :
```tsx
<div className="bg-white rounded-xl border border-[#0000001a] p-6">
  <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* ... */}
      </table>
    </div>
  </div>
</div>
```

### En-têtes de colonnes :
```tsx
<thead className="bg-muted/50">
  <tr className="border-b border-border">
    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
      Colonne
    </th>
  </tr>
</thead>
```

### Lignes de données :
```tsx
<tbody>
  <tr className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
    <td className="py-4 px-4 text-sm text-foreground">
      Contenu
    </td>
  </tr>
</tbody>
```

### Ligne vide (aucune donnée) :
```tsx
<tr>
  <td
    colSpan={7}
    className="py-8 text-center text-sm text-muted-foreground"
  >
    Aucune donnée trouvée
  </td>
</tr>
```

---

## 6. Badges et Statuts

### Import :
```tsx
import { getBadgeClasses } from "@/lib/ui/badge-styles";
```

### Utilisation :
```tsx
<Badge className={getBadgeClasses("competences", statut)}>
  {statut}
</Badge>
```

### Couleurs par type de statut :

**Succès** (bg-emerald-100 text-emerald-800) :
- VALIDÉ, SOLDÉE, ACTIF, APPROUVÉ

**En cours** (bg-blue-100 text-blue-800) :
- EN_COURS, A_VALIDER, EN_ATTENTE_VALIDATION

**Attention** (bg-orange-100 text-orange-800) :
- EN_ATTENTE, PARTIELLE, SANS_TAUX

**Erreur** (bg-red-100 text-red-800) :
- REFUSÉ, EN_RETARD, BLOQUÉ

**Neutre** (bg-gray-100 text-gray-800) :
- BROUILLON, ARCHIVÉ

---

## 7. Boutons d'Action

### Boutons principaux :
```tsx
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Nouveau
</Button>
```

### Boutons secondaires :
```tsx
<Button variant="outline" size="sm">
  <Eye className="h-4 w-4 mr-2" />
  Voir
</Button>
```

### Boutons dans tableau :
```tsx
<div className="flex items-center gap-2">
  <Button variant="ghost" size="sm">
    <Edit className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm">
    <Trash className="h-4 w-4 text-destructive" />
  </Button>
</div>
```

**Icônes dans boutons** :
- Toujours `h-4 w-4`
- Avec label : `mr-2`
- Sans label : pas de marge

---

## 8. Pagination

### Composant :
```tsx
<PaginationModule
  page={currentPage}
  limit={limit}
  total={total}
  onPageChange={(p) => router.push(`?page=${p}`)}
/>
```

### Structure manuelle :
```tsx
<div className="flex items-center justify-between mt-6">
  <div className="text-sm text-muted-foreground">
    {debut + 1}-{Math.min(fin, total)} sur {total}
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" disabled={page === 1}>
      Précédent
    </Button>
    <Button variant="outline" size="sm" disabled={fin >= total}>
      Suivant
    </Button>
  </div>
</div>
```

---

## 9. Typographie

### Titres de page :
- `text-3xl font-semibold` (dans ModuleLayout)

### Titres de section :
- `text-lg font-semibold text-[#18181a]`

### Texte normal :
- `text-sm text-foreground`

### Texte secondaire :
- `text-sm text-muted-foreground`

### Labels de formulaire :
- `text-sm font-medium text-foreground`

### Montants/chiffres :
- `tabular-nums` (toujours !)
- `text-sm` ou `text-base` selon contexte

**⚠️ JAMAIS `font-bold`** — Utiliser `font-semibold` (600) ou `font-medium` (500)

---

## 10. Espacements

### Padding de page :
- Container principal : `p-6`

### Padding de carte :
- Carte blanche : `p-6`

### Gaps entre éléments :
- Indicateurs (grid) : `gap-4`
- Boutons horizontaux : `gap-2`
- Sections : `mt-6` ou `space-y-6`

### Padding interne tableau :
- Cellules : `py-4 px-4` (lignes) / `py-3 px-4` (en-têtes)

---

## 11. Couleurs ITA

### Primaire (bleu ITA) :
- `#1d186c` — Boutons, liens actifs, accents
- Tailwind : `text-primary` / `bg-primary`

### Bordures :
- `#0000001a` (noir 10% opacité)
- `border-[#0000001a]`

### Backgrounds :
- Fond page : `bg-background` (blanc ou gris très clair)
- Carte : `bg-white` ou `bg-card`
- Hover tableau : `hover:bg-muted/50`

---

## 12. États Interactifs

### Hover sur ligne de tableau :
```tsx
className="hover:bg-muted/50 transition-colors"
```

### Bouton actif/sélectionné :
```tsx
variant={isActive ? "default" : "outline"}
```

### Champ de formulaire focus :
- Géré automatiquement par shadcn/ui

---

## 13. Composants Réutilisables

### Localisation :
- **Indicateurs** : `@/components/indicateurs`
- **Layout** : `@/components/layouts/module-layout`
- **UI de base** : `@/components/ui/*` (shadcn)
- **Badges** : `@/lib/ui/badge-styles`

### À créer pour chaque module :
1. `indicateurs-[module].tsx` — Stats
2. `liste-[module].tsx` — Tableau principal
3. `barre-recherche.tsx` — Filtres
4. `pagination-[module].tsx` — Navigation pages
5. `liste-taches.tsx` — Tâches à faire
6. `titre-taches.tsx` — Compteur tâches

---

## 14. Règles de Nommage

### Fichiers :
- Composants : `kebab-case.tsx`
- Actions : `kebab-case.ts`
- Types : `PascalCase` dans le fichier

### Classes CSS :
- Tailwind uniquement (pas de CSS custom)
- Pas de `@apply` dans les composants
- Configuration dans `app/globals.css`

### Composants :
- `PascalCase` pour les exports
- Server Components par défaut
- `"use client"` seulement si nécessaire

---

## 15. Accessibilité

### Labels et textes :
- Tous les boutons icônes ont un `aria-label`
- Les tooltips enrichissent, n'expliquent pas l'essentiel
- Texte minimum 14px (`text-sm`)

### Contraste :
- Respecter WCAG AA minimum
- Texte principal : `text-foreground` (contraste élevé)
- Texte secondaire : `text-muted-foreground` (lisible)

### Navigation clavier :
- Tous les éléments interactifs focusables
- Focus visible automatique (shadcn)

---

## 16. Performance

### Server Components :
- Par défaut pour toutes les pages
- `Suspense` pour chargements asynchrones

### Client Components :
- Uniquement pour interactivité
- Marquer explicitement `"use client"`

### Images :
- Utiliser `next/image`
- Spécifier `width` et `height`

---

## 17. Exemple Complet

Voir le module **Compétences** comme référence :
- `/app/(app)/personnel/competences/page.tsx`
- `/app/(app)/personnel/competences/_components/`

Copier cette structure pour tout nouveau module.

---

## 18. Checklist Nouveau Module

- [ ] Page principale avec `ModuleLayout`
- [ ] Composant `indicateurs-[module].tsx` (4 stats)
- [ ] Composant `liste-[module].tsx` (tableau)
- [ ] Composant `barre-recherche.tsx` (filtres)
- [ ] Composant `pagination-[module].tsx`
- [ ] Composant `liste-taches.tsx`
- [ ] Composant `titre-taches.tsx`
- [ ] Server Action dans `lib/actions/[module].ts`
- [ ] Protection avec `actionProtegee`
- [ ] Badges avec `getBadgeClasses`
- [ ] Typographie sans `font-bold`
- [ ] `tabular-nums` sur tous les montants
- [ ] `Suspense` sur tous les composants async
- [ ] Tests TypeScript : `npx tsc --noEmit`
- [ ] Build réussi : `npm run build`

---

**Dernière mise à jour** : 2026-10-31
**Basé sur** : Module Compétences (M17)
**Mainteneur** : Équipe ITA Manager
