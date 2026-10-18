/**
 * Script de diagnostic et correction : Association Profil ↔ Employé
 *
 * Vérifie que chaque profil utilisateur a un employé associé,
 * et propose de créer/lier un employé si nécessaire.
 */

import { prismaDirect } from "./lib/prisma-direct";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

async function main() {
  console.log("🔍 Diagnostic des profils sans employé associé...\n");

  // Lister tous les profils
  const profils = await prismaDirect.profil.findMany({
    include: {
      employe: true,
    },
    orderBy: { creeLe: "asc" },
  });

  console.log(`📊 Total profils : ${profils.length}\n`);

  const profilsSansEmploye = profils.filter((p) => !p.employe);

  if (profilsSansEmploye.length === 0) {
    console.log("✅ Tous les profils ont un employé associé.");
    return;
  }

  console.log(`⚠️  ${profilsSansEmploye.length} profil(s) sans employé :\n`);

  for (const profil of profilsSansEmploye) {
    console.log(`   ID : ${profil.id}`);
    console.log(`   Email : ${profil.email || "(non renseigné)"}`);
    console.log(`   Créé le : ${profil.creeLe.toLocaleDateString("fr-FR")}`);
    console.log("");
  }

  // Lister les employés sans profil
  const employes = await prismaDirect.employe.findMany({
    include: {
      profil: true,
    },
  });

  const employesSansProfil = employes.filter((e) => !e.profil);

  console.log(`\n📋 Employés sans profil : ${employesSansProfil.length}\n`);

  if (employesSansProfil.length > 0) {
    for (const employe of employesSansProfil) {
      console.log(`   ID : ${employe.id}`);
      console.log(`   Nom : ${employe.prenom} ${employe.nom}`);
      console.log(`   Matricule : ${employe.matricule}`);
      console.log("");
    }
  }

  // Interface interactive
  const rl = readline.createInterface({ input, output });

  console.log("\n💡 Options de correction :\n");
  console.log("1. Lier un profil existant à un employé existant");
  console.log("2. Créer un employé pour un profil");
  console.log("3. Annuler\n");

  const choix = await rl.question("Votre choix (1/2/3) : ");

  if (choix === "1" && employesSansProfil.length > 0) {
    console.log("\nProfils sans employé :");
    profilsSansEmploye.forEach((p, i) => {
      console.log(`${i + 1}. ${p.email || p.id} (ID: ${p.id})`);
    });

    const indexProfil = parseInt(await rl.question("\nNuméro du profil : ")) - 1;
    const profilChoisi = profilsSansEmploye[indexProfil];

    if (!profilChoisi) {
      console.log("❌ Profil invalide");
      rl.close();
      return;
    }

    console.log("\nEmployés sans profil :");
    employesSansProfil.forEach((e, i) => {
      console.log(`${i + 1}. ${e.prenom} ${e.nom} - ${e.matricule} (ID: ${e.id})`);
    });

    const indexEmploye = parseInt(await rl.question("\nNuméro de l'employé : ")) - 1;
    const employeChoisi = employesSansProfil[indexEmploye];

    if (!employeChoisi) {
      console.log("❌ Employé invalide");
      rl.close();
      return;
    }

    // Confirmation
    console.log(`\n📎 Lier :`);
    console.log(`   Profil : ${profilChoisi.email || profilChoisi.id}`);
    console.log(`   Employé : ${employeChoisi.prenom} ${employeChoisi.nom}`);

    const confirmer = await rl.question("\nConfirmer ? (o/n) : ");

    if (confirmer.toLowerCase() === "o") {
      await prismaDirect.profil.update({
        where: { id: profilChoisi.id },
        data: { employeId: employeChoisi.id },
      });

      console.log("\n✅ Profil lié à l'employé avec succès !");
    } else {
      console.log("\n❌ Opération annulée");
    }
  } else if (choix === "2") {
    console.log("\nProfils sans employé :");
    profilsSansEmploye.forEach((p, i) => {
      console.log(`${i + 1}. ${p.email || p.id} (ID: ${p.id})`);
    });

    const indexProfil = parseInt(await rl.question("\nNuméro du profil : ")) - 1;
    const profilChoisi = profilsSansEmploye[indexProfil];

    if (!profilChoisi) {
      console.log("❌ Profil invalide");
      rl.close();
      return;
    }

    console.log("\n📝 Informations de l'employé à créer :\n");

    const prenom = await rl.question("Prénom : ");
    const nom = await rl.question("Nom : ");
    const matricule = await rl.question("Matricule : ");

    // Vérifier unicité matricule
    const matriculeExiste = await prismaDirect.employe.findUnique({
      where: { matricule },
    });

    if (matriculeExiste) {
      console.log("\n❌ Ce matricule existe déjà");
      rl.close();
      return;
    }

    console.log(`\n📎 Créer employé :`);
    console.log(`   Prénom : ${prenom}`);
    console.log(`   Nom : ${nom}`);
    console.log(`   Matricule : ${matricule}`);
    console.log(`   Et le lier au profil : ${profilChoisi.email || profilChoisi.id}`);

    const confirmer = await rl.question("\nConfirmer ? (o/n) : ");

    if (confirmer.toLowerCase() === "o") {
      const employe = await prismaDirect.employe.create({
        data: {
          prenom,
          nom,
          matricule,
          typeMainOeuvre: "JOURNALIER",
          actif: true,
        },
      });

      await prismaDirect.profil.update({
        where: { id: profilChoisi.id },
        data: { employeId: employe.id },
      });

      console.log("\n✅ Employé créé et lié au profil avec succès !");
      console.log(`   ID employé : ${employe.id}`);
    } else {
      console.log("\n❌ Opération annulée");
    }
  } else {
    console.log("\n❌ Opération annulée");
  }

  rl.close();
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaDirect.$disconnect();
  });
