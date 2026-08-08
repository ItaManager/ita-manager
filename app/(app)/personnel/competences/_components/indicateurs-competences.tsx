import { statistiquesCompetences } from "@/lib/actions/competences";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

export async function IndicateursCompetences() {
  const stats = await statistiquesCompetences();

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compétences actives */}
        <CardIndicateur
          label="Compétences actives"
          helpText="Compétences métier ayant un taux journalier défini et pouvant être assignées aux agents."
          value={stats.competencesActives}
          chart={
            <MiniGraphBarres
              values={[3, 5, 4, 7, 6, 8, stats.competencesActives]}
            />
          }
        />

        {/* En attente de taux */}
        <CardIndicateur
          label="En attente de taux"
          helpText="Compétences créées par la Direction Technique qui attendent la validation de la Direction Financière. Elles ne peuvent pas être assignées tant qu'aucun taux n'est fixé."
          value={stats.enAttenteDeTaux}
          valueColor={stats.enAttenteDeTaux > 0 ? "#f59e0b" : "#18181a"}
          chart={
            <MiniGraphProgression
              percentage={
                stats.competencesActives > 0
                  ? (stats.enAttenteDeTaux / stats.competencesActives) * 100
                  : 0
              }
            />
          }
        />

        {/* Agents sans compétence */}
        <CardIndicateur
          label="Agents sans compétence"
          helpText="Agents journaliers sans compétence assignée. Ils ne peuvent pas être pointés au relevé d'activité car sans taux, aucun montant ne peut être calculé."
          value={stats.agentsSansCompetence}
          chart={
            <MiniGraphCirculaire
              percentage={
                stats.totalAgents > 0
                  ? stats.agentsSansCompetence / stats.totalAgents
                  : 0
              }
            />
          }
        />

        {/* Coût journalier total */}
        <CardIndicateur
          label="Coût journalier total"
          helpText="Somme des taux journaliers de toutes les compétences actives. Représente le coût théorique journalier maximal si tous les postes étaient occupés."
          value={`${stats.coutJournalier.toLocaleString("fr-FR")} F`}
          chart={
            <MiniGraphBarres
              values={[45000, 52000, 48000, 55000, 51000, 58000, stats.coutJournalier]}
            />
          }
        />
      </div>
    </TooltipProvider>
  );
}
