import { prismaDirect } from "./lib/prisma-direct";

async function seedParametresM15L2() {
  console.log("🌱 Ajout des paramètres M15 L2 - Paiements Fournisseurs...");

  const parametres = [
    {
      cle: "SEUIL_VALIDATION_DG_FOURNISSEUR",
      libelle: "Seuil de validation DG pour factures fournisseurs",
      valeur: "500000",
      type: "NUMBER" as const,
      groupe: "PAIEMENTS",
      aide: "Montant TTC (en FCFA) au-delà duquel une facture fournisseur nécessite la validation du Directeur Général après celle du Gestionnaire. Décision D-02.",
    },
  ];

  for (const param of parametres) {
    await prismaDirect.parametre.upsert({
      where: { cle: param.cle },
      create: param,
      update: param,
    });
    console.log(`  ✓ ${param.cle}: ${param.valeur} FCFA`);
  }

  console.log("\n✅ Paramètres M15 L2 ajoutés");
  await prismaDirect.$disconnect();
}

seedParametresM15L2().catch((e) => {
  console.error(e);
  process.exit(1);
});
