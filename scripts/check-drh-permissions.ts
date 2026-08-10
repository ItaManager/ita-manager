import { prismaDirect as p } from './lib/prisma-direct';

async function main() {
  const profil = await p.profil.findUnique({
    where: { email: "drh@ita-manager.test" },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  console.log('\n=== Compte DRH ===\n');
  console.log('Email:', profil?.email);
  console.log('Rôles:', profil?.roles.map(r => r.role.code).join(', '));
  
  const permissions = profil?.roles.flatMap(pr => 
    pr.role.permissions.map(rp => rp.permission.code)
  ) ?? [];
  
  console.log('\nPermissions:');
  permissions.forEach(p => console.log(`  - ${p}`));
  
  console.log('\n✓ mission:traiter:', permissions.includes('mission:traiter') ? 'OUI' : 'NON');
  
  await p.$disconnect();
}

main().catch(console.error);
