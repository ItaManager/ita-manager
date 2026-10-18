#!/usr/bin/env tsx
/**
 * Test d'exécution M15 — Bypass créneau horaire
 *
 * Pour tester l'exécution hors des heures 8h-14h
 */

import { PrismaClient } from '@prisma/client';
import { executerPaiementLogique } from '../lib/actions/paiements';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🧪 Test d\'exécution M15 — Bypass créneau horaire\n');

  // Récupérer la demande
  const demande = await prisma.demandePaiement.findUnique({
    where: { referenceIta: 'DEMO-PAY-2026-0001' },
    include: {
      autorisation: true,
      preparateur: true,
    },
  });

  if (!demande) {
    console.error('❌ Demande DEMO-PAY-2026-0001 introuvable');
    process.exit(1);
  }

  console.log(`📋 Demande : ${demande.referenceIta}`);
  console.log(`   Montant : ${demande.montantTotal.toString()} F`);
  console.log(`   Préparateur : ${demande.preparateur.email}\n`);

  // Vérifier l'autorisation
  if (!demande.autorisation) {
    console.error('❌ Aucune autorisation trouvée');
    console.log('   Créez d\'abord une autorisation avec :');
    console.log('   npx dotenv -e .env.dev -- npx tsx scripts/autoriser-demo-m15.ts\n');
    process.exit(1);
  }

  if (!demande.autorisation.autoriseeLe) {
    console.error('❌ Autorisation non accordée');
    console.log('   Exécutez : npx dotenv -e .env.dev -- npx tsx scripts/autoriser-demo-m15.ts\n');
    process.exit(1);
  }

  console.log('✅ Autorisation accordée le :', demande.autorisation.autoriseeLe);
  console.log('   Expire le :', demande.autorisation.expireLe);
  console.log('   Montant figé :', demande.autorisation.montantFige.toString(), 'F\n');

  // Récupérer un profil avec permission executer
  const executeur = await prisma.profil.findFirst({
    where: {
      roles: {
        some: {
          role: {
            permissions: {
              some: {
                permission: { code: 'paiement:executer' },
              },
            },
          },
        },
      },
    },
  });

  if (!executeur) {
    console.error('❌ Aucun profil avec permission paiement:executer');
    process.exit(1);
  }

  console.log(`🚀 Exécution par : ${executeur.email}\n`);
  console.log('⚠️  BYPASS COMPLET : Tous les interdits ignorés (test uniquement)\n');

  try {
    const resultat = await executerPaiementLogique(
      { userId: executeur.id, email: executeur.email },
      demande.id,
      {
        ignoreCreneau: true, // BYPASS pour tester hors 8h-14h
        ignoreAutorisateur: true, // BYPASS interdit #2 pour tester
        ignoreMontant: true, // BYPASS interdit #5 pour tester
        ignoreVerification: true, // BYPASS interdit #7 pour tester
      }
    );

    console.log('✅ EXÉCUTION RÉUSSIE\n');
    console.log(`   Paiements réussis : ${resultat.nombreReussis}`);
    console.log(`   Paiements échoués : ${resultat.nombreEchecs}\n`);

    // Afficher les résultats
    const lignes = await prisma.lignePaiement.findMany({
      where: { demandePaiementId: demande.id },
      orderBy: { id: 'asc' },
    });

    console.log('📊 Détail des lignes :');
    for (const ligne of lignes) {
      const statut = ligne.statut;
      const icone = statut === 'REUSSI' ? '✅' : statut === 'ECHOUE' ? '❌' : '⏳';
      console.log(
        `   ${icone} ${ligne.beneficiaireNom} — ${ligne.montant.toString()} F — ${statut}`
      );
      if (ligne.wavePayoutId) {
        console.log(`      Wave ID: ${ligne.wavePayoutId}`);
      }
    }
  } catch (error: any) {
    console.error('❌ ERREUR D\'EXÉCUTION\n');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 ERREUR INATTENDUE\n', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
