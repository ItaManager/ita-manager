/**
 * Utilitaires pour les notifications toast cohérentes dans toute l'application.
 * Basé sur Sonner avec styles personnalisés pour ITA Manager.
 */

import { toast as sonnerToast } from "sonner";

/**
 * Affiche un toast de succès (vert).
 * @param message - Message à afficher
 * @param description - Description optionnelle
 */
export function toastSucces(message: string, description?: string) {
  return sonnerToast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Affiche un toast d'erreur (rouge).
 * @param message - Message à afficher
 * @param description - Description optionnelle
 */
export function toastErreur(message: string, description?: string) {
  return sonnerToast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Affiche un toast d'avertissement (orange/amber).
 * @param message - Message à afficher
 * @param description - Description optionnelle
 */
export function toastAvertissement(message: string, description?: string) {
  return sonnerToast.warning(message, {
    description,
    duration: 4500,
  });
}

/**
 * Affiche un toast d'information (bleu).
 * @param message - Message à afficher
 * @param description - Description optionnelle
 */
export function toastInfo(message: string, description?: string) {
  return sonnerToast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Affiche un toast de chargement (avec spinner).
 * Utile pour les opérations longues.
 * @param message - Message à afficher
 * @returns ID du toast (pour le dismiss)
 */
export function toastChargement(message: string) {
  return sonnerToast.loading(message);
}

/**
 * Ferme un toast spécifique par son ID.
 * @param toastId - ID du toast retourné par toastChargement
 */
export function toastDismiss(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

/**
 * Toast avec action personnalisée (bouton).
 * @param message - Message principal
 * @param actionLabel - Texte du bouton
 * @param onAction - Callback au clic du bouton
 * @param description - Description optionnelle
 */
export function toastAvecAction(
  message: string,
  actionLabel: string,
  onAction: () => void,
  description?: string
) {
  return sonnerToast(message, {
    description,
    action: {
      label: actionLabel,
      onClick: onAction,
    },
    duration: 6000,
  });
}

/**
 * Toast de promesse (affiche loading → success/error automatiquement).
 * @param promise - Promesse à surveiller
 * @param messages - Messages pour loading/success/error
 */
export function toastPromesse<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return sonnerToast.promise(promise, messages);
}

/**
 * Messages de toast prédéfinis pour les opérations courantes.
 */
export const TOAST_MESSAGES = {
  // CRUD
  CREATION_REUSSIE: (entite: string) => `${entite} créé(e) avec succès`,
  MODIFICATION_REUSSIE: (entite: string) => `${entite} modifié(e) avec succès`,
  SUPPRESSION_REUSSIE: (entite: string) => `${entite} supprimé(e) avec succès`,
  ARCHIVAGE_REUSSI: (entite: string) => `${entite} archivé(e) avec succès`,

  // Erreurs
  ERREUR_SERVEUR: "Une erreur serveur est survenue",
  ERREUR_RESEAU: "Erreur de connexion. Vérifiez votre connexion internet.",
  ERREUR_PERMISSION: "Vous n'avez pas les permissions nécessaires",
  ERREUR_VALIDATION: "Certains champs sont invalides",
  ERREUR_DOUBLON: "Cet élément existe déjà",

  // Formulaires
  BROUILLON_SAUVEGARDE: "Brouillon sauvegardé",
  FORMULAIRE_INCOMPLET: "Veuillez remplir tous les champs obligatoires",

  // Fichiers
  FICHIER_UPLOADE: (nom: string) => `${nom} téléversé avec succès`,
  FICHIER_TROP_GROS: (max: string) => `Le fichier dépasse la taille maximale de ${max}`,
  FORMAT_INVALIDE: (formats: string) => `Format invalide. Formats acceptés : ${formats}`,

  // Opérations métier
  MATRICULE_GENERE: (matricule: string) => `Matricule généré : ${matricule}`,
  EMAIL_ENVOYE: (destinataire: string) => `Email envoyé à ${destinataire}`,
  COMPTE_ACTIVE: "Compte activé avec succès",
  COMPTE_DESACTIVE: "Compte désactivé",

  // Confirmations
  ACTION_IRREVERSIBLE: "Cette action est irréversible",
  MODIFICATIONS_NON_SAUVEGARDEES: "Vous avez des modifications non sauvegardées",
} as const;

/**
 * Toast pour les erreurs de Server Actions.
 * Parse automatiquement les erreurs Zod et autres.
 */
export function toastErreurAction(error: any, contexte?: string) {
  let message = TOAST_MESSAGES.ERREUR_SERVEUR;
  let description: string | undefined;

  if (error?.message) {
    message = error.message;
  }

  if (error?.errors && Array.isArray(error.errors)) {
    // Erreurs Zod
    description = error.errors.map((e: any) => e.message).join(", ");
  }

  if (contexte) {
    description = `${contexte}: ${description || message}`;
  }

  return toastErreur(message, description);
}

/**
 * Toast pour les validations de formulaire avec Zod.
 */
export function toastErreursValidation(errors: Record<string, { message: string }>) {
  const messages = Object.values(errors)
    .map((err) => err.message)
    .join(", ");

  return toastErreur(TOAST_MESSAGES.ERREUR_VALIDATION, messages);
}
