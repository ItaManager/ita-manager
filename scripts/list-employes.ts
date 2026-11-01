import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  const employes = await prisma.employe.findMany({
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      email: true,
      profil: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { creeLe: "desc" },
    take: 20,
  });

  console.log(`\n📋 ${employes.length} employés dans la base:\n`);

  for (const emp of employes) {
    const statut = emp.profil ? "✅ A un compte" : "❌ Sans compte";
    console.log(`${emp.matricule.padEnd(15)} ${emp.prenom} ${emp.nom.padEnd(15)} ${emp.email?.padEnd(30)} ${statut}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
