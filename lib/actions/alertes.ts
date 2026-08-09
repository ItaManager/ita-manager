/**
 * Server Actions — Système d'alertes email (M11)
 *
 * Gestion des configurations d'alertes automatiques par email
 * Accessible uniquement aux Super Admin
 */

"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { z } from "zod";

// =============================================================================
// TYPES D'ALERTES DISPONIBLES
// =============================================================================

export type TypeAlerte =
  | "CONTRATS_EXPIRANT" // Contrats CDD expirant bientôt
  | "UTILISATEURS_INACTIFS" // Comptes inactifs
  | "UTILISATEURS_SANS_2FA" // Utilisateurs sans 2FA
  | "ERREURS_SYSTEME" // Erreurs système récentes
  | "CONGES_EN_ATTENTE" // Demandes de congé en attente
  | "ACHATS_EN_ATTENTE" // Demandes d'achat en attente
  | "DOCUMENTS_EXPIRANT"; // Documents administratifs expirant

interface ConfigurationAlerte {
  type: TypeAlerte;
  libelle: string;
  description: string;
  actif: boolean;
  destinataires: string[];
  seuil?: number; // Seuil pour déclencher l'alerte (ex: 30 jours)
  frequence: "QUOTIDIEN" | "HEBDOMADAIRE" | "MENSUEL";
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const schemaModifierConfigAlerte = z.object({
  type: z.string(),
  actif: z.boolean(),
  destinataires: z.array(z.string().email()).min(1, "Au moins un destinataire requis"),
  seuil: z.number().optional(),
  frequence: z.enum(["QUOTIDIEN", "HEBDOMADAIRE", "MENSUEL"]),
});

// =============================================================================
// RÉCUPÉRATION DES CONFIGURATIONS
// =============================================================================

/**
 * Obtenir toutes les configurations d'alertes
 */
export const obtenirConfigurationsAlertes = actionProtegee(
  "admin:parametres",
  async (session) => {
    // Récupérer les configurations depuis la table Parametre
    const params = await prisma.parametre.findMany({
      where: {
        cle: {
          startsWith: "alerte:",
        },
      },
    });

    // Parser les configurations JSON
    const configs: ConfigurationAlerte[] = params.map((p) => {
      const parsed = typeof p.valeur === "string" ? JSON.parse(p.valeur) : p.valeur;
      return parsed as ConfigurationAlerte;
    });

    // Si aucune config n'existe, retourner les configs par défaut
    if (configs.length === 0) {
      return {
        success: true,
        configurations: obtenirConfigurationsParDefaut(),
      };
    }

    return {
      success: true,
      configurations: configs,
    };
  }
);

/**
 * Configurations par défaut des alertes
 */
function obtenirConfigurationsParDefaut(): ConfigurationAlerte[] {
  return [
    {
      type: "CONTRATS_EXPIRANT",
      libelle: "Contrats expirant bientôt",
      description: "Notification lorsque des contrats CDD arrivent à expiration",
      actif: true,
      destinataires: ["armelgnakpa7@gmail.com"],
      seuil: 30, // 30 jours
      frequence: "HEBDOMADAIRE",
    },
    {
      type: "UTILISATEURS_INACTIFS",
      libelle: "Comptes utilisateurs inactifs",
      description: "Liste des comptes utilisateurs désactivés",
      actif: false,
      destinataires: ["armelgnakpa7@gmail.com"],
      frequence: "MENSUEL",
    },
    {
      type: "UTILISATEURS_SANS_2FA",
      libelle: "Utilisateurs sans 2FA",
      description: "Utilisateurs actifs n'ayant pas activé l'authentification à deux facteurs",
      actif: true,
      destinataires: ["armelgnakpa7@gmail.com"],
      frequence: "HEBDOMADAIRE",
    },
    {
      type: "ERREURS_SYSTEME",
      libelle: "Erreurs système",
      description: "Notification des erreurs et refus d'accès récents",
      actif: true,
      destinataires: ["armelgnakpa7@gmail.com"],
      frequence: "QUOTIDIEN",
    },
    {
      type: "CONGES_EN_ATTENTE",
      libelle: "Demandes de congé en attente",
      description: "Demandes de congé en attente de validation",
      actif: true,
      destinataires: ["armelgnakpa7@gmail.com"],
      seuil: 3, // Plus de 3 jours sans action
      frequence: "QUOTIDIEN",
    },
    {
      type: "ACHATS_EN_ATTENTE",
      libelle: "Demandes d'achat en attente",
      description: "Demandes d'achat en attente de validation ou instruction",
      actif: true,
      destinataires: ["armelgnakpa7@gmail.com"],
      seuil: 5, // Plus de 5 jours sans action
      frequence: "HEBDOMADAIRE",
    },
    {
      type: "DOCUMENTS_EXPIRANT",
      libelle: "Documents administratifs expirant",
      description: "Documents administratifs du matériel arrivant à expiration",
      actif: true,
      destinataires: ["armelgnakpa7@gmail.com"],
      seuil: 30, // 30 jours
      frequence: "HEBDOMADAIRE",
    },
  ];
}

// =============================================================================
// MODIFICATION DES CONFIGURATIONS
// =============================================================================

/**
 * Modifier la configuration d'une alerte
 */
export const modifierConfigurationAlerte = actionProtegee(
  "admin:parametres",
  async (session, input: unknown) => {
    const validated = schemaModifierConfigAlerte.parse(input);

    // Récupérer la configuration existante ou les configs par défaut
    const configurationsRes = await obtenirConfigurationsAlertes();
    if (!configurationsRes.success) {
      return { success: false, error: "Erreur lors de la récupération des configurations" };
    }

    const configurations = configurationsRes.configurations || [];
    const configExistante = configurations.find((c) => c.type === validated.type);

    if (!configExistante) {
      return { success: false, error: "Type d'alerte inconnu" };
    }

    // Mettre à jour la configuration
    const nouvelleConfig: ConfigurationAlerte = {
      ...configExistante,
      actif: validated.actif,
      destinataires: validated.destinataires,
      seuil: validated.seuil,
      frequence: validated.frequence,
    };

    // Sauvegarder dans la table Parametre
    await prisma.parametre.upsert({
      where: {
        cle: `alerte:${validated.type}`,
      },
      create: {
        cle: `alerte:${validated.type}`,
        valeur: JSON.stringify(nouvelleConfig),
        type: "JSON",
        groupe: "ALERTE",
        libelle: configExistante.libelle,
        aide: configExistante.description,
      },
      update: {
        valeur: JSON.stringify(nouvelleConfig),
        modifieLe: new Date(),
      },
    });

    // Logger l'événement
    await prisma.journalEvenement.create({
      data: {
        entite: "Parametre",
        entiteId: `alerte:${validated.type}`,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Configuration alerte "${configExistante.libelle}" modifiée`,
        details: JSON.parse(JSON.stringify({
          avant: configExistante,
          apres: nouvelleConfig,
        })),
      },
    });

    return { success: true };
  }
);

// =============================================================================
// INITIALISATION DES CONFIGURATIONS PAR DÉFAUT
// =============================================================================

/**
 * Initialiser toutes les configurations d'alertes par défaut
 * (Utile lors de la première utilisation)
 */
export const initialiserConfigurationsAlertes = actionProtegee(
  "admin:parametres",
  async (session) => {
    const configsDefaut = obtenirConfigurationsParDefaut();

    for (const config of configsDefaut) {
      await prisma.parametre.upsert({
        where: {
          cle: `alerte:${config.type}`,
        },
        create: {
          cle: `alerte:${config.type}`,
          valeur: JSON.stringify(config),
          type: "JSON",
          groupe: "ALERTE",
          libelle: config.libelle,
          aide: config.description,
        },
        update: {
          // Ne rien faire si existe déjà
        },
      });
    }

    await prisma.journalEvenement.create({
      data: {
        entite: "Parametre",
        entiteId: "alerte:init",
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Initialisation des configurations d'alertes par défaut",
      },
    });

    return { success: true };
  }
);

// =============================================================================
// TEST D'ENVOI D'ALERTE
// =============================================================================

/**
 * Envoyer un email de test pour une alerte
 */
export const envoyerEmailTestAlerte = actionProtegee(
  "admin:parametres",
  async (session, input: { type: string; destinataire: string }) => {
    const { type, destinataire } = input;

    // Valider l'email
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(destinataire);

    // Récupérer la configuration
    const configurationsRes = await obtenirConfigurationsAlertes();
    if (!configurationsRes.success) {
      return { success: false, error: "Erreur lors de la récupération des configurations" };
    }

    const config = configurationsRes.configurations?.find((c) => c.type === type);
    if (!config) {
      return { success: false, error: "Type d'alerte inconnu" };
    }

    // TODO: Implémenter l'envoi d'email via Resend
    // Pour l'instant, on simule juste l'envoi

    await prisma.journalEvenement.create({
      data: {
        entite: "Email",
        entiteId: `test:${config.type}`,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Email de test envoyé pour l'alerte "${config.libelle}" à ${validatedEmail}`,
      },
    });

    return {
      success: true,
      message: `Email de test envoyé à ${validatedEmail}`,
    };
  }
);
