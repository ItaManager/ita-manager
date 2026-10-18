#!/usr/bin/env tsx
/**
 * Vérification stricte de la hiérarchie (superieurPosteId)
 *
 * Compare la base à un registre en dur (DECISIONS.md A-06, A-08, A-08 bis).
 * Sort en code d'erreur si un écart est détecté.
 *
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/verify-hierarchie.ts
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

// Registre de la hiérarchie attendue (source : DECISIONS.md)
const HIERARCHIE_ATTENDUE: Record<string, string | null> = {
  // DG
  DIR_GENERAL: null, // Sommet de la hiérarchie
  ASST_DG: "DIR_GENERAL",

  // DFC
  DIR_FINANCIER: "DIR_GENERAL",
  CHEF_ACHATS: "DIR_FINANCIER",
  ASST_COMPTABLE: "DIR_FINANCIER",

  // DT
  DIR_TECHNIQUE: "DIR_GENERAL",
  CONDUCTEUR_TRAVAUX: "DIR_TECHNIQUE",
  CHEF_CHANTIER: "DIR_TECHNIQUE", // A-08 : hiérarchique direct, pas CT
  CHEF_CHANTIER_ADJ: "DIR_TECHNIQUE", // A-08 bis : pair du CC, pas subordonné
  CHEF_EQUIPE: "CHEF_CHANTIER",
  OUVRIER: "CHEF_EQUIPE",
  MANOEUVRE: "CHEF_EQUIPE",
  CHARGE_ETUDES: "DIR_TECHNIQUE",
  CHEF_AEP: "DIR_TECHNIQUE",
  CHEF_ASSAINISSEMENT: "DIR_TECHNIQUE",
  CHEF_ROUTES: "DIR_TECHNIQUE",
  CHEF_LOGISTIQUE: "DIR_TECHNIQUE",
  CHEF_GARAGE: "CHEF_LOGISTIQUE",
  GESTIONNAIRE_STOCKS: "CHEF_LOGISTIQUE",
  MECANICIEN: "CHEF_GARAGE",
  CONDUCTEUR_ENGINS: "CHEF_GARAGE",
  CHAUFFEUR: "CHEF_GARAGE",
  GARDIEN: "CHEF_GARAGE", // A-06 : équipe garage sous Chef Garage

  // DAR
  DIR_ADMIN_RH: "DIR_GENERAL",
  ASST_RH: "DIR_ADMIN_RH",
  COURSIER: "DIR_ADMIN_RH",
  TECH_SURFACE: "DIR_ADMIN_RH",
  CHEF_QHSE: "DIR_ADMIN_RH",
  ASST_QHSE: "CHEF_QHSE",
  RELAIS_QHSE: "ASST_QHSE",
};

async function main() {
  console.log("🔍 Vérification stricte de la hiérarchie\n");

  let erreurs = 0;

  // Récupérer tous les postes actifs avec leur supérieur
  const postes = await prisma.poste.findMany({
    where: { archiveLe: null },
    select: {
      code: true,
      libelle: true,
      superieurPoste: {
        select: { code: true },
      },
    },
  });

  const postesMap = new Map(
    postes.map((p) => [p.code, p.superieurPoste?.code ?? null])
  );

  console.log("📋 Contrôle des 30 postes\n");

  for (const [codePoste, superieurAttendu] of Object.entries(
    HIERARCHIE_ATTENDUE
  )) {
    const superieurReel = postesMap.get(codePoste);

    if (superieurReel === undefined) {
      console.log(`❌ ${codePoste} : POSTE INTROUVABLE EN BASE`);
      erreurs++;
      continue;
    }

    if (superieurReel !== superieurAttendu) {
      console.log(
        `❌ ${codePoste} : hiérarchie incorrecte\n` +
          `   Attendu : ${superieurAttendu ?? "AUCUN"}\n` +
          `   Réel    : ${superieurReel ?? "AUCUN"}`
      );
      erreurs++;
    } else {
      console.log(
        `✅ ${codePoste} → ${superieurAttendu ?? "AUCUN (sommet)"}`
      );
    }
  }

  // Vérifier qu'il n'y a pas de postes en trop
  const postesEnTrop = Array.from(postesMap.keys()).filter(
    (code) => !(code in HIERARCHIE_ATTENDUE)
  );

  if (postesEnTrop.length > 0) {
    console.log(
      `\n❌ Postes en base non prévus au registre : ${postesEnTrop.join(", ")}`
    );
    erreurs += postesEnTrop.length;
  }

  // Résultat
  console.log(`\n${"=".repeat(60)}`);
  if (erreurs === 0) {
    console.log("✅ HIÉRARCHIE CONFORME — 30 postes, 29 liens, 1 sommet");
    process.exit(0);
  } else {
    console.log(`❌ HIÉRARCHIE NON CONFORME — ${erreurs} erreur(s) détectée(s)`);
    console.log(
      "\nSource de vérité : DECISIONS.md A-06, A-08, A-08 bis"
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Erreur lors de la vérification :", e);
  process.exit(1);
});
