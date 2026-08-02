/**
 * Vérifie que toutes les Server Actions exportées sont protégées
 *
 * Une Server Action est un endpoint HTTP public. SECURITE.md exigence bloquante #1 :
 * "Chaque Server Action commence par exigerPermission()".
 *
 * Ce script vérifie que toute fonction exportée dans lib/actions/*.ts utilise
 * actionProtegee() ou exigerPermission().
 *
 * EXCEPTIONS EXPLICITES :
 * - export type, export interface → types TypeScript, pas des actions
 * - deconnecter() → endpoint public de logout, auth via createClient()
 * - enregistrerPointage() → auth par jeton appareil + bcrypt, pas session web
 */

import * as fs from "fs";
import * as path from "path";

const ACTIONS_DIR = path.join(process.cwd(), "lib/actions");

// Fonctions exemptées avec justification
const EXEMPTIONS: Record<string, string> = {
  "deconnecter": "Endpoint public de logout, authentification via createClient()",
  "enregistrerPointage": "Authentification par jeton appareil + code employé haché (bcrypt)",
};

type Violation = {
  file: string;
  line: number;
  functionName: string;
};

function analyzeFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Ignorer les exports de types
    if (
      line.match(/^export\s+(type|interface)\s+/) ||
      line.includes("export type")
    ) {
      continue;
    }

    // Détecter les exports de fonctions
    const exportMatch = line.match(
      /^export\s+(?:const|async function)\s+(\w+)/
    );

    if (exportMatch) {
      const functionName = exportMatch[1];

      // Vérifier si exemptée
      if (EXEMPTIONS[functionName]) {
        continue;
      }

      // Examiner les 3 lignes suivantes pour actionProtegee ou exigerPermission
      const nextLines = lines.slice(i, i + 3).join("\n");

      const hasGuard =
        nextLines.includes("actionProtegee") ||
        nextLines.includes("exigerPermission");

      if (!hasGuard) {
        violations.push({
          file: path.basename(filePath),
          line: lineNumber,
          functionName,
        });
      }
    }
  }

  return violations;
}

function main() {
  console.log("🔒 Vérification des Server Actions protégées\n");

  const files = fs
    .readdirSync(ACTIONS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join(ACTIONS_DIR, f));

  const allViolations: Violation[] = [];

  for (const file of files) {
    const violations = analyzeFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log("✅ Toutes les Server Actions sont protégées\n");
    console.log(`   Fichiers analysés : ${files.length}`);
    console.log(`   Exemptions : ${Object.keys(EXEMPTIONS).length}`);
    console.log(
      `     - ${Object.entries(EXEMPTIONS)
        .map(([fn, reason]) => `${fn} (${reason})`)
        .join("\n     - ")}`
    );
    process.exit(0);
  }

  console.log(`❌ ${allViolations.length} Server Action(s) EXPOSÉE(S) :\n`);

  for (const v of allViolations) {
    console.log(`   ${v.file}:${v.line} — ${v.functionName}()`);
  }

  console.log(
    `\n⚠️  FAILLE DE SÉCURITÉ — Server Actions sans garde sont des endpoints HTTP publics.`
  );
  console.log(
    `   Envelopper avec actionProtegee() ou appeler exigerPermission().`
  );

  process.exit(1);
}

main();
