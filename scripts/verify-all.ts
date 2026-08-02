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
    name: "Type checking (tsc)",
    path: "tsc-check", // Special case
  },
  {
    name: "Build production",
    path: "build", // Special case
  },
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
  {
    name: "M2 — Nationalités et Permissions",
    path: join(__dirname, "verify-m2.ts"),
  },
  {
    name: "M3 — Congés et Absences",
    path: join(__dirname, "verify-m3.ts"),
  },
  {
    name: "M4 — Rémunération",
    path: join(__dirname, "verify-m4.ts"),
  },
  {
    name: "M5 — Projets et Planning",
    path: join(__dirname, "verify-m5.ts"),
  },
  {
    name: "M6 — Relevés d'activité",
    path: join(__dirname, "verify-m6.ts"),
  },
  {
    name: "M7 — Paie chantier",
    path: join(__dirname, "verify-m7.ts"),
  },
  {
    name: "M8 — Ressources et matériel",
    path: join(__dirname, "verify-m8.ts"),
  },
  {
    name: "M9 — Appels d'offres",
    path: join(__dirname, "verify-m9.ts"),
  },
  {
    name: "M10 — Pilotage",
    path: join(__dirname, "verify-m10.ts"),
  },
  {
    name: "M11 — Administration",
    path: join(__dirname, "verify-m11.ts"),
  },
  {
    name: "M12 — Présences bureau",
    path: join(__dirname, "verify-m12.ts"),
  },
  {
    name: "SECURITE — Server Actions protégées",
    path: join(__dirname, "verify-actions-protegees.ts"),
  },
];

async function runScript(script: VerificationScript): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`▶ ${script.name}`);
    console.log(`${"=".repeat(60)}\n`);

    // Special cases: tsc and build
    let command: string;
    let args: string[];

    if (script.path === "tsc-check") {
      command = "npx";
      args = ["tsc", "--noEmit"];
    } else if (script.path === "build") {
      command = "npm";
      args = ["run", "build"];
    } else {
      command = "npx";
      args = ["dotenv", "-e", ".env.dev", "--", "npx", "tsx", script.path];
    }

    const child = spawn(command, args, {
      stdio: "inherit",
      cwd: join(__dirname, ".."),
    });

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
  console.log("🔍 Vérifications post-seed — M0→M12 (tous modules)\n");

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
