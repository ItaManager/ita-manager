/**
 * Script pour appliquer les index de performance
 * Lance: npx tsx scripts/apply-performance-indexes.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger .env.dev
config({ path: resolve(process.cwd(), ".env.dev") });

import { prismaDirect } from "./lib/prisma-direct";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🔧 Application des index de performance...");

  const migrationPath = join(
    process.cwd(),
    "prisma/migrations/20260808_add_performance_indexes/migration.sql"
  );

  const sql = readFileSync(migrationPath, "utf-8");

  try {
    await prismaDirect.$executeRawUnsafe(sql);
    console.log("✅ Index créés avec succès !");

    // Enregistrer la migration comme appliquée
    await prismaDirect.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      ) VALUES (
        gen_random_uuid(),
        '${Buffer.from(sql).toString("hex").slice(0, 64)}',
        NOW(),
        '20260808_add_performance_indexes',
        NULL,
        NULL,
        NOW(),
        1
      ) ON CONFLICT DO NOTHING;
    `);

    console.log("✅ Migration enregistrée dans _prisma_migrations");
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      console.log("ℹ️  Index déjà existants, aucune action nécessaire");
    } else {
      console.error("❌ Erreur:", error.message);
      throw error;
    }
  } finally {
    await prismaDirect.$disconnect();
  }
}

main();
