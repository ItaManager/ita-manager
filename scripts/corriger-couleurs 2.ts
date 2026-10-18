#!/usr/bin/env tsx
/**
 * Correction automatique des classes Tailwind colorées
 *
 * Convertit les classes Tailwind (blue-500, green-100, etc.) en CSS tokens
 * sémantiques (--primary, --success, etc.) conformément à TYPOGRAPHIE.md.
 *
 * Usage:
 *   npx tsx scripts/corriger-couleurs.ts --dry-run  # Aperçu sans modification
 *   npx tsx scripts/corriger-couleurs.ts            # Applique les modifications
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Table de correspondance Tailwind → CSS tokens
 *
 * Ordre : du plus spécifique au plus général (bg-green-100 avant bg-green-*)
 */
const CORRESPONDANCES: Array<{ pattern: RegExp; replacement: string; description: string }> = [
  // ========== SLATE → GRAY (gris non toléré) ==========
  { pattern: /\bbg-slate-50\b/g, replacement: "bg-gray-50", description: "slate → gray" },
  { pattern: /\bbg-slate-100\b/g, replacement: "bg-gray-100", description: "slate → gray" },
  { pattern: /\btext-slate-300\b/g, replacement: "text-gray-300", description: "slate → gray" },
  { pattern: /\btext-slate-400\b/g, replacement: "text-gray-400", description: "slate → gray" },
  { pattern: /\btext-slate-500\b/g, replacement: "text-gray-500", description: "slate → gray" },
  { pattern: /\btext-slate-600\b/g, replacement: "text-gray-600", description: "slate → gray" },
  { pattern: /\btext-slate-900\b/g, replacement: "text-gray-900", description: "slate → gray" },
  { pattern: /\bborder-slate-(\d+)\b/g, replacement: "border-gray-$1", description: "slate → gray" },

  // ========== SUCCESS (green) ==========
  { pattern: /\bbg-green-50\b/g, replacement: "bg-success-soft", description: "green-50 → success-soft" },
  { pattern: /\bbg-green-100\b/g, replacement: "bg-success-soft", description: "green-100 → success-soft" },
  { pattern: /\bbg-green-200\b/g, replacement: "bg-success-soft", description: "green-200 → success-soft" },
  { pattern: /\bbg-green-600\b/g, replacement: "bg-success", description: "green-600 → success" },
  { pattern: /\bbg-green-700\b/g, replacement: "bg-success", description: "green-700 → success" },
  { pattern: /\bbg-green-900\b/g, replacement: "bg-success", description: "green-900 → success (dark)" },
  { pattern: /\bbg-green-950\b/g, replacement: "bg-success", description: "green-950 → success (dark)" },
  { pattern: /\btext-green-300\b/g, replacement: "text-success", description: "green-300 → success" },
  { pattern: /\btext-green-400\b/g, replacement: "text-success", description: "green-400 → success (dark)" },
  { pattern: /\btext-green-600\b/g, replacement: "text-success", description: "green-600 → success" },
  { pattern: /\btext-green-700\b/g, replacement: "text-success", description: "green-700 → success" },
  { pattern: /\btext-green-800\b/g, replacement: "text-success", description: "green-800 → success" },
  { pattern: /\btext-green-900\b/g, replacement: "text-success", description: "green-900 → success" },
  { pattern: /\bborder-green-200\b/g, replacement: "border-success/20", description: "green-200 → success/20" },

  // ========== DESTRUCTIVE (red) ==========
  { pattern: /\bbg-red-50\b/g, replacement: "bg-destructive-soft", description: "red-50 → destructive-soft" },
  { pattern: /\bbg-red-100\b/g, replacement: "bg-destructive-soft", description: "red-100 → destructive-soft" },
  { pattern: /\bbg-red-950\b/g, replacement: "bg-destructive", description: "red-950 → destructive (dark)" },
  { pattern: /\btext-red-300\b/g, replacement: "text-destructive", description: "red-300 → destructive" },
  { pattern: /\btext-red-500\b/g, replacement: "text-destructive", description: "red-500 → destructive" },
  { pattern: /\btext-red-600\b/g, replacement: "text-destructive", description: "red-600 → destructive" },
  { pattern: /\btext-red-700\b/g, replacement: "text-destructive", description: "red-700 → destructive" },
  { pattern: /\btext-red-800\b/g, replacement: "text-destructive", description: "red-800 → destructive" },
  { pattern: /\btext-red-900\b/g, replacement: "text-destructive", description: "red-900 → destructive" },
  { pattern: /\bborder-red-200\b/g, replacement: "border-destructive/20", description: "red-200 → destructive/20" },
  { pattern: /\bborder-red-500\b/g, replacement: "border-destructive", description: "red-500 → destructive" },

  // ========== WARNING (orange + amber) ==========
  { pattern: /\bbg-orange-50\b/g, replacement: "bg-warning-soft", description: "orange-50 → warning-soft" },
  { pattern: /\bbg-orange-100\b/g, replacement: "bg-warning-soft", description: "orange-100 → warning-soft" },
  { pattern: /\bbg-orange-200\b/g, replacement: "bg-warning-soft", description: "orange-200 → warning-soft" },
  { pattern: /\bbg-orange-900\b/g, replacement: "bg-warning", description: "orange-900 → warning (dark)" },
  { pattern: /\bbg-orange-950\b/g, replacement: "bg-warning", description: "orange-950 → warning (dark)" },
  { pattern: /\btext-orange-300\b/g, replacement: "text-warning", description: "orange-300 → warning" },
  { pattern: /\btext-orange-400\b/g, replacement: "text-warning", description: "orange-400 → warning (dark)" },
  { pattern: /\btext-orange-500\b/g, replacement: "text-warning", description: "orange-500 → warning" },
  { pattern: /\btext-orange-600\b/g, replacement: "text-warning", description: "orange-600 → warning" },
  { pattern: /\btext-orange-700\b/g, replacement: "text-warning", description: "orange-700 → warning" },
  { pattern: /\btext-orange-800\b/g, replacement: "text-warning", description: "orange-800 → warning" },
  { pattern: /\btext-orange-900\b/g, replacement: "text-warning", description: "orange-900 → warning" },
  { pattern: /\bborder-orange-200\b/g, replacement: "border-warning/20", description: "orange-200 → warning/20" },
  { pattern: /\bborder-orange-500\b/g, replacement: "border-warning", description: "orange-500 → warning" },
  { pattern: /\bborder-orange-600\b/g, replacement: "border-warning", description: "orange-600 → warning" },

  { pattern: /\bbg-amber-50\b/g, replacement: "bg-warning-soft", description: "amber-50 → warning-soft" },
  { pattern: /\bbg-amber-100\b/g, replacement: "bg-warning-soft", description: "amber-100 → warning-soft" },
  { pattern: /\bbg-amber-950\b/g, replacement: "bg-warning", description: "amber-950 → warning (dark)" },
  { pattern: /\btext-amber-100\b/g, replacement: "text-warning-soft", description: "amber-100 → warning-soft" },
  { pattern: /\btext-amber-200\b/g, replacement: "text-warning-soft", description: "amber-200 → warning-soft" },
  { pattern: /\btext-amber-300\b/g, replacement: "text-warning", description: "amber-300 → warning" },
  { pattern: /\btext-amber-400\b/g, replacement: "text-warning", description: "amber-400 → warning" },
  { pattern: /\btext-amber-500\b/g, replacement: "text-warning", description: "amber-500 → warning" },
  { pattern: /\btext-amber-600\b/g, replacement: "text-warning", description: "amber-600 → warning" },
  { pattern: /\btext-amber-700\b/g, replacement: "text-warning", description: "amber-700 → warning" },
  { pattern: /\btext-amber-800\b/g, replacement: "text-warning", description: "amber-800 → warning" },
  { pattern: /\btext-amber-900\b/g, replacement: "text-warning", description: "amber-900 → warning" },
  { pattern: /\bborder-amber-200\b/g, replacement: "border-warning/20", description: "amber-200 → warning/20" },
  { pattern: /\bborder-amber-300\b/g, replacement: "border-warning/20", description: "amber-300 → warning/20" },
  { pattern: /\bborder-amber-500\b/g, replacement: "border-warning", description: "amber-500 → warning" },
  { pattern: /\bborder-amber-800\b/g, replacement: "border-warning", description: "amber-800 → warning" },

  { pattern: /\bbg-yellow-100\b/g, replacement: "bg-warning-soft", description: "yellow-100 → warning-soft" },
  { pattern: /\btext-yellow-600\b/g, replacement: "text-warning", description: "yellow-600 → warning" },
  { pattern: /\btext-yellow-800\b/g, replacement: "text-warning", description: "yellow-800 → warning" },

  // ========== PRIMARY (blue) ==========
  { pattern: /\bbg-blue-50\b/g, replacement: "bg-primary-soft", description: "blue-50 → primary-soft" },
  { pattern: /\bbg-blue-100\b/g, replacement: "bg-primary-soft", description: "blue-100 → primary-soft" },
  { pattern: /\bbg-blue-500\b/g, replacement: "bg-primary", description: "blue-500 → primary" },
  { pattern: /\bbg-blue-600\b/g, replacement: "bg-primary", description: "blue-600 → primary" },
  { pattern: /\bbg-blue-800\b/g, replacement: "bg-primary", description: "blue-800 → primary (dark)" },
  { pattern: /\bbg-blue-950\b/g, replacement: "bg-primary", description: "blue-950 → primary (dark)" },
  { pattern: /\btext-blue-100\b/g, replacement: "text-primary-soft", description: "blue-100 → primary-soft" },
  { pattern: /\btext-blue-300\b/g, replacement: "text-primary", description: "blue-300 → primary" },
  { pattern: /\btext-blue-500\b/g, replacement: "text-primary", description: "blue-500 → primary" },
  { pattern: /\btext-blue-600\b/g, replacement: "text-primary", description: "blue-600 → primary" },
  { pattern: /\btext-blue-700\b/g, replacement: "text-primary", description: "blue-700 → primary" },
  { pattern: /\btext-blue-800\b/g, replacement: "text-primary", description: "blue-800 → primary" },
  { pattern: /\btext-blue-900\b/g, replacement: "text-primary", description: "blue-900 → primary" },
  { pattern: /\bborder-blue-200\b/g, replacement: "border-primary/20", description: "blue-200 → primary/20" },
  { pattern: /\bborder-blue-500\b/g, replacement: "border-primary", description: "blue-500 → primary" },
  { pattern: /\bborder-blue-600\b/g, replacement: "border-primary", description: "blue-600 → primary" },

  // ========== ACCENT (purple) ==========
  { pattern: /\bbg-purple-100\b/g, replacement: "bg-accent-soft", description: "purple-100 → accent-soft" },
  { pattern: /\bbg-purple-950\b/g, replacement: "bg-accent", description: "purple-950 → accent (dark)" },
  { pattern: /\btext-purple-300\b/g, replacement: "text-accent", description: "purple-300 → accent" },
  { pattern: /\btext-purple-800\b/g, replacement: "text-accent", description: "purple-800 → accent" },
];

interface ChangeStats {
  file: string;
  changes: Array<{ line: number; description: string }>;
}

async function main() {
  console.log(`🎨 Correction des couleurs Tailwind → CSS tokens\n`);
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (aucune modification)" : "ÉCRITURE"}\n`);

  // Trouver tous les fichiers .tsx dans app/ et components/
  const files = await glob("**/*.tsx", {
    cwd: path.join(process.cwd(), "app"),
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const componentsFiles = await glob("**/*.tsx", {
    cwd: path.join(process.cwd(), "components"),
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const allFiles = [...files, ...componentsFiles];

  console.log(`📁 ${allFiles.length} fichiers à analyser\n`);

  const stats: ChangeStats[] = [];
  let totalChanges = 0;

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    let newContent = content;
    const fileChanges: Array<{ line: number; description: string }> = [];

    for (const { pattern, replacement, description } of CORRESPONDANCES) {
      const matches = [...newContent.matchAll(pattern)];
      if (matches.length > 0) {
        // Trouver les numéros de ligne
        for (const match of matches) {
          const before = newContent.slice(0, match.index);
          const lineNumber = before.split("\n").length;
          fileChanges.push({ line: lineNumber, description });
        }
        newContent = newContent.replace(pattern, replacement);
      }
    }

    if (fileChanges.length > 0) {
      stats.push({
        file: path.relative(process.cwd(), filePath),
        changes: fileChanges,
      });
      totalChanges += fileChanges.length;

      if (!DRY_RUN) {
        fs.writeFileSync(filePath, newContent, "utf-8");
      }
    }
  }

  // Affichage des résultats
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`RÉSULTAT : ${totalChanges} modification(s) dans ${stats.length} fichier(s)`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (stats.length > 0) {
    // Grouper par nombre de modifications
    stats.sort((a, b) => b.changes.length - a.changes.length);

    console.log("📊 Détail par fichier:\n");
    for (const { file, changes } of stats) {
      console.log(`  ${file} (${changes.length} modification${changes.length > 1 ? "s" : ""})`);

      // Grouper par type de modification
      const grouped = new Map<string, number>();
      for (const change of changes) {
        grouped.set(change.description, (grouped.get(change.description) || 0) + 1);
      }

      for (const [desc, count] of grouped) {
        console.log(`    ├─ ${desc} (${count}×)`);
      }
      console.log("");
    }
  }

  if (DRY_RUN) {
    console.log("\n⚠️  Mode DRY-RUN : aucun fichier n'a été modifié.");
    console.log("   Relancez sans --dry-run pour appliquer les modifications.\n");
  } else {
    console.log("\n✅ Modifications appliquées avec succès.\n");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
