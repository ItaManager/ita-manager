import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Ajout des permissions employé au rôle ADMIN...");

  // Trouver le rôle ADMIN
  const roleAdmin = await prisma.role.findUnique({
    where: { code: "ADMIN" },
  });

  if (!roleAdmin) {
    console.error("❌ Rôle ADMIN introuvable");
    return;
  }

  // Trouver les permissions employé
  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        in: ["employe:lire", "employe:creer", "employe:modifier", "employe:archiver"],
      },
    },
  });

  console.log(`✓ ${permissions.length} permissions trouvées`);

  // Ajouter chaque permission au rôle ADMIN si elle n'existe pas déjà
  for (const permission of permissions) {
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: roleAdmin.id,
          permissionId: permission.id,
        },
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: roleAdmin.id,
          permissionId: permission.id,
        },
      });
      console.log(`✓ Permission ${permission.code} ajoutée au rôle ADMIN`);
    } else {
      console.log(`  Permission ${permission.code} déjà présente`);
    }
  }

  console.log("✅ Terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
