import { prismaDirect as p } from './lib/prisma-direct';

async function main() {
  const missions = await p.mission.findMany({
    select: { 
      reference: true, 
      dateDepart: true, 
      dateRetour: true,
      soumiseLe: true, 
      viseeN1Le: true, 
      valideeRhLe: true,
      rapportDeposeLe: true, 
      clotureeLe: true 
    },
    orderBy: { reference: 'asc' },
  });
  
  console.table(missions);
  await p.$disconnect();
}

main().catch(console.error);
