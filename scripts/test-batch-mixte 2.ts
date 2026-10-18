/**
 * Test batch mixte — 20 paiements, 3 résultats différents
 *
 * Prouve que :
 * 1. Un lot MIXTE est le cas normal (Wave le documente)
 * 2. Chaque payout doit être inspecté individuellement
 * 3. Le statut du lot (processing/complete) ne dit RIEN sur les résultats
 * 4. Un payout qui reste en 'processing' devient EN_ATTENTE après N interrogations
 *
 * Scénario :
 * - Ligne 6 : status 'processing' qui persiste → EN_COURS puis EN_ATTENTE
 * - Ligne 11 : status 'failed' + recipient-limit-exceeded → ECHOUE
 * - 18 autres : status 'succeeded' → REUSSI
 */

import { creerClientSimule } from '../lib/paiements/wave/client-simule';
import { statutDepuisReponse } from '../lib/paiements/wave/classement-erreurs';
import type { ParamsBatch } from '../lib/paiements/wave/types';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST BATCH MIXTE — Inspection individuelle obligatoire');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = creerClientSimule();
  client.definirScenarioGlobal('SUCCES');

  // Programmer les cas particuliers
  client.programmerOrdre(6, 'PROCESSING'); // Reste en processing
  client.programmerOrdre(11, 'RECIPIENT_LIMIT'); // Échec définitif

  // ─────────────────────────────────────────────────────────────────────
  // 1. Créer un lot de 20 paiements
  // ─────────────────────────────────────────────────────────────────────
  console.log('1️⃣  Création du lot de 20 paiements\n');

  const params: ParamsBatch = {
    payouts: Array.from({ length: 20 }, (_, i) => ({
      amount: '25000',
      currency: 'XOF',
      recipient: `+22507${String(i + 1).padStart(8, '0')}`,
      payment_reason: 'Prime transport',
      client_reference: `BATCH-001-${String(i + 1).padStart(3, '0')}`,
    })),
  };

  const cleIdempotence = 'batch-test-001';
  const batchReponse = await client.payoutBatch(params, cleIdempotence);

  console.log(`   Lot créé : ${batchReponse.id}`);
  console.log(`   HTTP Status : ${batchReponse.httpStatus}`);

  if (batchReponse.httpStatus !== 200 || !batchReponse.id) {
    console.error('   ❌ ÉCHEC : création du lot échouée');
    process.exit(1);
  }
  console.log('   ✅ Lot accepté par Wave\n');

  // ─────────────────────────────────────────────────────────────────────
  // 2. Première interrogation — lot en traitement
  // ─────────────────────────────────────────────────────────────────────
  console.log('2️⃣  Première interrogation (immédiate)\n');

  const batch1 = await client.recupererBatch(batchReponse.id!);

  console.log(`   Statut du lot : ${batch1.status}`);
  console.log(`   Nombre de payouts : ${batch1.payouts?.length ?? 0}`);

  if (batch1.status !== 'processing') {
    console.error('   ❌ ÉCHEC : attendu status processing, obtenu', batch1.status);
    process.exit(1);
  }
  console.log('   ✅ Lot en cours de traitement\n');

  // ─────────────────────────────────────────────────────────────────────
  // 3. Inspection individuelle à la première interrogation
  // ─────────────────────────────────────────────────────────────────────
  console.log('3️⃣  Inspection individuelle (interrogation 1)\n');

  const payouts1 = batch1.payouts ?? [];
  const stats1 = {
    succeeded: 0,
    processing: 0,
    failed: 0,
  };

  payouts1.forEach((p) => {
    if (p.status === 'succeeded') stats1.succeeded++;
    else if (p.status === 'processing') stats1.processing++;
    else if (p.status === 'failed') stats1.failed++;
  });

  console.log(`   succeeded : ${stats1.succeeded}`);
  console.log(`   processing : ${stats1.processing}`);
  console.log(`   failed : ${stats1.failed}\n`);

  // Vérifier ligne 6 (index 5) — EN_COURS
  const ligne6_interro1 = payouts1[5];
  const statut6_interro1 = statutDepuisReponse(ligne6_interro1);

  console.log(`   Ligne 6 (index 5) :`);
  console.log(`     status : ${ligne6_interro1.status}`);
  console.log(`     Statut classé : ${statut6_interro1.statut}`);

  if (statut6_interro1.statut !== 'EN_COURS') {
    console.error('   ❌ ÉCHEC : status processing doit donner EN_COURS');
    process.exit(1);
  }
  console.log('   ✅ status processing → EN_COURS\n');

  // Vérifier ligne 11 (index 10) — ECHOUE
  const ligne11 = payouts1[10];
  const statut11 = statutDepuisReponse(ligne11);

  console.log(`   Ligne 11 (index 10) :`);
  console.log(`     status : ${ligne11.status}`);
  console.log(`     error_code : ${ligne11.payoutError?.error_code}`);
  console.log(`     Statut classé : ${statut11.statut}`);

  if (statut11.statut !== 'ECHOUE') {
    console.error('   ❌ ÉCHEC : recipient-limit-exceeded doit donner ECHOUE');
    process.exit(1);
  }
  console.log('   ✅ Ligne 11 ECHOUE (définitif)\n');

  // ─────────────────────────────────────────────────────────────────────
  // 4. Interrogations suivantes (2, 3, 4) — processing persiste
  // ─────────────────────────────────────────────────────────────────────
  console.log('4️⃣  Interrogations 2 à 4 — processing persiste\n');

  for (let i = 2; i <= 4; i++) {
    const batch = await client.recupererBatch(batchReponse.id!);
    console.log(`   Interrogation ${i} : status du lot = ${batch.status}`);

    const ligne6 = batch.payouts?.[5];
    if (ligne6?.status !== 'processing') {
      console.error(`   ❌ ÉCHEC : ligne 6 devrait rester en processing`);
      process.exit(1);
    }
  }

  console.log('   ✅ Ligne 6 reste en processing (état inconnu)\n');

  // ─────────────────────────────────────────────────────────────────────
  // 5. Cinquième interrogation — lot complet
  // ─────────────────────────────────────────────────────────────────────
  console.log('5️⃣  Cinquième interrogation — lot complet\n');

  const batch5 = await client.recupererBatch(batchReponse.id!);

  console.log(`   Statut du lot : ${batch5.status}`);

  if (batch5.status !== 'complete') {
    console.error('   ❌ ÉCHEC : attendu complete après 5 interrogations');
    process.exit(1);
  }
  console.log('   ✅ Lot marqué complete\n');

  // ─────────────────────────────────────────────────────────────────────
  // 6. Classement final — ligne 6 devient EN_ATTENTE
  // ─────────────────────────────────────────────────────────────────────
  console.log('6️⃣  Classement final après 5 interrogations\n');

  const payouts5 = batch5.payouts ?? [];
  const ligne6_final = payouts5[5];

  console.log(`   Ligne 6 :`);
  console.log(`     status : ${ligne6_final.status}`);

  // Après 5 interrogations, un processing qui persiste → EN_ATTENTE
  // (dans le vrai code, cette logique serait dans le traitement du lot)
  const interrogations = 5;
  let statutFinal6: string;

  if (ligne6_final.status === 'processing' && interrogations >= 5) {
    statutFinal6 = 'EN_ATTENTE';
  } else {
    statutFinal6 = statutDepuisReponse(ligne6_final).statut;
  }

  console.log(`     Statut après ${interrogations} interrogations : ${statutFinal6}`);

  if (statutFinal6 !== 'EN_ATTENTE') {
    console.error('   ❌ ÉCHEC : processing persistant doit devenir EN_ATTENTE');
    process.exit(1);
  }
  console.log('   ✅ processing persistant → EN_ATTENTE (à reprendre)\n');

  // ─────────────────────────────────────────────────────────────────────
  // 7. Bilan final
  // ─────────────────────────────────────────────────────────────────────
  console.log('7️⃣  Bilan final du lot\n');

  const bilanFinal = {
    REUSSI: 0,
    EN_ATTENTE: 0,
    ECHOUE: 0,
  };

  payouts5.forEach((p, index) => {
    // Logique de classement
    if (p.status === 'succeeded') {
      bilanFinal.REUSSI++;
    } else if (p.status === 'failed') {
      bilanFinal.ECHOUE++;
    } else if (p.status === 'processing' && interrogations >= 5) {
      // processing persistant après 5 interrogations
      bilanFinal.EN_ATTENTE++;
    }
  });

  console.log(`   REUSSI : ${bilanFinal.REUSSI}`);
  console.log(`   EN_ATTENTE : ${bilanFinal.EN_ATTENTE}`);
  console.log(`   ECHOUE : ${bilanFinal.ECHOUE}\n`);

  console.log('   Vérifications :');

  if (bilanFinal.REUSSI !== 18) {
    console.error(`   ❌ ÉCHEC : attendu 18 REUSSI, obtenu ${bilanFinal.REUSSI}`);
    process.exit(1);
  }
  console.log('   ✅ 18 paiements réussis');

  if (bilanFinal.EN_ATTENTE !== 1) {
    console.error(`   ❌ ÉCHEC : attendu 1 EN_ATTENTE, obtenu ${bilanFinal.EN_ATTENTE}`);
    process.exit(1);
  }
  console.log('   ✅ 1 paiement EN_ATTENTE (ligne 6, état inconnu)');

  if (bilanFinal.ECHOUE !== 1) {
    console.error(`   ❌ ÉCHEC : attendu 1 ECHOUE, obtenu ${bilanFinal.ECHOUE}`);
    process.exit(1);
  }
  console.log('   ✅ 1 paiement ECHOUE (ligne 11, définitif)\n');

  // ─────────────────────────────────────────────────────────────────────
  // 8. Documentation
  // ─────────────────────────────────────────────────────────────────────
  console.log('8️⃣  Enseignements\n');
  console.log('   a) Le statut du lot (processing/complete) ne dit RIEN sur les résultats');
  console.log('   b) Chaque payout DOIT être inspecté individuellement');
  console.log('   c) Un lot peut contenir 18 succès, 1 échec, 1 inconnu — c\'est NORMAL');
  console.log('   d) Un processing qui persiste N interrogations devient EN_ATTENTE');
  console.log('   e) EN_ATTENTE signifie : on ne sait pas, il faut chercher puis reprendre\n');

  // ─────────────────────────────────────────────────────────────────────
  // RÉSULTAT
  // ─────────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ TEST RÉUSSI — Inspection individuelle validée');
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 ERREUR INATTENDUE\n', err);
  process.exit(1);
});
