# TODO — Refactorisation modale création employé

## Contexte

Le patron `ModaleEtapes` a été déposé dans `components/patterns/modale-etapes.tsx`.
Il impose les jetons verrouillés pour toutes les modales de création (>15 champs).

La modale actuelle (`modale-creation-employe-v2.tsx`) fonctionne mais présente
**5 écarts** par rapport aux règles du projet.

---

## 5 écarts à corriger (ordre de priorité)

### 1. RAYON DES CHAMPS — CRITIQUE

**État actuel** : `rounded-lg` ou `rounded-xl`, hauteur variable
**Attendu** : `rounded-md h-10` partout

**Impact** : Incohérence visuelle avec le reste de l'application.

**Correctif** : Rechercher/remplacer dans le fichier :
- `rounded-lg` → `rounded-md`
- `rounded-xl` → `rounded-md`
- Ajouter `h-10` sur tous les `<Input>` et `<select>`

---

### 2. EMAIL PROFESSIONNEL — HORS CADRAGE

**État actuel** : Champ « Email professionnel » présent à l'étape 1
**Attendu** : Retrait du champ (hors périmètre M2-EMPLOYES.md)

**Question** : Ce champ sert-il d'identifiant de connexion (→ création de compte,
besoin `admin:utilisateurs`) ou de simple contact (→ facultatif pour ouvriers) ?

**Décision** : Le retirer pour l'instant. M0 gère les comptes séparément.

**Correctif** :
1. Retirer le champ du formulaire (étape 1)
2. Retirer `email` du schéma de validation
3. Ne pas l'envoyer dans `creerEmploye()`

---

### 3. NATIONALITÉ EN LISTE DÉROULANTE — R-04 VIOLÉ

**État actuel** : `Combobox` standard (liste fermée)
**Attendu** : `ReferentielCombobox` avec création inline

**Règle R-04** : Tout sélecteur de référentiel = champ à autocomplétation créable.

**Blocage actuel** : `ReferentielCombobox` n'existe pas encore dans le projet.

**Correctif** :
1. Créer `components/ui/referentiel-combobox.tsx` (patron 5)
2. Remplacer `Combobox` par `ReferentielCombobox` pour `nationaliteId`
3. Garder `Combobox` pour Sexe et Situation matrimoniale (listes fermées)

---

### 4. ÉTAPE DE RÉCAPITULATIF MANQUANTE

**État actuel** : 6 étapes, dernière = Paie
**Attendu** : 7 étapes, dernière = Récapitulatif en lecture seule

**Motif** : Sur 6 étapes, l'utilisateur ne se souvient plus de ce qu'il a saisi
3 écrans plus tôt.

**Correctif** :
1. Ajouter étape 7 : `EtapeRecapitulatif`
2. Afficher toutes les valeurs saisies en lecture seule
3. Bouton « Modifier » par section → retour à l'étape concernée
4. Modèle : voir exemple ligne 327-360 de `modale-etapes.tsx`

---

### 5. BLOCAGE INTER-ÉTAPES MANQUANT

**État actuel** : Bouton « Suivant » toujours actif
**Attendu** : Bouton « Suivant » inactif + message « X champ(s) obligatoire(s) »

**Motif** : L'utilisateur découvre l'erreur à l'étape 6 et doit tout remonter.

**Correctif** (exemple fourni dans `modale-etapes.tsx` ligne 330-334) :

```typescript
const etape = etapes[etapeCourante];
const manquants = (etape.champsRequis ?? []).filter((c) => !form.getValues(c));
const blocage = manquants.length
  ? `${manquants.length} champ(s) obligatoire(s) à renseigner`
  : null;
```

Passer `blocage` en prop à `<ModaleEtapes>`.

---

## Refactorisation complète avec ModaleEtapes

**Prérequis manquants** :
- `components/ui/referentiel-combobox.tsx` (patron 5)
- `lib/actions/brouillons.ts` → fonction `enregistrerBrouillon()`
- `lib/toast.ts` → `toastSucces()` et `toastErreur()`

**Ordre de travail recommandé** :
1. Corriger écarts 1, 2, 5 dans la modale actuelle (rapide)
2. Créer `ReferentielCombobox` (patron 5)
3. Corriger écart 3 (nationalité)
4. Créer système de brouillon (décision E-03)
5. Refactoriser entièrement avec `ModaleEtapes`

---

## État actuel du code

✅ **Corrections appliquées** :
- 25+ erreurs TypeScript corrigées (noms champs Prisma)
- Correction `superieurId` : spread conditionnel dans 3 endroits
- Largeur modale adaptative : `!max-w` avec `!important`

⏳ **En attente** :
- Les 5 écarts ci-dessus
- Système de brouillon automatique
- Refactorisation complète

---

## Vérifications à faire après refactorisation

- [ ] Le brouillon automatique se déclenche-t-il (indicateur en haut à droite) ?
- [ ] Revenir en arrière conserve-t-il les valeurs ?
- [ ] Le blocage inter-étapes fonctionne-t-il ?
- [ ] L'étape récapitulatif affiche-t-elle toutes les valeurs ?
- [ ] Les boutons « Modifier » du récapitulatif fonctionnent-ils ?
- [ ] Les champs ont-ils tous `rounded-md h-10` ?
- [ ] La nationalité est-elle en `ReferentielCombobox` ?
- [ ] Le champ email a-t-il été retiré ?

---

**Dernière mise à jour** : 2026-07-30
