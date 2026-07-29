#!/usr/bin/env tsx
/**
 * Enchaîne toutes les vérifications post-seed
 *
 * Sort en code d'erreur 1 si l'une échoue.
 * À relancer après chaque migration et chaque seed.
 *
 * Usage: npm run verify
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface VerificationScript {
  name: string;
  path: string;
}

const VERIFICATIONS: VerificationScript[] = [
  {
    name: "Permissions et rôles",
    path: join(__dirname, "verify-post-seed.ts"),
  },
  {
    name: "Comptages (4/8/30/14)",
    path: join(__dirname, "verify-db-counts.ts"),
  },
  {
    name: "Hiérarchie stricte",
    path: join(__dirname, "verify-hierarchie.ts"),
  },
  {
    name: "Grille M1 complète",
    path: join(__dirname, "verify-m1-grille.ts"),
  },
];

async function runScript(script: VerificationScript): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`▶ ${script.name}`);
    console.log(`${"=".repeat(60)}\n`);

    const child = spawn(
      "npx",
      ["dotenv", "-e", ".env.dev", "--", "npx", "tsx", script.path],
      {
        stdio: "inherit",
        cwd: join(__dirname, ".."),
      }
    );

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${script.name} — SUCCÈS\n`);
        resolve(true);
      } else {
        console.log(`\n❌ ${script.name} — ÉCHEC (code ${code})\n`);
        resolve(false);
      }
    });

    child.on("error", (err) => {
      console.error(`\n❌ ${script.name} — ERREUR :`, err.message, "\n");
      resolve(false);
    });
  });
}

async function main() {
  console.log("🔍 Vérifications post-seed — M0 + M1\n");

  const resultats: boolean[] = [];

  for (const script of VERIFICATIONS) {
    const succes = await runScript(script);
    resultats.push(succes);

    if (!succes) {
      console.log("⚠️  Arrêt à la première erreur\n");
      break;
    }
  }

  const toutesReussies = resultats.every((r) => r === true);
  const nbReussies = resultats.filter((r) => r === true).length;

  console.log(`${"=".repeat(60)}`);
  console.log(`RÉSULTAT : ${nbReussies}/${VERIFICATIONS.length} vérifications passées`);
  console.log(`${"=".repeat(60)}\n`);

  if (toutesReussies) {
    console.log("✅ TOUTES LES VÉRIFICATIONS ONT RÉUSSI\n");
    process.exit(0);
  } else {
    console.log("❌ AU MOINS UNE VÉRIFICATION A ÉCHOUÉ\n");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Erreur fatale :", e);
  process.exit(1);
});
