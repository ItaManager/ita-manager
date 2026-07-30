/**
 * Vérification du filtrage de navigation pour les comptes de test
 *
 * Liste les entrées de menu visibles pour CC, DT, RH
 */

import { PrismaClient } from "@prisma/client";
import { NAV_PERMISSIONS, hasAccessToRoute } from "../lib/auth/nav-permissions";

const prisma = new PrismaClient();

// Navigation structure (copie de barre-laterale-client.tsx)
const navigation = [
  {
    title: "PILOTAGE",
    items: [
      { name: "Tableau de bord", href: "/" },
      { name: "Notifications", href: "/notifications" },
      { name: "Calendrier RH", href: "/calendrier" },
    ],
  },
  {
    title: "PERSONNEL",
    items: [
      { name: "Employés", href: "/employes" },
      { name: "Organigramme", href: "/organisation/organigramme" },
      { name: "Services & Équipes", href: "/organisation/services" },
      { name: "Contrats", href: "/contrats" },
    ],
  },
  {
    title: "TEMPS & ABSENCES",
    items: [
      { name: "Congés", href: "/conges" },
      { name: "Planning", href: "/planning" },
      { name: "Relevés d'activité", href: "/releves" },
      { name: "Présences bureau", href: "/presences" },
    ],
  },
  {
    title: "TECHNIQUE",
    items: [
      { name: "Projets", href: "/projets" },
      { name: "Appels d'offres", href: "/appels-offres" },
      { name: "Ressources", href: "/ressources" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Documents", href: "/documents" },
      { name: "Paie", href: "/paie" },
      { name: "Annonces", href: "/annonces" },
      { name: "Rapports", href: "/rapports" },
    ],
  },
];

const bottomNav = [
  { name: "Utilisateurs", href: "/admin/utilisateurs" },
  { name: "Journal d'audit", href: "/audit" },
  { name: "Paramètres", href: "/parametres" },
  { name: "Aide", href: "/aide" },
];

console.log("🔍 Vérification du filtrage de navigation\n");

async function verifyMenuFiltering() {
  try {
    const testAccounts = [
      { email: "test-cc@ita-sarl.local", role: "CC" },
      { email: "test-dt@ita-sarl.local", role: "DT" },
      { email: "test-rh@ita-sarl.local", role: "RH" },
    ];

    for (const account of testAccounts) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📋 Compte : ${account.email} (Rôle ${account.role})`);
      console.log(`${"=".repeat(60)}\n`);

      // Récupérer le profil et ses permissions
      const profil = await prisma.profil.findFirst({
        where: { email: account.email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!profil) {
        console.log(`❌ Compte introuvable\n`);
        continue;
      }

      const userPermissions = profil.roles.flatMap(pr =>
        pr.role.permissions.map(rp => rp.permission.code)
      );

      console.log(`Permissions (${userPermissions.length}) :`);
      userPermissions.forEach(p => console.log(`  - ${p}`));

      console.log(`\nEntrées de menu visibles :\n`);

      // Navigation principale
      let totalVisible = 0;
      for (const section of navigation) {
        const visibleItems = section.items.filter(item =>
          hasAccessToRoute(item.href, userPermissions)
        );

        if (visibleItems.length > 0) {
          console.log(`${section.title} :`);
          visibleItems.forEach(item => {
            console.log(`  ✅ ${item.name} (${item.href})`);
            totalVisible++;
          });
          console.log();
        }
      }

      // Navigation bottom
      const visibleBottomItems = bottomNav.filter(item =>
        hasAccessToRoute(item.href, userPermissions)
      );

      if (visibleBottomItems.length > 0) {
        console.log("NAVIGATION BAS :");
        visibleBottomItems.forEach(item => {
          console.log(`  ✅ ${item.name} (${item.href})`);
          totalVisible++;
        });
        console.log();
      }

      console.log(`Total : ${totalVisible} entrée(s) visible(s)`);

      // Entrées cachées importantes
      console.log(`\nEntrées cachées (exemples) :`);
      const hiddenExamples = [
        { name: "Paie", href: "/paie" },
        { name: "Utilisateurs", href: "/admin/utilisateurs" },
      ];

      hiddenExamples.forEach(item => {
        const hasAccess = hasAccessToRoute(item.href, userPermissions);
        if (!hasAccess) {
          console.log(`  ❌ ${item.name} (${item.href})`);
        }
      });
    }

    console.log(`\n${"=".repeat(60)}\n`);
    console.log("✅ Vérification terminée\n");

  } catch (error) {
    console.error("\n❌ Erreur durant la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMenuFiltering();
