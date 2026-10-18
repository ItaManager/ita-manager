#!/usr/bin/env tsx
/**
 * Seed démo M15 — Données de test pour Livraison 1
 *
 * Crée une demande de paiement avec 8 bénéficiaires, dont 2 bloqués :
 * - 1 NO_MATCH (nom différent chez Wave)
 * - 1 HORS_LIMITES (plafond atteint)
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-paiements-demo.ts
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
  console.log('📝 Seed paiements démo M15\n');

  // Récupérer un profil DFC ou ADMIN pour préparateur
  const preparateur = await prisma.profil.findFirst({
    where: {
      roles: {
        some: {
          role: { code: { in: ['DFC', 'ADMIN'] } },
        },
      },
    },
  });

  if (!preparateur) {
    console.error('❌ Aucun profil DFC ou ADMIN trouvé');
    console.log('   Exécutez d\'abord : npm run db:seed');
    process.exit(1);
  }

  // Supprimer les données de test existantes
  await prisma.lignePaiement.deleteMany({
    where: {
      demandePaiement: {
        referenceIta: { startsWith: 'DEMO-PAY-' },
      },
    },
  });

  await prisma.demandePaiement.deleteMany({
    where: { referenceIta: { startsWith: 'DEMO-PAY-' } },
  });

  // Créer une demande de paiement
  const demande = await prisma.demandePaiement.create({
    data: {
      referenceIta: 'DEMO-PAY-2026-0001',
      categorie: 'SALAIRES',
      sourceId: 'demo-m7',
      sourceType: 'M7 · Paie chantier',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(1143700),
      lignes: {
        create: [
          {
            beneficiaireNom: 'DOSSO Christ',
            beneficiaireMobile: '+2250598765432',
            montant: new Decimal(142300),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-001',
            statut: 'PREPARE',
          },
          {
            beneficiaireNom: 'KABORÉ Salif',
            beneficiaireMobile: '+2250712345678',
            montant: new Decimal(98000),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-002',
            statut: 'PREPARE',
          },
          {
            beneficiaireNom: 'TRAORÉ Moussa',
            beneficiaireMobile: '+2250501122334',
            montant: new Decimal(156800),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-003',
            statut: 'PREPARE',
          },
          {
            beneficiaireNom: 'OUÉDRAOGO Paul',
            beneficiaireMobile: '+2250755443322',
            montant: new Decimal(121500),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-004',
            statut: 'PREPARE',
          },
          {
            // BLOQUÉ : NO_MATCH
            beneficiaireNom: 'SANGARÉ Ibrahim',
            beneficiaireMobile: '+2250566778899',
            montant: new Decimal(134200),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-005',
            statut: 'PREPARE',
            // Note : le verify_recipient simulé retournera NO_MATCH pour ce numéro
          },
          {
            // BLOQUÉ : HORS_LIMITES
            beneficiaireNom: 'DIABATÉ Yaya',
            beneficiaireMobile: '+2250744556677',
            montant: new Decimal(178400),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-006',
            statut: 'PREPARE',
            // Note : le verify_recipient simulé retournera withinLimits: false
          },
          {
            beneficiaireNom: 'COULIBALY Adama',
            beneficiaireMobile: '+2250522334455',
            montant: new Decimal(145000),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-007',
            statut: 'PREPARE',
          },
          {
            beneficiaireNom: 'BAMBA Seydou',
            beneficiaireMobile: '+2250766778811',
            montant: new Decimal(167300),
            motifPaiement: 'Paie journaliers — Chantier Bouaké Nord',
            referenceIta: 'M7-J-008',
            statut: 'PREPARE',
          },
        ],
      },
      autorisation: {
        create: {
          demandeeParId: preparateur.id,
          montantFige: new Decimal(1143700),
        },
      },
    },
  });

  console.log(`✅ Demande créée : ${demande.referenceIta}`);
  console.log(`   8 bénéficiaires, dont 2 seront bloqués après vérification`);
  console.log(`   Montant total : 1 143 700 F\n`);
  console.log('Note : Exécutez verify_recipient pour voir les 2 bloqués');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed paiements démo :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
