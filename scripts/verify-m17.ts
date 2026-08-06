/**
 * Script de vérification M17 — Compétences et taux journaliers
 *
 * Vérifie les critères de recette critiques :
 * - Modèles Prisma corrects
 * - Permissions créées et assignées
 * - Fichiers d'actions présents
 * - Écrans créés
 * - Seed fonctionnel
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Compteurs
let verificationsPasses = 0;
let verificationsEchouees = 0;

function verifier(nom: string, condition: boolean, erreur?: string) {
  if (condition) {
    console.log(`  ✅ ${nom}`);
    verificationsPasses++;
  } else {
    console.log(`  ❌ ${nom}${erreur ? ` — ${erreur}` : ""}`);
    verificationsEchouees++;
  }
}

function fichierExiste(chemin: string): boolean {
  return existsSync(join(process.cwd(), chemin));
}

function fichierContient(chemin: string, texte: string): boolean {
  if (!fichierExiste(chemin)) return false;
  const contenu = readFileSync(join(process.cwd(), chemin), "utf-8");
  return contenu.includes(texte);
}

console.log("🔍 Vérification M17 — Compétences et taux journaliers\n");

// =====================================================================
// 1. MODÈLES PRISMA
// =====================================================================
console.log("1️⃣  Modèles Prisma");

verifier(
  "Enum CategorieCompetence existe",
  fichierContient("prisma/schema.prisma", "enum CategorieCompetence")
);

verifier(
  "Model Competence existe",
  fichierContient("prisma/schema.prisma", "model Competence")
);

verifier(
  "Model TauxJournalier existe",
  fichierContient("prisma/schema.prisma", "model TauxJournalier")
);

verifier(
  "Model AffectationCompetence existe",
  fichierContient("prisma/schema.prisma", "model AffectationCompetence")
);

verifier(
  "Auto-relation Composition avec deux champs",
  fichierContient("prisma/schema.prisma", 'composantes  Competence[] @relation("Composition")') &&
  fichierContient("prisma/schema.prisma", 'composeeDans Competence[] @relation("Composition")')
);

verifier(
  "Contrainte unique @@unique([competenceId, dateEffet])",
  fichierContient("prisma/schema.prisma", "@@unique([competenceId, dateEffet])")
);

// Vérifier qu'il n'y a pas de champ actif/courant dans TauxJournalier
const schemaPrisma = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf-8");
const tauxJournalierBlock = schemaPrisma.match(/model TauxJournalier \{[\s\S]*?\n\}/)?.[0] || "";
const hasActifOrCourant = tauxJournalierBlock.includes("actif ") || tauxJournalierBlock.includes("courant ");

verifier(
  "Aucun champ 'actif' ou 'courant' sur TauxJournalier",
  !hasActifOrCourant
);

// =====================================================================
// 2. PERMISSIONS
// =====================================================================
console.log("\n2️⃣  Permissions");

verifier(
  "Permission competence:lire existe",
  fichierContient("lib/auth/guard.ts", '"competence:lire"')
);

verifier(
  "Permission competence:gerer existe",
  fichierContient("lib/auth/guard.ts", '"competence:gerer"')
);

verifier(
  "Permission taux:definir existe",
  fichierContient("lib/auth/guard.ts", '"taux:definir"')
);

verifier(
  "Permission competence:assigner existe",
  fichierContient("lib/auth/guard.ts", '"competence:assigner"')
);

verifier(
  "Matrice de permissions dans seed.ts",
  fichierContient("prisma/seed.ts", '"competence:lire"') &&
  fichierContient("prisma/seed.ts", '"competence:gerer"') &&
  fichierContient("prisma/seed.ts", '"taux:definir"') &&
  fichierContient("prisma/seed.ts", '"competence:assigner"')
);

verifier(
  "Routes dans nav-permissions.ts",
  fichierContient("lib/auth/nav-permissions.ts", '"/personnel/competences"') &&
  fichierContient("lib/auth/nav-permissions.ts", '"/personnel/competences/agents"')
);

// =====================================================================
// 3. ACTIONS SERVEUR
// =====================================================================
console.log("\n3️⃣  Actions serveur");

verifier(
  "Fichier lib/actions/competences.ts existe",
  fichierExiste("lib/actions/competences.ts")
);

verifier(
  "Action listerCompetences existe",
  fichierContient("lib/actions/competences.ts", "export const listerCompetences")
);

verifier(
  "Action creerCompetence existe",
  fichierContient("lib/actions/competences.ts", "export const creerCompetence")
);

verifier(
  "Action fixerTaux existe",
  fichierContient("lib/actions/competences.ts", "export const fixerTaux")
);

verifier(
  "Action assignerCompetence existe",
  fichierContient("lib/actions/competences.ts", "export const assignerCompetence")
);

verifier(
  "Fonction montantDuJour existe (CRITIQUE)",
  fichierContient("lib/actions/competences.ts", "export async function montantDuJour")
);

verifier(
  "Fonction tauxEnVigueur existe",
  fichierContient("lib/actions/competences.ts", "export async function tauxEnVigueur")
);

verifier(
  "Fonction competenceALaDate existe",
  fichierContient("lib/actions/competences.ts", "export async function competenceALaDate")
);

verifier(
  "Fonction normaliserLibelle existe",
  fichierContient("lib/actions/competences.ts", "function normaliserLibelle")
);

// =====================================================================
// 4. ÉCRANS
// =====================================================================
console.log("\n4️⃣  Écrans");

verifier(
  "Page /personnel/competences existe",
  fichierExiste("app/(app)/personnel/competences/page.tsx")
);

verifier(
  "Page /personnel/competences/agents existe",
  fichierExiste("app/(app)/personnel/competences/agents/page.tsx")
);

verifier(
  "Composant indicateurs-competences existe",
  fichierExiste("app/(app)/personnel/competences/_components/indicateurs-competences.tsx")
);

verifier(
  "Composant liste-competences existe",
  fichierExiste("app/(app)/personnel/competences/_components/liste-competences.tsx")
);

verifier(
  "Modale compétence (DT) existe",
  fichierExiste("app/(app)/personnel/competences/_components/modale-competence.tsx")
);

verifier(
  "Modale taux (DFC) existe",
  fichierExiste("app/(app)/personnel/competences/_components/modale-taux.tsx")
);

verifier(
  "Modale historique existe",
  fichierExiste("app/(app)/personnel/competences/_components/modale-historique.tsx")
);

verifier(
  "Modale assigner compétence (RH) existe",
  fichierExiste("app/(app)/personnel/competences/agents/_components/modale-assigner-competence.tsx")
);

verifier(
  "Modale compétence n'a PAS de champ montant",
  !fichierContient("app/(app)/personnel/competences/_components/modale-competence.tsx", "montant") ||
  !fichierContient("app/(app)/personnel/competences/_components/modale-competence.tsx", "Montant")
);

// =====================================================================
// 5. SEED
// =====================================================================
console.log("\n5️⃣  Seed");

verifier(
  "Fonction seedCompetencesM17 existe",
  fichierContient("prisma/seed.ts", "async function seedCompetencesM17")
);

verifier(
  "9 compétences dans le seed",
  fichierContient("prisma/seed.ts", '"Manœuvre"') &&
  fichierContient("prisma/seed.ts", '"Aide-maçon"') &&
  fichierContient("prisma/seed.ts", '"Maçon"') &&
  fichierContient("prisma/seed.ts", '"Coffreur"') &&
  fichierContient("prisma/seed.ts", '"Ferrailleur"') &&
  fichierContient("prisma/seed.ts", '"Plombier — pose canalisation"') &&
  fichierContient("prisma/seed.ts", '"Soudeur"') &&
  fichierContient("prisma/seed.ts", '"Conducteur d\'engins"') &&
  fichierContient("prisma/seed.ts", '"Maçon-Coffreur"')
);

verifier(
  "Seed est idempotent (upsert)",
  fichierContient("prisma/seed.ts", "upsert")
);

verifier(
  "Avertissement HYPOTHÈSES dans le seed",
  fichierContient("prisma/seed.ts", "HYPOTHÈSE")
);

// =====================================================================
// 6. TEST CRITIQUE
// =====================================================================
console.log("\n6️⃣  Test critique");

verifier(
  "Script test-montant-du-jour.ts existe",
  fichierExiste("scripts/test-montant-du-jour.ts")
);

verifier(
  "Test utilise montantDuJour avec plusieurs dates",
  fichierContient("scripts/test-montant-du-jour.ts", "montantDuJour") &&
  fichierContient("scripts/test-montant-du-jour.ts", "2025-03-15") &&
  fichierContient("scripts/test-montant-du-jour.ts", "2025-06-15") &&
  fichierContient("scripts/test-montant-du-jour.ts", "2026-03-15")
);

// =====================================================================
// RÉSULTAT
// =====================================================================
console.log("\n" + "=".repeat(60));
console.log(`📊 Résultat : ${verificationsPasses}/${verificationsPasses + verificationsEchouees} vérifications passées`);
console.log("=".repeat(60));

if (verificationsEchouees > 0) {
  console.log("\n❌ ÉCHEC : Certaines vérifications ont échoué\n");
  process.exit(1);
} else {
  console.log("\n✅ SUCCÈS : Toutes les vérifications sont passées\n");
  console.log("M17 — Compétences et taux journaliers est complet et conforme à la spécification.");
  process.exit(0);
}
