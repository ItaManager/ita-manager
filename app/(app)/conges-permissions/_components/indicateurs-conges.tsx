import { CardIndicateur } from "@/components/indicateurs";
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
      <CardIndicateur
        label="Solde disponible"
        value={`${data.soldeDisponible} j`}
        valueColor="#13850b"
        helpText="Jours de congés restants pour l'année en cours"
      />

      <CardIndicateur
        label="En attente"
        value={data.enAttente}
        valueColor="#f59e0b"
        helpText="Demandes en attente de traitement"
      />

      <CardIndicateur
        label="Validés (année)"
        value={data.validesAnnee}
        valueColor="#18181a"
        helpText="Jours de congés validés cette année"
      />

      {vue !== "mes-demandes" && (
        <CardIndicateur
          label="À valider"
          value={data.aValider}
          valueColor="#ef4444"
          helpText="Demandes nécessitant votre validation"
        />
      )}
    </div>
  );
}
