/**
 * M16 L2 — Test calcul consommation carburant
 *
 * RÈGLE CRITIQUE (cf. lib/actions/carburant.ts lignes 170-298) :
 *
 * Les litres retenus sont ceux du PREMIER plein complet + partiels intermédiaires.
 * PAS ceux du second plein complet (il n'a pas encore été consommé).
 *
 * Exemple donné dans le dossier :
 *
 *   12 juin  45 200 km  60 L  plein complet   ← 60 L retenus
 *   18 juin  45 450 km  30 L  partiel         ← 30 L retenus
 *   28 juin  45 890 km  55 L  plein complet   ← 55 L NON retenus
 *
 *   690 km avec 90 L → 13,0 L/100 km
 */

import { PrismaClient } from "@prisma/client";
import { calculerConsommation } from "../lib/actions/carburant";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Test calcul consommation carburant — Règle critique\n");

  try {
    // 1. Créer un matériel de test (véhicule)
    const materiel = await prisma.materiel.create({
      data: {
        codeIta: "VL-TEST-001",
        designation: "Véhicule test consommation",
        type: "VEHICULE_LEGER",
        familleMaterielId: (
          await prisma.familleMateriel.findFirst({
            where: { code: "VL" },
          })
        )!.id,
      },
    });

    console.log(`✓ Matériel créé: ${materiel.codeIta}\n`);

    // 2. Créer les 3 distributions selon l'exemple exact
    const demandeur = await prisma.employe.findFirst({
      where: { typeEmploye: "PERMANENT" },
    });

    if (!demandeur) {
      throw new Error("Aucun employé trouvé pour le test");
    }

    const station = await prisma.stationService.findFirst();
    if (!station) {
      throw new Error("Aucune station-service trouvée");
    }

    // Distribution 1 : 12 juin, 45 200 km, 60 L, PLEIN COMPLET
    const dist1 = await prisma.distributionCarburant.create({
      data: {
        reference: "TEST-2026-0001",
        demandeurId: demandeur.id,
        materielId: materiel.id,
        typeCarburant: "GASOIL",
        quantite: 60.0,
        compteur: 45200,
        uniteCompteur: "KILOMETRE",
        pleinComplet: true,
        compteurAnomalie: false,
        nature: "STATION",
        stationId: station.id,
        serviParId: demandeur.id,
        dateDistribution: new Date("2026-06-12"),
      },
    });

    console.log("✓ Distribution 1 créée:");
    console.log(`  12 juin  45 200 km  60 L  plein complet   ← 60 L retenus`);

    // Distribution 2 : 18 juin, 45 450 km, 30 L, PARTIEL
    const dist2 = await prisma.distributionCarburant.create({
      data: {
        reference: "TEST-2026-0002",
        demandeurId: demandeur.id,
        materielId: materiel.id,
        typeCarburant: "GASOIL",
        quantite: 30.0,
        compteur: 45450,
        uniteCompteur: "KILOMETRE",
        pleinComplet: false, // ← PARTIEL
        compteurAnomalie: false,
        nature: "STATION",
        stationId: station.id,
        serviParId: demandeur.id,
        dateDistribution: new Date("2026-06-18"),
      },
    });

    console.log("✓ Distribution 2 créée:");
    console.log(`  18 juin  45 450 km  30 L  partiel         ← 30 L retenus`);

    // Distribution 3 : 28 juin, 45 890 km, 55 L, PLEIN COMPLET
    const dist3 = await prisma.distributionCarburant.create({
      data: {
        reference: "TEST-2026-0003",
        demandeurId: demandeur.id,
        materielId: materiel.id,
        typeCarburant: "GASOIL",
        quantite: 55.0,
        compteur: 45890,
        uniteCompteur: "KILOMETRE",
        pleinComplet: true,
        compteurAnomalie: false,
        nature: "STATION",
        stationId: station.id,
        serviParId: demandeur.id,
        dateDistribution: new Date("2026-06-28"),
      },
    });

    console.log("✓ Distribution 3 créée:");
    console.log(`  28 juin  45 890 km  55 L  plein complet   ← 55 L NON retenus\n`);

    // 3. Calculer la consommation
    console.log("📊 Calcul de la consommation...\n");

    const resultat = await calculerConsommation(materiel.id);

    // 4. Vérifications
    console.log("🔍 Vérification du résultat:");
    console.log(`   Type: ${resultat.type}`);

    if (resultat.type === "CALCULE") {
      console.log(`   Dernier calcul: ${resultat.dernierCalcul.toFixed(1)} ${resultat.unite}`);
      console.log(`   Moyenne: ${resultat.moyenneConsommation.toFixed(1)} ${resultat.unite}`);
      console.log(`   Écart: ${resultat.ecartPourcent.toFixed(1)}%`);
      console.log(`   Nb intervalles: ${resultat.nbIntervalles}`);

      // Vérification attendue
      const DISTANCE_ATTENDUE = 45890 - 45200; // 690 km
      const LITRES_ATTENDUS = 60 + 30; // 90 L (PREMIER plein + partiel)
      const CONSO_ATTENDUE = (LITRES_ATTENDUS / DISTANCE_ATTENDUE) * 100; // 13.0 L/100km

      console.log(`\n✅ ATTENDU:`);
      console.log(`   Distance: ${DISTANCE_ATTENDUE} km`);
      console.log(`   Litres: ${LITRES_ATTENDUS} L (60 + 30, PAS +55)`);
      console.log(`   Consommation: ${CONSO_ATTENDUE.toFixed(1)} L/100km`);

      // Détail de l'intervalle calculé
      if (resultat.intervalles && resultat.intervalles.length > 0) {
        const intervalle = resultat.intervalles[0];
        console.log(`\n📐 CALCUL RÉEL:`);
        console.log(`   Distance parcourue: ${intervalle.distance} km`);
        console.log(`   Litres retenus: ${intervalle.litres} L`);
        console.log(`   Consommation: ${intervalle.consommation.toFixed(1)} L/100km`);

        // Assertion
        if (Math.abs(intervalle.consommation - CONSO_ATTENDUE) < 0.01) {
          console.log(`\n✅ TEST RÉUSSI — Calcul conforme à la règle critique`);
        } else {
          console.log(`\n❌ TEST ÉCHOUÉ — Consommation incorrecte`);
          console.log(`   Attendu: ${CONSO_ATTENDUE.toFixed(1)}`);
          console.log(`   Obtenu: ${intervalle.consommation.toFixed(1)}`);
          process.exit(1);
        }
      }
    } else {
      console.log(`\n❌ TEST ÉCHOUÉ — Type "${resultat.type}" au lieu de "CALCULE"`);
      console.log(`   Message: ${resultat.message}`);
      process.exit(1);
    }

    // Nettoyage
    await prisma.distributionCarburant.deleteMany({
      where: { materielId: materiel.id },
    });
    await prisma.materiel.delete({ where: { id: materiel.id } });

    console.log(`\n🧹 Nettoyage effectué`);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
