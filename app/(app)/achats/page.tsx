import { verifierAccesPage } from "@/lib/auth/page-access";
import { IndicateursAchats } from "./_components/indicateurs-achats";
import { ListeDemandes } from "./_components/liste-demandes";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";
import { WrapperPageAchats } from "./_components/wrapper-page-achats";

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
    <WrapperPageAchats>
      {/* Indicateurs */}
      <IndicateursAchats />

      {/* Vos tâches */}
      <div className="bg-white rounded-xl border border-[#0000001a]">
        <div className="px-6 py-4 border-b border-[#0000001a]">
          <TitreTaches />
        </div>
        <div className="px-6 py-6">
          <ListeTaches />
        </div>
      </div>

      {/* Contenu principal */}
      <ListeDemandes
        recherche={params.recherche}
        filtre={params.filtre}
        page={params.page ? parseInt(params.page) : 1}
        limit={params.limit ? parseInt(params.limit) : 20}
      />
    </WrapperPageAchats>
  );
}
