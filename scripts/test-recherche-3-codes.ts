#!/usr/bin/env tsx
import { prismaDirect as p } from './lib/prisma-direct.js';

async function main() {
  const f = await p.familleMateriel.findFirst({ where: { code: 'AK-VL' } });

  if (!f) {
    console.error('❌ Famille AK-VL introuvable');
    process.exit(1);
  }

  const m = await p.materiel.create({
    data: {
      codeIta: 'AK-VL999',
      designation: 'Test recherche',
      familleId: f.id,
      type: 'VEHICULE_LEGER',
      statut: 'DISPONIBLE',
      numeroParcAncien: 'A11157',
      codeLong: 'ITA-VE0999-BE/22',
    },
  });

  console.log('Matériel créé:', m.codeIta);
  console.log('');

  for (const q of ['AK-VL999', 'A11157', 'ITA-VE0999', 'vl999']) {
    const r = await p.materiel.findMany({
      where: {
        OR: [
          { codeIta: { contains: q, mode: 'insensitive' } },
          { numeroParcAncien: { contains: q, mode: 'insensitive' } },
          { codeLong: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { codeIta: true },
    });
    console.log(q, '→', r.length, 'résultat(s)', r.length === 1 ? '✅' : '❌');
  }

  console.log('');
  await p.materiel.delete({ where: { id: m.id } });
  console.log('Matériel supprimé');

  await p.$disconnect();
}

main();
