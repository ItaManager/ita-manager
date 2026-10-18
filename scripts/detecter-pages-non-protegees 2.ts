#!/usr/bin/env tsx
/**
 * Détection des pages non protégées — analyse statique
 *
 * Scanne toutes les pages de app/(app) et détecte celles qui n'appellent
 * pas verifierAccesPage().
 *
 * Une page non protégée est une FAILLE DE SÉCURITÉ : n'importe quel
 * utilisateur authentifié peut y accéder, même sans la permission requise.
 *
 * Usage: npx tsx scripts/detecter-pages-non-protegees.ts
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const APP_DIR = join(process.cwd(), "app/(app)");

type Resultat = {
  chemin: string;
  route: string;
  protegee: boolean;
};

function scannerRepertoire(dir: string, baseRoute = ""): Resultat[] {
  const resultats: Resultat[] = [];
  const entrees = readdirSync(dir);

  for (const entree of entrees) {
    const cheminComplet = join(dir, entree);
    const stat = statSync(cheminComplet);

    if (stat.isDirectory() && !entree.startsWith("_")) {
      // Sous-répertoire : scanner récursivement
      const nouveauBaseRoute = baseRoute + "/" + entree;
      resultats.push(...scannerRepertoire(cheminComplet, nouveauBaseRoute));
    } else if (entree === "page.tsx") {
      // Fichier page : analyser
      const contenu = readFileSync(cheminComplet, "utf-8");
      const protegee = contenu.includes("verifierAccesPage");
      const route = baseRoute || "/";

      resultats.push({
        chemin: cheminComplet.replace(process.cwd() + "/", ""),
        route,
        protegee,
      });
    }
  }

  return resultats;
}

function main() {
  console.log("🔍 Détection des pages non protégées\n");

  const resultats = scannerRepertoire(APP_DIR);

  const nonProtegees = resultats.filter((r) => !r.protegee);
  const protegees = resultats.filter((r) => r.protegee);

  console.log(`📊 Résultats :\n`);
  console.log(`   ✅ Pages protégées : ${protegees.length}`);
  console.log(`   ❌ Pages NON protégées : ${nonProtegees.length}\n`);

  if (nonProtegees.length > 0) {
    console.log("🚨 FAILLES DE SÉCURITÉ DÉTECTÉES :\n");

    nonProtegees.forEach((r, i) => {
      console.log(`${i + 1}. Route : ${r.route}`);
      console.log(`   Fichier : ${r.chemin}`);
      console.log(`   Danger : Accessible sans vérification de permission\n`);
    });

    console.log("============================================================");
    console.log("❌ ÉCHEC : Des pages non protégées ont été détectées");
    console.log("============================================================\n");
    process.exit(1);
  } else {
    console.log("============================================================");
    console.log("✅ SUCCÈS : Toutes les pages sont protégées");
    console.log("============================================================\n");
    process.exit(0);
  }
}

main();
