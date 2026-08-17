import { listerProjets } from "@/lib/actions/projets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, MapPin, User } from "lucide-react";
import Link from "next/link";
import { BarreRechercheProjets } from "./barre-recherche-projets";
import { PaginationProjets } from "./pagination-projets";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutProjet } from "@prisma/client";

interface TableauProjetsProps {
  recherche?: string;
  statut?: StatutProjet;
  page?: number;
  limit?: number;
}

const STATUT_CONFIG: Record<
  StatutProjet,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  BROUILLON: { label: "Brouillon", variant: "outline" },
  OUVERT: { label: "Ouvert", variant: "secondary" },
  EN_COURS: { label: "En cours", variant: "default" },
  SUSPENDU: { label: "Suspendu", variant: "destructive" },
  CLOTURE: { label: "Clôturé", variant: "secondary" },
};

export async function TableauProjets({
  recherche,
  statut,
  page = 1,
  limit = 20,
}: TableauProjetsProps) {
  const projets = await listerProjets();

  // Filtrer par recherche et statut
  let resultats = projets;

  if (recherche) {
    resultats = resultats.filter(
      (p) =>
        p.code.toLowerCase().includes(recherche.toLowerCase()) ||
        p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        p.maitreOuvrage?.toLowerCase().includes(recherche.toLowerCase())
    );
  }

  if (statut) {
    resultats = resultats.filter((p) => p.statut === statut);
  }

  // Pagination
  const total = resultats.length;
  const debut = (page - 1) * limit;
  const fin = debut + limit;
  const resultatsPagines = resultats.slice(debut, fin);

  // Compter par statut pour les filtres
  const counts = {
    brouillon: projets.filter((p) => p.statut === "BROUILLON").length,
    ouvert: projets.filter((p) => p.statut === "OUVERT").length,
    enCours: projets.filter((p) => p.statut === "EN_COURS").length,
    suspendu: projets.filter((p) => p.statut === "SUSPENDU").length,
    cloture: projets.filter((p) => p.statut === "CLOTURE").length,
    tous: projets.length,
  };

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Recherche et filtres */}
      <BarreRechercheProjets counts={counts} />

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Code
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Nom
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Maître d'ouvrage
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Avancement
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Dates
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
                    className="text-center py-12 text-sm text-muted-foreground"
                  >
                    Aucun projet trouvé
                  </td>
                </tr>
              ) : (
                resultatsPagines.map((projet) => {
                  const config = STATUT_CONFIG[projet.statut];
                  return (
                    <tr
                      key={projet.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 px-4">
                        <Link
                          href={`/projets/${projet.id}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {projet.code}
                        </Link>
                      </td>

                      {/* Nom */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-foreground">
                            {projet.nom}
                          </p>
                          {projet.localisation && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              <span>{projet.localisation}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Maître d'ouvrage */}
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">
                          {projet.maitreOuvrage || "—"}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="py-4 px-4">
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </td>

                      {/* Avancement */}
                      <td className="py-4 px-4">
                        {projet.avancementConstate !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{
                                  width: `${projet.avancementConstate}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">
                              {projet.avancementConstate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Planifié : {projet.avancementPlanifie}%
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          {projet.dateDebut || projet.dateFin ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              <span>
                                {projet.dateDebut
                                  ? format(new Date(projet.dateDebut), "dd/MM/yyyy", {
                                      locale: fr,
                                    })
                                  : "—"}
                                {" → "}
                                {projet.dateFin
                                  ? format(new Date(projet.dateFin), "dd/MM/yyyy", {
                                      locale: fr,
                                    })
                                  : "—"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              <span>Non planifié</span>
                            </div>
                          )}
                          {projet.conducteur && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="size-3" />
                              <span>
                                {projet.conducteur.prenom} {projet.conducteur.nom}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2"
                        >
                          <Link href={`/projets/${projet.id}`}>
                            <Eye className="size-4" />
                            <span>Voir</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-6">
          <PaginationProjets
            page={page}
            totalPages={Math.ceil(total / limit)}
            total={total}
          />
        </div>
      )}
    </div>
  );
}
