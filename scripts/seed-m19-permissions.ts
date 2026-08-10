import { prismaDirect as p } from './lib/prisma-direct';

async function main() {
  console.log('\n=== Seed permissions M19 ===\n');

  const permissionsM19 = [
    { code: "mission:demander", libelle: "Demander une mission", domaine: "RH" },
    { code: "mission:traiter", libelle: "Valider ou refuser une mission", domaine: "RH" },
    { code: "mission:payer", libelle: "Verser l'avance de frais", domaine: "PAIE" },
    { code: "mission:controler", libelle: "Contrôler les frais réels", domaine: "FINANCE" },
    { code: "mission:lire", libelle: "Consulter les missions", domaine: "RH" },
    { code: "mission:parametres", libelle: "Gérer les paramètres missions", domaine: "ADMIN" },
  ];

  for (const perm of permissionsM19) {
    await p.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: perm,
    });
    console.log(`✓ ${perm.code}`);
  }

  console.log('\n✅ Permissions M19 créées/mises à jour\n');

  // Assigner mission:traiter au rôle DRH
  const roleDRH = await p.role.findUnique({ where: { code: "DRH" } });
  const permTraiter = await p.permission.findUnique({ where: { code: "mission:traiter" } });

  if (roleDRH && permTraiter) {
    await p.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleDRH.id,
          permissionId: permTraiter.id,
        },
      },
      create: {
        roleId: roleDRH.id,
        permissionId: permTraiter.id,
      },
      update: {},
    });

    console.log('✅ Permission mission:traiter assignée au rôle DRH\n');
  }

  await p.$disconnect();
}

main().catch(console.error);
