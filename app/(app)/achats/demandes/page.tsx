import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursAchats } from "../_components/indicateurs-achats";
import { ListeDemandes } from "./_components/liste-demandes";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";

interface PageDemandesProps {
  searchParams: Promise<{
    recherche?: string;
    filtre?: "toutes" | "brouillon" | "en-attente" | "validees";
    page?: string;
    limit?: string;
  }>;
}

export const metadata = {
  title: "Mes demandes d'achat — ITA Manager",
};

export default async function PageDemandes({
  searchParams,
}: PageDemandesProps) {
  await verifierAccesPage("/achats/demandes");

  const params = await searchParams;

  return (
    <ModuleLayout
      titre="Mes demandes d'achat"
      description="Créer et suivre vos demandes d'achat"
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
