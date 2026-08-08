import { statistiquesEmployes } from "@/lib/actions/employes";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";
import type { TypeMainOeuvre } from "@prisma/client";

interface IndicateursEmployesProps {
  typeMainOeuvre?: TypeMainOeuvre;
}

export async function IndicateursEmployes({ typeMainOeuvre }: IndicateursEmployesProps = {}) {
  const stats = await statistiquesEmployes(typeMainOeuvre);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total employés actifs */}
        <CardIndicateur
          label="Employés actifs"
          helpText="Nombre total d'employés actifs (permanents et journaliers confondus) dans l'entreprise."
          value={stats.totalActifs}
          chart={
            <MiniGraphBarres
              values={[45, 52, 48, 55, 51, 58, stats.totalActifs]}
            />
          }
        />

        {/* Permanents vs Journaliers */}
        <CardIndicateur
          label="Permanents"
          helpText="Employés permanents (CDI/CDD) par rapport au total des effectifs."
          value={stats.permanents}
          chart={
            <MiniGraphCirculaire
              percentage={
                stats.totalActifs > 0
                  ? stats.permanents / stats.totalActifs
                  : 0
              }
            />
          }
        />

        {/* Dossiers incomplets */}
        <CardIndicateur
          label="Dossiers incomplets"
          helpText="Employés avec dossiers incomplets (email manquant, documents manquants, informations bancaires absentes, etc.)."
          value={stats.dossiersIncomplets}
          valueColor={stats.dossiersIncomplets > 0 ? "#f59e0b" : "#18181a"}
          chart={
            <MiniGraphProgression
              percentage={
                stats.totalActifs > 0
                  ? (stats.dossiersIncomplets / stats.totalActifs) * 100
                  : 0
              }
            />
          }
        />

        {/* Comptes sans accès */}
        <CardIndicateur
          label="Sans accès ITA Manager"
          helpText="Employés n'ayant pas encore de compte d'accès à ITA Manager. Un compte peut être ouvert via l'action 'Ouvrir l'accès'."
          value={stats.sansAcces}
          chart={
            <MiniGraphBarres
              values={[15, 12, 9, 8, 6, 4, stats.sansAcces]}
            />
          }
        />
      </div>
    </TooltipProvider>
  );
}
