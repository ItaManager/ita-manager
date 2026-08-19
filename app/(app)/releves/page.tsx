import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ListeReleves } from "./_components/liste-releves";
import { ClipboardCheck } from "lucide-react";

export const metadata = {
  title: "Relevés d'activité — ITA Manager",
};

interface PageRelevesProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    projetId?: string;
    statut?: "BROUILLON" | "SOUMIS" | "VISE" | "REFUSE";
  }>;
}

export default async function PageReleves({ searchParams }: PageRelevesProps) {
  await verifierAccesPage("/releves");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = params.limit ? parseInt(params.limit) : 20;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="size-6" />
            Relevés d'activité
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saisie et validation des relevés journaliers par chantier
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
        <ListeReleves
          page={page}
          limit={limit}
          projetId={params.projetId}
          statut={params.statut}
        />
      </Suspense>
    </div>
  );
}
