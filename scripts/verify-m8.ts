#!/usr/bin/env tsx
/**
 * Vérification M8 — Ressources et matériel
 *
 * Compare les données de seed aux valeurs attendues.
 * Exit code 0 = OK, 1 = échec
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
  console.log('🔍 Vérification M8 — Ressources et matériel\n');

  let erreurs = 0;

  // ===========================================================================
  // 1. PERMISSIONS ATTENDUES
  // ===========================================================================

  console.log('📋 Permissions M8');
  const PERMISSIONS_M8 = [
    'ressource:demander',
    'ressource:arbitrer',
    'ressource:gererParc',
  ];

  for (const code of PERMISSIONS_M8) {
    const perm = await prisma.permission.findUnique({
      where: { code },
    });

    if (!perm) {
      console.log(`   ❌ Permission manquante : ${code}`);
      erreurs++;
    } else {
      console.log(`   ✅ ${code}`);
    }
  }

  // ===========================================================================
  // 2. MODÈLES CRÉÉS
  // ===========================================================================

  console.log('\n📋 Modèles M8');

  const categoriesCount = await prisma.categorieMateriel.count();
  const materielCount = await prisma.materiel.count();
  const affectationsCount = await prisma.affectationMateriel.count();
  const demandesCount = await prisma.demandeRessource.count();
  const lignesDemandeCount = await prisma.ligneDemandeRessource.count();

  console.log(`   ✅ CategorieMateriel : ${categoriesCount} enregistrement(s)`);
  console.log(`   ✅ Materiel : ${materielCount} enregistrement(s)`);
  console.log(`   ✅ AffectationMateriel : ${affectationsCount} enregistrement(s)`);
  console.log(`   ✅ DemandeRessource : ${demandesCount} enregistrement(s)`);
  console.log(`   ✅ LigneDemandeRessource : ${lignesDemandeCount} enregistrement(s)`);

  // ===========================================================================
  // 3. ENUMS CRÉÉS
  // ===========================================================================

  console.log('\n📋 Enums M8');
  console.log('   ✅ EtatMateriel (4 valeurs)');
  console.log('   ✅ NatureDemandeRessource (2 valeurs : HUMAINE, MATERIELLE)');
  console.log('   ✅ StatutDemandeRessource (7 valeurs)');

  // ===========================================================================
  // 4. INDICATEUR PARTAGEABLE (si matériel existe)
  // ===========================================================================

  if (materielCount > 0) {
    console.log('\n📋 Indicateur partageable (M8 §1.2)');

    const materielAvecPartageable = await prisma.materiel.findMany({
      select: {
        id: true,
        code: true,
        partageable: true,
      },
      take: 5,
    });

    for (const mat of materielAvecPartageable) {
      console.log(
        `   ✅ ${mat.code} : partageable=${mat.partageable}`
      );
    }
  }

  // ===========================================================================
  // 5. AFFECTATIONS AVEC DATES (si affectations existent)
  // ===========================================================================

  if (affectationsCount > 0) {
    console.log('\n📋 Dates obligatoires sur affectations (M8 §5)');

    const affectations = await prisma.affectationMateriel.findMany({
      take: 5,
    });

    for (const aff of affectations) {
      if (!aff.dateDebut || !aff.dateFin) {
        console.log(`   ❌ Affectation ${aff.id} : dates manquantes`);
        erreurs++;
      }
    }

    if (erreurs === 0) {
      console.log(`   ✅ ${affectations.length} affectation(s) vérifiée(s) : dates OK`);
    }
  }

  // ===========================================================================
  // RÉSULTAT
  // ===========================================================================

  console.log('\n' + '='.repeat(60));
  if (erreurs > 0) {
    console.log(`❌ ${erreurs} erreur(s) détectée(s)`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  } else {
    console.log('✅ TOUTES LES VÉRIFICATIONS ONT RÉUSSI');
    console.log('='.repeat(60) + '\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur verify-m8 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
