#!/usr/bin/env tsx
/**
 * Seed permissions M13 — Logistique L1
 *
 * Exécution :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-permissions-m13.ts
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DIRECT_URL ou DATABASE_URL manquant');
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const PERMISSIONS_M13_L1 = [
  {
    code: 'materiel:lire',
    libelle: 'Consulter le registre matériel et les échéances',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'materiel:creer',
    libelle: 'Créer une fiche matériel',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'materiel:modifier',
    libelle: 'Modifier une fiche matériel',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'typePiece:gerer',
    libelle: 'Créer et désactiver un type de pièce administrative',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'materiel:coutsAdministratifs',
    libelle: 'Consulter les coûts d\'acquisition et montants des pièces',
    domaine: 'TECHNIQUE',
  },
  {
    code: 'logistique:parametres',
    libelle: 'Configurer les paramètres logistiques (seuils, délais)',
    domaine: 'ADMIN',
  },
];

const ATTRIBUTIONS = [
  {
    roleCode: 'ADMIN',
    permCodes: [
      'materiel:lire',
      'materiel:creer',
      'materiel:modifier',
      'typePiece:gerer',
      'materiel:coutsAdministratifs',
      'logistique:parametres',
    ],
  },
  {
    roleCode: 'DG',
    permCodes: ['materiel:lire', 'materiel:coutsAdministratifs'],
  },
  {
    roleCode: 'DFC',
    permCodes: ['materiel:lire', 'materiel:coutsAdministratifs'],
  },
  {
    roleCode: 'DT',
    permCodes: [
      'materiel:lire',
      'materiel:creer',
      'materiel:modifier',
      'typePiece:gerer',
      'materiel:coutsAdministratifs',
    ],
  },
];

async function main() {
  console.log('📝 Seed permissions M13 L1 — Logistique\n');

  // ===========================================================================
  // 1. CRÉER LES PERMISSIONS
  // ===========================================================================

  for (const perm of PERMISSIONS_M13_L1) {
    const existante = await prisma.permission.findUnique({
      where: { code: perm.code },
    });

    if (existante) {
      console.log(`   ⏭️  Permission existante : ${perm.code}`);
    } else {
      await prisma.permission.create({ data: perm });
      console.log(`   ✅ Permission créée : ${perm.code}`);
    }
  }

  // ===========================================================================
  // 2. ATTRIBUER AUX RÔLES
  // ===========================================================================

  console.log('\n📋 Attributions de permissions\n');

  for (const { roleCode, permCodes } of ATTRIBUTIONS) {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      console.log(`   ⚠️  Rôle ${roleCode} introuvable`);
      continue;
    }

    for (const permCode of permCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code: permCode },
      });

      if (!permission) {
        console.log(`   ⚠️  Permission ${permCode} introuvable`);
        continue;
      }

      const existante = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
      });

      if (existante) {
        console.log(`   ⏭️  ${roleCode} → ${permCode}`);
      } else {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        console.log(`   ✅ ${roleCode} → ${permCode}`);
      }
    }
  }

  console.log('\n✅ Seed permissions M13 L1 terminé\n');
  console.log('Note : Permissions logistique attribuées :');
  console.log('  • ADMIN : toutes les permissions');
  console.log('  • DT : gestion complète (la logistique relève de la DT)');
  console.log('  • DG/DFC : consultation + coûts administratifs (données sensibles)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed permissions M13 L1 :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
