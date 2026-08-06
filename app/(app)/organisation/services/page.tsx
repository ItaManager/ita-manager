import { ListeServices } from "./_components/liste-services";

interface PageServicesProps {
  searchParams: Promise<{
    page?: string;
    recherche?: string;
    direction?: string;
  }>;
}

export default async function PageServices({ searchParams }: PageServicesProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Services</h1>
        <p className="text-sm text-muted-foreground">Gérer les services</p>
      </div>

      {/* Liste dynamique */}
      <ListeServices
        page={page}
        recherche={params.recherche}
        directionId={params.direction}
      />
    </div>
  );
}
