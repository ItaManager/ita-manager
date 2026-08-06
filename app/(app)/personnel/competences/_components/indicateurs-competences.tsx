import { statistiquesCompetences } from "@/lib/actions/competences";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, AlertCircle, UserX, Banknote } from "lucide-react";

export async function IndicateursCompetences() {
  const stats = await statistiquesCompetences();

  const indicateurs = [
    {
      label: "Compétences actives",
      valeur: stats.competencesActives.toString(),
      complement: "dont 2 composées",
      icon: Award,
      variante: "default" as const,
    },
    {
      label: "En attente de taux",
      valeur: stats.enAttenteDeTaux.toString(),
      complement: "à valider par la Direction Financière",
      icon: AlertCircle,
      variante: "destructive" as const,
      badge: stats.enAttenteDeTaux > 0,
    },
    {
      label: "Sans compétence",
      valeur: stats.agentsSansCompetence.toString(),
      complement: "ne peuvent pas être pointés",
      icon: UserX,
      variante: "default" as const,
    },
    {
      label: "Coût journalier",
      valeur: `${stats.coutJournalier.toLocaleString("fr-FR")} F`,
      complement: "agents sur chantier",
      icon: Banknote,
      variante: "default" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {indicateurs.map((ind) => {
        const Icon = ind.icon;
        return (
          <Card key={ind.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {ind.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-semibold text-foreground">
                      {ind.valeur}
                    </p>
                    {ind.badge && (
                      <Badge variant={ind.variante} className="h-5 px-1.5">
                        !
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ind.complement}
                  </p>
                </div>
                <div
                  className={`rounded-full p-2 ${
                    ind.variante === "destructive"
                      ? "bg-destructive/10"
                      : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`size-5 ${
                      ind.variante === "destructive"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
