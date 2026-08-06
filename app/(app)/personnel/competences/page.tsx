import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { IndicateursCompetences } from "./_components/indicateurs-competences";
import { ListeCompetences } from "./_components/liste-competences";
import { BoutonNouvelleCompetence } from "./_components/bouton-nouvelle-competence";

interface PageCompetencesProps {
  searchParams: Promise<{
    recherche?: string;
    filtre?: "actives" | "sans-taux" | "composees" | "archivees" | "toutes";
  }>;
}

export const metadata = {
  title: "Compétences et taux journaliers — ITA Manager",
};

export default async function PageCompetences({
  searchParams,
}: PageCompetencesProps) {
  await verifierAccesPage("/personnel/competences");

  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Compétences et taux journaliers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un agent porte <strong>une</strong> compétence. S'il sait faire deux
            métiers, on crée une compétence composée.
          </p>
        </div>
        <BoutonNouvelleCompetence />
      </div>

      {/* Indicateurs */}
      <Suspense fallback={<div>Chargement...</div>}>
        <IndicateursCompetences />
      </Suspense>

      {/* Alertes et liste */}
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeCompetences
          recherche={params.recherche}
          filtre={params.filtre}
        />
      </Suspense>

      {/* Footer explicatif */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <strong>Trois directions, trois gestes.</strong> La Technique définit
          le métier, la Financière fixe le taux, les RH l'assignent. Le taux
          alimente ensuite la paie chantier — M7 : le pointage donne les jours,
          la compétence donne le taux.
        </p>
      </div>
    </div>
  );
}
