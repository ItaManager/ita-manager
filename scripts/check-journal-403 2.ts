/**
 * Vérifier les événements ACCES_REFUSE dans le journal
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const accesRefuses = await prisma.journalEvenement.findMany({
    where: { action: "ACCES_REFUSE" },
    orderBy: { survenuLe: "desc" },
    take: 5,
    select: {
      survenuLe: true,
      auteurNom: true,
      entite: true,
      entiteId: true,
      action: true,
      commentaire: true,
      details: true,
    },
  });

  console.log("\n📋 Événements ACCES_REFUSE (5 derniers) :\n");

  if (accesRefuses.length === 0) {
    console.log("   Aucun événement trouvé.");
  } else {
    accesRefuses.forEach((evt, i) => {
      console.log(`${i + 1}. ${evt.survenuLe.toISOString()}`);
      console.log(`   Auteur : ${evt.auteurNom}`);
      console.log(`   Route : ${evt.entiteId}`);
      console.log(`   Commentaire : ${evt.commentaire}`);
      if (evt.details) {
        console.log(`   Détails :`, evt.details);
      }
      console.log("");
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
