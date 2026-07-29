// Seed M0 — rôles, permissions, compte Super Admin (M0-SOCLE.md §5, §9 ;
// DECISIONS.md C-01/C-02). Idempotent : rejouable sans erreur ni doublon
// (upsert partout côté Prisma, vérification d'existence côté Supabase
// Admin avant createUser).
//
// M0 ne crée aucun employé réel (BRIEF-CLAUDE-CODE.md, « ce que tu ne
// décides pas seul ») — le seul compte créé est le Super Admin, un
// accès technique de maintenance sans Employe rattaché (C-02).

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/db/prisma";
import { PERMISSIONS } from "../lib/auth/guard";

const ROLES = [
  {
    code: "ADMIN",
    libelle: "Super Admin",
    description: "Tout, y compris règles et référentiels",
  },
  {
    code: "DG",
    libelle: "Directeur Général",
    description: "Go/no-go et visa des appels d'offres",
  },
  {
    code: "DRH",
    libelle: "Directrice Administrative et RH",
    description: "Employés, congés, dossiers, dérogations",
  },
  { code: "RH", libelle: "Assistant RH", description: "Saisie sans validation" },
  {
    code: "DFC",
    libelle: "Directeur Financier",
    description: "Grille salariale, dérogations, paiement",
  },
  {
    code: "DT",
    libelle: "Directeur Technique",
    description: "Projets, planning, jalons, présences",
  },
  {
    code: "CT",
    libelle: "Conducteur de Travaux",
    description: "Planning, visa des relevés",
  },
  {
    code: "CC",
    libelle: "Chef de Chantier",
    description: "Saisie des relevés, demandes de ressources",
  },
  { code: "CE", libelle: "Chargé d'études", description: "Appels d'offres" },
] as const;

// Matrice rôle × permission (M0-SOCLE.md §5), transcrite verbatim.
const MATRICE: Record<string, readonly string[]> = {
  "employe:lire": ["ADMIN", "DG", "DRH", "RH", "DFC", "DT", "CT"],
  "employe:creer": ["ADMIN", "DRH", "RH"],
  "employe:modifier": ["ADMIN", "DRH", "RH"],
  "employe:archiver": ["ADMIN", "DRH"],
  "employe:donneesSensibles": ["ADMIN", "DG", "DRH", "DFC"],
  "referentiel:creer": ["ADMIN", "DRH", "DT"],
  "direction:creer": ["ADMIN"],
  "posteDirection:affecter": ["ADMIN"],
  "absence:demander": ["ADMIN", "DG", "DRH", "RH", "DFC", "DT", "CT", "CC", "CE"],
  "absence:valider": ["ADMIN", "DRH"],
  "reglesConges:modifier": ["ADMIN"],
  "grille:modifier": ["ADMIN", "DFC"],
  "derogation:valider": ["ADMIN", "DFC"],
  "paie:ouvrirPeriode": ["ADMIN", "DRH", "RH"],
  "paie:validerDT": ["ADMIN", "DT"],
  "paie:validerDFC": ["ADMIN", "DFC"],
  "paie:exporter": ["ADMIN", "DFC"],
  "ao:creer": ["ADMIN", "DG", "DT", "CE"],
  "ao:soumettre": ["ADMIN", "DG", "DT"],
  "ao:validerDG": ["ADMIN", "DG"],
  "projet:creer": ["ADMIN", "DG", "DT"],
  "planning:modifier": ["ADMIN", "DT", "CT"],
  "jalon:valider": ["ADMIN", "DG", "DT"],
  "releve:saisir": ["ADMIN", "CT", "CC"],
  "releve:viser": ["ADMIN", "DT", "CT"],
  "ressource:demander": ["ADMIN", "DT", "CT", "CC"],
  "admin:utilisateurs": ["ADMIN", "DRH"],
  "admin:parametres": ["ADMIN"],
  "admin:journal": ["ADMIN"],
};

// Compte Super Admin — accès technique de maintenance, sans Employe
// rattaché (C-02). Identifiant historique `itajoy`, conservé pour
// mémoire (C-02) : c'était l'identifiant du compte équivalent dans
// l'ancienne application ITA Digital, abandonnée.
const SUPER_ADMIN_EMAIL = "armelgnakpa7@gmail.com";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function seedPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      create: permission,
      update: { libelle: permission.libelle, domaine: permission.domaine },
    });
  }
  console.log(`  ${PERMISSIONS.length} permissions`);
}

async function seedRoles() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: { ...role, systeme: true },
      update: { libelle: role.libelle, description: role.description },
    });
  }
  console.log(`  ${ROLES.length} rôles`);
}

async function seedRolePermissions() {
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const roleId = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  const permissionId = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

  let count = 0;
  for (const [permissionCode, roleCodes] of Object.entries(MATRICE)) {
    for (const roleCode of roleCodes) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleId[roleCode],
            permissionId: permissionId[permissionCode],
          },
        },
        create: { roleId: roleId[roleCode], permissionId: permissionId[permissionCode] },
        update: {},
      });
      count++;
    }
  }
  console.log(`  ${count} attributions rôle × permission`);
}

async function seedSuperAdmin() {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  let userId = existing?.users.find((u) => u.email === SUPER_ADMIN_EMAIL)?.id;

  if (!userId) {
    const motDePasseTemporaire = randomBytes(18).toString("base64url");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: motDePasseTemporaire,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Échec de création du compte Super Admin : ${error?.message}`);
    }
    userId = data.user.id;

    console.log(`\n  Compte Super Admin créé : ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Mot de passe temporaire (à noter, affiché une seule fois) :`);
    console.log(`  ${motDePasseTemporaire}\n`);

    // Le trigger auth.users -> profils (migration 20260729103725) crée la
    // ligne `profils` correspondante. On attend qu'elle soit visible avant
    // de continuer (réplication du pooler).
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Journalisé uniquement à la création réelle du compte — sinon un
    // rejeu du seed (idempotent par ailleurs) dupliquerait cette entrée
    // à chaque exécution.
    await prisma.journalEvenement.create({
      data: {
        entite: "Profil",
        entiteId: userId,
        action: "CREATION",
        auteurId: null,
        auteurNom: "Amorçage système (seed M0)",
        commentaire: "Création du compte Super Admin d'amorçage et attribution du rôle ADMIN.",
      },
    });
  } else {
    console.log(`  Compte Super Admin déjà existant : ${SUPER_ADMIN_EMAIL}`);
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });

  await prisma.profilRole.upsert({
    where: { profilId_roleId: { profilId: userId, roleId: adminRole.id } },
    create: { profilId: userId, roleId: adminRole.id },
    update: {},
  });

  console.log(`  Rôle ADMIN attribué au Super Admin`);
}

async function main() {
  console.log("Seed M0 — début");
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedSuperAdmin();
  console.log("Seed M0 — terminé");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
