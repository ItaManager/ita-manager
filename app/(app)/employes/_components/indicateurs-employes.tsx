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
  const isJournaliers = typeMainOeuvre === "JOURNALIER";

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total employés actifs */}
        <CardIndicateur
          label={isJournaliers ? "Journaliers actifs" : "Employés actifs"}
          helpText={
            isJournaliers
              ? "Nombre total de journaliers (INTERIM) actuellement actifs dans l'entreprise."
              : "Nombre total d'employés permanents (CDI/CDD) actifs dans l'entreprise."
          }
          value={stats.totalActifs}
          chart={
            <MiniGraphBarres
              values={[45, 52, 48, 55, 51, 58, stats.totalActifs]}
            />
          }
        />

        {/* Permanents vs Journaliers OU En mission */}
        <CardIndicateur
          label={isJournaliers ? "En mission" : "Avec contrat actif"}
          helpText={
            isJournaliers
              ? "Journaliers actuellement affectés à un chantier (avec contrat en cours)."
              : "Employés permanents ayant un contrat en cours (CDI ou CDD non expiré)."
          }
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
          helpText={
            isJournaliers
              ? "Journaliers avec dossiers incomplets (téléphone manquant, documents manquants, etc.)."
              : "Employés avec dossiers incomplets (email manquant, documents manquants, informations bancaires absentes, etc.)."
          }
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

        {/* Comptes sans accès OU Sans compétence */}
        <CardIndicateur
          label={isJournaliers ? "Sans compétence" : "Sans accès ITA Manager"}
          helpText={
            isJournaliers
              ? "Journaliers n'ayant pas encore de compétence assignée (nécessaire pour la paie)."
              : "Employés n'ayant pas encore de compte d'accès à ITA Manager. Un compte peut être ouvert via l'action 'Ouvrir l'accès'."
          }
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
