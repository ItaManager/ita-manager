import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursCompetences } from "./_components/indicateurs-competences";
import { ListeCompetences } from "./_components/liste-competences";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";

interface PageCompetencesProps {
  searchParams: Promise<{
    recherche?: string;
    filtre?: "actives" | "sans-taux" | "composees" | "archivees" | "toutes";
    page?: string;
    limit?: string;
  }>;
}

export const metadata = {
  title: "Compétences — ITA Manager",
};

export default async function PageCompetences({
  searchParams,
}: PageCompetencesProps) {
  await verifierAccesPage("/personnel/competences");

  const params = await searchParams;

  return (
    <ModuleLayout
      titre="Compétences"
      description="Gérez les compétences métier et leurs taux journaliers"
      helpText="Circuit de validation à 3 acteurs : La Direction Technique définit les compétences métier, la Direction Financière fixe les taux journaliers, puis les RH assignent ces compétences aux agents. Le taux journalier alimente ensuite le calcul de paie chantier : le pointage fournit les jours travaillés, la compétence fournit le taux."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursCompetences />
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
        <ListeCompetences
          recherche={params.recherche}
          filtre={params.filtre}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </ModuleLayout>
  );
}
