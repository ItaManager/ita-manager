/**
 * Test simplifié de la logique de verifierAccesPage
 *
 * Teste directement la vérification de permissions sans passer par HTTP
 */

import { PrismaClient } from "@prisma/client";
import { NAV_PERMISSIONS } from "../lib/auth/nav-permissions";

const prisma = new PrismaClient();

console.log("🔐 Test de la logique de vérification d'accès\n");

async function testPageAccessLogic() {
  try {
    // 1. Récupérer le compte CC
    console.log("1️⃣  Récupération du compte CC");

    const testEmail = "test-cc@ita-sarl.local";
    const profil = await prisma.profil.findFirst({
      where: { email: testEmail },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profil) {
      console.log(`   ❌ Compte ${testEmail} introuvable`);
      return;
    }

    console.log(`   ✅ Compte trouvé : ${profil.email} (${profil.id})`);

    // 2. Extraire les permissions
    console.log("\n2️⃣  Permissions du compte CC");

    const userPermissions = profil.roles.flatMap(pr =>
      pr.role.permissions.map(rp => rp.permission.code)
    );

    console.log(`   📋 ${userPermissions.length} permission(s) :`);
    userPermissions.forEach(p => console.log(`      - ${p}`));

    // 3. Tester accès à /paie
    console.log("\n3️⃣  Test d'accès à /paie");

    const pathname = "/paie";
    const requiredPermissions = NAV_PERMISSIONS[pathname];

    console.log(`   📋 Permissions requises pour ${pathname} :`);
    requiredPermissions.forEach(p => console.log(`      - ${p}`));

    const hasPermission = requiredPermissions.some(perm =>
      userPermissions.includes(perm)
    );

    console.log(`\n   ${hasPermission ? "✅" : "❌"} Accès autorisé : ${hasPermission ? "OUI" : "NON"}`);

    if (!hasPermission) {
      console.log("   ✅ Accès refusé comme attendu (CC ne peut pas accéder à /paie)");

      // 4. Simuler le log d'audit
      console.log("\n4️⃣  Simulation du log d'audit");

      const auditEntry = await prisma.journalEvenement.create({
        data: {
          entite: "Page",
          entiteId: pathname,
          action: "ACCES_REFUSE",
          auteurId: profil.id,
          auteurNom: profil.email,
          details: {
            route: pathname,
            permissionsRequises: requiredPermissions,
            permissionsUtilisateur: userPermissions,
          },
          commentaire: "Test automatisé de protection de page",
        },
      });

      console.log(`   ✅ Événement créé : ${auditEntry.id}`);
      console.log(`   📅 Date : ${auditEntry.survenuLe.toISOString()}`);
      console.log(`   📝 Détails : ${JSON.stringify(auditEntry.details, null, 2)}`);
    } else {
      console.log("   ❌ ERREUR : CC devrait être refusé pour /paie");
    }

    // 5. Tester accès à une page autorisée
    console.log("\n5️⃣  Test d'accès à /releves (autorisé)");

    const allowedPath = "/releves";
    const allowedPermissions = NAV_PERMISSIONS[allowedPath];

    console.log(`   📋 Permissions requises pour ${allowedPath} :`);
    allowedPermissions.forEach(p => console.log(`      - ${p}`));

    const hasAllowedPermission = allowedPermissions.some(perm =>
      userPermissions.includes(perm)
    );

    console.log(`\n   ${hasAllowedPermission ? "✅" : "❌"} Accès autorisé : ${hasAllowedPermission ? "OUI" : "NON"}`);

    if (hasAllowedPermission) {
      console.log("   ✅ Accès autorisé comme attendu (CC a la permission releve:saisir)");
    } else {
      console.log("   ❌ ERREUR : CC devrait avoir accès à /releves");
    }

    // 6. Vérifier les événements dans le journal
    console.log("\n6️⃣  Vérification du journal d'audit");

    const refusEvents = await prisma.journalEvenement.findMany({
      where: {
        auteurId: profil.id,
        action: "ACCES_REFUSE",
        entite: "Page",
      },
      orderBy: {
        survenuLe: "desc",
      },
      take: 3,
    });

    console.log(`   📋 ${refusEvents.length} événement(s) ACCES_REFUSE dans le journal :`);
    refusEvents.forEach((event, i) => {
      console.log(`\n   Événement ${i + 1} :`);
      console.log(`      - ID : ${event.id}`);
      console.log(`      - Date : ${event.survenuLe.toISOString()}`);
      console.log(`      - Page : ${event.entiteId}`);
      console.log(`      - Commentaire : ${event.commentaire || "Aucun"}`);
    });

    console.log("\n✅ Test terminé avec succès");

  } catch (error) {
    console.error("\n❌ Erreur durant le test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPageAccessLogic();
