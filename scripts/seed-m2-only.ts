#!/usr/bin/env tsx
/**
 * Seed M2 uniquement — Nationalités et Permissions Employés
 *
 * Ce script seed les données de référence du module M2 :
 * - 10 nationalités (source : ApercuM2.jsx ligne 104)
 * - 7 permissions employés (source : M2-EMPLOYES.md §5)
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-m2-only.ts
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
  console.log('🌱 Seed M2 — Nationalités et Permissions\n');

  // =========================================================================
  // NATIONALITÉS (source : ApercuM2.jsx ligne 104, lue ligne à ligne)
  // =========================================================================

  const NATIONALITES = [
    'Ivoirienne',
    'Burkinabè',
    'Malienne',
    'Guinéenne',
    'Ghanéenne',
    'Sénégalaise',
    'Béninoise',
    'Togolaise',
    'Nigérienne',
    'Française',
  ];

  console.log('📋 Nationalités');
  let countNat = 0;
  for (const libelle of NATIONALITES) {
    await prisma.nationalite.upsert({
      where: { libelle },
      create: { libelle },
      update: {},
    });
    countNat++;
  }
  console.log(`   ✅ ${countNat} nationalités créées/vérifiées\n`);

  // =========================================================================
  // PERMISSIONS M2 (source : M2-EMPLOYES.md §5, lue ligne à ligne)
  // =========================================================================

  const PERMISSIONS_M2 = [
    // --- RH ---
    { code: 'employe:lire', libelle: 'Consulter la liste et les fiches employés', domaine: 'RH' },
    { code: 'employe:creer', libelle: 'Créer un profil employé', domaine: 'RH' },
    { code: 'employe:modifier', libelle: 'Modifier un profil employé', domaine: 'RH' },
    { code: 'employe:archiver', libelle: 'Archiver un employé sortant', domaine: 'RH' },
    { code: 'employe:donneesSensibles', libelle: 'Voir salaire, CNPS, RIB, Wave', domaine: 'RH' },

    // --- PAIE ---
    { code: 'derogation:valider', libelle: 'Statuer sur une dérogation salariale', domaine: 'PAIE' },

    // --- REFERENTIEL ---
    { code: 'posteDirection:affecter', libelle: 'Affecter un poste réservé (directions)', domaine: 'REFERENTIEL' },
  ];

  console.log('📋 Permissions M2');
  let countPerm = 0;
  for (const perm of PERMISSIONS_M2) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { libelle: perm.libelle, domaine: perm.domaine },
    });
    countPerm++;
  }
  console.log(`   ✅ ${countPerm} permissions M2 créées/mises à jour\n`);

  // =========================================================================
  // ATTRIBUTION DES PERMISSIONS AUX RÔLES (source : M2-EMPLOYES.md §5)
  // =========================================================================

  const ATTRIBUTIONS = [
    // ADMIN : toutes les permissions M2
    { role: 'ADMIN', permissions: ['employe:lire', 'employe:creer', 'employe:modifier', 'employe:archiver', 'employe:donneesSensibles', 'derogation:valider', 'posteDirection:affecter'] },

    // DRH : toutes sauf posteDirection:affecter (réservée ADMIN)
    { role: 'DRH', permissions: ['employe:lire', 'employe:creer', 'employe:modifier', 'employe:archiver', 'employe:donneesSensibles'] },

    // RH : crée et modifie, mais NE VOIT PAS les rémunérations (règle importante §5)
    { role: 'RH', permissions: ['employe:lire', 'employe:creer', 'employe:modifier'] },

    // DFC : voit les données sensibles et valide les dérogations
    { role: 'DFC', permissions: ['employe:lire', 'employe:donneesSensibles', 'derogation:valider'] },

    // DT, CT, CC : lecture seule
    { role: 'DT', permissions: ['employe:lire'] },
    { role: 'CT', permissions: ['employe:lire'] },
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
    console.log(`   ✅ ${attribution.role} : ${attribution.permissions.length} permissions`);
  }

  console.log('\n✅ Seed M2 terminé\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed M2 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
