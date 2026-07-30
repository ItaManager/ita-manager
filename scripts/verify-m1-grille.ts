#!/usr/bin/env tsx
/**
 * Vérification COMPLÈTE du seed M1 contre la grille M1-ORGANISATION.md §8
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/verify-m1-grille.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TestResult {
  nom: string;
  conforme: boolean;
  details?: string;
}

const resultats: TestResult[] = [];

function test(nom: string, conforme: boolean, details?: string) {
  resultats.push({ nom, conforme, details });
  const icon = conforme ? "✅" : "❌";
  console.log(`${icon} ${nom}`);
  if (details) console.log(`   ${details}`);
}

async function main() {
  console.log("🔍 Vérification complète M1 — grille §8\n");

  // ===== SEED — CONFORMITÉ =====
  console.log("📋 SEED — Conformité DECISIONS.md section A\n");

  const directions = await prisma.direction.findMany({ orderBy: { ordre: "asc" } });
  test(
    "4 directions : DG, DFC, DT, DAR",
    directions.length === 4 &&
      directions.map((d) => d.code).join(",") === "DG,DFC,DT,DAR",
    `Trouvé: ${directions.map((d) => d.code).join(", ")}`
  );

  const services = await prisma.service.findMany({
    include: { direction: true },
    orderBy: { code: "asc" },
  });
  const codesServices = services.map((s) => s.code).sort();
  test(
    "8 services attendus",
    services.length === 8,
    `Trouvé: ${services.length} services`
  );

  test(
    "Aucun service 'Secrétariat de Direction'",
    !services.some((s) =>
      s.libelle.toLowerCase().includes("secrétariat") ||
      s.code.includes("SECRETARIAT")
    )
  );

  test(
    "Aucun service 'Administration & RH'",
    !services.some((s) =>
      s.libelle.toLowerCase().includes("administration") ||
      s.code.includes("ADMIN_RH")
    )
  );

  const postes = await prisma.poste.findMany({
    include: { direction: true, service: true },
  });
  test("30 postes exactement", postes.length === 30, `Trouvé: ${postes.length}`);

  const logistique = services.find((s) => s.code === "LOGISTIQUE");
  const dt = directions.find((d) => d.code === "DT");
  test(
    "Service Logistique rattaché à la DT",
    logistique?.directionId === dt?.id,
    `Trouvé: ${logistique?.direction.code}`
  );

  // ===== POSTES SANS SERVICE =====
  console.log("\n📋 POSTES SANS SERVICE\n");

  const postesSansService = postes.filter((p) => p.serviceId === null);
  test(
    "14 postes ont serviceId = null",
    postesSansService.length === 14,
    `Trouvé: ${postesSansService.length}`
  );

  const coursier = postes.find((p) => p.code === "COURSIER");
  const techSurface = postes.find((p) => p.code === "TECH_SURFACE");
  const qhse = services.find((s) => s.code === "QHSE");
  test(
    "Coursier et Technicien de surface PAS rattachés au Service QHSE",
    coursier?.serviceId !== qhse?.id && techSurface?.serviceId !== qhse?.id
  );

  const chefChantier = postes.find((p) => p.code === "CHEF_CHANTIER");
  const chefChantierAdj = postes.find((p) => p.code === "CHEF_CHANTIER_ADJ");
  const chefEquipe = postes.find((p) => p.code === "CHEF_EQUIPE");
  test(
    "Chef Chantier, Chef Chantier Adjoint, Chef d'équipe sans service",
    !chefChantier?.serviceId &&
      !chefChantierAdj?.serviceId &&
      !chefEquipe?.serviceId
  );

  // ===== INTITULÉS =====
  console.log("\n📋 INTITULÉS\n");

  const chefsService = [
    "CHEF_ACHATS",
    "CHEF_AEP",
    "CHEF_ASSAINISSEMENT",
    "CHEF_ROUTES",
    "CHEF_LOGISTIQUE",
    "CHEF_QHSE",
  ];
  const intitulesOK = chefsService.every((code) => {
    const p = postes.find((x) => x.code === code);
    return p?.libelle.startsWith("Chef de Service");
  });
  test(
    "'Chef de Service...' pour les 6 chefs de service",
    intitulesOK,
    chefsService
      .map((c) => {
        const p = postes.find((x) => x.code === c);
        return `${c}: "${p?.libelle}"`;
      })
      .join(", ")
  );

  const chefGarage = postes.find((p) => p.code === "CHEF_GARAGE");
  const chargeEtudes = postes.find((p) => p.code === "CHARGE_ETUDES");
  test(
    "Exceptions : 'Chef du Garage' et 'Chargé d'études et travaux'",
    chefGarage?.libelle === "Chef du Garage" &&
      chargeEtudes?.libelle === "Chargé d'études et travaux",
    `Garage: "${chefGarage?.libelle}", Études: "${chargeEtudes?.libelle}"`
  );

  const dirDARH = postes.find((p) => p.code === "DIR_ADMIN_RH");
  test(
    "'Directeur Administratif et RH' au masculin",
    dirDARH?.libelle === "Directeur Administratif et RH",
    `Trouvé: "${dirDARH?.libelle}"`
  );

  // ===== CHAÎNE HIÉRARCHIQUE =====
  console.log("\n📋 CHAÎNE HIÉRARCHIQUE\n");

  const dirGeneral = postes.find((p) => p.code === "DIR_GENERAL");
  test(
    "Le Directeur Général est le seul poste sans supérieur",
    !dirGeneral?.superieurPosteId &&
      postes.filter((p) => !p.superieurPosteId).length === 1
  );

  const mecanicien = postes.find((p) => p.code === "MECANICIEN");
  test(
    "Mécanicien → Chef du Garage",
    mecanicien?.superieurPosteId === chefGarage?.id,
    `Trouvé: ${postes.find((p) => p.id === mecanicien?.superieurPosteId)?.code}`
  );

  const gestionnaireStocks = postes.find(
    (p) => p.code === "GESTIONNAIRE_STOCKS"
  );
  const chefLogistique = postes.find((p) => p.code === "CHEF_LOGISTIQUE");
  test(
    "Gestionnaire de stocks → Chef de Service Logistique",
    gestionnaireStocks?.superieurPosteId === chefLogistique?.id
  );

  test(
    "Chef du Garage → Chef de Service Logistique",
    chefGarage?.superieurPosteId === chefLogistique?.id
  );

  const dirTechnique = postes.find((p) => p.code === "DIR_TECHNIQUE");
  const conducteurTravaux = postes.find((p) => p.code === "CONDUCTEUR_TRAVAUX");
  test(
    "Chef Chantier → Directeur Technique (PAS Conducteur de Travaux)",
    chefChantier?.superieurPosteId === dirTechnique?.id &&
      chefChantier?.superieurPosteId !== conducteurTravaux?.id,
    `Trouvé: ${postes.find((p) => p.id === chefChantier?.superieurPosteId)?.code}`
  );

  test(
    "Chef d'équipe → Chef Chantier",
    chefEquipe?.superieurPosteId === chefChantier?.id
  );

  const ouvrier = postes.find((p) => p.code === "OUVRIER");
  const manoeuvre = postes.find((p) => p.code === "MANOEUVRE");
  test(
    "Ouvrier et Manœuvre → Chef d'équipe",
    ouvrier?.superieurPosteId === chefEquipe?.id &&
      manoeuvre?.superieurPosteId === chefEquipe?.id
  );

  const relaisQHSE = postes.find((p) => p.code === "RELAIS_QHSE");
  const asstQHSE = postes.find((p) => p.code === "ASST_QHSE");
  const chefQHSE = postes.find((p) => p.code === "CHEF_QHSE");
  test(
    "Relais QHSE → Assistant QHSE → Chef de Service QHSE",
    relaisQHSE?.superieurPosteId === asstQHSE?.id &&
      asstQHSE?.superieurPosteId === chefQHSE?.id
  );

  const asstComptable = postes.find((p) => p.code === "ASST_COMPTABLE");
  const dirFinancier = postes.find((p) => p.code === "DIR_FINANCIER");
  test(
    "Assistant comptable → Directeur Financier et Comptable (direct)",
    asstComptable?.superieurPosteId === dirFinancier?.id
  );

  // Détection de boucles
  const detecterBoucles = () => {
    for (const p of postes) {
      const visite = new Set<string>();
      let courant: typeof postes[number] | null = p;
      while (courant?.superieurPosteId) {
        if (visite.has(courant.id)) return true; // Boucle détectée
        visite.add(courant.id);
        courant = postes.find((x) => x.id === courant!.superieurPosteId) || null;
      }
    }
    return false;
  };
  test("Aucune boucle détectée", !detecterBoucles());

  // ===== MODÈLE =====
  console.log("\n📋 MODÈLE\n");

  test(
    "Le champ superieurPosteId existe sur Poste",
    postes.every((p) => "superieurPosteId" in p)
  );

  const dirPosteIds = [
    "DIR_GENERAL",
    "DIR_FINANCIER",
    "DIR_TECHNIQUE",
    "DIR_ADMIN_RH",
  ];
  const titulairesUniques = postes.filter((p) => dirPosteIds.includes(p.code));
  test(
    "titulaireUnique = true sur les 4 postes de direction",
    titulairesUniques.every((p) => p.titulaireUnique === true),
    `Trouvé: ${titulairesUniques.filter((p) => !p.titulaireUnique).map((p) => p.code).join(", ") || "tous OK"}`
  );

  // ===== RÉSUMÉ =====
  console.log("\n" + "=".repeat(60));
  const conformes = resultats.filter((r) => r.conforme).length;
  const total = resultats.length;
  const pct = Math.round((conformes / total) * 100);

  console.log(
    `\n${conformes}/${total} tests passés (${pct}%)\n`
  );

  if (conformes === total) {
    console.log("✅ SEED M1 ENTIÈREMENT CONFORME à la grille §8\n");
  } else {
    console.log("❌ ÉCARTS DÉTECTÉS — à corriger avant M2\n");
    const echecs = resultats.filter((r) => !r.conforme);
    echecs.forEach((r) => {
      console.log(`   ❌ ${r.nom}`);
      if (r.details) console.log(`      ${r.details}`);
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
