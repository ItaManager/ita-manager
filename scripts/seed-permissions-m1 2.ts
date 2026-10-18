#!/usr/bin/env tsx
/**
 * Seed permissions M1 — organisation:consulter, organisation:modifier
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/seed-permissions-m1.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Permissions M1
const PERMISSIONS_M1 = [
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
];

// Matrice rôle × permission M1
const MATRICE_M1: Record<string, string[]> = {
  "organisation:consulter": ["ADMIN", "DG", "DRH", "RH", "DFC", "DT", "CT"],
  "organisation:modifier": ["ADMIN", "DRH"],
};

async function main() {
  console.log("🌱 Seed permissions M1 — début\n");

  // Créer les permissions
  for (const perm of PERMISSIONS_M1) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { libelle: perm.libelle, domaine: perm.domaine },
    });
  }

  console.log(`  ✅ ${PERMISSIONS_M1.length} permissions créées`);

  // Attribuer les permissions aux rôles
  for (const [permCode, rolesCodes] of Object.entries(MATRICE_M1)) {
    const permission = await prisma.permission.findUnique({
      where: { code: permCode },
    });

    if (!permission) {
      console.error(`  ❌ Permission ${permCode} introuvable`);
      continue;
    }

    for (const roleCode of rolesCodes) {
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
      });

      if (!role) {
        console.error(`  ❌ Rôle ${roleCode} introuvable`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
        update: {},
      });
    }
  }

  console.log("  ✅ Permissions attribuées aux rôles");

  // Récapitulatif
  const totalPermissions = await prisma.permission.count();
  const totalRoles = await prisma.role.count();

  console.log("\n📊 Récapitulatif:");
  console.log(`  • ${totalPermissions} permissions au total`);
  console.log(`  • ${totalRoles} rôles au total`);

  console.log("\n✅ Seed permissions M1 — terminé");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
