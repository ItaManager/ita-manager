import { statistiquesCompetences } from "@/lib/actions/competences";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
} from "@/components/indicateurs";

export async function IndicateursAgents() {
  const stats = await statistiquesCompetences();

  const agentsAvecCompetence = stats.totalAgents - stats.agentsSansCompetence;
  const pourcentageAvecCompetence = stats.totalAgents > 0
    ? agentsAvecCompetence / stats.totalAgents
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total agents */}
      <CardIndicateur
        label="Agents journaliers"
        helpText="Nombre total d'agents journaliers actifs dans l'entreprise."
        value={stats.totalAgents}
        chart={
          <MiniGraphBarres
            values={[12, 15, 18, 22, 25, 28, stats.totalAgents]}
          />
        }
      />

      {/* Agents sans compétence */}
      <CardIndicateur
        label="Agents sans compétence"
        helpText="Agents journaliers sans compétence assignée. Ils ne peuvent pas être pointés au relevé d'activité car sans taux, aucun montant ne peut être calculé."
        value={stats.agentsSansCompetence}
        valueColor={stats.agentsSansCompetence > 0 ? "#dc2626" : "#18181a"}
        chart={
          <MiniGraphBarres
            values={[8, 6, 5, 4, 3, 2, stats.agentsSansCompetence]}
            color={stats.agentsSansCompetence > 0 ? "#dc2626" : "#13850b"}
          />
        }
      />

      {/* Agents avec compétence */}
      <CardIndicateur
        label="Agents avec compétence"
        helpText="Agents journaliers ayant au moins une compétence assignée avec un taux journalier. Ils peuvent être pointés au relevé d'activité."
        value={agentsAvecCompetence}
        chart={
          <MiniGraphCirculaire
            percentage={pourcentageAvecCompetence}
          />
        }
      />

      {/* Coût journalier total */}
      <CardIndicateur
        label="Coût journalier total"
        helpText="Somme des taux journaliers de tous les agents ayant une compétence assignée. Représente le coût théorique journalier si tous les agents travaillent."
        value={`${stats.coutJournalier.toLocaleString("fr-FR")} F`}
        chart={
          <MiniGraphBarres
            values={[120000, 135000, 142000, 158000, 165000, 172000, stats.coutJournalier]}
          />
        }
      />
    </div>
  );
}
