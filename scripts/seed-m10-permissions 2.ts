/**
 * Seed permissions M10 - Pilotage uniquement
 * Script rapide pour créer les 4 permissions pilotage
 */

import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("🌱 Création permissions M10 Pilotage...");

  // 1. Créer les 4 permissions M10
  const permissions = [
    {
      code: "pilotage:dg",
      libelle: "Accéder au tableau de bord Direction Générale",
      domaine: "PILOTAGE",
    },
    {
      code: "pilotage:drh",
      libelle: "Accéder au tableau de bord RH",
      domaine: "PILOTAGE",
    },
    {
      code: "pilotage:dfc",
      libelle: "Accéder au tableau de bord Financier",
      domaine: "PILOTAGE",
    },
    {
      code: "pilotage:dt",
      libelle: "Accéder au tableau de bord Technique",
      domaine: "PILOTAGE",
    },
  ];

  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    console.log(`  ✓ ${created.code}`);
  }

  // 2. Assigner au rôle ADMIN
  const adminRole = await prisma.role.findUnique({
    where: { code: "ADMIN" },
  });

  if (adminRole) {
    for (const perm of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: perm.code },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        });
      }
    }
    console.log(`  ✓ Permissions assignées au rôle ADMIN`);
  }

  // 3. Assigner pilotage:dg au rôle DG
  const dgRole = await prisma.role.findUnique({ where: { code: "DG" } });
  const dgPerm = await prisma.permission.findUnique({ where: { code: "pilotage:dg" } });
  if (dgRole && dgPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: dgRole.id,
          permissionId: dgPerm.id,
        },
      },
      update: {},
      create: { roleId: dgRole.id, permissionId: dgPerm.id },
    });
    console.log(`  ✓ pilotage:dg assignée au rôle DG`);
  }

  // 4. Assigner pilotage:drh au rôle DRH
  const drhRole = await prisma.role.findUnique({ where: { code: "DRH" } });
  const drhPerm = await prisma.permission.findUnique({ where: { code: "pilotage:drh" } });
  if (drhRole && drhPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: drhRole.id,
          permissionId: drhPerm.id,
        },
      },
      update: {},
      create: { roleId: drhRole.id, permissionId: drhPerm.id },
    });
    console.log(`  ✓ pilotage:drh assignée au rôle DRH`);
  }

  // 5. Assigner pilotage:dfc au rôle DFC
  const dfcRole = await prisma.role.findUnique({ where: { code: "DFC" } });
  const dfcPerm = await prisma.permission.findUnique({ where: { code: "pilotage:dfc" } });
  if (dfcRole && dfcPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: dfcRole.id,
          permissionId: dfcPerm.id,
        },
      },
      update: {},
      create: { roleId: dfcRole.id, permissionId: dfcPerm.id },
    });
    console.log(`  ✓ pilotage:dfc assignée au rôle DFC`);
  }

  // 6. Assigner pilotage:dt au rôle DT
  const dtRole = await prisma.role.findUnique({ where: { code: "DT" } });
  const dtPerm = await prisma.permission.findUnique({ where: { code: "pilotage:dt" } });
  if (dtRole && dtPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: dtRole.id,
          permissionId: dtPerm.id,
        },
      },
      update: {},
      create: { roleId: dtRole.id, permissionId: dtPerm.id },
    });
    console.log(`  ✓ pilotage:dt assignée au rôle DT`);
  }

  console.log("\n✅ Permissions M10 Pilotage créées avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
