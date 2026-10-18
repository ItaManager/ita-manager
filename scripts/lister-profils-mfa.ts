#!/usr/bin/env npx tsx
/**
 * Script : Liste tous les profils avec leur statut MFA
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  const profils = await prisma.profil.findMany({
    where: { actif: true },
    select: {
      id: true,
      email: true,
      employe: {
        select: {
          nom: true,
          prenom: true,
        },
      },
    },
    orderBy: { creeLe: "desc" },
  });

  console.log("\n📋 Profils actifs :\n");

  for (const profil of profils) {
    const nomComplet = profil.employe
      ? `${profil.employe.prenom} ${profil.employe.nom}`
      : "Super Admin";

    console.log(`• ${profil.email}`);
    console.log(`  ${nomComplet}`);
    console.log("");
  }

  console.log(`Total : ${profils.length} profil(s)\n`);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
