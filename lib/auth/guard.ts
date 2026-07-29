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

export const PERMISSIONS = [
  { code: "employe:lire", libelle: "Consulter les employés", domaine: "RH" },
  { code: "employe:creer", libelle: "Créer un employé", domaine: "RH" },
  { code: "employe:modifier", libelle: "Modifier un employé", domaine: "RH" },
  { code: "employe:archiver", libelle: "Archiver un employé", domaine: "RH" },
  {
    code: "employe:donneesSensibles",
    libelle: "Consulter les données sensibles d'un employé",
    domaine: "RH",
  },
  {
    code: "organisation:consulter",
    libelle: "Consulter l'organigramme",
    domaine: "REFERENTIEL",
  },
  {
    code: "organisation:modifier",
    libelle: "Modifier l'organigramme (services, postes)",
    domaine: "REFERENTIEL",
  },
  {
    code: "referentiel:creer",
    libelle: "Créer une valeur de référentiel",
    domaine: "REFERENTIEL",
  },
  { code: "direction:creer", libelle: "Créer une direction", domaine: "REFERENTIEL" },
  {
    code: "posteDirection:affecter",
    libelle: "Affecter un poste à une direction",
    domaine: "REFERENTIEL",
  },
  { code: "absence:demander", libelle: "Demander une absence", domaine: "RH" },
  {
    code: "absence:valider",
    libelle: "Valider une demande d'absence",
    domaine: "RH",
  },
  {
    code: "reglesConges:modifier",
    libelle: "Modifier les règles de congés",
    domaine: "RH",
  },
  { code: "grille:modifier", libelle: "Modifier la grille salariale", domaine: "PAIE" },
  {
    code: "derogation:valider",
    libelle: "Valider une dérogation salariale",
    domaine: "PAIE",
  },
  {
    code: "paie:ouvrirPeriode",
    libelle: "Ouvrir une période de paie",
    domaine: "PAIE",
  },
  {
    code: "paie:validerDT",
    libelle: "Valider la paie (Direction Technique)",
    domaine: "PAIE",
  },
  { code: "paie:validerDFC", libelle: "Valider la paie (DFC)", domaine: "PAIE" },
  { code: "paie:exporter", libelle: "Exporter la paie", domaine: "PAIE" },
  { code: "ao:creer", libelle: "Créer un appel d'offres", domaine: "TECHNIQUE" },
  {
    code: "ao:soumettre",
    libelle: "Soumettre un appel d'offres",
    domaine: "TECHNIQUE",
  },
  {
    code: "ao:validerDG",
    libelle: "Valider un appel d'offres (Direction Générale)",
    domaine: "TECHNIQUE",
  },
  { code: "projet:creer", libelle: "Créer un projet", domaine: "TECHNIQUE" },
  {
    code: "planning:modifier",
    libelle: "Modifier le planning",
    domaine: "TECHNIQUE",
  },
  { code: "jalon:valider", libelle: "Valider un jalon", domaine: "TECHNIQUE" },
  {
    code: "releve:saisir",
    libelle: "Saisir un relevé d'activité",
    domaine: "TECHNIQUE",
  },
  {
    code: "releve:viser",
    libelle: "Viser un relevé d'activité",
    domaine: "TECHNIQUE",
  },
  {
    code: "ressource:demander",
    libelle: "Demander une ressource",
    domaine: "TECHNIQUE",
  },
  {
    code: "admin:utilisateurs",
    libelle: "Administrer les utilisateurs",
    domaine: "ADMIN",
  },
  {
    code: "admin:parametres",
    libelle: "Administrer les paramètres",
    domaine: "ADMIN",
  },
  {
    code: "admin:journal",
    libelle: "Consulter le journal d'audit",
    domaine: "ADMIN",
  },
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number]["code"];

export class PermissionRefusee extends Error {
  constructor(code: PermissionCode) {
    super(`Permission refusée : ${code}`);
    this.name = "PermissionRefusee";
  }
}

async function journaliserRefus(code: PermissionCode, userId: string | null, email: string | null) {
  await prisma.journalEvenement.create({
    data: {
      entite: "Permission",
      entiteId: userId ?? "anonyme",
      action: "REFUS",
      auteurId: userId,
      auteurNom: email ?? "anonyme",
      commentaire: `Permission refusée : ${code}`,
    },
  });
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
