import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursUtilisateurs } from "./_components/indicateurs-utilisateurs";
import { ListeUtilisateurs } from "./_components/liste-utilisateurs";
import { listerEmployesSansCompte, listerRolesDisponibles } from "@/lib/actions/utilisateurs";

export const metadata = {
  title: "Utilisateurs — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    recherche?: string;
    actifs?: string;
  }>;
}

export default async function PageUtilisateurs({ searchParams }: PageProps) {
  await verifierAccesPage("/admin/utilisateurs");
  const params = await searchParams;

  // Charger les données nécessaires pour la modale d'invitation
  const [employesSansCompte, rolesDisponibles] = await Promise.all([
    listerEmployesSansCompte(),
    listerRolesDisponibles(),
  ]);

  return (
    <ModuleLayout
      titre="Utilisateurs"
      description="Gérez les comptes utilisateurs, leurs rôles et permissions"
      helpText="Administration des accès : créez des utilisateurs, assignez-leur des rôles prédéfinis ou personnalisés, et gérez l'activation des comptes."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursUtilisateurs />
        </Suspense>
      }
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeUtilisateurs
          recherche={params.recherche}
          actifSeulement={params.actifs !== "false"}
          employesSansCompte={employesSansCompte}
          rolesDisponibles={rolesDisponibles}
        />
      </Suspense>
    </ModuleLayout>
  );
}
