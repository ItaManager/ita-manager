/**
 * Vérification post-seed — contrôles demandés par l'utilisateur
 *
 * Vérifie :
 * 1. Liste des permissions en base
 * 2. Permissions de ADMIN, DRH, DT
 * 3. armelgnakpa7@gmail.com a toujours le rôle ADMIN
 * 4. Connexion fonctionne (lien auth.users ↔ profils)
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function verifierSeed() {
  console.log("=== VÉRIFICATION POST-SEED ===\n");

  // 1. Liste des permissions en base
  console.log("1. PERMISSIONS EN BASE");
  const permissions = await prisma.permission.findMany({
    orderBy: [{ domaine: "asc" }, { code: "asc" }],
    select: { code: true, libelle: true, domaine: true },
  });

  console.log(`  Total: ${permissions.length} permissions`);
  console.log("\n  Par domaine:");
  const parDomaine = permissions.reduce(
    (acc, p) => {
      acc[p.domaine] = (acc[p.domaine] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(parDomaine).forEach(([domaine, count]) => {
    console.log(`    ${domaine}: ${count}`);
  });

  // Vérifier qu'organisation:consulter et organisation:modifier n'existent pas
  const orgConsulter = permissions.find((p) => p.code === "organisation:consulter");
  const orgModifier = permissions.find((p) => p.code === "organisation:modifier");

  if (orgConsulter) {
    console.log("  ❌ ERREUR: organisation:consulter existe encore!");
  } else {
    console.log("  ✅ organisation:consulter supprimée");
  }

  if (orgModifier) {
    console.log("  ❌ ERREUR: organisation:modifier existe encore!");
  } else {
    console.log("  ✅ organisation:modifier n'existe pas");
  }

  // 2. Permissions de ADMIN, DRH, DT
  console.log("\n2. PERMISSIONS DES RÔLES CLÉS");

  const rolesAChercher = ["ADMIN", "DRH", "DT"];

  for (const codeRole of rolesAChercher) {
    const role = await prisma.role.findUnique({
      where: { code: codeRole },
      include: {
        permissions: {
          include: { permission: true },
          orderBy: { permission: { code: "asc" } },
        },
      },
    });

    if (!role) {
      console.log(`  ❌ Rôle ${codeRole} introuvable`);
      continue;
    }

    console.log(`\n  Rôle ${codeRole} (${role.libelle})`);
    console.log(`    ${role.permissions.length} permissions`);

    // Vérifier referentiel:creer pour DRH et DT
    if (codeRole === "DRH" || codeRole === "DT") {
      const aReferentielCreer = role.permissions.some(
        (rp) => rp.permission.code === "referentiel:creer"
      );
      if (aReferentielCreer) {
        console.log(`    ✅ A la permission referentiel:creer`);
      } else {
        console.log(`    ❌ N'a PAS la permission referentiel:creer`);
      }
    }

    // Afficher toutes les permissions pour référence
    const permsByDomain = role.permissions.reduce(
      (acc, rp) => {
        const domaine = rp.permission.domaine;
        if (!acc[domaine]) acc[domaine] = [];
        acc[domaine].push(rp.permission.code);
        return acc;
      },
      {} as Record<string, string[]>
    );

    Object.entries(permsByDomain).forEach(([domaine, codes]) => {
      console.log(`    ${domaine}:`);
      codes.forEach((code) => console.log(`      - ${code}`));
    });
  }

  // 3. Vérifier armelgnakpa7@gmail.com
  console.log("\n3. COMPTE SUPER ADMIN");

  const superAdmin = await prisma.profil.findUnique({
    where: { email: "armelgnakpa7@gmail.com" },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!superAdmin) {
    console.log("  ❌ Profil armelgnakpa7@gmail.com introuvable!");
  } else {
    console.log(`  ✅ Profil trouvé (ID: ${superAdmin.id})`);
    console.log(`  Email: ${superAdmin.email}`);
    console.log(`  Actif: ${superAdmin.actif}`);
    console.log(`  Rôles: ${superAdmin.roles.map((pr) => pr.role.code).join(", ")}`);

    const aRoleAdmin = superAdmin.roles.some((pr) => pr.role.code === "ADMIN");
    if (aRoleAdmin) {
      console.log("  ✅ A le rôle ADMIN");
    } else {
      console.log("  ❌ N'a PAS le rôle ADMIN!");
    }
  }

  // 4. Vérifier lien auth.users ↔ profils
  console.log("\n4. INTÉGRITÉ auth.users ↔ profils");

  // Compter les profils
  const countProfils = await prisma.profil.count();
  console.log(`  Profils en base: ${countProfils}`);

  // Vérifier que le profil Super Admin a un ID valide (UUID Supabase)
  if (superAdmin) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(superAdmin.id)) {
      console.log(`  ✅ ID profil est un UUID valide: ${superAdmin.id}`);
      console.log(
        "  ℹ️  Connexion devrait fonctionner si auth.users contient cet UUID"
      );
    } else {
      console.log(`  ❌ ID profil n'est pas un UUID: ${superAdmin.id}`);
    }
  }

  console.log("\n=== FIN VÉRIFICATION ===");
}

verifierSeed()
  .catch((e) => {
    console.error("Erreur:", e);
    process.exit(1);
  });
