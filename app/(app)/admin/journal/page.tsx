import { Suspense } from "react";
import { ListeEvenements } from "./_components/liste-evenements";
import { SqueletteJournal } from "./_components/squelette-journal";
import { StatistiquesAudit } from "./_components/statistiques-audit";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Journal d'audit — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    curseur?: string;
    entite?: string;
    entiteId?: string;
    action?: string;
    auteurId?: string;
  }>;
}

export default async function PageJournal({ searchParams }: PageProps) {
  await verifierAccesPage("/admin/journal");
  const params = await searchParams;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Journal d'audit
        </h1>
        <p className="text-sm text-muted-foreground">
          Traçabilité complète de toutes les actions système
        </p>
      </div>

      <Suspense fallback={<div className="h-32" />}>
        <StatistiquesAudit />
      </Suspense>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<SqueletteJournal />}
      >
        <ListeEvenements
          curseur={params.curseur}
          entite={params.entite}
          entiteId={params.entiteId}
          action={params.action}
          auteurId={params.auteurId}
        />
      </Suspense>
    </div>
  );
}
