#!/usr/bin/env tsx
/**
 * Script : Seed PRODUCTION - Admin uniquement
 *
 * ⚠️  PRODUCTION UNIQUEMENT
 *
 * Usage: tsx scripts/seed-production-admin.ts
 *
 * Crée UNIQUEMENT :
 * - 1 compte Super Admin (armelgnakpa7@gmail.com)
 * - Rôles et permissions de base
 * - Paramètres système essentiels
 *
 * NE CRÉE PAS :
 * - Employés de test
 * - Données de démo
 * - Projets fictifs
 */

import { createClient } from "@supabase/supabase-js";
import { prismaDirect as prisma } from "./lib/prisma-direct";
import * as crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🚀 Seed PRODUCTION - Admin uniquement\n");
  console.log("⚠️  Mode PRODUCTION - Données minimales\n");

  // 1. Créer rôles
  console.log("📋 Création des rôles...");
  const roles = [
    { code: "ADMIN", libelle: "Super Admin", description: "Accès total technique" },
    { code: "DG", libelle: "Directeur Général", description: "Direction générale" },
    { code: "DRH", libelle: "Directeur RH", description: "Direction des ressources humaines" },
    { code: "DFC", libelle: "Directeur Financier", description: "Direction financière et comptable" },
    { code: "DT", libelle: "Directeur Technique", description: "Direction des travaux" },
    { code: "CT", libelle: "Conducteur de Travaux", description: "Conduite de chantier" },
    { code: "CC", libelle: "Chef de Chantier", description: "Gestion terrain" },
    { code: "CE", libelle: "Chargé d'études", description: "Études et appels d'offres" },
    { code: "RH", libelle: "Assistant RH", description: "Saisie RH" },
    { code: "AD", libelle: "Assistante de Direction", description: "Assistanat général" },
  ];

  await prisma.role.createMany({
    data: roles,
    skipDuplicates: true,
  });
  console.log(`✅ ${roles.length} rôles créés\n`);

  // 2. Créer compte Super Admin dans Supabase Auth
  console.log("👤 Création compte Super Admin...");

  const ADMIN_EMAIL = "armelgnakpa7@gmail.com";
  const ADMIN_PASSWORD = crypto.randomBytes(16).toString("hex"); // Mot de passe aléatoire

  // Vérifier si compte existe déjà
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers.users.find((u) => u.email === ADMIN_EMAIL);

  let adminUserId: string;

  if (existing) {
    console.log(`ℹ️  Compte ${ADMIN_EMAIL} existe déjà`);
    adminUserId = existing.id;
  } else {
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Confirmé automatiquement
    });

    if (error) {
      console.error("❌ Erreur création compte:", error);
      process.exit(1);
    }

    adminUserId = newUser.user.id;
    console.log(`✅ Compte créé : ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe temporaire : ${ADMIN_PASSWORD}`);
    console.log(`⚠️  CHANGEZ LE MOT DE PASSE immédiatement après connexion !\n`);
  }

  // 3. Créer profil dans Prisma
  console.log("📝 Création profil Super Admin...");

  const adminRole = await prisma.role.findUnique({
    where: { code: "ADMIN" },
  });

  if (!adminRole) {
    console.error("❌ Rôle ADMIN introuvable");
    process.exit(1);
  }

  // Vérifier si profil existe
  const existingProfil = await prisma.profil.findUnique({
    where: { userId: adminUserId },
  });

  if (existingProfil) {
    console.log(`ℹ️  Profil existe déjà pour ${ADMIN_EMAIL}`);
  } else {
    await prisma.profil.create({
      data: {
        userId: adminUserId,
        email: ADMIN_EMAIL,
        roleId: adminRole.id,
        employeId: null, // Super Admin sans employé rattaché (C-02)
        actif: true,
      },
    });
    console.log(`✅ Profil créé\n`);
  }

  // 4. Créer paramètres système essentiels
  console.log("⚙️  Création paramètres système...");

  const parametres = [
    {
      cle: "SEUIL_VALIDATION_DG_FOURNISSEUR",
      valeur: "500000",
      description: "Seuil validation DG pour factures fournisseurs (en FCFA)",
      type: "NOMBRE",
    },
    {
      cle: "DUREE_SESSION_MINUTES",
      valeur: "480",
      description: "Durée session utilisateur (8 heures)",
      type: "NOMBRE",
    },
    {
      cle: "EMAIL_NOTIF_ADMIN",
      valeur: ADMIN_EMAIL,
      description: "Email pour notifications administrateur",
      type: "EMAIL",
    },
  ];

  for (const param of parametres) {
    await prisma.parametre.upsert({
      where: { cle: param.cle },
      update: {},
      create: param,
    });
  }

  console.log(`✅ ${parametres.length} paramètres créés\n`);

  // 5. Résumé
  const stats = await Promise.all([
    prisma.role.count(),
    prisma.profil.count(),
    prisma.parametre.count(),
  ]);

  console.log("\n📊 RÉSUMÉ SEED PRODUCTION");
  console.log("==========================");
  console.log(`Rôles          : ${stats[0]}`);
  console.log(`Profils        : ${stats[1]}`);
  console.log(`Paramètres     : ${stats[2]}`);
  console.log("\n✅ Seed production terminé !");
  console.log("\n🔐 CONNEXION ADMIN :");
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  if (!existing) {
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   ⚠️  CHANGEZ LE MOT DE PASSE après 1ère connexion`);
  }
  console.log("\n🚀 Prêt pour la production !");
}

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
