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
//
// Une exemption se justifie si l'action ne PEUT PAS porter de permission.
// Les actions avec contrôle par lien de données ne sont PAS exemptées :
// le script les reconnaît via les motifs employeId/profilId/permissions.includes
const EXEMPTIONS: Record<string, string> = {
  "deconnecter": "Endpoint public de logout, authentification via createClient()",
  "enregistrerPointage": "Authentification par jeton appareil + code employé haché (M12 § 3)",
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

      // Examiner les 30 lignes suivantes pour détecter 3 formes de garde
      const nextLines = lines.slice(i, i + 30).join("\n");

      const hasPermissionGuard =
        nextLines.includes("actionProtegee") ||
        nextLines.includes("exigerPermission");

      // Détecter contrôle par lien de données (data-link control)
      // Motifs : profil?.employeId !== / .employeId !== / profilId !== / auteurId !==
      const hasDataLinkGuard =
        /profil\?\.employeId\s*!==/.test(nextLines) ||
        /\.employeId\s*!==\s*(?:input|session|user)\.employeId/.test(nextLines) ||
        /\.profilId\s*!==\s*user\.id/.test(nextLines) ||
        /\.auteurId\s*!==/.test(nextLines) ||
        /permissions\.includes\(/.test(nextLines);

      // Vérifier si c'est un alias vers une fonction protégée (même ligne)
      const isAlias = line.includes("=") &&
        !line.includes("actionProtegee") &&
        /=\s*\w+Logique\s*;/.test(line);

      if (!hasPermissionGuard && !hasDataLinkGuard && !isAlias) {
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
