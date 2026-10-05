import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursAchats } from "./_components/indicateurs-achats";
import { ListeDemandes } from "./_components/liste-demandes";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";

interface PageAchatsProps {
  searchParams: Promise<{
    recherche?: string;
    filtre?: "toutes" | "brouillon" | "attente-n1" | "attente-achats" | "bc-emis" | "soldees" | "refusees";
    page?: string;
    limit?: string;
  }>;
}

export const metadata = {
  title: "Achats — ITA Manager",
};

export default async function PageAchats({
  searchParams,
}: PageAchatsProps) {
  await verifierAccesPage("/achats");

  const params = await searchParams;

  return (
    <ModuleLayout
      titre="Achats"
      description="Gérez vos demandes d'achat et suivez leur circuit de validation"
      helpText="Le circuit d'achat commence par la création d'une demande. Après soumission, elle passe par votre N+1, puis le Service Achats pour instruction (consultation fournisseurs, prix), et enfin l'émission du bon de commande."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursAchats />
        </Suspense>
      }
      taches={{
        titre: (
          <Suspense fallback={<h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>}>
            <TitreTaches />
          </Suspense>
        ),
        contenu: (
          <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement...</div>}>
            <ListeTaches />
          </Suspense>
        ),
      }}
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeDemandes
          recherche={params.recherche}
          filtre={params.filtre}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </ModuleLayout>
  );
}
