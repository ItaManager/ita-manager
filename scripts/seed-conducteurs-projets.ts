/**
 * Script de seed : Ajouter des conducteurs aux projets existants
 *
 * Utilisation :
 *   npx dotenv -e .env.dev -- npx tsx scripts/seed-conducteurs-projets.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Début du seed des conducteurs de projets...\n");

  // 1. Récupérer tous les projets
  const projets = await prisma.projet.findMany({
    select: {
      id: true,
      code: true,
      nom: true,
      affectations: {
        where: {
          roleFonctionnel: "CONDUCTEUR",
          dateFin: null,
        },
      },
    },
  });

  console.log(`📊 ${projets.length} projet(s) trouvé(s)`);

  // 2. Récupérer des employés potentiels pour être conducteurs
  // (Idéalement des cadres ou conducteurs de travaux)
  const employes = await prisma.employe.findMany({
    where: {
      archiveLe: null,
      affectations: {
        some: {
          dateFin: null,
          poste: {
            OR: [
              { libelle: { contains: "Conducteur", mode: "insensitive" } },
              { libelle: { contains: "Chef", mode: "insensitive" } },
              { libelle: { contains: "Responsable", mode: "insensitive" } },
            ],
          },
        },
      },
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      affectations: {
        where: {
          dateFin: null,
        },
        select: {
          poste: {
            select: {
              libelle: true,
            },
          },
        },
      },
    },
    take: 10,
  });

  console.log(`👥 ${employes.length} employé(s) potentiel(s) trouvé(s)`);

  if (employes.length === 0) {
    console.log(
      "\n⚠️  Aucun employé trouvé. Utilisation de tous les employés actifs..."
    );
    const tousEmployes = await prisma.employe.findMany({
      where: { archiveLe: null },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
      },
      take: 10,
    });
    employes.push(...tousEmployes);
  }

  if (employes.length === 0) {
    console.log("\n❌ Aucun employé disponible. Abandon.");
    return;
  }

  // 3. Affecter des conducteurs aux projets qui n'en ont pas
  let affectationsCreees = 0;
  let projetsSansChangement = 0;

  for (let i = 0; i < projets.length; i++) {
    const projet = projets[i];

    // Vérifier si le projet a déjà un conducteur
    if (projet.affectations.length > 0) {
      console.log(
        `✓ ${projet.code} - Déjà un conducteur assigné, ignoré`
      );
      projetsSansChangement++;
      continue;
    }

    // Assigner un employé en rotation
    const employeIndex = i % employes.length;
    const employe = employes[employeIndex];

    // Créer l'affectation
    await prisma.affectationChantier.create({
      data: {
        projetId: projet.id,
        employeId: employe.id,
        roleFonctionnel: "CONDUCTEUR",
        dateDebut: new Date(),
        dateFin: null,
        creePar: "00000000-0000-0000-0000-000000000000", // UUID système
      },
    });

    console.log(
      `✅ ${projet.code} - Conducteur assigné : ${employe.prenom} ${employe.nom} (${employe.matricule})`
    );
    affectationsCreees++;
  }

  console.log("\n" + "=".repeat(60));
  console.log("📈 Résumé :");
  console.log(`   • Projets traités : ${projets.length}`);
  console.log(`   • Affectations créées : ${affectationsCreees}`);
  console.log(`   • Projets déjà assignés : ${projetsSansChangement}`);
  console.log("=".repeat(60));

  console.log("\n✅ Seed des conducteurs terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("\n❌ Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
