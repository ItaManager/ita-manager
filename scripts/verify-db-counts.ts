#!/usr/bin/env tsx
import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  const [
    countDirections,
    countServices,
    countPostes,
    countPostesSansService,
  ] = await Promise.all([
    prisma.direction.count(),
    prisma.service.count(),
    prisma.poste.count(),
    prisma.poste.count({ where: { serviceId: null } }),
  ]);

  console.log("📊 Comptages en base (vérification brute)\n");
  console.log(`directions           : ${countDirections} (attendu: 4)`);
  console.log(`services             : ${countServices} (attendu: 8)`);
  console.log(`postes               : ${countPostes} (attendu: 30)`);
  console.log(`postes sans service  : ${countPostesSansService} (attendu: 14)`);

  const conforme =
    countDirections === 4 &&
    countServices === 8 &&
    countPostes === 30 &&
    countPostesSansService === 14;

  console.log(
    conforme
      ? "\n✅ CONFORME — les comptages sont exacts"
      : "\n❌ NON CONFORME — écart détecté"
  );
}

main().catch(console.error);
