#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const perms = await prisma.permission.findMany({
  select: { code: true },
  orderBy: { code: "asc" },
});

console.log("📋 Permissions en base :");
perms.forEach((p) => console.log(`  ${p.code}`));
console.log(`\n✅ ${perms.length} permissions trouvées`);

await prisma.$disconnect();
