#!/usr/bin/env tsx
/**
 * Seed M1 uniquement — Organisation
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/seed-m1-only.ts
 */

import { PrismaClient, type NiveauHierarchique } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDirections() {
  console.log("📋 Seed M1 — Directions");

  const directions = [
    { code: "DG", libelle: "Direction Générale", ordre: 1, reserveAdmin: true },
    { code: "DFC", libelle: "Direction Financière et Comptable", ordre: 2, reserveAdmin: true },
    { code: "DT", libelle: "Direction Technique", ordre: 3, reserveAdmin: true },
    { code: "DAR", libelle: "Direction Administrative et RH", ordre: 4, reserveAdmin: true },
  ];

  for (const dir of directions) {
    await prisma.direction.upsert({
      where: { code: dir.code },
      create: dir,
      update: { libelle: dir.libelle, ordre: dir.ordre },
    });
  }

  console.log(`  ✅ ${directions.length} directions créées`);
}

async function seedServices() {
  console.log("📋 Seed M1 — Services");

  const DG = await prisma.direction.findUniqueOrThrow({ where: { code: "DG" } });
  const DFC = await prisma.direction.findUniqueOrThrow({ where: { code: "DFC" } });
  const DT = await prisma.direction.findUniqueOrThrow({ where: { code: "DT" } });
  const DAR = await prisma.direction.findUniqueOrThrow({ where: { code: "DAR" } });

  const services = [
    // DFC — 2 services
    { code: "ACHATS", libelle: "Service Achats", directionId: DFC.id, ordre: 1 },
    { code: "COMPTA", libelle: "Comptabilité", directionId: DFC.id, ordre: 2 },

    // DT — 5 services
    { code: "ETUDES_AO", libelle: "Études et Appels d'Offres", directionId: DT.id, ordre: 1 },
    { code: "AEP", libelle: "Adduction d'Eau Potable", directionId: DT.id, ordre: 2 },
    { code: "ASSAINISSEMENT", libelle: "Assainissement", directionId: DT.id, ordre: 3 },
    { code: "ROUTES", libelle: "Routes et Voiries", directionId: DT.id, ordre: 4 },
    { code: "LOGISTIQUE", libelle: "Logistique", directionId: DT.id, ordre: 5 },

    // DAR — 1 service
    { code: "QHSE", libelle: "QHSE", directionId: DAR.id, ordre: 1 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      create: service,
      update: { libelle: service.libelle, directionId: service.directionId, ordre: service.ordre },
    });
  }

  console.log(`  ✅ ${services.length} services créés`);
}

async function seedPostes() {
  console.log("📋 Seed M1 — Postes");

  const DG = await prisma.direction.findUniqueOrThrow({ where: { code: "DG" } });
  const DFC = await prisma.direction.findUniqueOrThrow({ where: { code: "DFC" } });
  const DT = await prisma.direction.findUniqueOrThrow({ where: { code: "DT" } });
  const DAR = await prisma.direction.findUniqueOrThrow({ where: { code: "DAR" } });

  const achats = await prisma.service.findUniqueOrThrow({ where: { code: "ACHATS" } });
  const compta = await prisma.service.findUniqueOrThrow({ where: { code: "COMPTA" } });
  const etudesAO = await prisma.service.findUniqueOrThrow({ where: { code: "ETUDES_AO" } });
  const aep = await prisma.service.findUniqueOrThrow({ where: { code: "AEP" } });
  const assainissement = await prisma.service.findUniqueOrThrow({ where: { code: "ASSAINISSEMENT" } });
  const routes = await prisma.service.findUniqueOrThrow({ where: { code: "ROUTES" } });
  const logistique = await prisma.service.findUniqueOrThrow({ where: { code: "LOGISTIQUE" } });
  const qhse = await prisma.service.findUniqueOrThrow({ where: { code: "QHSE" } });

  const postes: Array<{
    code: string;
    libelle: string;
    niveau: NiveauHierarchique;
    directionId: string;
    serviceId: string | null;
    reserveAdmin?: boolean;
    titulaireUnique?: boolean;
    ouvreDroitConges?: boolean;
  }> = [
    // DG — 2 postes sans service
    { code: "DIR_GENERAL", libelle: "Directeur Général", niveau: "DIRECTION" as NiveauHierarchique, directionId: DG.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },
    { code: "ASST_DG", libelle: "Assistante de Direction", niveau: "SUPPORT", directionId: DG.id, serviceId: null },

    // DFC — 1 direction + 2 postes avec service
    { code: "DIR_FINANCIER", libelle: "Directeur Financier et Comptable", niveau: "DIRECTION", directionId: DFC.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },
    { code: "CHEF_ACHATS", libelle: "Chef de Service Achats", niveau: "CADRE", directionId: DFC.id, serviceId: achats.id },
    { code: "ASST_COMPTABLE", libelle: "Assistant comptable", niveau: "SUPPORT", directionId: DFC.id, serviceId: compta.id },

    // DT — 1 direction + 7 postes chantier + 12 postes services
    { code: "DIR_TECHNIQUE", libelle: "Directeur Technique", niveau: "DIRECTION", directionId: DT.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },

    // Chaîne chantier (sans service)
    { code: "CONDUCTEUR_TRAVAUX", libelle: "Conducteur de Travaux", niveau: "CADRE", directionId: DT.id, serviceId: null },
    { code: "CHEF_CHANTIER", libelle: "Chef Chantier", niveau: "CADRE", directionId: DT.id, serviceId: null },
    { code: "CHEF_CHANTIER_ADJ", libelle: "Chef Chantier Adjoint", niveau: "CADRE", directionId: DT.id, serviceId: null },
    { code: "CHEF_EQUIPE", libelle: "Chef d'équipe", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: null },
    { code: "OUVRIER", libelle: "Ouvrier", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: null, ouvreDroitConges: false },
    { code: "MANOEUVRE", libelle: "Manœuvre", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: null, ouvreDroitConges: false },

    // Services DT
    { code: "CHARGE_ETUDES", libelle: "Chargé d'études et travaux", niveau: "CADRE", directionId: DT.id, serviceId: etudesAO.id },
    { code: "CHEF_AEP", libelle: "Chef de Service AEP", niveau: "CADRE", directionId: DT.id, serviceId: aep.id },
    { code: "CHEF_ASSAINISSEMENT", libelle: "Chef de Service Assainissement", niveau: "CADRE", directionId: DT.id, serviceId: assainissement.id },
    { code: "CHEF_ROUTES", libelle: "Chef de Service Routes et Voiries", niveau: "CADRE", directionId: DT.id, serviceId: routes.id },
    { code: "CHEF_LOGISTIQUE", libelle: "Chef de Service Logistique", niveau: "CADRE", directionId: DT.id, serviceId: logistique.id },
    { code: "CHEF_GARAGE", libelle: "Chef du Garage", niveau: "CADRE", directionId: DT.id, serviceId: logistique.id },
    { code: "GESTIONNAIRE_STOCKS", libelle: "Gestionnaire de stocks", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "MECANICIEN", libelle: "Mécanicien", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "CONDUCTEUR_ENGINS", libelle: "Conducteur d'engins", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "GARDIEN", libelle: "Gardien", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },
    { code: "CHAUFFEUR", libelle: "Chauffeur", niveau: "OPERATIONNEL", directionId: DT.id, serviceId: logistique.id },

    // DAR — 1 direction + 4 postes
    { code: "DIR_ADMIN_RH", libelle: "Directeur Administratif et RH", niveau: "DIRECTION", directionId: DAR.id, serviceId: null, reserveAdmin: true, titulaireUnique: true },
    { code: "ASST_RH", libelle: "Assistant RH", niveau: "SUPPORT", directionId: DAR.id, serviceId: null },
    { code: "COURSIER", libelle: "Coursier", niveau: "SUPPORT", directionId: DAR.id, serviceId: null },
    { code: "TECH_SURFACE", libelle: "Technicien de surface", niveau: "OPERATIONNEL", directionId: DAR.id, serviceId: null },
    { code: "CHEF_QHSE", libelle: "Chef de Service QHSE", niveau: "CADRE", directionId: DAR.id, serviceId: qhse.id },
    { code: "ASST_QHSE", libelle: "Assistant QHSE", niveau: "SUPPORT", directionId: DAR.id, serviceId: qhse.id },
    { code: "RELAIS_QHSE", libelle: "Relais QHSE", niveau: "OPERATIONNEL", directionId: DAR.id, serviceId: qhse.id },
  ];

  for (const poste of postes) {
    await prisma.poste.upsert({
      where: { code: poste.code },
      create: {
        code: poste.code,
        libelle: poste.libelle,
        niveau: poste.niveau,
        directionId: poste.directionId,
        serviceId: poste.serviceId,
        reserveAdmin: "reserveAdmin" in poste ? poste.reserveAdmin : false,
        titulaireUnique: "titulaireUnique" in poste ? poste.titulaireUnique : false,
        ouvreDroitConges: "ouvreDroitConges" in poste ? poste.ouvreDroitConges : true,
      },
      update: {
        libelle: poste.libelle,
        niveau: poste.niveau,
        directionId: poste.directionId,
        serviceId: poste.serviceId,
        reserveAdmin: "reserveAdmin" in poste ? poste.reserveAdmin : false,
        titulaireUnique: "titulaireUnique" in poste ? poste.titulaireUnique : false,
        ouvreDroitConges: "ouvreDroitConges" in poste ? poste.ouvreDroitConges : true,
      },
    });
  }

  console.log(`  ✅ ${postes.length} postes créés`);
}

async function seedHierarchie() {
  console.log("📋 Seed M1 — Hiérarchie des postes");

  // Récupération de tous les postes en une seule requête
  const postes = await prisma.poste.findMany();
  const posteByCode = new Map(postes.map((p) => [p.code, p]));

  const getPoste = (code: string) => {
    const p = posteByCode.get(code);
    if (!p) throw new Error(`Poste ${code} introuvable`);
    return p;
  };

  const DG = getPoste("DIR_GENERAL");
  const DFC = getPoste("DIR_FINANCIER");
  const DT = getPoste("DIR_TECHNIQUE");
  const DAR = getPoste("DIR_ADMIN_RH");

  // Chaîne hiérarchique selon DECISIONS.md
  const hierarchie = [
    // DG
    { code: "DIR_GENERAL", superieurCode: null }, // Sommet

    // DG › Assistante DG
    { code: "ASST_DG", superieurCode: "DIR_GENERAL" },

    // DG › Directeurs
    { code: "DIR_FINANCIER", superieurCode: "DIR_GENERAL" },
    { code: "DIR_TECHNIQUE", superieurCode: "DIR_GENERAL" },
    { code: "DIR_ADMIN_RH", superieurCode: "DIR_GENERAL" },

    // DFC › Chef Achats, Assistant comptable (A-07)
    { code: "CHEF_ACHATS", superieurCode: "DIR_FINANCIER" },
    { code: "ASST_COMPTABLE", superieurCode: "DIR_FINANCIER" },

    // DT › Chefs de service (A-08)
    { code: "CHARGE_ETUDES", superieurCode: "DIR_TECHNIQUE" },
    { code: "CHEF_AEP", superieurCode: "DIR_TECHNIQUE" },
    { code: "CHEF_ASSAINISSEMENT", superieurCode: "DIR_TECHNIQUE" },
    { code: "CHEF_ROUTES", superieurCode: "DIR_TECHNIQUE" },
    { code: "CHEF_LOGISTIQUE", superieurCode: "DIR_TECHNIQUE" },

    // DT › Chaîne chantier (A-08 bis)
    { code: "CONDUCTEUR_TRAVAUX", superieurCode: "DIR_TECHNIQUE" },
    { code: "CHEF_CHANTIER", superieurCode: "DIR_TECHNIQUE" }, // ⚠️ DT, PAS Conducteur de Travaux
    { code: "CHEF_CHANTIER_ADJ", superieurCode: "DIR_TECHNIQUE" },
    { code: "CHEF_EQUIPE", superieurCode: "CHEF_CHANTIER" },
    { code: "OUVRIER", superieurCode: "CHEF_EQUIPE" },
    { code: "MANOEUVRE", superieurCode: "CHEF_EQUIPE" },

    // Service Logistique (A-06)
    { code: "GESTIONNAIRE_STOCKS", superieurCode: "CHEF_LOGISTIQUE" },
    { code: "CHEF_GARAGE", superieurCode: "CHEF_LOGISTIQUE" },
    { code: "MECANICIEN", superieurCode: "CHEF_GARAGE" },
    { code: "CONDUCTEUR_ENGINS", superieurCode: "CHEF_GARAGE" },
    { code: "CHAUFFEUR", superieurCode: "CHEF_GARAGE" },
    { code: "GARDIEN", superieurCode: "CHEF_GARAGE" },

    // DAR (A-10)
    { code: "ASST_RH", superieurCode: "DIR_ADMIN_RH" },
    { code: "COURSIER", superieurCode: "DIR_ADMIN_RH" },
    { code: "TECH_SURFACE", superieurCode: "DIR_ADMIN_RH" },
    { code: "CHEF_QHSE", superieurCode: "DIR_ADMIN_RH" },
    { code: "ASST_QHSE", superieurCode: "CHEF_QHSE" },
    { code: "RELAIS_QHSE", superieurCode: "ASST_QHSE" },
  ];

  // Mise à jour
  for (const { code, superieurCode } of hierarchie) {
    const poste = getPoste(code);
    const superieurId = superieurCode ? getPoste(superieurCode).id : null;

    await prisma.poste.update({
      where: { id: poste.id },
      data: { superieurPosteId: superieurId },
    });
  }

  console.log(`  ✅ ${hierarchie.length} liens hiérarchiques renseignés`);
}

async function main() {
  console.log("🌱 Seed M1 — début\n");

  await seedDirections();
  await seedServices();
  await seedPostes();
  await seedHierarchie();

  console.log("\n✅ Seed M1 — terminé");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
