// Catalogue des permissions applicatives (M0-SOCLE.md §5) — transcrit
// verbatim, ne pas modifier sans validation (BRIEF-CLAUDE-CODE.md,
// « ce que tu ne décides pas seul »).
//
// `exigerPermission` et `actionProtegee` ci-dessous sont une version
// minimale, avancée de l'étape 0.5 à l'étape 0.4 parce que la
// réinitialisation du second facteur par le Super Admin (0.4) est une
// Server Action réservée et doit, comme toute Server Action, respecter
// l'exigence bloquante n°1 de BRIEF-CLAUDE-CODE.md dès sa création — pas
// de fenêtre où elle existerait sans garde. Les 3 garde-fous en dur
// (retirerRole/desactiverProfil) et les pages /403 /404 restent prévus
// pour l'étape 0.5, avec les écrans d'administration qui les rendent
// pertinents.

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export const PERMISSIONS = {
  "employe:lire": { code: "employe:lire", libelle: "Consulter les employés", domaine: "RH" },
  "employe:creer": { code: "employe:creer", libelle: "Créer un employé", domaine: "RH" },
  "employe:modifier": { code: "employe:modifier", libelle: "Modifier un employé", domaine: "RH" },
  "employe:archiver": { code: "employe:archiver", libelle: "Archiver un employé", domaine: "RH" },
  "employe:donneesSensibles": {
    code: "employe:donneesSensibles",
    libelle: "Consulter les données sensibles d'un employé",
    domaine: "RH",
  },
  "referentiel:creer": {
    code: "referentiel:creer",
    libelle: "Créer une valeur de référentiel",
    domaine: "REFERENTIEL",
  },
  "direction:creer": { code: "direction:creer", libelle: "Créer une direction", domaine: "REFERENTIEL" },
  "posteDirection:affecter": {
    code: "posteDirection:affecter",
    libelle: "Affecter un poste à une direction",
    domaine: "REFERENTIEL",
  },
  "absence:demander": { code: "absence:demander", libelle: "Demander une absence", domaine: "RH" },
  "absence:valider": {
    code: "absence:valider",
    libelle: "Valider une demande d'absence",
    domaine: "RH",
  },
  "reglesConges:modifier": {
    code: "reglesConges:modifier",
    libelle: "Modifier les règles de congés",
    domaine: "ADMIN",
  },
  "grille:modifier": { code: "grille:modifier", libelle: "Modifier la grille salariale", domaine: "PAIE" },
  "derogation:valider": {
    code: "derogation:valider",
    libelle: "Valider une dérogation salariale",
    domaine: "PAIE",
  },
  "paie:ouvrirPeriode": {
    code: "paie:ouvrirPeriode",
    libelle: "Ouvrir une période de paie",
    domaine: "PAIE",
  },
  "paie:validerDT": {
    code: "paie:validerDT",
    libelle: "Valider la paie (Direction Technique)",
    domaine: "PAIE",
  },
  "paie:validerDFC": { code: "paie:validerDFC", libelle: "Valider la paie (DFC)", domaine: "PAIE" },
  "paie:exporter": { code: "paie:exporter", libelle: "Exporter la paie", domaine: "PAIE" },
  "ao:creer": { code: "ao:creer", libelle: "Créer un appel d'offres", domaine: "TECHNIQUE" },
  "ao:soumettre": {
    code: "ao:soumettre",
    libelle: "Soumettre un appel d'offres",
    domaine: "TECHNIQUE",
  },
  "ao:validerDG": {
    code: "ao:validerDG",
    libelle: "Valider un appel d'offres (Direction Générale)",
    domaine: "TECHNIQUE",
  },
  "projet:creer": { code: "projet:creer", libelle: "Créer un projet", domaine: "TECHNIQUE" },
  "planning:modifier": {
    code: "planning:modifier",
    libelle: "Modifier le planning",
    domaine: "TECHNIQUE",
  },
  "jalon:valider": { code: "jalon:valider", libelle: "Valider un jalon", domaine: "TECHNIQUE" },
  "releve:saisir": {
    code: "releve:saisir",
    libelle: "Saisir un relevé d'activité",
    domaine: "TECHNIQUE",
  },
  "releve:viser": {
    code: "releve:viser",
    libelle: "Viser un relevé d'activité",
    domaine: "TECHNIQUE",
  },
  "ressource:demander": {
    code: "ressource:demander",
    libelle: "Demander une ressource",
    domaine: "TECHNIQUE",
  },
  "admin:utilisateurs": {
    code: "admin:utilisateurs",
    libelle: "Administrer les utilisateurs",
    domaine: "ADMIN",
  },
  "admin:parametres": {
    code: "admin:parametres",
    libelle: "Administrer les paramètres",
    domaine: "ADMIN",
  },
  "admin:journal": {
    code: "admin:journal",
    libelle: "Consulter le journal d'audit",
    domaine: "ADMIN",
  },
  "presence:gererCodes": {
    code: "presence:gererCodes",
    libelle: "Gérer les codes de pointage",
    domaine: "ADMIN",
  },
  "presence:gererBornes": {
    code: "presence:gererBornes",
    libelle: "Gérer les appareils de pointage",
    domaine: "ADMIN",
  },
  "presence:corriger": {
    code: "presence:corriger",
    libelle: "Corriger un pointage",
    domaine: "RH",
  },
  // M14 — Achats
  "achat:demander": {
    code: "achat:demander",
    libelle: "Créer une demande d'achat",
    domaine: "TECHNIQUE",
  },
  "achat:instruire": {
    code: "achat:instruire",
    libelle: "Instruire une demande d'achat (prix, fournisseurs)",
    domaine: "TECHNIQUE",
  },
  "achat:valider": {
    code: "achat:valider",
    libelle: "Valider une demande au comité",
    domaine: "TECHNIQUE",
  },
  "achat:receptionner": {
    code: "achat:receptionner",
    libelle: "Réceptionner et contrôler une livraison",
    domaine: "TECHNIQUE",
  },
  "achat:facturer": {
    code: "achat:facturer",
    libelle: "Enregistrer facture et paiement",
    domaine: "PAIE",
  },
  "achat:regulariser": {
    code: "achat:regulariser",
    libelle: "Créer une régularisation d'achat",
    domaine: "TECHNIQUE",
  },
  "achat:parametres": {
    code: "achat:parametres",
    libelle: "Modifier les paramètres d'achat (seuils, plafonds)",
    domaine: "ADMIN",
  },
  // M15 — ItaPay
  "paiement:consulter": {
    code: "paiement:consulter",
    libelle: "Consulter les paiements",
    domaine: "PAIEMENT",
  },
  "paiement:preparer": {
    code: "paiement:preparer",
    libelle: "Préparer une demande de paiement",
    domaine: "PAIEMENT",
  },
  "paiement:autoriser": {
    code: "paiement:autoriser",
    libelle: "Autoriser un paiement",
    domaine: "PAIEMENT",
  },
  "paiement:executer": {
    code: "paiement:executer",
    libelle: "Exécuter un paiement",
    domaine: "PAIEMENT",
  },
  "paiement:annuler": {
    code: "paiement:annuler",
    libelle: "Annuler un paiement (< 3 jours)",
    domaine: "PAIEMENT",
  },
  "paiement:parametres": {
    code: "paiement:parametres",
    libelle: "Configurer les paramètres de paiement",
    domaine: "PAIEMENT",
  },
  // M13 — Logistique
  "materiel:lire": {
    code: "materiel:lire",
    libelle: "Consulter le registre matériel et les échéances",
    domaine: "TECHNIQUE",
  },
  "materiel:creer": {
    code: "materiel:creer",
    libelle: "Créer une fiche matériel",
    domaine: "TECHNIQUE",
  },
  "materiel:modifier": {
    code: "materiel:modifier",
    libelle: "Modifier une fiche matériel",
    domaine: "TECHNIQUE",
  },
  "typePiece:gerer": {
    code: "typePiece:gerer",
    libelle: "Créer et désactiver un type de pièce administrative",
    domaine: "TECHNIQUE",
  },
  "materiel:coutsAdministratifs": {
    code: "materiel:coutsAdministratifs",
    libelle: "Consulter les coûts d'acquisition et montants des pièces",
    domaine: "TECHNIQUE",
  },
  "logistique:parametres": {
    code: "logistique:parametres",
    libelle: "Configurer les paramètres logistiques (seuils, délais)",
    domaine: "ADMIN",
  },
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

export class PermissionRefusee extends Error {
  constructor(code: PermissionCode) {
    super(`Permission refusée : ${code}`);
    this.name = "PermissionRefusee";
  }
}

async function journaliserRefus(code: PermissionCode, userId: string | null, email: string | null) {
  try {
    // Vérifier si le profil existe avant de journaliser
    let auteurId: string | null = null;
    if (userId) {
      const profil = await prisma.profil.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      auteurId = profil ? userId : null;
    }

    await prisma.journalEvenement.create({
      data: {
        entite: "Permission",
        entiteId: userId ?? "anonyme",
        action: "REFUS",
        auteurId: auteurId,
        auteurNom: email ?? "anonyme",
        commentaire: `Permission refusée : ${code}`,
      },
    });
  } catch (error) {
    // Échec de journalisation : écrire en console sans remonter
    console.error("[journaliserRefus] Échec de journalisation:", error);
  }
}

/**
 * Authentifie via `getUser()` (jamais `getSession()` — SECURITE.md,
 * exigence bloquante n°2), vérifie que le profil est actif et détient
 * la permission demandée via ses rôles, journalise tout refus — y
 * compris pour un appel non authentifié — avant de lever une erreur.
 */
export async function exigerPermission(
  code: PermissionCode,
): Promise<{ userId: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await journaliserRefus(code, null, null);
    throw new PermissionRefusee(code);
  }

  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
    },
  });

  const autorise =
    !!profil?.actif &&
    profil.roles.some((profilRole) =>
      profilRole.role.permissions.some((rp) => rp.permission.code === code),
    );

  if (!autorise) {
    await journaliserRefus(code, user.id, user.email ?? null);
    throw new PermissionRefusee(code);
  }

  return { userId: user.id, email: user.email ?? "" };
}

/**
 * Vérifier si un utilisateur possède une permission (non bloquant)
 *
 * Contrairement à `exigerPermission`, cette fonction ne lève pas d'erreur
 * et ne journalise pas de refus. À utiliser pour masquer/afficher des
 * éléments optionnels (ex: coûts d'acquisition).
 */
export async function verifierPermission(
  userId: string,
  code: PermissionCode,
): Promise<boolean> {
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
    },
  });

  return (
    !!profil?.actif &&
    profil.roles.some((profilRole) =>
      profilRole.role.permissions.some((rp) => rp.permission.code === code),
    )
  );
}

/**
 * Enveloppe standard de toute Server Action protégée. `exigerPermission`
 * s'exécute avant toute lecture/validation des paramètres reçus
 * (SECURITE.md §4).
 */
export function actionProtegee<Args extends unknown[], Result>(
  code: PermissionCode,
  fn: (session: { userId: string; email: string }, ...args: Args) => Promise<Result>,
) {
  return async (...args: Args): Promise<Result> => {
    const session = await exigerPermission(code);
    return fn(session, ...args);
  };
}
