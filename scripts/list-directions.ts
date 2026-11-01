import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  const directions = await prisma.direction.findMany({
    orderBy: { code: "asc" },
  });

  console.log(`\n📋 ${directions.length} directions dans la base:\n`);

  for (const dir of directions) {
    console.log(`${dir.code.padEnd(10)} ${dir.libelle}`);
  }

  const services = await prisma.service.findMany({
    include: {
      direction: true,
    },
    orderBy: { code: "asc" },
  });

  console.log(`\n📋 ${services.length} services dans la base:\n`);

  for (const svc of services) {
    console.log(`${svc.code.padEnd(10)} ${svc.libelle.padEnd(40)} Direction: ${svc.direction.code}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
