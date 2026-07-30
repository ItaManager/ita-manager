#!/usr/bin/env tsx
/**
 * Seed M3 uniquement — Types d'absence et Permissions Congés
 *
 * Ce script seed les données de référence du module M3 :
 * - 4 types d'absence de base (source : M3-CONGES.md §2)
 * - 3 permissions congés (source : M3-CONGES.md §8)
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-m3-only.ts
 */

import { PrismaClient } from '@prisma/client';

// Utilise la connexion directe (scripts/lib/) pour éviter pgBouncer
// Règle §11.8 : ne pas mélanger client applicatif et client de script
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant dans .env.dev');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log('🌱 Seed M3 — Types d\'absence et Permissions\n');

  // =========================================================================
  // TYPES D'ABSENCE (source : M3-CONGES.md §2)
  // =========================================================================

  const TYPES_ABSENCE = [
    {
      libelle: 'Congé annuel',
      decompte: true,         // Décompté du solde
      pieceRequise: false,    // Pas de justificatif requis
      pieceClassification: false,
      actif: true,
    },
    {
      libelle: 'Congé maladie',
      decompte: false,        // Ne décompte pas du solde (déclaration, pas demande)
      pieceRequise: true,     // Certificat médical requis
      pieceClassification: true, // PARTICULIER : accès DRH seule (§7.5)
      actif: true,
    },
    {
      libelle: 'Permission exceptionnelle',
      decompte: true,         // Décompté du solde
      pieceRequise: false,    // Pas systématiquement (mariage, décès, etc.)
      pieceClassification: false,
      actif: true,
    },
    {
      libelle: 'Congé sans solde',
      decompte: false,        // Ne décompte pas (congé non payé)
      pieceRequise: false,
      pieceClassification: false,
      actif: true,
    },
  ];

  console.log('📋 Types d\'absence');
  let countTypes = 0;
  for (const type of TYPES_ABSENCE) {
    await prisma.typeAbsence.upsert({
      where: { libelle: type.libelle },
      create: type,
      update: {
        decompte: type.decompte,
        pieceRequise: type.pieceRequise,
        pieceClassification: type.pieceClassification,
        actif: type.actif,
      },
    });
    countTypes++;
  }
  console.log(`   ✅ ${countTypes} types d'absence créés/vérifiés\n`);

  // =========================================================================
  // PERMISSIONS M3 (source : M3-CONGES.md §8)
  // =========================================================================

  const PERMISSIONS_M3 = [
    // --- RH ---
    {
      code: 'absence:demander',
      libelle: 'Créer une demande d\'absence pour soi',
      domaine: 'RH',
    },
    {
      code: 'absence:valider',
      libelle: 'Contrôle RH des demandes d\'absence',
      domaine: 'RH',
    },

    // --- ADMIN ---
    {
      code: 'reglesConges:modifier',
      libelle: 'Modifier les règles de congés (dotation, fériés, plafonds)',
      domaine: 'ADMIN',
    },
  ];

  console.log('📋 Permissions M3');
  let countPerm = 0;
  for (const perm of PERMISSIONS_M3) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { libelle: perm.libelle, domaine: perm.domaine },
    });
    countPerm++;
  }
  console.log(`   ✅ ${countPerm} permissions M3 créées/mises à jour\n`);

  // =========================================================================
  // ATTRIBUTION DES PERMISSIONS AUX RÔLES (source : M3-CONGES.md §8)
  // =========================================================================

  const ATTRIBUTIONS = [
    // ADMIN : toutes les permissions M3
    {
      role: 'ADMIN',
      permissions: ['absence:demander', 'absence:valider', 'reglesConges:modifier'],
    },

    // DRH : demander et valider (contrôle RH)
    {
      role: 'DRH',
      permissions: ['absence:demander', 'absence:valider'],
    },

    // RH : demander uniquement (pas de validation RH)
    {
      role: 'RH',
      permissions: ['absence:demander'],
    },

    // DG, DFC, DT, CT, CC, CE : tous peuvent demander leurs congés
    // (tous sauf journaliers — §8, ligne 304)
    { role: 'DG', permissions: ['absence:demander'] },
    { role: 'DFC', permissions: ['absence:demander'] },
    { role: 'DT', permissions: ['absence:demander'] },
    { role: 'CT', permissions: ['absence:demander'] },
    { role: 'CC', permissions: ['absence:demander'] },
    { role: 'CE', permissions: ['absence:demander'] },
  ];

  console.log('📋 Attribution des permissions aux rôles');
  for (const attribution of ATTRIBUTIONS) {
    const role = await prisma.role.findUnique({ where: { code: attribution.role } });
    if (!role) {
      console.log(`   ⚠️  Rôle ${attribution.role} non trouvé, ignoré`);
      continue;
    }

    for (const permCode of attribution.permissions) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!permission) {
        console.log(`   ⚠️  Permission ${permCode} non trouvée, ignorée`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
        update: {},
      });
    }
    console.log(`   ✅ ${attribution.role} : ${attribution.permissions.length} permission(s)`);
  }

  console.log('\n✅ Seed M3 terminé\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed M3 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
