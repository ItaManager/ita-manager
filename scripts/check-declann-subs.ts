import { prismaDirect as p } from './lib/prisma-direct';

async function main() {
  const d = await p.employe.findFirst({ 
    where: { nom: { contains: 'DECLANN' } } 
  });
  
  console.log('Declann :', d?.id, d?.nom, d?.prenom);
  
  const subs = await p.affectation.findMany({
    where: { superieurId: d?.id, dateFin: null },
    select: { 
      employeId: true,
      employe: { 
        select: { 
          nom: true, 
          prenom: true 
        } 
      } 
    },
  });
  
  console.table(subs);
  await p.$disconnect();
}

main().catch(console.error);
