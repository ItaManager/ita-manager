/**
 * Script simple pour appliquer les index de performance
 * Lance: node scripts/apply-indexes-simple.mjs
 */

import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env.dev
dotenv.config({ path: join(__dirname, "../.env.dev") });

const { Client } = pg;

async function main() {
  console.log("🔧 Application des index de performance...");

  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connecté à la base de données");

    const migrationPath = join(
      __dirname,
      "../prisma/migrations/20260808_add_performance_indexes/migration.sql"
    );

    const sql = readFileSync(migrationPath, "utf-8");

    await client.query(sql);
    console.log("✅ Index créés avec succès !");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("ℹ️  Index déjà existants, aucune action nécessaire");
    } else {
      console.error("❌ Erreur:", error.message);
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
