/**
 * Seed d'agents journaliers pour tester M17
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function genererMatricule(): Promise<string> {
  const annee = new Date().getFullYear();
  const dernier = await prisma.employe.findFirst({
    where: {
      matricule: {
        startsWith: `ITA-${annee}-`,
      },
    },
    orderBy: { matricule: "desc" },
  });

  let numero = 1;
  if (dernier) {
    const match = dernier.matricule.match(/ITA-\d{4}-(\d{4})/);
    if (match) {
      numero = parseInt(match[1]) + 1;
    }
  }

  return `ITA-${annee}-${numero.toString().padStart(4, "0")}`;
}

async function main() {
  console.log("🌱 Création d'agents journaliers pour test M17...\n");

  // Récupérer la nationalité ivoirienne
  const nationaliteCi = await prisma.nationalite.findFirst({
    where: { libelle: "Ivoirienne" },
  });

  if (!nationaliteCi) {
    console.log("❌ Nationalité CI introuvable");
    return;
  }

  const agents = [
    {
      nom: "TRAORÉ",
      prenom: "Moussa",
      dateNaissance: new Date("1985-03-15"),
      lieuNaissance: "Bouaké",
      telephone: "+225 07 12 34 56 78",
    },
    {
      nom: "KONÉ",
      prenom: "Abdoulaye",
      dateNaissance: new Date("1990-07-22"),
      lieuNaissance: "Korhogo",
      telephone: "+225 07 23 45 67 89",
    },
    {
      nom: "COULIBALY",
      prenom: "Ibrahim",
      dateNaissance: new Date("1988-11-08"),
      lieuNaissance: "Man",
      telephone: "+225 07 34 56 78 90",
    },
    {
      nom: "DOSSO",
      prenom: "Bakary",
      dateNaissance: new Date("1992-05-30"),
      lieuNaissance: "Abidjan",
      telephone: "+225 07 45 67 89 01",
    },
    {
      nom: "SYLLA",
      prenom: "Mohamed",
      dateNaissance: new Date("1987-09-14"),
      lieuNaissance: "Daloa",
      telephone: "+225 07 56 78 90 12",
    },
  ];

  for (const agent of agents) {
    // Vérifier si l'agent existe déjà
    const existing = await prisma.employe.findFirst({
      where: {
        nom: agent.nom,
        prenom: agent.prenom,
      },
    });

    if (existing) {
      console.log(`  ⏭️  ${agent.prenom} ${agent.nom} existe déjà`);
      continue;
    }

    // Générer le matricule
    const matricule = await genererMatricule();

    // Créer l'agent
    const employe = await prisma.employe.create({
      data: {
        matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        dateNaissance: agent.dateNaissance,
        lieuNaissance: agent.lieuNaissance,
        telephone: agent.telephone,
        sexe: "MASCULIN",
        nationaliteId: nationaliteCi.id,
        typeMainOeuvre: "JOURNALIER",
      },
    });

    console.log(`  ✅ ${employe.prenom} ${employe.nom} — ${employe.matricule}`);
  }

  console.log("\n✅ Agents journaliers créés");
  console.log(
    "\n💡 Vous pouvez maintenant tester l'assignation de compétences sur /personnel/competences/agents"
  );
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
