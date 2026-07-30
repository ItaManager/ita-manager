# Système de Notifications Toast - ITA Manager

Ce fichier documente l'utilisation du système de toast unifié dans l'application.

## Import

```typescript
import {
  toastSucces,
  toastErreur,
  toastAvertissement,
  toastInfo,
  toastChargement,
  toastDismiss,
  toastAvecAction,
  toastPromesse,
  toastErreurAction,
  TOAST_MESSAGES,
} from "@/lib/utils/toast";
```

## Fonctions de base

### 1. Toast de succès (vert)
```typescript
toastSucces("Opération réussie");
toastSucces("Employé créé", "Matricule : ITA-2026-0001");
```

### 2. Toast d'erreur (rouge)
```typescript
toastErreur("Échec de l'opération");
toastErreur("Erreur de validation", "Vérifiez les champs obligatoires");
```

### 3. Toast d'avertissement (orange)
```typescript
toastAvertissement("Attention");
toastAvertissement("Modifications non sauvegardées", "Cliquez sur Enregistrer");
```

### 4. Toast d'information (bleu)
```typescript
toastInfo("Information");
toastInfo("Nouvelle fonctionnalité", "Découvrez le nouvel export PDF");
```

## Fonctions avancées

### Toast de chargement

```typescript
// Afficher un loader
const toastId = toastChargement("Envoi en cours...");

// Plus tard, fermer le loader
toastDismiss(toastId);
```

### Toast avec action (bouton)

```typescript
toastAvecAction(
  "Employé archivé",
  "Annuler",
  () => {
    // Logique d'annulation
    restaurerEmploye(id);
  },
  "Vous pouvez annuler cette action pendant 5 secondes"
);
```

### Toast pour les promesses

Affiche automatiquement loading → success/error :

```typescript
toastPromesse(
  fetchData(),
  {
    loading: "Chargement...",
    success: "Données chargées",
    error: "Échec du chargement",
  }
);

// Avec fonction pour personnaliser le message
toastPromesse(
  creerEmploye(data),
  {
    loading: "Création en cours...",
    success: (result) => `Employé créé : ${result.matricule}`,
    error: (err) => `Erreur : ${err.message}`,
  }
);
```

## Messages prédéfinis

Utilisez `TOAST_MESSAGES` pour des messages cohérents :

```typescript
// CRUD
toastSucces(TOAST_MESSAGES.CREATION_REUSSIE("Employé"));
toastSucces(TOAST_MESSAGES.MODIFICATION_REUSSIE("Contrat"));
toastSucces(TOAST_MESSAGES.SUPPRESSION_REUSSIE("Document"));
toastSucces(TOAST_MESSAGES.ARCHIVAGE_REUSSI("Profil"));

// Erreurs courantes
toastErreur(TOAST_MESSAGES.ERREUR_SERVEUR);
toastErreur(TOAST_MESSAGES.ERREUR_PERMISSION);
toastErreur(TOAST_MESSAGES.ERREUR_VALIDATION);
toastErreur(TOAST_MESSAGES.ERREUR_DOUBLON);

// Formulaires
toastSucces(TOAST_MESSAGES.BROUILLON_SAUVEGARDE);
toastAvertissement(TOAST_MESSAGES.FORMULAIRE_INCOMPLET);

// Fichiers
toastSucces(TOAST_MESSAGES.FICHIER_UPLOADE("CV.pdf"));
toastErreur(TOAST_MESSAGES.FICHIER_TROP_GROS("10 Mo"));
toastErreur(TOAST_MESSAGES.FORMAT_INVALIDE("PDF, JPG, PNG"));

// Opérations métier
toastSucces(TOAST_MESSAGES.MATRICULE_GENERE("ITA-2026-0042"));
toastSucces(TOAST_MESSAGES.EMAIL_ENVOYE("employe@ita.ci"));
toastSucces(TOAST_MESSAGES.COMPTE_ACTIVE);
toastInfo(TOAST_MESSAGES.COMPTE_DESACTIVE);
```

## Gestion des erreurs Server Actions

Pour les erreurs de Server Actions avec parsing automatique :

```typescript
try {
  const result = await monAction(data);
  toastSucces("Succès");
} catch (error) {
  toastErreurAction(error);
  // ou avec contexte
  toastErreurAction(error, "Création employé");
}
```

Pour les erreurs de validation Zod :

```typescript
const { errors } = form.formState;
if (Object.keys(errors).length > 0) {
  toastErreursValidation(errors);
}
```

## Exemples d'utilisation réelle

### Exemple 1 : Création d'employé

```typescript
const onSubmit = async (data: FormData) => {
  try {
    const result = await creerEmploye(data);

    if (result.success) {
      toastSucces(
        TOAST_MESSAGES.CREATION_REUSSIE("Employé"),
        `Matricule : ${result.matricule}`
      );
      router.push(`/employes/${result.id}`);
    }
  } catch (error) {
    toastErreurAction(error, "Création employé");
  }
};
```

### Exemple 2 : Upload de fichier avec progression

```typescript
const handleUpload = async (file: File) => {
  const loadingId = toastChargement(`Upload de ${file.name}...`);

  try {
    await uploadDocument(file);
    toastDismiss(loadingId);
    toastSucces(TOAST_MESSAGES.FICHIER_UPLOADE(file.name));
  } catch (error) {
    toastDismiss(loadingId);
    toastErreur("Échec de l'upload", error.message);
  }
};
```

### Exemple 3 : Action avec confirmation

```typescript
const supprimerEmploye = async (id: string) => {
  toastAvecAction(
    "Êtes-vous sûr ?",
    "Confirmer",
    async () => {
      await deleteEmploye(id);
      toastSucces(TOAST_MESSAGES.SUPPRESSION_REUSSIE("Employé"));
    },
    TOAST_MESSAGES.ACTION_IRREVERSIBLE
  );
};
```

### Exemple 4 : Validation de formulaire

```typescript
const { register, formState: { errors } } = useForm();

const onSubmit = (data) => {
  if (Object.keys(errors).length > 0) {
    toastErreursValidation(errors);
    return;
  }
  // Continuer...
};
```

## Durées par défaut

- **Succès** : 4 secondes
- **Erreur** : 5 secondes
- **Avertissement** : 4.5 secondes
- **Info** : 4 secondes
- **Avec action** : 6 secondes

## Bonnes pratiques

1. **Toujours donner du contexte** : Préférez `toastSucces("Employé créé", "Matricule : ...")` à `toastSucces("Succès")`

2. **Utilisez les messages prédéfinis** : `TOAST_MESSAGES` garantit la cohérence

3. **Ne dupliquez pas les erreurs** : Si le Server Action renvoie déjà un message d'erreur clair, utilisez `toastErreurAction(error)`

4. **Toast de chargement pour opérations longues** : Au-delà de 500ms, affichez un loader

5. **Actions critiques = Toast avec action** : Donnez la possibilité d'annuler (archivage, suppression)

6. **Pas de toast pour les validations côté client** : Laissez les messages d'erreur inline près des champs

## Configuration globale

Le composant `<Toaster />` est configuré dans `app/layout.tsx` et s'applique à toute l'application.

Personnalisation possible dans `components/ui/sonner.tsx` (couleurs, position, etc.).
