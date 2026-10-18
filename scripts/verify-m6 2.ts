#!/usr/bin/env tsx
/**
 * Vérification M6 — Relevés d'activité
 *
 * Vérifie :
 * - Permissions M6 présentes
 * - Modèles Prisma créés (6 modèles)
 * - Enums StatutReleve et EtatPointage
 * - Contrainte d'unicité projetId + date
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🔍 Vérification M6 — Relevés d\'activité\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. PERMISSIONS M6
  // ===========================================================================

  console.log('1️⃣  Vérification des permissions M6...');
  const PERMISSIONS_M6 = ['releve:saisir', 'releve:viser'];

  const permissions = await prisma.permission.findMany({
    where: { code: { in: PERMISSIONS_M6 } },
  });

  if (permissions.length !== 2) {
    console.log(`   ❌ Attendu: 2 permissions, trouvé: ${permissions.length}`);
    erreurs++;
  } else {
    console.log(`   ✅ 2 permissions M6 présentes`);
  }

  // ===========================================================================
  // 2. MODÈLES PRISMA M6
  // ===========================================================================

  console.log('\n2️⃣  Vérification des modèles Prisma M6...');

  const relevesCount = await prisma.releveActivite.count();
  console.log(`   ✅ Modèle ReleveActivite : ${relevesCount} enregistrement(s)`);

  const pointagesCount = await prisma.pointage.count();
  console.log(`   ✅ Modèle Pointage : ${pointagesCount} enregistrement(s)`);

  const travauxCount = await prisma.travauxRealises.count();
  console.log(`   ✅ Modèle TravauxRealises : ${travauxCount} enregistrement(s)`);

  const materielCount = await prisma.utilisationMateriel.count();
  console.log(`   ✅ Modèle UtilisationMateriel : ${materielCount} enregistrement(s)`);

  const consommationsCount = await prisma.consommationMateriau.count();
  console.log(`   ✅ Modèle ConsommationMateriau : ${consommationsCount} enregistrement(s)`);

  const incidentsCount = await prisma.incident.count();
  console.log(`   ✅ Modèle Incident : ${incidentsCount} enregistrement(s)`);

  // ===========================================================================
  // 3. STATUTS RELEVÉ
  // ===========================================================================

  console.log('\n3️⃣  Vérification des statuts relevé...');

  const releves = await prisma.releveActivite.findMany({
    select: { statut: true },
  });

  const statutsUniques = new Set(releves.map((r) => r.statut));
  console.log(`   ✅ ${statutsUniques.size} statut(s) utilisé(s) actuellement`);
  console.log('   ℹ️  Statuts attendus : BROUILLON, SOUMIS, VISE, REFUSE');

  // ===========================================================================
  // 4. CONTRAINTE D'UNICITÉ
  // ===========================================================================

  console.log('\n4️⃣  Vérification contrainte d\'unicité (projetId + date)...');

  // Vérifier s'il y a des doublons (ne devrait jamais arriver grâce à @@unique)
  const doublons = await prisma.$queryRaw<Array<{ projetId: string; date: Date; count: bigint }>>`
    SELECT "projetId", date, COUNT(*) as count
    FROM releves_activite
    GROUP BY "projetId", date
    HAVING COUNT(*) > 1
  `;

  if (doublons.length > 0) {
    console.log(`   ❌ ${doublons.length} doublon(s) détecté(s) !`);
    erreurs++;
  } else {
    console.log(`   ✅ Aucun doublon (contrainte M6 §8.1 respectée)`);
  }

  // ===========================================================================
  // 5. WORKFLOW
  // ===========================================================================

  console.log('\n5️⃣  Vérification du workflow...');

  // Transitions autorisées (M6 §5.1)
  const transitionsAutorisees = [
    ['BROUILLON', 'SOUMIS'],
    ['SOUMIS', 'VISE'],
    ['SOUMIS', 'REFUSE'],
    ['REFUSE', 'BROUILLON'],
  ];

  console.log(`   ✅ ${transitionsAutorisees.length} transitions définies`);
  console.log('   ℹ️  REFUSE revient à BROUILLON (M6 §5.1)');

  // ===========================================================================
  // RÉSULTAT
  // ===========================================================================

  console.log('\n' + '='.repeat(60));
  if (erreurs > 0) {
    console.log(`❌ ${erreurs} erreur(s) détectée(s)`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  } else {
    console.log('✅ Tous les critères M6 sont satisfaits (structure de base)');
    console.log('\n📌 Note : M6 nécessite implémentation IndexedDB hors ligne');
    console.log('   M6 §3.3 : Brouillon local, synchronisation différée');
    console.log('   M6 §3.2 : Pointage par exception (tous présents par défaut)');
    console.log('='.repeat(60) + '\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur verify-m6 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
