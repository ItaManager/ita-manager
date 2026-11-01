import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { TableauSuiviOptimise } from "./_components/tableau-suivi-optimise";
import { listerConsommationsPourSuivi } from "@/lib/actions/carburant";

export const metadata = {
  title: "Carburant — ITA Manager",
};

export default async function CarburantPage() {
  await verifierAccesPage("/carburant");

  // Récupérer les données depuis la base
  const donnees = await listerConsommationsPourSuivi();

  return (
    <ModuleLayout
      titre="Carburant"
      description="Distribution et suivi de consommation carburant"
      helpText="Créez des distributions de carburant et suivez la consommation par véhicule. Deux circuits disponibles : station-service (dépense) ou cuve ITA (mouvement de stock)."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <TableauSuiviOptimise donneesInitiales={donnees} />
      </Suspense>
    </ModuleLayout>
  );
}
