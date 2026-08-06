import { ListeEmployes } from "./_components/liste-employes";
import { obtenirDonneesReferenceEmploye } from "@/lib/actions/employes";
import type { TypeMainOeuvre } from "@prisma/client";

interface PageEmployesProps {
  searchParams: Promise<{
    page?: string;
    recherche?: string;
    directionId?: string;
    serviceId?: string;
    typeMainOeuvre?: TypeMainOeuvre;
    statutDossier?: "COMPLET" | "INCOMPLET";
  }>;
}

export default async function PageEmployes({ searchParams }: PageEmployesProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  // Charger les données de référence pour le formulaire de création
  const donneesReference = await obtenirDonneesReferenceEmploye();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Employés</h1>
        <p className="text-sm text-muted-foreground">Gérer vos employés</p>
      </div>

      {/* Liste dynamique */}
      <ListeEmployes
        page={page}
        recherche={params.recherche}
        directionId={params.directionId}
        serviceId={params.serviceId}
        typeMainOeuvre={params.typeMainOeuvre}
        statutDossier={params.statutDossier}
        donneesReference={donneesReference}
      />
    </div>
  );
}
