/**
 * Vérifie s'il existe des triggers PostgreSQL qui créent automatiquement des profils
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("\n🔍 Vérification des triggers PostgreSQL\n");

  // Vérifier les triggers sur auth.users
  const triggersAuthUsers = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      tgname as nom_trigger,
      tgrelid::regclass::text as table_cible,
      tgfoid::regproc::text as fonction_trigger
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
  `);

  console.log("Triggers sur auth.users :");
  if (triggersAuthUsers.length === 0) {
    console.log("  Aucun trigger trouvé");
  } else {
    triggersAuthUsers.forEach((t) => {
      console.log(
        `  - ${t.nom_trigger} → ${t.table_cible} → ${t.fonction_trigger}`
      );
    });
  }
  console.log("");

  // Vérifier les triggers sur Profil
  const triggersProfil = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      tgname as nom_trigger,
      tgrelid::regclass::text as table_cible,
      tgfoid::regproc::text as fonction_trigger
    FROM pg_trigger
    WHERE tgrelid = 'public."Profil"'::regclass
      AND NOT tgisinternal
  `);

  console.log('Triggers sur table "Profil" :');
  if (triggersProfil.length === 0) {
    console.log("  Aucun trigger trouvé");
  } else {
    triggersProfil.forEach((t) => {
      console.log(
        `  - ${t.nom_trigger} → ${t.table_cible} → ${t.fonction_trigger}`
      );
    });
  }
  console.log("");

  // Chercher tous les triggers qui mentionnent "profil" ou "user"
  const allTriggers = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      tgname as nom_trigger,
      tgrelid::regclass::text as table_cible,
      tgfoid::regproc::text as fonction_trigger,
      pg_get_triggerdef(oid) as definition
    FROM pg_trigger
    WHERE NOT tgisinternal
      AND (
        tgname ILIKE '%profil%'
        OR tgname ILIKE '%user%'
        OR tgfoid::regproc::text ILIKE '%profil%'
        OR tgfoid::regproc::text ILIKE '%user%'
      )
  `);

  console.log("Tous les triggers liés à user/profil :");
  if (allTriggers.length === 0) {
    console.log("  Aucun trigger trouvé\n");
  } else {
    allTriggers.forEach((t) => {
      console.log(`\n  Trigger: ${t.nom_trigger}`);
      console.log(`  Table: ${t.table_cible}`);
      console.log(`  Fonction: ${t.fonction_trigger}`);
      console.log(`  Définition: ${t.definition}`);
    });
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
