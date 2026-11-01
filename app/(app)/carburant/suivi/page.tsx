import { TableauSuiviOptimise } from "./_components/tableau-suivi-optimise";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { Suspense } from "react";
import { listerConsommationsPourSuivi } from "@/lib/actions/carburant";

export default async function PageSuiviCarburant() {
  await verifierAccesPage("/carburant/suivi");

  // Récupérer les données depuis la base
  const donnees = await listerConsommationsPourSuivi();

  return (
    <ModuleLayout
      titre="Suivi de consommation carburant"
      description="Vue d'ensemble de toutes les distributions et consommations par véhicule"
      helpText="Suivez la consommation de carburant par véhicule, chauffeur et projet. Les données sont calculées automatiquement à partir des distributions validées."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <TableauSuiviOptimise donneesInitiales={donnees} />
      </Suspense>
    </ModuleLayout>
  );
}
