#!/usr/bin/env tsx
/**
 * Vérification du seed M1 contre la grille DECISIONS.md section A
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/verify-m1-seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Vérification du seed M1\n");

  // 1. Exactement 4 directions
  const directions = await prisma.direction.findMany({ orderBy: { ordre: "asc" } });
  console.log(`📋 Directions (attendu: 4, trouvé: ${directions.length})`);
  directions.forEach((d) => console.log(`  - ${d.code}: ${d.libelle}`));
  console.log(directions.length === 4 ? "  ✅ CONFORME\n" : "  ❌ NON CONFORME\n");

  // 2. Exactement 8 services
  const services = await prisma.service.findMany({
    include: { direction: true },
    orderBy: { ordre: "asc" },
  });
  console.log(`📋 Services (attendu: 8, trouvé: ${services.length})`);
  services.forEach((s) => console.log(`  - ${s.code}: ${s.libelle} (${s.direction.code})`));
  console.log(services.length === 8 ? "  ✅ CONFORME\n" : "  ❌ NON CONFORME\n");

  // 3. Aucun service "Secrétariat de Direction" ni "Administration & RH"
  const servicesBannis = services.filter((s) =>
    s.libelle.toLowerCase().includes("secrétariat") ||
    s.code.includes("ADMIN_RH") ||
    s.libelle.toLowerCase().includes("administration")
  );
  console.log(`📋 Services bannis (attendu: 0, trouvé: ${servicesBannis.length})`);
  servicesBannis.forEach((s) => console.log(`  ⚠️ ${s.code}: ${s.libelle}`));
  console.log(servicesBannis.length === 0 ? "  ✅ CONFORME\n" : "  ❌ NON CONFORME\n");

  // 4. Service Logistique rattaché à la DT
  const logistique = services.find((s) => s.code === "LOGISTIQUE");
  const dt = directions.find((d) => d.code === "DT");
  console.log(`📋 Service Logistique`);
  if (logistique && dt) {
    console.log(`  - Rattachement: ${logistique.direction.code}`);
    console.log(logistique.directionId === dt.id ? "  ✅ CONFORME (DT)\n" : `  ❌ NON CONFORME (trouvé: ${logistique.direction.code})\n`);
  } else {
    console.log("  ❌ Service ou Direction introuvable\n");
  }

  // 5. Exactement 30 postes
  const postes = await prisma.poste.findMany({
    include: { direction: true, service: true },
  });
  console.log(`📋 Postes (attendu: 30, trouvé: ${postes.length})`);
  console.log(postes.length === 30 ? "  ✅ CONFORME\n" : "  ❌ NON CONFORME\n");

  // 6. 14 postes avec serviceId = null
  const postesSansService = postes.filter((p) => p.serviceId === null);
  console.log(`📋 Postes sans service (attendu: 14, trouvé: ${postesSansService.length})`);
  console.log("  Liste:");
  postesSansService.forEach((p) => console.log(`    - ${p.code}: ${p.libelle} (${p.direction.code})`));
  console.log(postesSansService.length === 14 ? "  ✅ CONFORME\n" : "  ❌ NON CONFORME\n");

  // 7. Chef Chantier ne remonte PAS au Conducteur de Travaux
  const chefChantier = postes.find((p) => p.code === "CHEF_CHANTIER");
  const conducteurTravaux = postes.find((p) => p.code === "CONDUCTEUR_TRAVAUX");
  console.log(`📋 Chef Chantier — supérieur hiérarchique`);
  if (chefChantier && conducteurTravaux) {
    if (chefChantier.superieurPosteId) {
      const superieurActuel = postes.find((p) => p.id === chefChantier.superieurPosteId);
      console.log(`  - Supérieur actuel: ${superieurActuel?.code} (${superieurActuel?.libelle})`);
      console.log(chefChantier.superieurPosteId !== conducteurTravaux.id
        ? "  ✅ CONFORME (ne remonte PAS au Conducteur de Travaux)"
        : "  ❌ NON CONFORME (remonte au Conducteur de Travaux)");
    } else {
      console.log("  ⚠️ Pas encore renseigné (superieurPosteId = null)");
    }
  } else {
    console.log("  ❌ Postes introuvables");
  }
  console.log();

  // 8. Intitulés "Chef de Service ...", sauf Chef du Garage et Chargé d'études
  const chefsService = postes.filter((p) => p.serviceId !== null && p.niveau === "CADRE");
  console.log(`📋 Intitulés des chefs de service`);
  const intitulesIncorrects: string[] = [];
  chefsService.forEach((p) => {
    if (p.code === "CHEF_GARAGE" || p.code === "CHARGE_ETUDES") {
      // Exceptions
      if (p.libelle.startsWith("Chef de Service")) {
        intitulesIncorrects.push(`  ⚠️ ${p.code}: "${p.libelle}" (devrait être "${p.code === "CHEF_GARAGE" ? "Chef du Garage" : "Chargé d'études et travaux"}")`);
      }
    } else if (p.code.startsWith("CHEF_")) {
      // Tous les autres chefs de service
      if (!p.libelle.startsWith("Chef de Service")) {
        intitulesIncorrects.push(`  ⚠️ ${p.code}: "${p.libelle}" (devrait commencer par "Chef de Service")`);
      }
    }
  });

  if (intitulesIncorrects.length > 0) {
    intitulesIncorrects.forEach((msg) => console.log(msg));
    console.log("  ❌ NON CONFORME\n");
  } else {
    console.log("  ✅ CONFORME (tous les intitulés respectent la règle)\n");
  }

  console.log("✅ Vérification terminée");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
