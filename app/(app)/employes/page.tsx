import { Suspense } from "react";
import { ListeEmployes } from "./_components/liste-employes";
import { SqueletteListeEmployes } from "./_components/squelette-liste-employes";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Employés — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    recherche?: string;
    direction?: string;
    service?: string;
    typeMainOeuvre?: string;
    statutDossier?: string;
  }>;
}

export default async function PageEmployes({ searchParams }: PageProps) {
  await verifierAccesPage("/employes");
  const params = await searchParams;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Employés</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des dossiers employés (permanents et journaliers)
        </p>
      </div>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<SqueletteListeEmployes />}
      >
        <ListeEmployes
          page={params.page ? parseInt(params.page, 10) : 1}
          recherche={params.recherche}
          directionId={params.direction}
          serviceId={params.service}
          typeMainOeuvre={params.typeMainOeuvre as any}
          statutDossier={params.statutDossier as any}
        />
      </Suspense>
    </div>
  );
}
