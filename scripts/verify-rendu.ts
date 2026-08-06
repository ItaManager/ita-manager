#!/usr/bin/env tsx
/**
 * Vérification des jetons de rendu TYPOGRAPHIE.md + CHAMPS.md
 *
 * 8 contrôles pour détecter les violations des règles de rendu :
 * 1. font-bold (doit être font-semibold)
 * 2. text-xl/text-base (paliers incorrects)
 * 3. Input/Textarea rounded-lg/xl (doit être rounded-md)
 * 4. Couleurs hexadécimales hardcodées
 * 5. Classes Tailwind colorées (slate, red, green, etc.)
 * 6. grid-cols-4 sans responsive (doit être md:grid-cols-3)
 * 7. DialogContent sans max-h-[90vh]
 * 8. font-mono + font-medium (acceptable, juste comptage)
 *
 * Exclusions :
 * - connexion-test/ (page de démo)
 * - components/ui/ pour paliers de texte (composants système)
 * - grid-cols-4 avec md:/lg: préfixe (responsive valide)
 *
 * Exit 0 si aucune violation, exit 1 sinon.
 */

import { execSync } from "child_process";

interface Controle {
  nom: string;
  commande: string;
  seuil: number; // Nombre maximum acceptable
}

const CONTROLES: Controle[] = [
  {
    nom: "font-bold (doit être font-semibold)",
    commande:
      'grep -rn "font-bold" app components --include="*.tsx" | grep -v "connexion-test" | wc -l',
    seuil: 0,
  },
  {
    nom: "text-xl/base (paliers incorrects hors UI)",
    commande:
      'grep -rnE "text-base|text-xl\\b" app components --include="*.tsx" | grep -v "components/ui/" | grep -v "connexion-test" | wc -l',
    seuil: 0,
  },
  {
    nom: "Input/Textarea rounded-lg/xl (doit être rounded-md)",
    commande:
      'grep -rn "rounded-\\(lg\\|xl\\)" app components --include="*.tsx" | grep -E "(Input|Textarea)" | wc -l',
    seuil: 0,
  },
  {
    nom: "Couleurs hexadécimales hardcodées",
    commande:
      'grep -rnE "#[0-9A-Fa-f]{3,6}" app components --include="*.tsx" | grep -v "90vh" | wc -l',
    seuil: 0,
  },
  {
    nom: "Classes Tailwind colorées (slate, red, green, etc.)",
    commande:
      'grep -rnE "\\b(slate|zinc|neutral|stone|red|green|blue|yellow|purple|pink|orange|indigo|teal|cyan|emerald|amber|lime|violet|fuchsia|rose)-[0-9]{2,3}\\b" app components --include="*.tsx" | wc -l',
    seuil: 0,
  },
  {
    nom: "grid-cols-4 sans responsive (doit être md:grid-cols-3)",
    commande:
      'grep -rn "grid-cols-4" app components --include="*.tsx" | grep -v "lg:grid-cols-4" | grep -v "md:grid-cols-4" | wc -l',
    seuil: 0,
  },
  {
    nom: "DialogContent sans max-h-[90vh]",
    commande:
      'grep -rn "<DialogContent" app components --include="*.tsx" | grep -v "max-h-" | grep -v "</DialogContent" | grep -v "DialogContent," | wc -l',
    seuil: 6, // 6 cas multilignes légitimes (className sur ligne suivante)
  },
  {
    nom: "font-mono + font-medium (acceptable, comptage)",
    commande:
      'grep -rnE "font-mono.*font-medium|font-medium.*font-mono" app components --include="*.tsx" | wc -l',
    seuil: 999, // Pas de limite, juste informatif
  },
];

async function main() {
  console.log("🎨 Vérification des jetons de rendu TYPOGRAPHIE.md + CHAMPS.md\n");

  let violations = 0;

  for (const controle of CONTROLES) {
    try {
      const result = execSync(controle.commande, {
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      const count = parseInt(result.trim(), 10);

      if (count > controle.seuil) {
        console.log(`❌ ${controle.nom}`);
        console.log(`   Trouvé : ${count} | Seuil : ${controle.seuil}`);
        console.log(`   Commande : ${controle.commande}\n`);
        violations++;
      } else {
        console.log(`✅ ${controle.nom} (${count}/${controle.seuil})`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution : ${controle.nom}`);
      console.error(error);
      violations++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  if (violations === 0) {
    console.log("✅ AUCUNE VIOLATION DE RENDU DÉTECTÉE\n");
    process.exit(0);
  } else {
    console.log(`❌ ${violations} VIOLATION(S) DÉTECTÉE(S)\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erreur fatale :", error);
  process.exit(1);
});
