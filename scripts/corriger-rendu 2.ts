#!/usr/bin/env tsx
/**
 * Correction automatique des défauts de rendu
 *
 * Corrige les violations TYPOGRAPHIE.md et CHAMPS.md :
 * 1. font-bold → font-semibold
 * 2. text-xl → text-lg, text-base → text-sm (hors composants UI)
 * 3. grid-cols-4 → md:grid-cols-3 (hors grilles d'indicateurs)
 * 4. DialogContent sans max-h → ajouter max-h-[90vh]
 *
 * Usage:
 *   npx tsx scripts/corriger-rendu.ts --dry-run  # Aperçu
 *   npx tsx scripts/corriger-rendu.ts            # Applique
 */

import * as fs from "fs";
import { glob } from "glob";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");

interface Change {
  file: string;
  type: "font-bold" | "text-paliers" | "grid-cols-4" | "dialog-max-h";
  count: number;
}

async function main() {
  console.log(`🎨 Correction des défauts de rendu TYPOGRAPHIE.md + CHAMPS.md\n`);
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "ÉCRITURE"}\n`);

  const changes: Change[] = [];

  // Trouver tous les fichiers .tsx
  const appFiles = await glob("**/*.tsx", {
    cwd: path.join(process.cwd(), "app"),
    absolute: true,
    ignore: [
      "**/node_modules/**",
      "**/connexion-test/**", // page de démo
      "**/borne/**", // placeholder M12
    ],
  });

  const componentFiles = await glob("**/*.tsx", {
    cwd: path.join(process.cwd(), "components"),
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const allFiles = [...appFiles, ...componentFiles];

  console.log(`📁 ${allFiles.length} fichiers à analyser\n`);

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    let newContent = content;
    const fileChanges: Change["type"][] = [];

    // 1. font-bold → font-semibold
    const fontBoldCount = (content.match(/\bfont-bold\b/g) || []).length;
    if (fontBoldCount > 0) {
      newContent = newContent.replace(/\bfont-bold\b/g, "font-semibold");
      fileChanges.push("font-bold");
    }

    // 2. text-xl → text-lg et text-base → text-sm
    // ATTENTION : Ne pas toucher aux composants UI (input.tsx, textarea.tsx, etc.)
    const isUIComponent = filePath.includes("components/ui/");
    if (!isUIComponent) {
      const textXlCount = (content.match(/\btext-xl\b/g) || []).length;
      const textBaseCount = (content.match(/\btext-base\b/g) || []).length;

      if (textXlCount > 0 || textBaseCount > 0) {
        newContent = newContent.replace(/\btext-xl\b/g, "text-lg");
        newContent = newContent.replace(/\btext-base\b/g, "text-sm");
        fileChanges.push("text-paliers");
      }
    }

    // 3. grid-cols-4 → md:grid-cols-3
    // ATTENTION : Vérifier le contexte (grilles d'indicateurs légitimes)
    const gridCols4Matches = content.match(/grid-cols-4/g);
    if (gridCols4Matches && gridCols4Matches.length > 0) {
      // Vérifier si c'est une grille d'indicateurs (KPI cards)
      const isKpiGrid = content.includes("text-2xl") || content.includes("stats");

      if (!isKpiGrid) {
        // Formulaire : remplacer par md:grid-cols-3
        newContent = newContent.replace(/grid-cols-4/g, "md:grid-cols-3");
        fileChanges.push("grid-cols-4");
      }
    }

    // 4. DialogContent sans max-h → ajouter max-h-[90vh]
    // Pattern : <DialogContent className="..."> sans max-h-
    const dialogContentRegex = /<DialogContent([^>]*?)className="([^"]*?)"([^>]*?)>/g;
    let match;
    const dialogMatches: Array<{ original: string; className: string }> = [];

    while ((match = dialogContentRegex.exec(content)) !== null) {
      const original = match[0];
      const className = match[2];

      if (!className.includes("max-h-")) {
        dialogMatches.push({ original, className });
      }
    }

    if (dialogMatches.length > 0) {
      for (const { original, className } of dialogMatches) {
        // Ajouter max-h-[90vh] overflow-y-auto au className
        const newClassName = `max-h-[90vh] overflow-y-auto ${className}`.trim();
        const replacement = original.replace(`className="${className}"`, `className="${newClassName}"`);
        newContent = newContent.replace(original, replacement);
      }
      fileChanges.push("dialog-max-h");
    }

    // Écrire les modifications
    if (fileChanges.length > 0) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, newContent, "utf-8");
      }

      const relativePath = path.relative(process.cwd(), filePath);
      for (const type of [...new Set(fileChanges)]) {
        changes.push({
          file: relativePath,
          type,
          count: 1,
        });
      }
    }
  }

  // Affichage des résultats
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`RÉSULTAT : ${changes.length} fichier(s) modifié(s)`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (changes.length > 0) {
    // Grouper par type
    const byType = changes.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = [];
      acc[change.type].push(change.file);
      return acc;
    }, {} as Record<string, string[]>);

    console.log("📊 Détail par type de correction:\n");

    if (byType["font-bold"]) {
      console.log(`  font-bold → font-semibold : ${byType["font-bold"].length} fichiers`);
    }

    if (byType["text-paliers"]) {
      console.log(`  text-xl → text-lg, text-base → text-sm : ${byType["text-paliers"].length} fichiers`);
    }

    if (byType["grid-cols-4"]) {
      console.log(`  grid-cols-4 → md:grid-cols-3 : ${byType["grid-cols-4"].length} fichiers`);
    }

    if (byType["dialog-max-h"]) {
      console.log(`  DialogContent + max-h-[90vh] : ${byType["dialog-max-h"].length} fichiers`);
    }

    console.log("");
  }

  if (DRY_RUN) {
    console.log("\n⚠️  Mode DRY-RUN : aucun fichier modifié.");
    console.log("   Relancez sans --dry-run pour appliquer.\n");
  } else {
    console.log("\n✅ Modifications appliquées avec succès.\n");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
