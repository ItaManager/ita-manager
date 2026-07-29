#!/usr/bin/env tsx
/**
 * Vérification de la hiérarchie renseignée en base (superieurPosteId)
 * Usage: npx dotenv -e .env.dev -- npx tsx scripts/verify-hierarchie.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Vérification superieurPosteId en base réelle\n");

  // 1. Postes sans supérieur
  const postesSansSuperieur = await prisma.poste.findMany({
    where: { superieurPosteId: null, archiveLe: null },
    select: { code: true, libelle: true },
  });

  console.log("📋 Postes sans supérieur (attendu : 1 seul — DIR_GENERAL)\n");
  postesSansSuperieur.forEach((p) => {
    console.log(`  - ${p.code} : ${p.libelle}`);
  });
  console.log(
    postesSansSuperieur.length === 1 &&
      postesSansSuperieur[0]?.code === "DIR_GENERAL"
      ? "\n✅ CONFORME\n"
      : "\n❌ NON CONFORME\n"
  );

  // 2. Vérifier 3 chaînes spécifiques
  console.log("📋 Vérification de 3 chaînes hiérarchiques\n");

  const verifierChaine = async (
    posteCode: string,
    superieurCodeAttendu: string
  ) => {
    const poste = await prisma.poste.findUnique({
      where: { code: posteCode },
      include: {
        superieurPoste: {
          select: { code: true, libelle: true },
        },
      },
    });

    if (!poste) {
      console.log(`❌ ${posteCode} : INTROUVABLE`);
      return;
    }

    const superieurReel = poste.superieurPoste
      ? `${poste.superieurPoste.code} (${poste.superieurPoste.libelle})`
      : "AUCUN";

    const conforme =
      poste.superieurPoste?.code === superieurCodeAttendu;

    console.log(
      `${conforme ? "✅" : "❌"} ${posteCode} → ${superieurReel}`
    );
    console.log(`   Attendu: ${superieurCodeAttendu}`);
  };

  await verifierChaine("MECANICIEN", "CHEF_GARAGE");
  console.log();
  await verifierChaine("GESTIONNAIRE_STOCKS", "CHEF_LOGISTIQUE");
  console.log();
  await verifierChaine("CHEF_CHANTIER", "DIR_TECHNIQUE");

  console.log("\n✅ Vérification terminée");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
