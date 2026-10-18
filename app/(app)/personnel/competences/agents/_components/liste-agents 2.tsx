import { listerAgentsAvecCompetences } from "@/lib/actions/competences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import { BoutonAssignerCompetence } from "./bouton-assigner-competence";
import { BarreRechercheAgents } from "./barre-recherche-agents";
import { PaginationAgents } from "./pagination-agents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ListeAgentsProps {
  filtre: "tous" | "sans-competence" | "sur-chantier";
  recherche?: string;
  page?: number;
  limit?: number;
}

export async function ListeAgents({
  filtre,
  recherche,
  page = 1,
  limit = 20,
}: ListeAgentsProps) {
  // Récupérer les agents selon le filtre
  const filtres = {
    sansCompetence: filtre === "sans-competence",
    surChantier: filtre === "sur-chantier",
  };

  const result = await listerAgentsAvecCompetences(filtres);

  if (!result.success) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Erreur lors du chargement des agents
        </p>
      </div>
    );
  }

  let agents = result.data;

  // Filtrer par recherche
  if (recherche) {
    const termeRecherche = recherche.toLowerCase();
    agents = agents.filter(
      (a) =>
        a.nom.toLowerCase().includes(termeRecherche) ||
        a.prenom.toLowerCase().includes(termeRecherche) ||
        a.matricule.toLowerCase().includes(termeRecherche)
    );
  }

  // Pagination
  const total = agents.length;
  const debut = (page - 1) * limit;
  const fin = debut + limit;
  const agentsPagines = agents.slice(debut, fin);

  // Compter pour les filtres
  const allAgents = await listerAgentsAvecCompetences({});
  const counts = {
    tous: allAgents.data?.length || 0,
    sansCompetence: allAgents.data?.filter((a) => !a.competence).length || 0,
    surChantier: allAgents.data?.filter((a) => a.projet).length || 0,
  };

  return (
    <TooltipProvider>
      <div className="bg-white rounded-xl border border-[#0000001a] p-6">
        {/* Recherche et filtres */}
        <BarreRechercheAgents counts={counts} />

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Agent
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Compétence
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Taux journalier
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Depuis le
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Chantier
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {agentsPagines.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {recherche
                      ? "Aucun agent ne correspond à votre recherche."
                      : "Aucun agent trouvé."}
                  </td>
                </tr>
              ) : (
                agentsPagines.map((agent) => {
                  const sansCompetence = !agent.competence;

                  return (
                    <tr
                      key={agent.id}
                      className={`border-b border-border transition-colors ${
                        sansCompetence
                          ? "bg-yellow-50 hover:bg-yellow-100"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Agent */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-sm text-foreground">
                            {agent.prenom} {agent.nom}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {agent.matricule}
                          </div>
                        </div>
                      </td>

                      {/* Compétence */}
                      <td className="py-3 px-4">
                        {sansCompetence ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="size-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-700">
                                    aucune compétence
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-xs">
                                  Cet agent ne peut pas être pointé au relevé
                                  d'activité. Sans compétence, aucun taux ne
                                  peut être appliqué.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">
                              {agent.competence!.libelle}
                            </span>
                            <Badge variant="secondary">
                              {agent.competence!.categorie === "BASE"
                                ? "Base"
                                : agent.competence!.categorie === "QUALIFIE"
                                  ? "Qualifiée"
                                  : "Composée"}
                            </Badge>
                          </div>
                        )}
                      </td>

                      {/* Taux */}
                      <td className="py-3 px-4">
                        {agent.taux ? (
                          <span className="text-sm font-medium text-foreground">
                            {parseFloat(agent.taux.montant).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            F
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      {/* Date d'effet */}
                      <td className="py-3 px-4">
                        {agent.competence ? (
                          <span className="text-sm text-muted-foreground">
                            créée le{" "}
                            {format(
                              new Date(agent.competence.dateEffet),
                              "dd/MM/yyyy",
                              {
                                locale: fr,
                              }
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      {/* Chantier */}
                      <td className="py-3 px-4">
                        {agent.projet ? (
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {agent.projet.code}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {agent.projet.nom}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <BoutonAssignerCompetence agent={agent} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationAgents total={total} page={page} limit={limit} />
      </div>
    </div>
    </TooltipProvider>
  );
}
