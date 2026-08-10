/**
 * scripts/seed-comptes-m19.ts — Création de 2 comptes pour walkthrough M19
 *
 * Crée :
 * 1. Declann ARMEL — employé permanent, supérieur hiérarchique (pour visa N+1)
 * 2. Compte DRH — utilisateur avec rôle DRH (permission mission:traiter)
 *
 * Idempotent : peut être rejoué sans erreur ni doublon.
 *
 * Exécution :
 * npx tsx scripts/seed-comptes-m19.ts
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { prismaDirect as prisma } from "./lib/prisma-direct";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Email des comptes de test
const DECLANN_EMAIL = "declann.armel@ita-manager.test";
const DRH_EMAIL = "drh@ita-manager.test";

async function seedDeclannArmel() {
  console.log("\n📋 Compte 1 : Declann ARMEL (supérieur N+1)");

  // 1. Trouver ou créer une Direction et un Service
  const direction = await prisma.direction.findFirst({
    where: { libelle: "Direction Technique" },
  });

  if (!direction) {
    console.error("❌ Direction Technique introuvable. Exécutez d'abord prisma/seed.ts");
    process.exit(1);
  }

  const service = await prisma.service.findFirst({
    where: { directionId: direction.id },
  });

  // 2. Trouver ou créer un poste de manager
  let poste = await prisma.poste.findFirst({
    where: {
      code: "CT",
      directionId: direction.id,
    },
  });

  if (!poste) {
    console.log("  ⚠️  Poste Conducteur de Travaux introuvable, création...");
    poste = await prisma.poste.create({
      data: {
        code: "CT",
        libelle: "Conducteur de Travaux",
        directionId: direction.id,
        serviceId: service?.id || null,
        niveauHierarchique: "N_PLUS_1",
        pointageObligatoire: false,
      },
    });
  }

  // 3. Créer ou récupérer l'employé Declann ARMEL
  let employe = await prisma.employe.findFirst({
    where: { matricule: "DEC2025" },
  });

  if (!employe) {
    console.log("  ✨ Création de l'employé Declann ARMEL...");
    employe = await prisma.employe.create({
      data: {
        matricule: "DEC2025",
        nom: "DECLANN",
        prenom: "Armel",
        sexe: "MASCULIN",
        telephone: "+225 07 00 00 01",
        typeMainOeuvre: "PERMANENT",
      },
    });
  } else {
    console.log("  ✓ Employé Declann ARMEL déjà existant");
  }

  // 4. Créer une affectation sur le poste CT
  const affectationExistante = await prisma.affectation.findFirst({
    where: {
      employeId: employe.id,
      dateFin: null,
    },
  });

  if (!affectationExistante) {
    console.log("  ✨ Création de l'affectation sur poste Conducteur de Travaux...");
    await prisma.affectation.create({
      data: {
        employeId: employe.id,
        posteId: poste.id,
        directionId: direction.id,
        serviceId: service?.id || null,
        dateDebut: new Date("2025-01-01"),
        dateFin: null,
      },
    });
  } else {
    console.log("  ✓ Affectation déjà existante");
  }

  // 5. Créer le compte auth.users via Supabase Admin
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  let userId = existing?.users.find((u) => u.email === DECLANN_EMAIL)?.id;

  if (!userId) {
    const motDePasseTemporaire = randomBytes(18).toString("base64url");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DECLANN_EMAIL,
      password: motDePasseTemporaire,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Échec de création du compte ${DECLANN_EMAIL} : ${error?.message}`);
    }

    userId = data.user.id;

    console.log(`  ✨ Compte auth.users créé : ${DECLANN_EMAIL}`);
    console.log(`  🔑 Mot de passe : ${motDePasseTemporaire}\n`);

    await new Promise((resolve) => setTimeout(resolve, 500));
  } else {
    console.log(`  ✓ Compte auth.users déjà existant : ${DECLANN_EMAIL}`);
  }

  // 6. Lier le profil à l'employé
  await prisma.profil.upsert({
    where: { id: userId },
    create: {
      id: userId,
      employeId: employe.id,
      actif: true,
    },
    update: {
      employeId: employe.id,
      actif: true,
    },
  });

  // 7. Attribuer le rôle CT (Conducteur de Travaux)
  const roleCT = await prisma.role.findUnique({
    where: { code: "CT" },
  });

  if (!roleCT) {
    console.error("❌ Rôle CT introuvable. Exécutez d'abord prisma/seed.ts");
    process.exit(1);
  }

  await prisma.profilRole.upsert({
    where: {
      profilId_roleId: {
        profilId: userId,
        roleId: roleCT.id,
      },
    },
    create: {
      profilId: userId,
      roleId: roleCT.id,
    },
    update: {},
  });

  console.log("  ✅ Compte Declann ARMEL prêt");
  console.log(`     Email    : ${DECLANN_EMAIL}`);
  console.log(`     Matricule: DEC2025`);
  console.log(`     Poste    : Conducteur de Travaux (N+1)`);
}

async function seedCompteDRH() {
  console.log("\n📋 Compte 2 : DRH (validation RH)");

  // 1. Créer le compte auth.users via Supabase Admin
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  let userId = existing?.users.find((u) => u.email === DRH_EMAIL)?.id;

  if (!userId) {
    const motDePasseTemporaire = randomBytes(18).toString("base64url");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DRH_EMAIL,
      password: motDePasseTemporaire,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Échec de création du compte ${DRH_EMAIL} : ${error?.message}`);
    }

    userId = data.user.id;

    console.log(`  ✨ Compte auth.users créé : ${DRH_EMAIL}`);
    console.log(`  🔑 Mot de passe : ${motDePasseTemporaire}\n`);

    await new Promise((resolve) => setTimeout(resolve, 500));
  } else {
    console.log(`  ✓ Compte auth.users déjà existant : ${DRH_EMAIL}`);
  }

  // 2. S'assurer que le profil existe
  await prisma.profil.upsert({
    where: { id: userId },
    create: {
      id: userId,
      employeId: null, // Compte sans employé rattaché
      actif: true,
    },
    update: {
      actif: true,
    },
  });

  // 3. Attribuer le rôle DRH
  const roleDRH = await prisma.role.findUnique({
    where: { code: "DRH" },
  });

  if (!roleDRH) {
    console.error("❌ Rôle DRH introuvable. Exécutez d'abord prisma/seed.ts");
    process.exit(1);
  }

  await prisma.profilRole.upsert({
    where: {
      profilId_roleId: {
        profilId: userId,
        roleId: roleDRH.id,
      },
    },
    create: {
      profilId: userId,
      roleId: roleDRH.id,
    },
    update: {},
  });

  console.log("  ✅ Compte DRH prêt");
  console.log(`     Email      : ${DRH_EMAIL}`);
  console.log(`     Rôle       : DRH (Directrice Administrative et RH)`);
  console.log(`     Permissions: mission:traiter (validation RH des missions)`);
}

async function main() {
  console.log("🎯 Seed comptes M19 — Walkthrough missions");

  await seedDeclannArmel();
  await seedCompteDRH();

  console.log("\n✅ 2 comptes créés avec succès");
  console.log("\n📖 Walkthrough M19 :");
  console.log("   1. Connectez-vous avec un compte employé standard");
  console.log("   2. Créez une demande de mission sur /missions");
  console.log(`   3. Connectez-vous avec ${DECLANN_EMAIL}`);
  console.log("   4. Visez la mission en tant que N+1 sur /missions/validation-n1");
  console.log(`   5. Connectez-vous avec ${DRH_EMAIL}`);
  console.log("   6. Validez la mission sur /missions/validation-rh");
  console.log("   7. Reconnectez-vous avec le compte employé");
  console.log("   8. Déposez le rapport après la date de retour");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
