import { prismaDirect } from "./lib/prisma-direct";

async function seedParametres() {
  console.log("🌱 Ajout des paramètres de nomenclature...");

  const parametres = [
    {
      cle: "format.code_projet",
      libelle: "Format du code projet",
      valeur: "CH-{YYYY}-{NNN}",
      type: "STRING" as const,
      groupe: "Nomenclature",
      aide: "Format du code auto-généré. {YYYY} = année, {NNN} = numéro séquentiel sur 3 chiffres. Ex: CH-2026-001",
    },
    {
      cle: "prefix.code_projet",
      libelle: "Préfixe code projet",
      valeur: "CH",
      type: "STRING" as const,
      groupe: "Nomenclature",
      aide: "Préfixe utilisé dans le code projet (CH = Chantier)",
    },
  ];

  for (const param of parametres) {
    await prismaDirect.parametre.upsert({
      where: { cle: param.cle },
      create: param,
      update: param,
    });
    console.log(`  ✓ ${param.cle}: ${param.valeur}`);
  }

  console.log("\n✅ Paramètres de nomenclature ajoutés");
  await prismaDirect.$disconnect();
}

seedParametres().catch((e) => {
  console.error(e);
  process.exit(1);
});
