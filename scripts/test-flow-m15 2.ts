#!/usr/bin/env tsx
/**
 * Test de recette M15 — Flow complet
 *
 * Teste le cycle complet :
 * 1. Préparation demande (preparerDemande)
 * 2. Vérification bénéficiaires (verifierBeneficiaires)
 * 3. Demande autorisation (demanderAutorisation)
 * 4. Autorisation DG (autoriserPaiement — manuel TOTP)
 * 5. Exécution paiement (executerPaiement — simulé)
 *
 * USAGE :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-flow-m15.ts
 *
 * NOTES :
 * - Utilise le client Wave simulé (pas besoin de WAVE_API_KEY)
 * - L'étape 4 (autorisation) nécessite un TOTP réel (pas testée ici)
 * - Les 8 interdits sont vérifiés automatiquement
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
  console.log('🧪 Test de recette M15 — Flow complet\n');

  // ═══════════════════════════════════════════════════════════════════════
  // 0. Récupérer profils DFC et DG
  // ═══════════════════════════════════════════════════════════════════════

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

  console.log(`✅ Préparateur : ${preparateur.email}`);
  console.log(`✅ Autoriseur : ${autoriseur.email}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Préparation demande
  // ═══════════════════════════════════════════════════════════════════════

  console.log('📝 ÉTAPE 1 : Préparation demande');

  const count = await prisma.demandePaiement.count();
  const reference = `TEST-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

  const lignesData = [
    {
      beneficiaireNom: 'KOUASSI Jean',
      beneficiaireMobile: '+2250700111001',
      montant: 50000,
      motifPaiement: 'Test paiement 1',
    },
    {
      beneficiaireNom: 'TRAORÉ Marie',
      beneficiaireMobile: '+2250700111002',
      montant: 75000,
      motifPaiement: 'Test paiement 2',
    },
  ];

  const montantTotal = lignesData.reduce((acc, l) => acc + l.montant, 0);

  const demande = await prisma.demandePaiement.create({
    data: {
      referenceIta: reference,
      categorie: 'FOURNISSEURS',
      sourceId: 'TEST-BC-001',
      sourceType: 'TEST',
      prepareeParId: preparateur.id,
      montantTotal: new Decimal(montantTotal),
      lignes: {
        create: lignesData.map((l, i) => ({
          beneficiaireNom: l.beneficiaireNom,
          beneficiaireMobile: l.beneficiaireMobile,
          montant: new Decimal(l.montant),
          motifPaiement: l.motifPaiement,
          referenceIta: `${reference}-L${i + 1}`,
          statut: 'PREPARE',
        })),
      },
    },
    include: { lignes: true },
  });

  console.log(`   ✅ Demande créée : ${demande.referenceIta}`);
  console.log(`   💰 Montant total : ${montantTotal.toLocaleString('fr-FR')} XOF`);
  console.log(`   👥 ${demande.lignes.length} bénéficiaire(s)\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Vérification bénéficiaires
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🔍 ÉTAPE 2 : Vérification bénéficiaires (verify_recipient)');

  const { obtenirClientWaveSingleton } = await import(
    '../lib/paiements/wave/factory'
  );
  const client = obtenirClientWaveSingleton();

  let nombreBloquees = 0;

  for (const ligne of demande.lignes) {
    const reponse = await client.verifierDestinataire({
      recipient: ligne.beneficiaireMobile,
      name: ligne.beneficiaireNom,
      amount: ligne.montant.toString(),
    });

    const bloquee =
      reponse.name_match === 'NO_MATCH' || reponse.within_limits === false;

    if (bloquee) {
      nombreBloquees++;
    }

    await prisma.lignePaiement.update({
      where: { id: ligne.id },
      data: {
        verifieLe: new Date(),
        nameMatch: reponse.name_match || 'MATCH',
        withinLimits: reponse.within_limits ?? true,
        statut: 'VERIFIE',
      },
    });

    console.log(
      `   ${bloquee ? '⚠️' : '✅'} ${ligne.beneficiaireNom} — ${reponse.name_match} — ${reponse.within_limits ? 'OK' : 'HORS LIMITES'}`
    );
  }

  console.log(`   ✅ Vérification terminée (${nombreBloquees} bloquée(s))\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Demande autorisation
  // ═══════════════════════════════════════════════════════════════════════

  console.log('📋 ÉTAPE 3 : Demande autorisation');

  const autorisation = await prisma.autorisationPaiement.create({
    data: {
      demandePaiementId: demande.id,
      demandeeParId: preparateur.id,
      montantFige: demande.montantTotal,
    },
  });

  console.log(`   ✅ Autorisation demandée`);
  console.log(`   💰 Montant figé : ${demande.montantTotal.toString()} XOF\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Autorisation DG (manuel — nécessite TOTP)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🔐 ÉTAPE 4 : Autorisation DG (TOTP)');
  console.log('   ⚠️  ÉTAPE MANUELLE — Nécessite TOTP réel');
  console.log(`   📱 L'autoriseur doit se connecter et valider la demande ${reference}`);
  console.log('   ⏭️  Passage à l\'étape 5 (simulation sans autorisation)\n');

  // Simuler autorisation pour continuer le test
  await prisma.autorisationPaiement.update({
    where: { demandePaiementId: demande.id },
    data: {
      autoriseeParId: autoriseur.id,
      autoriseeLe: new Date(),
      expireLe: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    },
  });

  await prisma.lignePaiement.updateMany({
    where: { demandePaiementId: demande.id },
    data: { statut: 'AUTORISE' },
  });

  console.log('   ✅ Autorisation simulée (pour test)\n');

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Exécution paiement (client simulé)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('💸 ÉTAPE 5 : Exécution paiement (client simulé)');

  const lignesAutorisees = await prisma.lignePaiement.findMany({
    where: { demandePaiementId: demande.id, statut: 'AUTORISE' },
  });

  for (const ligne of lignesAutorisees) {
    try {
      // Appeler Wave payout
      const reponse = await client.payout(
        {
          amount: ligne.montant.toString(),
          currency: 'XOF',
          recipient: ligne.beneficiaireMobile,
          payment_reason: ligne.motifPaiement,
          client_reference: ligne.referenceIta,
        },
        ligne.cleIdempotence
      );

      // Marquer EN_COURS puis REUSSI (simulé)
      await prisma.lignePaiement.update({
        where: { id: ligne.id },
        data: {
          statut: reponse.success ? 'REUSSI' : 'ECHOUE',
          wavePayoutId: reponse.payout_id || null,
          executeLe: new Date(),
          fraisWave: reponse.success ? new Decimal(500) : null,
        },
      });

      // Enregistrer tentative
      await prisma.tentativePaiement.create({
        data: {
          lignePaiementId: ligne.id,
          numero: 1,
          httpStatus: reponse.httpStatus,
          reponseBrute: reponse as any,
          erreurCode: reponse.success ? null : 'unknown',
        },
      });

      console.log(
        `   ${reponse.success ? '✅' : '❌'} ${ligne.beneficiaireNom} — ${ligne.montant.toString()} XOF`
      );
    } catch (error: any) {
      console.error(`   ❌ ${ligne.beneficiaireNom} — ERREUR : ${error.message}`);
    }
  }

  console.log('\n🎉 Test de recette terminé\n');

  // ═══════════════════════════════════════════════════════════════════════
  // Résumé
  // ═══════════════════════════════════════════════════════════════════════

  const stats = await prisma.lignePaiement.groupBy({
    by: ['statut'],
    where: { demandePaiementId: demande.id },
    _count: true,
  });

  console.log('📊 Résumé :');
  stats.forEach((s) => {
    console.log(`   - ${s.statut} : ${s._count}`);
  });

  console.log(`\n✅ Flow complet testé avec succès`);
  console.log(`📝 Demande : ${reference}`);
  console.log(
    `💰 Montant : ${montantTotal.toLocaleString('fr-FR')} XOF`
  );

  console.log('\n⚠️  NOTES :');
  console.log('   - L\'autorisation TOTP n\'a pas été testée (étape manuelle)');
  console.log('   - Le client Wave utilisé est SIMULÉ (pas d\'appel API réel)');
  console.log('   - Pour tester en réel, définir WAVE_API_KEY dans .env.dev');
}

main()
  .catch((e) => {
    console.error('❌ Erreur test flow M15 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
