import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursCarburant } from "./_components/indicateurs-carburant";
import { TableauDemandes } from "./_components/tableau-demandes";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";

interface PageCarburantProps {
  searchParams: Promise<{
    statut?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Carburant — ITA Manager",
};

export default async function CarburantPage({
  searchParams,
}: PageCarburantProps) {
  await verifierAccesPage("/carburant");

  const params = await searchParams;

  return (
    <ModuleLayout
      titre="Carburant"
      description="Demandes, distributions et suivi de consommation"
      helpText="Gérez les demandes de carburant des chauffeurs, validez-les et suivez la consommation par véhicule. Deux circuits disponibles : station-service ou garage ITA."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursCarburant />
        </Suspense>
      }
      taches={{
        titre: (
          <Suspense fallback={<h2>Vos tâches</h2>}>
            <TitreTaches />
          </Suspense>
        ),
        contenu: (
          <Suspense fallback={<div>Chargement...</div>}>
            <ListeTaches />
          </Suspense>
        ),
      }}
    >
      <TableauDemandes
        statut={params.statut}
        page={params.page ? parseInt(params.page) : 1}
      />
    </ModuleLayout>
  );
}
