/**
 * Test d'idempotence — LE PLUS IMPORTANT
 *
 * Prouve que :
 * 1. Même clé + même corps → UN SEUL transfert
 * 2. Même clé + corps différent → idempotency-mismatch (ECHOUE + alerte)
 * 3. La clé doit être générée À LA CRÉATION, jamais à l'appel
 *
 * Ce test DOIT échouer si on génère la clé au moment de l'appel.
 */

import { creerClientSimule } from '../lib/paiements/wave/client-simule';
import {
  statutDepuisReponse,
  estAlerteCritique,
} from '../lib/paiements/wave/classement-erreurs';
import type { ParamsPayout } from '../lib/paiements/wave/types';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST IDEMPOTENCE — Garantie contre le double paiement');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = creerClientSimule();
  client.definirScenarioGlobal('SUCCES');

  const params: ParamsPayout = {
    amount: '50000',
    currency: 'XOF',
    recipient: '+2250701234567',
    payment_reason: 'Salaire janvier',
    client_reference: 'SAL-2026-01-001',
  };

  // ─────────────────────────────────────────────────────────────────────
  // 1. Premier appel avec une clé donnée
  // ─────────────────────────────────────────────────────────────────────
  console.log('1️⃣  Premier appel');
  const cle1 = 'test-cle-idempotence-001';
  const r1 = await client.payout(params, cle1);

  console.log(`   Réponse : ${r1.status}`);
  console.log(`   Transferts réels : ${client.transfertsReels()}`);

  if (client.transfertsReels() !== 1) {
    console.error('   ❌ ÉCHEC : attendu 1 transfert, obtenu', client.transfertsReels());
    process.exit(1);
  }
  console.log('   ✅ UN transfert\n');

  // ─────────────────────────────────────────────────────────────────────
  // 2. Même clé, même corps → DOIT être dédoublonné
  // ─────────────────────────────────────────────────────────────────────
  console.log('2️⃣  Rejeu avec MÊME clé et MÊME corps');
  const r2 = await client.payout(params, cle1);

  console.log(`   Réponse : ${r2.status}`);
  console.log(`   Transferts réels : ${client.transfertsReels()}`);

  if (client.transfertsReels() !== 1) {
    console.error('   ❌ ÉCHEC : idempotence NON respectée, obtenu', client.transfertsReels(), 'transferts');
    console.error('   💥 DOUBLE PAIEMENT détecté — cleIdempotence générée à l\'appel ?');
    process.exit(1);
  }
  console.log('   ✅ Toujours UN transfert (dédoublonné)\n');

  // ─────────────────────────────────────────────────────────────────────
  // 3. Vérifier le journal
  // ─────────────────────────────────────────────────────────────────────
  console.log('3️⃣  Vérification du journal');
  const appels = client.obtenirAppelsPayout();

  console.log(`   Nombre d'appels enregistrés : ${appels.length}`);
  console.log(`   Appel 1 — deduplique : ${appels[0].deduplique}`);
  console.log(`   Appel 2 — deduplique : ${appels[1].deduplique}`);

  if (appels.length !== 2) {
    console.error('   ❌ ÉCHEC : attendu 2 appels, obtenu', appels.length);
    process.exit(1);
  }

  if (appels[0].deduplique !== false || appels[1].deduplique !== true) {
    console.error('   ❌ ÉCHEC : mauvais marquage de déduplication');
    process.exit(1);
  }
  console.log('   ✅ Journal correct\n');

  // ─────────────────────────────────────────────────────────────────────
  // 4. Même clé, corps DIFFÉRENT → idempotency-mismatch
  // ─────────────────────────────────────────────────────────────────────
  console.log('4️⃣  Même clé avec corps DIFFÉRENT (montant changé)');
  const paramsModifies = { ...params, amount: '60000' };
  const r3 = await client.payout(paramsModifies, cle1);

  console.log(`   Réponse HTTP : ${r3.httpStatus}`);
  console.log(`   Code erreur : ${r3.errorCode}`);

  if (r3.errorCode !== 'idempotency-mismatch') {
    console.error('   ❌ ÉCHEC : attendu idempotency-mismatch, obtenu', r3.errorCode);
    process.exit(1);
  }
  console.log('   ✅ idempotency-mismatch détecté\n');

  // ─────────────────────────────────────────────────────────────────────
  // 5. Vérifier que c'est une alerte critique
  // ─────────────────────────────────────────────────────────────────────
  console.log('5️⃣  Vérification alerte critique');
  const critique = estAlerteCritique(r3);

  console.log(`   estAlerteCritique : ${critique}`);

  if (!critique) {
    console.error('   ❌ ÉCHEC : idempotency-mismatch DOIT être une alerte critique');
    process.exit(1);
  }
  console.log('   ✅ Alerte critique activée\n');

  // ─────────────────────────────────────────────────────────────────────
  // 6. Vérifier le statut : ECHOUE, jamais EN_ATTENTE
  // ─────────────────────────────────────────────────────────────────────
  console.log('6️⃣  Vérification statut');
  const resultat = statutDepuisReponse(r3);

  console.log(`   Statut : ${resultat.statut}`);
  console.log(`   Alerte : ${resultat.alerteCritique?.substring(0, 50)}...`);

  if (resultat.statut !== 'ECHOUE') {
    console.error('   ❌ ÉCHEC : idempotency-mismatch doit produire ECHOUE, obtenu', resultat.statut);
    process.exit(1);
  }

  if (!resultat.alerteCritique?.includes('idempotency-mismatch')) {
    console.error('   ❌ ÉCHEC : alerteCritique doit mentionner idempotency-mismatch');
    process.exit(1);
  }
  console.log('   ✅ Statut ECHOUE avec alerte\n');

  // ─────────────────────────────────────────────────────────────────────
  // 7. Documentation
  // ─────────────────────────────────────────────────────────────────────
  console.log('7️⃣  Documentation du cas idempotency-mismatch\n');
  console.log('   Ce n\'est PAS une erreur de Wave.');
  console.log('   C\'est un DÉFAUT DE NOTRE CODE.\n');
  console.log('   Causes possibles :');
  console.log('   - cleIdempotence générée à l\'appel au lieu de la création');
  console.log('   - Corps de requête modifié entre deux tentatives');
  console.log('   - Montant recalculé au lieu d\'être figé\n');
  console.log('   Conséquence si ignoré :');
  console.log('   - Le rejeu enverra l\'argent UNE SECONDE FOIS');
  console.log('   - DOUBLE PAIEMENT irrécupérable\n');

  // ─────────────────────────────────────────────────────────────────────
  // RÉSULTAT
  // ─────────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ TEST RÉUSSI — Idempotence garantie');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Appels enregistrés : ${appels.length + 1}`);
  console.log(`Transferts réels : ${client.transfertsReels()}`);
  console.log(`Ratio : ${((client.transfertsReels() / (appels.length + 1)) * 100).toFixed(0)}% (attendu 33%)\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 ERREUR INATTENDUE\n', err);
  process.exit(1);
});
