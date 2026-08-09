import { listerEmployesSoldes } from "@/lib/actions/conges";
import { Badge } from "@/components/ui/badge";
import { BarreRechercheConges } from "./barre-recherche-conges";
import { PaginationConges } from "./pagination-conges";

interface ListeCongesProps {
  page: number;
  limit: number;
  recherche?: string;
  filtre?: string;
}

export async function ListeConges({
  page,
  limit,
  recherche,
  filtre,
}: ListeCongesProps) {
  const resultats = await listerEmployesSoldes({
    page,
    limit,
    recherche,
    filtre,
  });

  const { employes, total, counts } = resultats as {
    employes: any[];
    total: number;
    counts: {
      eligibles: number;
      nonEligibles: number;
      avecDemandes: number;
      tous: number;
    };
  };

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-4 mb-6">
        <BarreRechercheConges counts={counts} />
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Matricule
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Nom
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Direction
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Solde
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                employes.map((employe: any) => (
                  <tr
                    key={employe.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {employe.matricule}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">
                        {employe.nom} {employe.prenom}
                      </div>
                      {!employe.eligible && (
                        <div className="text-xs text-orange-600">
                          Non éligible ({employe.moisDepuisEmbauche} mois)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {employe.direction}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {employe.service}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">
                        {employe.soldeTotal}/30
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {employe.demandesEnAttente > 0 && (
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                          À valider ({employe.demandesEnAttente})
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationConges total={total} page={page} limit={limit} />
      </div>
    </div>
  );
}
