import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursConges } from "./_components/indicateurs-conges";
import { ListeConges } from "./_components/liste-conges";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";

export const metadata = {
  title: "Congés et permissions — ITA Manager",
};

export default async function PageCongesPermissions() {
  await verifierAccesPage("/conges-permissions");

  return (
    <ModuleLayout
      titre="Congés et permissions"
      description="Gérez les soldes de congés et les demandes de votre équipe"
      helpText="Consultez les soldes de congés de tous les employés, suivez les demandes en attente et gérez les validations. Chaque employé dispose de 30 jours de congé par an (éligibilité après 12 mois d'ancienneté)."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursConges vue="equipe" />
        </Suspense>
      }
      taches={{
        titre: (
          <Suspense fallback={<h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>}>
            <TitreTaches />
          </Suspense>
        ),
        contenu: (
          <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement...</div>}>
            <ListeTaches />
          </Suspense>
        ),
      }}
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeConges />
      </Suspense>
    </ModuleLayout>
  );
}
