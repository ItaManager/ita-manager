import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursContrats } from "./_components/indicateurs-contrats";
import { ListeContrats } from "./_components/liste-contrats";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";

type SearchParams = Promise<{
  page?: string;
  limit?: string;
  recherche?: string;
  typeContrat?: string;
  echeance?: string;
  statut?: string;
}>;

export const metadata = {
  title: "Contrats — ITA Manager",
};

export default async function PageContrats({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["employe:lire"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "25", 10);

  return (
    <ModuleLayout
      titre="Contrats"
      description="Gérer les contrats des employés"
      helpText="Vue centralisée de tous les contrats (CDI, CDD, Intérim, Stage). Les CDD nécessitent un suivi régulier de leur date d'expiration pour anticiper les renouvellements ou clôtures."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursContrats />
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
        <ListeContrats
          page={page}
          limit={limit}
          recherche={params.recherche}
          typeContrat={params.typeContrat}
          echeance={params.echeance}
          statut={params.statut}
        />
      </Suspense>
    </ModuleLayout>
  );
}
