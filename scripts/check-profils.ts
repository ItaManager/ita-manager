import { prismaDirect as p } from './lib/prisma-direct';

async function main() {
  const profils = await p.profil.findMany({
    where: {
      OR: [
        { email: { contains: 'armel' } },
        { email: { contains: 'drh' } },
        { email: { contains: 'christ' } },
        { email: { contains: 'dosso' } }
      ]
    },
    select: { 
      email: true, 
      employe: { 
        select: { 
          prenom: true, 
          nom: true 
        } 
      } 
    }
  });
  
  console.log('\n=== Comptes de test ===\n');
  profils.forEach(p => {
    console.log(`${p.email}`);
    console.log(`  → ${p.employe?.prenom} ${p.employe?.nom}\n`);
  });
  
  await p.$disconnect();
}

main().catch(console.error);
