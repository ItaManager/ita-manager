#!/usr/bin/env tsx
/**
 * Autoriser manuellement la demande de démo M15
 *
 * Simule l'autorisation par le DG pour tester le circuit complet
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🔓 Autorisation manuelle de la demande DEMO-PAY-2026-0001\n');

  // Récupérer la demande
  const demande = await prisma.demandePaiement.findUnique({
    where: { referenceIta: 'DEMO-PAY-2026-0001' },
    include: {
      autorisation: true,
      lignes: true,
    },
  });

  if (!demande) {
    console.error('❌ Demande DEMO-PAY-2026-0001 introuvable');
    process.exit(1);
  }

  // Calculer le montant exécutable (sans les bloqués)
  const lignesExecutables = demande.lignes.filter(
    (l) => l.nameMatch !== 'NO_MATCH' && l.withinLimits !== false
  );
  const montantExecutable = lignesExecutables.reduce(
    (acc, l) => acc.add(l.montant),
    new Decimal(0)
  );

  console.log(`📋 Demande : ${demande.referenceIta}`);
  console.log(`   Montant total : ${demande.montantTotal.toString()} F`);
  console.log(`   Lignes exécutables : ${lignesExecutables.length}/${demande.lignes.length}`);
  console.log(`   Montant exécutable : ${montantExecutable.toString()} F\n`);

  // Récupérer un profil ADMIN (qui peut autoriser pour les tests)
  const admin = await prisma.profil.findFirst({
    where: {
      roles: {
        some: {
          role: { code: 'ADMIN' },
        },
      },
    },
  });

  if (!admin) {
    console.error('❌ Aucun profil ADMIN trouvé');
    process.exit(1);
  }

  const maintenant = new Date();
  const expireLe = new Date(maintenant.getTime() + 2 * 3600000); // +2 heures

  // Autoriser
  await prisma.autorisationPaiement.update({
    where: { demandePaiementId: demande.id },
    data: {
      autoriseeParId: admin.id,
      autoriseeLe: maintenant,
      expireLe,
      montantFige: montantExecutable,
    },
  });

  console.log('✅ Autorisation accordée par : ' + admin.email);
  console.log('   Autorisée le : ' + maintenant.toLocaleString('fr-FR'));
  console.log('   Expire le : ' + expireLe.toLocaleString('fr-FR'));
  console.log('   Montant figé : ' + montantExecutable.toString() + ' F\n');

  console.log('🚀 Vous pouvez maintenant tester l\'exécution :');
  console.log('   npx dotenv -e .env.dev -- npx tsx scripts/test-execution-m15.ts');
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
