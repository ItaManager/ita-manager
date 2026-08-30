import { statistiquesReleves } from "@/lib/actions/releves";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

export async function IndicateursReleves() {
  const stats = await statistiquesReleves();

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Relevés visés */}
        <CardIndicateur
          label="Relevés visés"
          helpText="Nombre de relevés d'activité validés par le conducteur de travaux. Ces relevés sont finalisés et leurs pointages alimentent le calcul de paie chantier."
          value={stats.vises}
          chart={
            <MiniGraphBarres
              values={[12, 15, 18, 14, 20, 16, stats.vises]}
            />
          }
        />

        {/* En attente de visa */}
        <CardIndicateur
          label="En attente de visa"
          helpText="Relevés soumis par le chef de chantier qui attendent la validation du conducteur de travaux. Ils doivent être visés ou refusés."
          value={stats.soumis}
          valueColor={stats.soumis > 0 ? "#f59e0b" : "#18181a"}
          chart={
            <MiniGraphProgression
              percentage={
                stats.total > 0
                  ? (stats.soumis / stats.total) * 100
                  : 0
              }
            />
          }
        />

        {/* Brouillons en cours */}
        <CardIndicateur
          label="Brouillons en cours"
          helpText="Relevés en cours de saisie par les chefs de chantier. Ils peuvent être modifiés avant soumission pour validation."
          value={stats.brouillons}
          chart={
            <MiniGraphCirculaire
              percentage={
                stats.total > 0
                  ? stats.brouillons / stats.total
                  : 0
              }
            />
          }
        />

        {/* Pointages ce mois */}
        <CardIndicateur
          label="Pointages ce mois"
          helpText="Nombre total de pointages validés (visés) ce mois. Représente le volume d'activité chantier validé pour la paie du mois en cours."
          value={stats.pointagesCeMois.toLocaleString("fr-FR")}
          chart={
            <MiniGraphBarres
              values={[320, 380, 350, 410, 390, 425, stats.pointagesCeMois]}
            />
          }
        />
      </div>
    </TooltipProvider>
  );
}
