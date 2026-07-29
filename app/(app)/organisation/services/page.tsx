import { Suspense } from "react";
import { ListeServices } from "./_components/liste-services";
import { SqueletteListeServices } from "./_components/squelette-liste-services";

export const metadata = {
  title: "Services — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    direction?: string;
    recherche?: string;
  }>;
}

export default async function PageServices({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des services par direction
        </p>
      </div>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<SqueletteListeServices />}
      >
        <ListeServices
          page={params.page ? parseInt(params.page, 10) : 1}
          directionId={params.direction}
          recherche={params.recherche}
        />
      </Suspense>
    </div>
  );
}
