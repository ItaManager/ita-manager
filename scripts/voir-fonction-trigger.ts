/**
 * Affiche le code de la fonction handle_new_user
 */

import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  console.log("\n📜 Code de la fonction handle_new_user\n");

  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT pg_get_functiondef('handle_new_user'::regproc) as definition
  `);

  if (result.length > 0) {
    console.log(result[0].definition);
    console.log("");
  } else {
    console.log("❌ Fonction introuvable\n");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
