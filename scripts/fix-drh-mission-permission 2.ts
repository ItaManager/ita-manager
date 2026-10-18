import { prismaDirect as p } from './lib/prisma-direct';

async function main() {
  console.log('\n=== Ajout permission mission:traiter au rôle DRH ===\n');

  // 1. Trouver le rôle DRH
  const roleDRH = await p.role.findUnique({
    where: { code: "DRH" },
  });

  if (!roleDRH) {
    console.error('❌ Rôle DRH introuvable');
    process.exit(1);
  }

  console.log(`✓ Rôle DRH trouvé : ${roleDRH.libelle}`);

  // 2. Trouver la permission mission:traiter
  const permission = await p.permission.findUnique({
    where: { code: "mission:traiter" },
  });

  if (!permission) {
    console.error('❌ Permission mission:traiter introuvable');
    process.exit(1);
  }

  console.log(`✓ Permission trouvée : ${permission.libelle}`);

  // 3. Vérifier si déjà assignée
  const existing = await p.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: roleDRH.id,
        permissionId: permission.id,
      },
    },
  });

  if (existing) {
    console.log('\n⚠️  Permission déjà assignée au rôle DRH');
  } else {
    await p.rolePermission.create({
      data: {
        roleId: roleDRH.id,
        permissionId: permission.id,
      },
    });

    console.log('\n✅ Permission mission:traiter ajoutée au rôle DRH');
  }

  await p.$disconnect();
}

main().catch(console.error);
