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
import { prismaDirect as prisma } from "../scripts/lib/prisma-direct";
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
  "referentiel:creer": ["ADMIN", "DRH", "DT"], // M1: créer services et postes
  "direction:creer": ["ADMIN"], // M1: Super Admin seul
  "posteDirection:affecter": ["ADMIN"], // M1: Super Admin seul
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
  const permissionsList = Object.values(PERMISSIONS);
  const codesAttendu = new Set(permissionsList.map((p) => p.code));

  // Upsert des permissions du catalogue
  for (const permission of permissionsList) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      create: permission,
      update: { libelle: permission.libelle, domaine: permission.domaine },
    });
  }

  // Nettoyage des permissions obsolètes (retirées du catalogue)
  const permissionsEnBase = await prisma.permission.findMany({
    select: { code: true, id: true },
  });

  const obsoletes = permissionsEnBase.filter(
    (p) => !codesAttendu.has(p.code)
  );

  if (obsoletes.length > 0) {
    console.log(
      `\n  ⚠️  ${obsoletes.length} permission(s) obsolète(s) retirée(s) :`
    );
    obsoletes.forEach((p) => console.log(`     - ${p.code}`));

    // Suppression avec cascade (role_permissions supprimés automatiquement)
    await prisma.permission.deleteMany({
      where: { id: { in: obsoletes.map((p) => p.id) } },
    });
  }

  console.log(`  ${permissionsList.length} permissions`);
}

async function seedRoles() {
  const codesAttendu = new Set(ROLES.map((r) => r.code));

  // Upsert des rôles du registre
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: { ...role, systeme: true },
      update: { libelle: role.libelle, description: role.description },
    });
  }

  // Nettoyage des rôles obsolètes (retirés du registre)
  // ATTENTION : ne touche que les rôles systeme = true (référentiels)
  const rolesEnBase = await prisma.role.findMany({
    where: { systeme: true },
    select: { code: true, id: true },
  });

  const obsoletes = rolesEnBase.filter((r) => !codesAttendu.has(r.code));

  if (obsoletes.length > 0) {
    console.log(
      `\n  ⚠️  ${obsoletes.length} rôle(s) obsolète(s) retiré(s) :`
    );
    obsoletes.forEach((r) => console.log(`     - ${r.code}`));

    // Suppression avec cascade (profil_roles et role_permissions supprimés)
    await prisma.role.deleteMany({
      where: { id: { in: obsoletes.map((r) => r.id) } },
    });
  }

  console.log(`  ${ROLES.length} rôles`);
}

async function seedRolePermissions() {
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const roleId = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  const permissionId = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

  // Contrôle bidirectionnel : MATRICE ↔ PERMISSIONS doivent être synchrones
  const codesPermissionsCatalogue = Object.keys(PERMISSIONS);
  const codesPermissionsMatrice = Object.keys(MATRICE);

  // 1. Permissions dans MATRICE absentes du catalogue
  const permissionsInconnues = codesPermissionsMatrice.filter(
    (code) => !codesPermissionsCatalogue.includes(code)
  );

  // 2. Permissions au catalogue absentes de MATRICE (donc inutilisables)
  const permissionsSansRole = codesPermissionsCatalogue.filter(
    (code) => !codesPermissionsMatrice.includes(code)
  );

  let erreurs = false;

  if (permissionsInconnues.length > 0) {
    console.error("\n❌ ERREUR SEED : Permissions dans MATRICE absentes du catalogue PERMISSIONS:");
    permissionsInconnues.forEach((code) => console.error(`   - ${code}`));
    erreurs = true;
  }

  if (permissionsSansRole.length > 0) {
    console.error("\n❌ ERREUR SEED : Permissions au catalogue non attribuées à un rôle (inutilisables):");
    permissionsSansRole.forEach((code) => console.error(`   - ${code}`));
    erreurs = true;
  }

  if (erreurs) {
    console.error("\nLe seed ne peut continuer avec une divergence catalogue/matrice.");
    process.exit(1);
  }

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

// =====================================================================
// SEED M1 — Organisation (4 directions, 8 services, 30 postes)
// Source : DECISIONS.md A-01 à A-11
// =====================================================================

async function seedDirections() {
  console.log("📋 Seed M1 — Directions");

  const directions = [
    { code: "DG", libelle: "Direction Générale", ordre: 1, reserveAdmin: true },
    { code: "DFC", libelle: "Direction Financière et Comptable", ordre: 2, reserveAdmin: true },
    { code: "DT", libelle: "Direction Technique", ordre: 3, reserveAdmin: true },
    { code: "DAR", libelle: "Direction Administrative et RH", ordre: 4, reserveAdmin: true },
  ];

  for (const dir of directions) {
    await prisma.direction.upsert({
      where: { code: dir.code },
      create: dir,
      update: { libelle: dir.libelle, ordre: dir.ordre },
    });
  }

  console.log(`  ✅ ${directions.length} directions créées`);
}

async function seedServices() {
  console.log("📋 Seed M1 — Services");

  const DG = await prisma.direction.findUniqueOrThrow({ where: { code: "DG" } });
  const DFC = await prisma.direction.findUniqueOrThrow({ where: { code: "DFC" } });
  const DT = await prisma.direction.findUniqueOrThrow({ where: { code: "DT" } });
  const DAR = await prisma.direction.findUniqueOrThrow({ where: { code: "DAR" } });

  const services = [
    // DFC — 2 services
    { code: "ACHATS", libelle: "Service Achats", directionId: DFC.id, ordre: 1 },
    { code: "COMPTA", libelle: "Comptabilité", directionId: DFC.id, ordre: 2 },

    // DT — 5 services
    { code: "ETUDES_AO", libelle: "Études et Appels d'Offres", directionId: DT.id, ordre: 1 },
    { code: "AEP", libelle: "Adduction d'Eau Potable", directionId: DT.id, ordre: 2 },
    { code: "ASSAINISSEMENT", libelle: "Assainissement", directionId: DT.id, ordre: 3 },
    { code: "ROUTES", libelle: "Routes et Voiries", directionId: DT.id, ordre: 4 },
    { code: "LOGISTIQUE", libelle: "Logistique", directionId: DT.id, ordre: 5 },

    // DAR — 1 service
    { code: "QHSE", libelle: "QHSE", directionId: DAR.id, ordre: 1 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      create: service,
      update: { libelle: service.libelle, directionId: service.directionId, ordre: service.ordre },
    });
  }

  console.log(`  ✅ ${services.length} services créés`);
}

async function seedPostes() {
  console.log("📋 Seed M1 — Postes");

  const DG = await prisma.direction.findUniqueOrThrow({ where: { code: "DG" } });
  const DFC = await prisma.direction.findUniqueOrThrow({ where: { code: "DFC" } });
  const DT = await prisma.direction.findUniqueOrThrow({ where: { code: "DT" } });
  const DAR = await prisma.direction.findUniqueOrThrow({ where: { code: "DAR" } });

  const achats = await prisma.service.findUniqueOrThrow({ where: { code: "ACHATS" } });
  const compta = await prisma.service.findUniqueOrThrow({ where: { code: "COMPTA" } });
  const etudesAO = await prisma.service.findUniqueOrThrow({ where: { code: "ETUDES_AO" } });
  const aep = await prisma.service.findUniqueOrThrow({ where: { code: "AEP" } });
  const assainissement = await prisma.service.findUniqueOrThrow({ where: { code: "ASSAINISSEMENT" } });
  const routes = await prisma.service.findUniqueOrThrow({ where: { code: "ROUTES" } });
  const logistique = await prisma.service.findUniqueOrThrow({ where: { code: "LOGISTIQUE" } });
  const qhse = await prisma.service.findUniqueOrThrow({ where: { code: "QHSE" } });

  const postes = [
    // DG — 2 postes sans service
    { code: "DIR_GENERAL", libelle: "Directeur Général", niveau: "DIRECTION", directionId: DG.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },
    { code: "ASST_DG", libelle: "Assistante de Direction", niveau: "SUPPORT", directionId: DG.id, serviceId: null },

    // DFC — 1 direction + 2 postes avec service
    { code: "DIR_FINANCIER", libelle: "Directeur Financier et Comptable", niveau: "DIRECTION", directionId: DFC.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },
    { code: "CHEF_ACHATS", libelle: "Chef de Service Achats", niveau: "CADRE", directionId: DFC.id, serviceId: achats.id },
    { code: "ASST_COMPTABLE", libelle: "Assistant comptable", niveau: "SUPPORT", directionId: DFC.id, serviceId: compta.id },

    // DT — 1 direction + 7 postes chantier + 12 postes services
    { code: "DIR_TECHNIQUE", libelle: "Directeur Technique", niveau: "DIRECTION", directionId: DT.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },

    // Chaîne chantier (sans service)
    { code: "CONDUCTEUR_TRAVAUX", libelle: "Conducteur de Travaux", niveau: "CADRE", directionId: DT.id, serviceId: null },
    { code: "CHEF_CHANTIER", libelle: "Chef Chantier", niveau: "CADRE", directionId: DT.id, serviceId: null },
    { code: "CHEF_CHANTIER_ADJ", libelle: "Chef Chantier Adjoint", niveau: "CADRE", directionId: DT.id, serviceId: null },
    { code: "CHEF_EQUIPE", libelle: "Chef d'équipe", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: null },
    { code: "OUVRIER", libelle: "Ouvrier", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: null, ouvreDroitConges: false },
    { code: "MANOEUVRE", libelle: "Manœuvre", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: null, ouvreDroitConges: false },

    // Services DT
    { code: "CHARGE_ETUDES", libelle: "Chargé d'études et travaux", niveau: "CADRE", directionId: DT.id, serviceId: etudesAO.id },
    { code: "CHEF_AEP", libelle: "Chef de Service AEP", niveau: "CADRE", directionId: DT.id, serviceId: aep.id },
    { code: "CHEF_ASSAINISSEMENT", libelle: "Chef de Service Assainissement", niveau: "CADRE", directionId: DT.id, serviceId: assainissement.id },
    { code: "CHEF_ROUTES", libelle: "Chef de Service Routes et Voiries", niveau: "CADRE", directionId: DT.id, serviceId: routes.id },
    { code: "CHEF_LOGISTIQUE", libelle: "Chef de Service Logistique", niveau: "CADRE", directionId: DT.id, serviceId: logistique.id },
    { code: "CHEF_GARAGE", libelle: "Chef du Garage", niveau: "CADRE", directionId: DT.id, serviceId: logistique.id },
    { code: "GESTIONNAIRE_STOCKS", libelle: "Gestionnaire de stocks", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "MECANICIEN", libelle: "Mécanicien", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "CONDUCTEUR_ENGINS", libelle: "Conducteur d'engins", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "GARDIEN", libelle: "Gardien", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "CHAUFFEUR", libelle: "Chauffeur", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },

    // DAR — 1 direction + 4 postes
    { code: "DIR_ADMIN_RH", libelle: "Directeur Administratif et RH", niveau: "DIRECTION", directionId: DAR.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },
    { code: "ASST_RH", libelle: "Assistant RH", niveau: "SUPPORT", directionId: DAR.id, serviceId: null },
    { code: "COURSIER", libelle: "Coursier", niveau: "SUPPORT", directionId: DAR.id, serviceId: null },
    { code: "TECH_SURFACE", libelle: "Technicien de surface", niveau: "OPERATIONNEL", directionId: DAR.id, serviceId: null },
    { code: "CHEF_QHSE", libelle: "Chef de Service QHSE", niveau: "CADRE", directionId: DAR.id, serviceId: qhse.id },
    { code: "ASST_QHSE", libelle: "Assistant QHSE", niveau: "SUPPORT", directionId: DAR.id, serviceId: qhse.id },
    { code: "RELAIS_QHSE", libelle: "Relais QHSE", niveau: "OPERATIONNEL", directionId: DAR.id, serviceId: qhse.id },
  ];

  // PASSE 1 : Créer tous les postes sans superieurPosteId
  for (const poste of postes) {
    await prisma.poste.upsert({
      where: { code: poste.code },
      create: poste,
      update: {
        libelle: poste.libelle,
        niveau: poste.niveau,
        directionId: poste.directionId,
        serviceId: poste.serviceId,
        reserveAdmin: poste.reserveAdmin ?? false,
        titulaireUnique: poste.titulaireUnique ?? false,
        ouvreDroitConges: poste.ouvreDroitConges ?? true,
      },
    });
  }

  console.log(`  ✅ ${postes.length} postes créés`);

  // PASSE 2 : Résoudre la hiérarchie (superieurPosteId)
  console.log("📋 Seed M1 — Hiérarchie");

  // Récupérer tous les postes créés
  const postesDB = await prisma.poste.findMany({
    select: { id: true, code: true },
  });
  const postesMap = new Map(postesDB.map((p) => [p.code, p.id]));

  // Définir la hiérarchie : code poste → code supérieur
  // Source : DECISIONS.md A-06, A-08, A-08 bis
  // ATTENTION : chaîne hiérarchique ≠ chaîne fonctionnelle
  // Le Conducteur de Travaux vise les relevés (fonctionnel) mais n'est PAS
  // le supérieur du Chef Chantier (hiérarchique).
  const hierarchie: Record<string, string> = {
    // DG
    ASST_DG: "DIR_GENERAL",

    // DFC
    DIR_FINANCIER: "DIR_GENERAL",
    CHEF_ACHATS: "DIR_FINANCIER",
    ASST_COMPTABLE: "DIR_FINANCIER",

    // DT
    DIR_TECHNIQUE: "DIR_GENERAL",
    CONDUCTEUR_TRAVAUX: "DIR_TECHNIQUE",
    CHEF_CHANTIER: "DIR_TECHNIQUE", // A-08 : hiérarchique direct DT, pas CT
    CHEF_CHANTIER_ADJ: "DIR_TECHNIQUE", // A-08 bis : pair du CC, pas subordonné
    CHEF_EQUIPE: "CHEF_CHANTIER",
    OUVRIER: "CHEF_EQUIPE",
    MANOEUVRE: "CHEF_EQUIPE",
    CHARGE_ETUDES: "DIR_TECHNIQUE",
    CHEF_AEP: "DIR_TECHNIQUE",
    CHEF_ASSAINISSEMENT: "DIR_TECHNIQUE",
    CHEF_ROUTES: "DIR_TECHNIQUE",
    CHEF_LOGISTIQUE: "DIR_TECHNIQUE",
    CHEF_GARAGE: "CHEF_LOGISTIQUE",
    GESTIONNAIRE_STOCKS: "CHEF_LOGISTIQUE",
    MECANICIEN: "CHEF_GARAGE",
    CONDUCTEUR_ENGINS: "CHEF_GARAGE",
    GARDIEN: "CHEF_GARAGE", // A-06 : équipe garage sous Chef Garage
    CHAUFFEUR: "CHEF_GARAGE",

    // DAR
    DIR_ADMIN_RH: "DIR_GENERAL",
    ASST_RH: "DIR_ADMIN_RH",
    COURSIER: "DIR_ADMIN_RH",
    TECH_SURFACE: "DIR_ADMIN_RH",
    CHEF_QHSE: "DIR_ADMIN_RH",
    ASST_QHSE: "CHEF_QHSE",
    RELAIS_QHSE: "ASST_QHSE",
  };

  // Appliquer en une seule transaction
  await prisma.$transaction(
    Object.entries(hierarchie).map(([codePoste, codeSuperieur]) => {
      const posteId = postesMap.get(codePoste);
      const superieurId = postesMap.get(codeSuperieur);

      if (!posteId || !superieurId) {
        throw new Error(
          `Hiérarchie invalide : ${codePoste} → ${codeSuperieur}`
        );
      }

      return prisma.poste.update({
        where: { id: posteId },
        data: { superieurPosteId: superieurId },
      });
    })
  );

  console.log(`  ✅ Hiérarchie configurée pour ${Object.keys(hierarchie).length} postes`);
}

async function main() {
  console.log("🌱 Seed M0 + M1 — début\n");

  // M0
  console.log("=== MODULE M0 ===");
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedSuperAdmin();

  // M1
  console.log("\n=== MODULE M1 ===");
  await seedDirections();
  await seedServices();
  await seedPostes();

  console.log("\n✅ Seed M0 + M1 — terminé");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
