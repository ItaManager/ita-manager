import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ListeAgents } from "./_components/liste-agents";

interface PageAgentsProps {
  searchParams: Promise<{
    filtre?: "tous" | "sans-competence" | "sur-chantier";
  }>;
}

export const metadata = {
  title: "Agents et compétences — ITA Manager",
};

export default async function PageAgents({ searchParams }: PageAgentsProps) {
  await verifierAccesPage("/personnel/competences/agents");

  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Agents et compétences
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compétences assignées aux agents journaliers
        </p>
      </div>

      {/* Liste */}
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeAgents filtre={params.filtre || "tous"} />
      </Suspense>

      {/* Footer explicatif */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <strong>Rappel :</strong> Un agent sans compétence ne peut pas être
          pointé au relevé d'activité. Sans taux, aucun montant ne se calcule à
          la paie.
        </p>
      </div>
    </div>
  );
}
