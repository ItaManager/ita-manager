import { listerCompetences } from "@/lib/actions/competences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { BoutonFixerTaux } from "./bouton-fixer-taux";
import { BoutonReviserTaux } from "./bouton-reviser-taux";
import { BoutonModifierCompetence } from "./bouton-modifier-competence";
import { BoutonHistoriqueTaux } from "./bouton-historique-taux";
import { BarreRecherche } from "./barre-recherche";
import { PaginationCompetences } from "./pagination-competences";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ListeCompetencesProps {
  recherche?: string;
  filtre?: "actives" | "sans-taux" | "composees" | "archivees" | "toutes";
  page?: number;
  limit?: number;
}

export async function ListeCompetences({
  recherche,
  filtre = "actives",
  page = 1,
  limit = 20,
}: ListeCompetencesProps) {
  // Récupérer les compétences selon le filtre
  const filtres = {
    actives: filtre === "actives",
    sansTaux: filtre === "sans-taux",
    composees: filtre === "composees",
    archivees: filtre === "archivees",
  };

  const competences = await listerCompetences(filtres);

  // Filtrer par recherche côté serveur (simple)
  let resultats = competences;
  if (recherche) {
    resultats = competences.filter((c) =>
      c.libelle.toLowerCase().includes(recherche.toLowerCase())
    );
  }

  // Pagination
  const total = resultats.length;
  const debut = (page - 1) * limit;
  const fin = debut + limit;
  const resultatsPagines = resultats.slice(debut, fin);

  // Compter pour les filtres
  const toutesCompetences = await listerCompetences({});
  const counts = {
    actives: toutesCompetences.filter((c) => c.actif).length,
    sansTaux: toutesCompetences.filter((c) => c.actif && !c.tauxCourant).length,
    composees: toutesCompetences.filter((c) => c.categorie === "COMPOSEE")
      .length,
    archivees: toutesCompetences.filter((c) => !c.actif).length,
    toutes: toutesCompetences.length,
  };

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Recherche et filtres */}
      <BarreRecherche counts={counts} />

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Compétence
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Catégorie
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Taux journalier
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Depuis
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Agents
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Versions
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {resultatsPagines.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {recherche
                      ? "Aucune compétence ne correspond à votre recherche."
                      : "Aucune compétence trouvée."}
                  </td>
                </tr>
              ) : (
                resultatsPagines.map((comp) => (
                  <tr
                    key={comp.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    {/* Compétence */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-sm text-foreground">
                          {comp.libelle}
                        </div>
                        {comp.categorie === "COMPOSEE" && comp.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {comp.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Catégorie */}
                    <td className="py-3 px-4">
                      <Badge variant="secondary">
                        {comp.categorie === "BASE"
                          ? "Base"
                          : comp.categorie === "QUALIFIE"
                            ? "Qualifiée"
                            : "Composée"}
                      </Badge>
                    </td>

                    {/* Taux journalier */}
                    <td className="py-3 px-4">
                      {comp.tauxCourant ? (
                        <span className="text-sm font-medium text-foreground">
                          {parseFloat(comp.tauxCourant.montant).toLocaleString(
                            "fr-FR"
                          )}{" "}
                          F
                        </span>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                          en attente
                        </Badge>
                      )}
                    </td>

                    {/* Depuis */}
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {comp.tauxCourant
                        ? format(comp.tauxCourant.dateEffet, "dd/MM/yyyy", {
                            locale: fr,
                          })
                        : `créée le ${format(comp.creeLe, "dd/MM/yyyy", { locale: fr })}`}
                    </td>

                    {/* Agents */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm ${comp.nombreAgents > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {comp.nombreAgents > 0 ? comp.nombreAgents : "aucun"}
                      </span>
                    </td>

                    {/* Versions */}
                    <td className="py-3 px-4">
                      {comp.nombreVersionsTaux > 0 ? (
                        <BoutonHistoriqueTaux competence={comp} />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          aucune
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {!comp.tauxCourant ? (
                          <BoutonFixerTaux competence={comp} />
                        ) : (
                          <BoutonReviserTaux competence={comp} />
                        )}
                        <BoutonModifierCompetence competence={comp} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationCompetences total={total} page={page} limit={limit} />
      </div>
    </div>
  );
}
