import { obtenirStatistiquesConges } from "@/lib/actions/conges";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

interface IndicateursCongesProps {
  vue: "mes-demandes" | "a-valider" | "controle-rh" | "equipe";
}

export async function IndicateursConges({ vue }: IndicateursCongesProps) {
  const stats = await obtenirStatistiquesConges(vue);

  if (!stats.success) {
    return null;
  }

  const { data } = stats;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde disponible */}
        <CardIndicateur
          label="Solde disponible"
          helpText="Jours de congés restants pour l'année en cours. Ce solde est recalculé après chaque validation de demande."
          value={`${data.soldeDisponible} j`}
          valueColor="#13850b"
          chart={
            <MiniGraphBarres
              values={[18, 20, 22, 19, 21, 23, data.soldeDisponible]}
            />
          }
        />

        {/* En attente */}
        <CardIndicateur
          label="En attente"
          helpText="Demandes de congés créées mais non encore soumises ou en cours de validation."
          value={data.enAttente}
          valueColor={data.enAttente > 0 ? "#f59e0b" : "#18181a"}
          chart={
            <MiniGraphProgression
              percentage={data.enAttente > 0 ? 65 : 0}
            />
          }
        />

        {/* Validés (année) */}
        <CardIndicateur
          label="Validés (année)"
          helpText="Nombre de jours de congés validés et pris depuis le début de l'année."
          value={data.validesAnnee}
          chart={
            <MiniGraphCirculaire
              percentage={data.validesAnnee / 22}
            />
          }
        />

        {/* À valider (si pas mes-demandes) */}
        {vue !== "mes-demandes" && (
          <CardIndicateur
            label="À valider"
            helpText="Demandes nécessitant votre validation en tant que N+1 ou RH."
            value={data.aValider}
            valueColor={data.aValider > 0 ? "#ef4444" : "#18181a"}
            chart={
              <MiniGraphBarres
                values={[2, 4, 3, 6, 4, 7, data.aValider]}
              />
            }
          />
        )}
      </div>
    </TooltipProvider>
  );
}
