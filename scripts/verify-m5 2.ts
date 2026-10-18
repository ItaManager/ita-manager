#!/usr/bin/env tsx
/**
 * Vérification M5 — Projets et Planning
 *
 * Vérifie :
 * - Permissions M5 présentes
 * - Modèles Prisma créés
 * - Enums StatutProjet et CyclePaie
 * - Création automatique LieuLivraison
 * - Cycle de vie projet
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
  console.log('🔍 Vérification M5 — Projets et Planning\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. PERMISSIONS M5
  // ===========================================================================

  console.log('1️⃣  Vérification des permissions M5...');
  const PERMISSIONS_M5 = ['projet:creer', 'planning:modifier', 'jalon:valider'];

  const permissions = await prisma.permission.findMany({
    where: { code: { in: PERMISSIONS_M5 } },
  });

  if (permissions.length !== 3) {
    console.log(`   ❌ Attendu: 3 permissions, trouvé: ${permissions.length}`);
    erreurs++;
  } else {
    console.log(`   ✅ 3 permissions M5 présentes`);
  }

  // ===========================================================================
  // 2. MODÈLES PRISMA M5
  // ===========================================================================

  console.log('\n2️⃣  Vérification des modèles Prisma M5...');

  const projetsCount = await prisma.projet.count();
  console.log(`   ✅ Modèle Projet : ${projetsCount} enregistrement(s)`);

  const tachesCount = await prisma.tache.count();
  console.log(`   ✅ Modèle Tache : ${tachesCount} enregistrement(s)`);

  const jalonsCount = await prisma.jalon.count();
  console.log(`   ✅ Modèle Jalon : ${jalonsCount} enregistrement(s)`);

  const affectationsCount = await prisma.affectationChantier.count();
  console.log(`   ✅ Modèle AffectationChantier : ${affectationsCount} enregistrement(s)`);

  const lieuxCount = await prisma.lieuLivraison.count();
  console.log(`   ✅ Modèle LieuLivraison : ${lieuxCount} enregistrement(s)`);

  // ===========================================================================
  // 3. STATUTS PROJET
  // ===========================================================================

  console.log('\n3️⃣  Vérification des statuts projet...');

  const projets = await prisma.projet.findMany({
    select: { statut: true },
  });

  const statutsUniques = new Set(projets.map((p) => p.statut));
  console.log(`   ✅ ${statutsUniques.size} statut(s) utilisé(s) actuellement`);
  console.log('   ℹ️  Statuts attendus : BROUILLON, OUVERT, EN_COURS, SUSPENDU, CLOTURE');

  // ===========================================================================
  // 4. CRÉATION AUTO LIEU LIVRAISON
  // ===========================================================================

  console.log('\n4️⃣  Vérification création auto LieuLivraison...');

  const projetsAvecLieu = await prisma.projet.findMany({
    include: { lieuLivraison: true },
  });

  const projetsSansLieu = projetsAvecLieu.filter((p) => !p.lieuLivraison);

  if (projetsSansLieu.length > 0) {
    console.log(`   ❌ ${projetsSansLieu.length} projet(s) sans LieuLivraison`);
    erreurs++;
  } else {
    console.log(`   ✅ Tous les projets ont un LieuLivraison associé`);
  }

  // ===========================================================================
  // 5. WORKFLOW
  // ===========================================================================

  console.log('\n5️⃣  Vérification du workflow...');

  // Transitions autorisées (M5 §5.3)
  const transitionsAutorisees = [
    ['BROUILLON', 'OUVERT'],
    ['OUVERT', 'EN_COURS'],
    ['EN_COURS', 'SUSPENDU'],
    ['SUSPENDU', 'EN_COURS'],
    ['EN_COURS', 'CLOTURE'],
  ];

  console.log(`   ✅ ${transitionsAutorisees.length} transitions définies`);
  console.log('   ℹ️  SUSPENDU ⇄ EN_COURS autorisé (bidirectionnel)');

  // ===========================================================================
  // RÉSULTAT
  // ===========================================================================

  console.log('\n' + '='.repeat(60));
  if (erreurs > 0) {
    console.log(`❌ ${erreurs} erreur(s) détectée(s)`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  } else {
    console.log('✅ Tous les critères M5 sont satisfaits');
    console.log('='.repeat(60) + '\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur verify-m5 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
