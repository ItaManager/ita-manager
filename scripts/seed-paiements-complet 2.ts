#!/usr/bin/env tsx
/**
 * Seed démo M15 — Données complètes pour tests
 *
 * Crée plusieurs demandes de paiement dans différents états :
 * - 1 demande PREPAREE (en attente d'autorisation)
 * - 1 demande AUTORISEE (prête à exécuter)
 * - 1 demande avec paiements REUSSI
 * - 1 demande avec paiements ECHOUE
 * - 1 demande avec paiements EN_ATTENTE
 * - 1 demande avec paiements ANNULE
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-paiements-complet.ts
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
  console.log('📝 Seed paiements complet M15\n');

  // Récupérer profils DFC et DG
  const preparateur = await prisma.profil.findFirst({
    where: {
      roles: {
        some: {
          role: { code: { in: ['DFC', 'ADMIN'] } },
        },
      },
    },
  });

  const autoriseur = await prisma.profil.findFirst({
    where: {
      roles: {
        some: {
          role: { code: { in: ['DG', 'ADMIN'] } },
        },
      },
    },
  });

  if (!preparateur || !autoriseur) {
    console.error('❌ Profils DFC/DG manquants');
    process.exit(1);
  }

  // Supprimer données de test existantes
  await prisma.lignePaiement.deleteMany({
    where: {
      demandePaiement: {
        referenceIta: { startsWith: 'DEMO-' },
      },
    },
  });

  await prisma.demandePaiement.deleteMany({
    where: { referenceIta: { startsWith: 'DEMO-' } },
  });

  console.log('🧹 Anciennes données de test supprimées\n');

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Demande PREPAREE (en attente d'autorisation)
  // ═══════════════════════════════════════════════════════════════════════

  const demande1 = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-001',
      categorie: 'SALAIRES',
      sourceId: 'M7-PAIE-JAN-2026',
      sourceType: 'PAIE',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(450000),
      lignes: {
        create: [
          {
            beneficiaireNom: 'KONÉ Mamadou',
            beneficiaireMobile: '+2250700000001',
            montant: new Decimal(150000),
            motifPaiement: 'Salaire janvier 2026',
            referenceIta: 'PAY-001-L1',
            statut: 'PREPARE',
          },
          {
            beneficiaireNom: 'DIABATÉ Aminata',
            beneficiaireMobile: '+2250700000002',
            montant: new Decimal(150000),
            motifPaiement: 'Salaire janvier 2026',
            referenceIta: 'PAY-001-L2',
            statut: 'PREPARE',
          },
          {
            beneficiaireNom: 'TOURÉ Ibrahim',
            beneficiaireMobile: '+2250700000003',
            montant: new Decimal(150000),
            motifPaiement: 'Salaire janvier 2026',
            referenceIta: 'PAY-001-L3',
            statut: 'PREPARE',
          },
        ],
      },
      autorisation: {
        create: {
          demandeeParId: preparateur.id,
          montantFige: new Decimal(450000),
        },
      },
    },
  });

  console.log(`✅ 1. PREPAREE : ${demande1.referenceIta} (450 000 F)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Demande AUTORISEE (prête à exécuter)
  // ═══════════════════════════════════════════════════════════════════════

  const demande2 = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-002',
      categorie: 'FOURNISSEURS',
      sourceId: 'BC-2026-015',
      sourceType: 'ACHAT',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(850000),
      lignes: {
        create: [
          {
            beneficiaireNom: 'SARL PROMAT',
            beneficiaireMobile: '+2250700000010',
            montant: new Decimal(350000),
            motifPaiement: 'Facture BC-2026-015 - Ciment',
            referenceIta: 'PAY-002-L1',
            statut: 'AUTORISE',
            verifieLe: new Date(),
            nameMatch: 'MATCH',
            withinLimits: true,
          },
          {
            beneficiaireNom: 'ETS KOFFI',
            beneficiaireMobile: '+2250700000011',
            montant: new Decimal(500000),
            motifPaiement: 'Facture BC-2026-015 - Ferraillage',
            referenceIta: 'PAY-002-L2',
            statut: 'AUTORISE',
            verifieLe: new Date(),
            nameMatch: 'MATCH',
            withinLimits: true,
          },
        ],
      },
      autorisation: {
        create: {
          demandeeParId: preparateur.id,
          autoriseeParId: autoriseur.id,
          autoriseeLe: new Date(),
          expireLe: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
          montantFige: new Decimal(850000),
          nombreEchecs: 0,
        },
      },
    },
  });

  console.log(`✅ 2. AUTORISEE : ${demande2.referenceIta} (850 000 F)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Demande avec paiements REUSSI
  // ═══════════════════════════════════════════════════════════════════════

  const demande3 = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-003',
      categorie: 'PRIMES',
      sourceId: 'PRIMES-DEC-2025',
      sourceType: 'PAIE',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(600000),
      lignes: {
        create: [
          {
            beneficiaireNom: 'OUATTARA Seydou',
            beneficiaireMobile: '+2250700000020',
            montant: new Decimal(200000),
            motifPaiement: 'Prime fin année 2025',
            referenceIta: 'PAY-003-L1',
            statut: 'REUSSI',
            verifieLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            nameMatch: 'MATCH',
            withinLimits: true,
            wavePayoutId: 'wave_payout_demo_001',
            executeLe: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            fraisWave: new Decimal(1000),
          },
          {
            beneficiaireNom: 'BAKAYOKO Fatoumata',
            beneficiaireMobile: '+2250700000021',
            montant: new Decimal(200000),
            motifPaiement: 'Prime fin année 2025',
            referenceIta: 'PAY-003-L2',
            statut: 'REUSSI',
            verifieLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            nameMatch: 'MATCH',
            withinLimits: true,
            wavePayoutId: 'wave_payout_demo_002',
            executeLe: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            fraisWave: new Decimal(1000),
          },
          {
            beneficiaireNom: 'SANOGO Moussa',
            beneficiaireMobile: '+2250700000022',
            montant: new Decimal(200000),
            motifPaiement: 'Prime fin année 2025',
            referenceIta: 'PAY-003-L3',
            statut: 'REUSSI',
            verifieLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            nameMatch: 'MATCH',
            withinLimits: true,
            wavePayoutId: 'wave_payout_demo_003',
            executeLe: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            fraisWave: new Decimal(1000),
          },
        ],
      },
    },
  });

  console.log(`✅ 3. REUSSI : ${demande3.referenceIta} (600 000 F)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Demande avec paiements ECHOUE
  // ═══════════════════════════════════════════════════════════════════════

  const demande4 = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-004',
      categorie: 'PRESTATAIRES',
      sourceId: 'BC-2026-020',
      sourceType: 'ACHAT',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(1200000),
      lignes: {
        create: [
          {
            beneficiaireNom: 'SARL GEOBAT',
            beneficiaireMobile: '+2250700000030',
            montant: new Decimal(1200000),
            motifPaiement: 'Prestation topographie - Chantier X',
            referenceIta: 'PAY-004-L1',
            statut: 'ECHOUE',
            verifieLe: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            nameMatch: 'MATCH',
            withinLimits: true,
            waveErrorCode: 'insufficient-funds',
            executeLe: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6h
          },
        ],
      },
    },
  });

  console.log(`✅ 4. ECHOUE : ${demande4.referenceIta} (1 200 000 F)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Demande avec paiements EN_ATTENTE
  // ═══════════════════════════════════════════════════════════════════════

  const demande5 = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-005',
      categorie: 'DIVERS',
      sourceId: 'REMB-2026-003',
      sourceType: 'REMBOURSEMENT',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(75000),
      lignes: {
        create: [
          {
            beneficiaireNom: 'KONAN Yves',
            beneficiaireMobile: '+2250700000040',
            montant: new Decimal(75000),
            motifPaiement: 'Remboursement frais mission',
            referenceIta: 'PAY-005-L1',
            statut: 'EN_ATTENTE',
            verifieLe: new Date(Date.now() - 2 * 60 * 60 * 1000),
            nameMatch: 'MATCH',
            withinLimits: true,
            executeLe: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30min
            tentatives: {
              create: [
                {
                  numero: 1,
                  httpStatus: 500,
                  reponseBrute: { error: 'timeout' },
                  erreurCode: 'network_error',
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✅ 5. EN_ATTENTE : ${demande5.referenceIta} (75 000 F)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Demande avec paiements ANNULE
  // ═══════════════════════════════════════════════════════════════════════

  const demande6 = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-006',
      categorie: 'FOURNISSEURS',
      sourceId: 'BC-2026-012',
      sourceType: 'ACHAT',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(350000),
      lignes: {
        create: [
          {
            beneficiaireNom: 'ETS YAPI',
            beneficiaireMobile: '+2250700000050',
            montant: new Decimal(350000),
            motifPaiement: 'Facture BC-2026-012 - Annulée',
            referenceIta: 'PAY-006-L1',
            statut: 'ANNULE',
            verifieLe: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            nameMatch: 'MATCH',
            withinLimits: true,
            wavePayoutId: 'wave_payout_demo_cancelled',
            executeLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log(`✅ 6. ANNULE : ${demande6.referenceIta} (350 000 F)`);

  // ═══════════════════════════════════════════════════════════════════════
  // Résumé
  // ═══════════════════════════════════════════════════════════════════════

  console.log('\n📊 Résumé :');
  console.log('   6 demandes créées');
  console.log('   Total : 3 525 000 F');
  console.log('\n🎯 États :');
  console.log('   - PREPAREE : 1 demande (en attente autorisation DG)');
  console.log('   - AUTORISEE : 1 demande (prête à exécuter)');
  console.log('   - REUSSI : 3 lignes');
  console.log('   - ECHOUE : 1 ligne (insufficient-funds)');
  console.log('   - EN_ATTENTE : 1 ligne (timeout réseau)');
  console.log('   - ANNULE : 1 ligne');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed paiements complet :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
