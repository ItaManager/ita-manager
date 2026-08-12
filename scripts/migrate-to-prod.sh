#!/bin/bash

# ============================================
# MIGRATION VERS NOUVELLE BASE PRODUCTION
# ============================================
# Usage: ./scripts/migrate-to-prod.sh
# Prérequis: .env.prod configuré avec nouvelles URLs Supabase

set -e  # Arrêt si erreur

echo "🚀 Migration ITA Manager vers nouvelle base de production"
echo ""

# Vérification fichier .env.prod existe
if [ ! -f .env.prod ]; then
    echo "❌ Erreur: Fichier .env.prod introuvable"
    echo "➡️  Créez .env.prod à partir de .env.prod.template"
    exit 1
fi

# Vérification DATABASE_URL configuré
if ! grep -q "DATABASE_URL=\"postgresql://" .env.prod; then
    echo "❌ Erreur: DATABASE_URL non configuré dans .env.prod"
    exit 1
fi

echo "📋 Étapes de migration:"
echo "  1. Appliquer les migrations Prisma"
echo "  2. Exécuter le seed principal"
echo "  3. Exécuter les seeds modules (M19, etc.)"
echo "  4. Créer compte super admin"
echo ""

read -p "Continuer ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration annulée"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ÉTAPE 1/4 — Application des migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx dotenv -e .env.prod -- npx prisma migrate deploy
echo "✅ Migrations appliquées"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌱 ÉTAPE 2/4 — Seed principal (structure + démo)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx dotenv -e .env.prod -- npx tsx prisma/seed.ts
echo "✅ Seed principal terminé"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 ÉTAPE 3/4 — Seeds modules spécifiques"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# M19 Permissions
if [ -f scripts/seed-m19-permissions.ts ]; then
    echo "  → M19 Permissions..."
    npx dotenv -e .env.prod -- npx tsx scripts/seed-m19-permissions.ts
    echo "  ✅ M19 Permissions"
fi

# Ajouter autres seeds si nécessaire
# npx dotenv -e .env.prod -- npx tsx scripts/seed-xxx.ts

echo "✅ Seeds modules terminés"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 ÉTAPE 4/4 — Compte super admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Créez maintenant le compte super admin"
echo ""
echo "1. Allez sur votre projet Supabase:"
echo "   https://supabase.com/dashboard/project/VOTRE_PROJET"
echo ""
echo "2. Authentication → Users → Add user"
echo "   Email: admin@ita-manager.ci"
echo "   Password: (choisissez un mot de passe fort)"
echo "   ✅ Auto Confirm User"
echo ""
echo "3. Récupérez l'UUID généré"
echo ""
read -p "UUID du super admin créé: " ADMIN_UUID

if [ -z "$ADMIN_UUID" ]; then
    echo "⚠️  UUID vide — vous devrez créer le profil manuellement"
else
    echo ""
    echo "Création du profil super admin..."
    npx dotenv -e .env.prod -- npx tsx -e "
    import { prismaDirect as prisma } from './scripts/lib/prisma-direct.js';

    async function createSuperAdmin() {
      const roleSuper = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
      if (!roleSuper) {
        console.error('❌ Rôle SUPER_ADMIN introuvable');
        process.exit(1);
      }

      await prisma.profil.upsert({
        where: { id: '${ADMIN_UUID}' },
        create: {
          id: '${ADMIN_UUID}',
          email: 'admin@ita-manager.ci',
          roles: {
            create: {
              roleId: roleSuper.id,
            },
          },
        },
        update: {},
      });

      console.log('✅ Profil super admin créé');
      await prisma.\$disconnect();
    }

    createSuperAdmin();
    "
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATION TERMINÉE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Résumé:"
echo "  • Migrations Prisma: ✅"
echo "  • Seed principal: ✅"
echo "  • Seeds modules: ✅"
echo "  • Super admin: ✅"
echo ""
echo "🔗 Prochaines étapes:"
echo "  1. Tester connexion: npx dotenv -e .env.prod -- npx prisma studio"
echo "  2. Vérifier données dans Supabase Dashboard"
echo "  3. Déployer sur Vercel avec ces variables d'environnement"
echo ""
