import { Suspense } from "react";
import { ListePostes } from "./_components/liste-postes";
import { SqueletteListePostes } from "./_components/squelette-liste-postes";

export const metadata = {
  title: "Postes — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    direction?: string;
    service?: string;
    niveau?: string;
    recherche?: string;
  }>;
}

export default async function PagePostes({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Postes</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des postes de l'organigramme
        </p>
      </div>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<SqueletteListePostes />}
      >
        <ListePostes
          page={params.page ? parseInt(params.page, 10) : 1}
          directionId={params.direction}
          serviceId={params.service}
          niveau={params.niveau as any}
          recherche={params.recherche}
        />
      </Suspense>
    </div>
  );
}
