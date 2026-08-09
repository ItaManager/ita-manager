import { listerDemandesConges } from "@/lib/actions/conges";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TabsConges } from "./tabs-conges";
import { FiltresConges } from "./filtres-conges";
import { PaginationConges } from "./pagination-conges";
import { BoutonNouvelleDemande } from "./bouton-nouvelle-demande";
import { ActionsDemandeConges } from "./actions-demande-conges";

interface ListeCongesProps {
  page: number;
  limit: number;
  recherche?: string;
  statut?: "EN_ATTENTE" | "APPROUVE_N1" | "VALIDE_RH" | "REFUSE";
  type?: "CONGE_ANNUEL" | "CONGE_MALADIE" | "PERMISSION" | "CONGE_SANS_SOLDE";
  dateDebut?: string;
  dateFin?: string;
  vue: "mes-demandes" | "a-valider" | "controle-rh" | "equipe";
}

export async function ListeConges({
  page,
  limit,
  recherche,
  statut,
  type,
  dateDebut,
  dateFin,
  vue,
}: ListeCongesProps) {
  const { items: demandes, total, pages } = await listerDemandesConges({
    page,
    recherche,
    statut,
    type,
    dateDebut,
    dateFin,
    vue,
  });

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Tabs */}
      <TabsConges vueActive={vue} />

      {/* Filtres et bouton */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <FiltresConges
          recherche={recherche}
          statut={statut}
          type={type}
          dateDebut={dateDebut}
          dateFin={dateFin}
        />
        {vue === "mes-demandes" && <BoutonNouvelleDemande />}
      </div>

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Demandeur
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Période
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Durée
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {demandes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Aucune demande trouvée
                  </td>
                </tr>
              ) : (
                demandes.map((demande) => (
                  <tr
                    key={demande.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link href={`/conges-permissions/${demande.id}`} className="hover:opacity-80">
                        <div className="font-medium text-sm">
                          {demande.employeNom} {demande.employePrenom}
                        </div>
                        <div className="text-xs text-muted-foreground">{demande.employeMatricule}</div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Badge variant="secondary">{demande.typeLibelle}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {demande.dateDebut} → {demande.dateFin}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {demande.dureeJours} j
                    </td>
                    <td className="py-3 px-4">
                      {demande.statut === "EN_ATTENTE" && (
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                          En attente
                        </Badge>
                      )}
                      {demande.statut === "APPROUVE_N1" && (
                        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                          Validé N+1
                        </Badge>
                      )}
                      {demande.statut === "VALIDE_RH" && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Validé RH
                        </Badge>
                      )}
                      {demande.statut === "REFUSE" && (
                        <Badge variant="destructive">
                          Refusé
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <ActionsDemandeConges
                        demandeId={demande.id}
                        statut={demande.statut}
                        vue={vue}
                      />
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
