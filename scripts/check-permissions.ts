#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.permission.findMany({
    where: {
      OR: [
        { code: { contains: "organisation" } },
        { code: { contains: "referentiel" } },
        { code: { contains: "direction" } },
      ]
    },
    select: { code: true, libelle: true, domaine: true },
    orderBy: { code: "asc" },
  });

  console.log("📋 Permissions M1 trouvées en base:\n");
  perms.forEach((p) => console.log(`  ${p.code} — ${p.libelle} [${p.domaine}]`));
  console.log(`\n✅ ${perms.length} permissions trouvées`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
