import { IndicateurCard } from "@/components/indicateurs/indicateur-card";
import { CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { obtenirStatistiquesConges } from "@/lib/actions/conges";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <IndicateurCard
        icon={CalendarDays}
        label="Solde disponible"
        value={`${data.soldeDisponible} j`}
        variant="success"
        description="Jours de congés restants"
      />

      <IndicateurCard
        icon={Clock}
        label="En attente"
        value={data.enAttente}
        variant="warning"
        description="Demandes à traiter"
      />

      <IndicateurCard
        icon={CheckCircle2}
        label="Validés (année)"
        value={data.validesAnnee}
        variant="default"
        description="Jours pris cette année"
      />

      {vue !== "mes-demandes" && (
        <IndicateurCard
          icon={AlertCircle}
          label="À valider"
          value={data.aValider}
          variant="error"
          description="Demandes en attente de validation"
        />
      )}
    </div>
  );
}
