import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursAgents } from "./_components/indicateurs-agents";
import { ListeAgents } from "./_components/liste-agents";
import { ListeTaches } from "../_components/liste-taches";
import { TitreTaches } from "../_components/titre-taches";

interface PageAgentsProps {
  searchParams: Promise<{
    filtre?: "tous" | "sans-competence" | "sur-chantier";
    recherche?: string;
    page?: string;
    limit?: string;
  }>;
}

export const metadata = {
  title: "Agents et compétences — ITA Manager",
};

export default async function PageAgents({ searchParams }: PageAgentsProps) {
  await verifierAccesPage("/personnel/competences/agents");

  const params = await searchParams;

  return (
    <ModuleLayout
      titre="Agents et compétences"
      description="Compétences assignées aux agents journaliers"
      helpText="Chaque agent journalier doit avoir une compétence assignée pour pouvoir être pointé au relevé d'activité. La compétence détermine le taux journalier appliqué lors du calcul de paie chantier."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursAgents />
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
        <ListeAgents
          filtre={params.filtre || "tous"}
          recherche={params.recherche}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </ModuleLayout>
  );
}
