import { ListePostes } from "./_components/liste-postes";
import type { NiveauHierarchique } from "@prisma/client";

interface PagePostesProps {
  searchParams: Promise<{
    page?: string;
    recherche?: string;
    direction?: string;
    service?: string;
    niveau?: NiveauHierarchique;
  }>;
}

export default async function PagePostes({ searchParams }: PagePostesProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Postes</h1>
        <p className="text-sm text-muted-foreground">Gérer les postes</p>
      </div>

      {/* Liste dynamique */}
      <ListePostes
        page={page}
        recherche={params.recherche}
        directionId={params.direction}
        serviceId={params.service}
        niveau={params.niveau}
      />
    </div>
  );
}
