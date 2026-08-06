import { listerCompetences, statistiquesCompetences } from "@/lib/actions/competences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle, AlertTriangle, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { BoutonFixerTaux } from "./bouton-fixer-taux";
import { BoutonModifierCompetence } from "./bouton-modifier-competence";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ListeCompetencesProps {
  recherche?: string;
  filtre?: "actives" | "sans-taux" | "composees" | "archivees" | "toutes";
}

export async function ListeCompetences({
  recherche,
  filtre = "actives",
}: ListeCompetencesProps) {
  // Récupérer les compétences selon le filtre
  const filtres = {
    actives: filtre === "actives",
    sansTaux: filtre === "sans-taux",
    composees: filtre === "composees",
    archivees: filtre === "archivees",
  };

  const competences = await listerCompetences(filtres);
  const stats = await statistiquesCompetences();

  // Filtrer par recherche côté serveur (simple)
  let resultats = competences;
  if (recherche) {
    resultats = competences.filter((c) =>
      c.libelle.toLowerCase().includes(recherche.toLowerCase())
    );
  }

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
    <div className="space-y-4">
      {/* Alertes */}
      {stats.enAttenteDeTaux > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertCircle className="size-5 text-orange-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-orange-900">
              <strong>{stats.enAttenteDeTaux} compétences en attente de taux.</strong>{" "}
              Créées par la Direction Technique, elles attendent la validation
              de la Direction Financière. Tant qu'aucun taux n'est fixé, elles
              ne peuvent pas être assignées.
            </p>
          </div>
        </div>
      )}

      {stats.agentsSansCompetence > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="size-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-900">
              <strong>{stats.agentsSansCompetence} agents sans compétence.</strong>{" "}
              Ils ne peuvent pas être pointés au relevé d'activité — sans taux,
              aucun montant ne se calcule.
            </p>
          </div>
        </div>
      )}

      {/* Recherche et filtres */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une compétence"
            defaultValue={recherche}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/personnel/competences?filtre=actives">
            <Badge
              variant={filtre === "actives" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3"
            >
              Actives ({counts.actives})
            </Badge>
          </Link>
          <Link href="/personnel/competences?filtre=sans-taux">
            <Badge
              variant={filtre === "sans-taux" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3"
            >
              Sans taux ({counts.sansTaux})
            </Badge>
          </Link>
          <Link href="/personnel/competences?filtre=composees">
            <Badge
              variant={filtre === "composees" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3"
            >
              Composées ({counts.composees})
            </Badge>
          </Link>
          <Link href="/personnel/competences?filtre=archivees">
            <Badge
              variant={filtre === "archivees" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3"
            >
              Archivées ({counts.archivees})
            </Badge>
          </Link>
          <Link href="/personnel/competences?filtre=toutes">
            <Badge
              variant={filtre === "toutes" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3"
            >
              Toutes ({counts.toutes})
            </Badge>
          </Link>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
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
              {resultats.length === 0 ? (
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
                resultats.map((comp) => (
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
                      <Badge
                        variant={
                          comp.categorie === "COMPOSEE"
                            ? "default"
                            : comp.categorie === "QUALIFIE"
                              ? "secondary"
                              : "outline"
                        }
                      >
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
                      {comp.nombreVersionsTaux > 1 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                        >
                          <Eye className="size-3" />
                          {comp.nombreVersionsTaux}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {comp.nombreVersionsTaux}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {!comp.tauxCourant && (
                          <BoutonFixerTaux competence={comp} />
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
      </div>
    </div>
  );
}
