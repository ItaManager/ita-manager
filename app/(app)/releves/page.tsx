import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { ListeReleves } from "./_components/liste-releves";
import { IndicateursReleves } from "./_components/indicateurs-releves";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";

export const metadata = {
  title: "Relevés d'activité — ITA Manager",
};

interface PageRelevesProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    projetId?: string;
    statut?: "BROUILLON" | "SOUMIS" | "VISE" | "REFUSE";
  }>;
}

export default async function PageReleves({ searchParams }: PageRelevesProps) {
  await verifierAccesPage("/releves");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = params.limit ? parseInt(params.limit) : 20;

  return (
    <ModuleLayout
      titre="Relevés d'activité"
      description="Saisie et validation des relevés journaliers par chantier"
      helpText="Circuit de validation en 2 étapes : Le chef de chantier saisit le relevé d'activité avec les pointages quotidiens et le soumet. Le conducteur de travaux (N+1) vise le relevé pour validation finale. Les pointages visés alimentent ensuite le calcul de paie chantier."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursReleves />
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
        <ListeReleves
          page={page}
          limit={limit}
          projetId={params.projetId}
          statut={params.statut}
        />
      </Suspense>
    </ModuleLayout>
  );
}
