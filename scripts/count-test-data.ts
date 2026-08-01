#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const employes = await prisma.employe.count();
  const absences = await prisma.absence.count();
  const typeAbsence = await prisma.typeAbsence.count();

  console.log("employés :", employes);
  console.log("absences :", absences);
  console.log("types d'absence :", typeAbsence);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
