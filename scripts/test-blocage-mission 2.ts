/**
 * Test de la fonction peutCreerMission — M19 Étape 1.3
 *
 * Ce test DOIT être vu échouer avant de passer (Règle 7).
 */

import { PrismaClient } from "@prisma/client";
import { peutCreerMission } from "../lib/actions/missions";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log("\n=== Test de blocage création mission ===\n");

  // Trouver un employé existant
  const employe = await prisma.employe.findFirst({
    where: { archiveLe: null },
    select: { id: true, prenom: true, nom: true },
  });

  if (!employe) {
    console.error("❌ Aucun employé trouvé en base");
    process.exit(1);
  }

  // Nettoyer d'abord toutes les missions de test précédentes
  await prisma.mission.deleteMany({
    where: {
      reference: { startsWith: "MIS-TEST-" },
    },
  });

  console.log(`Employé test : ${employe.prenom} ${employe.nom}\n`);

  // Créer une mission de retour passé SANS rapport
  const dateRetour = new Date();
  dateRetour.setDate(dateRetour.getDate() - 5); // Il y a 5 jours
  const dateDepart = new Date(dateRetour);
  dateDepart.setDate(dateDepart.getDate() - 3); // 3 jours avant le retour

  const mission = await prisma.mission.create({
    data: {
      reference: `MIS-TEST-${Date.now()}`,
      demandeurId: employe.id,
      objet: "Test blocage mission",
      destination: "Abidjan",
      moyenTransport: "VEHICULE_ITA",
      dateDepart: dateDepart,
      dateRetour: dateRetour,
      fraisEstimes: 0,
      soumiseLe: new Date(),
      viseeN1Le: new Date(),
      valideeRhLe: new Date(),
      // PAS de rapportDeposeLe → mission bloquante
    },
  });

  console.log(`Mission créée : ${mission.reference}`);
  console.log(`  Date retour : ${mission.dateRetour.toISOString().split("T")[0]}`);
  console.log(`  Rapport déposé : ${mission.rapportDeposeLe ? "OUI" : "NON"}\n`);

  // TEST 1 : Doit bloquer (mission passée sans rapport)
  const test1 = await peutCreerMission(employe.id);
  console.log(`Test 1 — Mission passée sans rapport :`);
  console.log(`  Attendu : false (BLOQUE)`);
  console.log(`  Obtenu  : ${test1}`);

  if (test1 !== false) {
    console.error(`  ❌ ÉCHEC — devrait bloquer`);
    await prisma.mission.delete({ where: { id: mission.id } });
    process.exit(1);
  }
  console.log(`  ✓ OK\n`);

  // TEST 2 : Ne doit PAS bloquer si mission clôturée
  await prisma.mission.update({
    where: { id: mission.id },
    data: {
      clotureeLe: new Date(),
    },
  });

  const test2 = await peutCreerMission(employe.id);
  console.log(`Test 2 — Mission passée sans rapport MAIS clôturée :`);
  console.log(`  Attendu : true (ne bloque pas)`);
  console.log(`  Obtenu  : ${test2}`);

  if (test2 !== true) {
    console.error(`  ❌ ÉCHEC — ne devrait pas bloquer`);
    await prisma.mission.delete({ where: { id: mission.id } });
    process.exit(1);
  }
  console.log(`  ✓ OK\n`);

  // Nettoyage de la mission clôturée
  await prisma.mission.delete({ where: { id: mission.id } });

  // TEST 3 : Ne doit PAS bloquer si mission refusée
  const missionRefusee = await prisma.mission.create({
    data: {
      reference: `MIS-TEST-REFUS-${Date.now()}`,
      demandeurId: employe.id,
      objet: "Test mission refusée",
      destination: "Bouaké",
      moyenTransport: "VEHICULE_ITA",
      dateDepart: dateDepart,
      dateRetour: dateRetour,
      fraisEstimes: 0,
      soumiseLe: new Date(),
      refuseeLe: new Date(),
      motifRefus: "Budget insuffisant",
      etapeRefus: "N1",
    },
  });

  const test3 = await peutCreerMission(employe.id);
  console.log(`Test 3 — Mission passée sans rapport MAIS refusée :`);
  console.log(`  Attendu : true (ne bloque pas)`);
  console.log(`  Obtenu  : ${test3}`);

  if (test3 !== true) {
    console.error(`  ❌ ÉCHEC — ne devrait pas bloquer`);
    await prisma.mission.delete({ where: { id: missionRefusee.id } });
    process.exit(1);
  }
  console.log(`  ✓ OK\n`);

  // Nettoyage
  await prisma.mission.delete({ where: { id: missionRefusee.id } });

  console.log("✅ Tous les tests passent (3/3)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
