import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursProjets } from "./_components/indicateurs-projets";
import { TableauProjets } from "./_components/tableau-projets";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";
import { StatutProjet } from "@prisma/client";

interface PageProjetsProps {
  searchParams: Promise<{
    recherche?: string;
    statut?: StatutProjet;
    page?: string;
    limit?: string;
  }>;
}

export const metadata = {
  title: "Projets — ITA Manager",
};

export default async function ProjetsPage({
  searchParams,
}: PageProjetsProps) {
  await verifierAccesPage("/projets");

  const params = await searchParams;

  return (
    <ModuleLayout
      titre="Projets"
      description="Gestion des chantiers et suivi de l'avancement"
      helpText="Créez et suivez vos projets de chantier : planification des tâches, affectation des équipes, suivi des jalons et de l'avancement. Chaque projet génère automatiquement un lieu de livraison pour la logistique."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursProjets />
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
        <TableauProjets
          recherche={params.recherche}
          statut={params.statut}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </ModuleLayout>
  );
}
