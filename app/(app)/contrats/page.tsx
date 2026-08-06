import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { ListeContrats } from "./_components/liste-contrats";

type SearchParams = Promise<{
  page?: string;
  recherche?: string;
  typeContrat?: string;
  echeance?: string;
  statut?: string;
}>;

export const metadata = {
  title: "Contrats — ITA Manager",
};

export default async function PageContrats({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["employe:lire"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Contrats</h1>
        <p className="text-sm text-muted-foreground">Gérer les contrats des employés</p>
      </div>

      {/* Liste dynamique */}
      <ListeContrats
        page={page}
        recherche={params.recherche}
        typeContrat={params.typeContrat}
        echeance={params.echeance}
        statut={params.statut}
      />
    </div>
  );
}
