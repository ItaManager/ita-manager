/**
 * Script de debug pour investiguer le bug Prisma "Unique constraint failed"
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";
import { randomUUID } from "crypto";

async function testSimpleCreate() {
  console.log("\n🧪 Test 1 : Création simple SANS transaction\n");

  const testId = randomUUID();
  const testEmail = `test-${Date.now()}@example.com`;

  console.log("ID généré :", testId);
  console.log("Email :", testEmail);

  try {
    const profil = await prisma.profil.create({
      data: {
        id: testId,
        email: testEmail,
        actif: true,
      },
    });

    console.log("✅ Profil créé sans transaction");

    // Nettoyage
    await prisma.profil.delete({ where: { id: testId } });
    console.log("✅ Profil supprimé\n");
  } catch (error: any) {
    console.log("❌ Erreur :", error.message);

    // Vérifier si le profil existe malgré l'erreur
    const profil = await prisma.profil.findUnique({ where: { id: testId } });
    console.log("Profil existe malgré erreur ?", profil ? "OUI" : "NON");

    if (profil) {
      await prisma.profil.delete({ where: { id: testId } });
      console.log("✅ Profil nettoyé\n");
    }
  }
}

async function testTransactionCreate() {
  console.log("🧪 Test 2 : Création AVEC transaction\n");

  const testId = randomUUID();
  const testEmail = `test-${Date.now()}@example.com`;

  console.log("ID généré :", testId);
  console.log("Email :", testEmail);

  try {
    await prisma.$transaction(async (tx) => {
      console.log("  → Dans la transaction, création du profil...");

      const profil = await tx.profil.create({
        data: {
          id: testId,
          email: testEmail,
          actif: true,
        },
      });

      console.log("  → Profil créé dans transaction");

      // Simuler d'autres opérations
      console.log("  → Simulation autres opérations...");
    });

    console.log("✅ Transaction réussie");

    // Vérifier que le profil existe
    const profil = await prisma.profil.findUnique({ where: { id: testId } });
    console.log("Profil existe après transaction ?", profil ? "OUI" : "NON");

    if (profil) {
      await prisma.profil.delete({ where: { id: testId } });
      console.log("✅ Profil supprimé\n");
    }
  } catch (error: any) {
    console.log("❌ Erreur transaction :", error.message);
    console.log("Code erreur :", error.code);

    // Vérifier si le profil existe malgré l'erreur
    const profil = await prisma.profil.findUnique({ where: { id: testId } });
    console.log("Profil existe malgré erreur ?", profil ? "OUI" : "NON");

    if (profil) {
      console.log("Email du profil créé :", profil.email);
      await prisma.profil.delete({ where: { id: testId } });
      console.log("✅ Profil nettoyé\n");
    }
  }
}

async function testMultipleOperationsTransaction() {
  console.log("🧪 Test 3 : Transaction avec PLUSIEURS opérations\n");

  const testId = randomUUID();
  const testEmail = `test-${Date.now()}@example.com`;

  console.log("ID généré :", testId);
  console.log("Email :", testEmail);

  // Récupérer un rôle existant
  const role = await prisma.role.findFirst();
  if (!role) {
    console.log("❌ Aucun rôle trouvé, impossible de tester");
    return;
  }

  console.log("Rôle utilisé :", role.code);

  try {
    await prisma.$transaction(async (tx) => {
      console.log("  → 1/2 Création profil...");
      await tx.profil.create({
        data: {
          id: testId,
          email: testEmail,
          actif: true,
        },
      });

      console.log("  → 2/2 Assignation rôle...");
      await tx.profilRole.create({
        data: {
          profilId: testId,
          roleId: role.id,
        },
      });

      console.log("  → Transaction terminée");
    });

    console.log("✅ Transaction réussie");

    // Vérifier
    const profil = await prisma.profil.findUnique({
      where: { id: testId },
      include: { roles: true },
    });

    console.log("Profil existe ?", profil ? "OUI" : "NON");
    console.log("Nombre de rôles :", profil?.roles.length || 0);

    // Nettoyage
    if (profil) {
      await prisma.profilRole.deleteMany({ where: { profilId: testId } });
      await prisma.profil.delete({ where: { id: testId } });
      console.log("✅ Nettoyé\n");
    }
  } catch (error: any) {
    console.log("❌ Erreur :", error.message);
    console.log("Code :", error.code);
    console.log("Meta :", error.meta);

    // Vérifier état
    const profil = await prisma.profil.findUnique({
      where: { id: testId },
      include: { roles: true },
    });

    console.log("Profil existe malgré erreur ?", profil ? "OUI" : "NON");
    if (profil) {
      console.log("Rôles assignés :", profil.roles.length);

      // Nettoyage
      await prisma.profilRole.deleteMany({ where: { profilId: testId } });
      await prisma.profil.delete({ where: { id: testId } });
      console.log("✅ Nettoyé\n");
    }
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  DEBUG PRISMA TRANSACTION BUG");
  console.log("═══════════════════════════════════════════════════");

  await testSimpleCreate();
  await testTransactionCreate();
  await testMultipleOperationsTransaction();

  console.log("═══════════════════════════════════════════════════");
  console.log("  FIN DES TESTS");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("💥 Erreur fatale :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
