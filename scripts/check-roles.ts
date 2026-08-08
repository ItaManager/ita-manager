import { prismaDirect as prisma } from "./lib/prisma-direct";

async function main() {
  const profil = await prisma.profil.findUnique({
    where: { email: "armelgnakpa7@gmail.com" },
    include: { roles: { include: { role: true } } },
  });

  console.log("📧 Email:", profil?.email);
  console.log("🎭 Rôles:", profil?.roles.map((r) => r.role.code).join(", "));

  console.log("\n📝 Permissions M17:");
  const roles = profil?.roles.map((r) => r.role.code) || [];

  if (roles.includes("ADMIN") || roles.includes("DT")) {
    console.log("  ✅ competence:gerer (créer compétences)");
  } else {
    console.log("  ❌ competence:gerer - Besoin du rôle DT");
  }

  if (roles.includes("ADMIN") || roles.includes("DFC")) {
    console.log("  ✅ taux:definir (fixer taux)");
  } else {
    console.log("  ❌ taux:definir - Besoin du rôle DFC");
  }

  if (
    roles.includes("ADMIN") ||
    roles.includes("DRH") ||
    roles.includes("RH")
  ) {
    console.log("  ✅ competence:assigner (assigner aux agents)");
  } else {
    console.log("  ❌ competence:assigner - Besoin du rôle RH");
  }

  console.log("\n💡 Pour tester M17 complet, vous avez besoin de DT + DFC + RH");
  console.log("   ou simplement du rôle ADMIN qui a toutes les permissions.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
