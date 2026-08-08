/**
 * Seed rapide des permissions M17 uniquement
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("🌱 Seed permissions M17...\n");

  // Les 4 permissions M17
  const permissions = [
    {
      code: "competence:lire",
      libelle: "Consulter les compétences et taux journaliers",
      domaine: "RH",
    },
    {
      code: "competence:gerer",
      libelle: "Créer, modifier et archiver les compétences",
      domaine: "RH",
    },
    {
      code: "taux:definir",
      libelle: "Fixer et réviser les taux journaliers",
      domaine: "PAIE",
    },
    {
      code: "competence:assigner",
      libelle: "Assigner une compétence à un agent",
      domaine: "RH",
    },
  ];

  // Upsert permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: perm,
    });
    console.log(`  ✅ ${perm.code}`);
  }

  // Matrice de permissions
  const matrice: Record<string, string[]> = {
    "competence:lire": ["ADMIN", "DG", "DT", "DRH", "RH", "DFC", "CT", "CC"],
    "competence:gerer": ["ADMIN", "DT"],
    "taux:definir": ["ADMIN", "DFC"],
    "competence:assigner": ["ADMIN", "DRH", "RH"],
  };

  console.log("\n📋 Assignation aux rôles...\n");

  for (const [permCode, roleCodes] of Object.entries(matrice)) {
    const permission = await prisma.permission.findUnique({
      where: { code: permCode },
    });

    if (!permission) continue;

    for (const roleCode of roleCodes) {
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
      });

      if (!role) continue;

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

    console.log(`  ✅ ${permCode} → ${roleCodes.join(", ")}`);
  }

  console.log("\n✅ Permissions M17 créées et assignées");
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
