import { prisma } from "@/lib/db/prisma";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

export async function IndicateursProjets() {
  // Compter les projets par statut
  const [total, enCours, ouverts, clotures, suspendus] = await Promise.all([
    prisma.projet.count(),
    prisma.projet.count({ where: { statut: "EN_COURS" } }),
    prisma.projet.count({ where: { statut: "OUVERT" } }),
    prisma.projet.count({ where: { statut: "CLOTURE" } }),
    prisma.projet.count({ where: { statut: "SUSPENDU" } }),
  ]);

  // Calculer montant total des marchés en cours
  const projetsEnCours = await prisma.projet.findMany({
    where: { statut: "EN_COURS" },
    select: { montantMarche: true },
  });

  const montantTotal = projetsEnCours.reduce((sum, p) => {
    return sum + (p.montantMarche ? Number(p.montantMarche) : 0);
  }, 0);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total projets */}
        <CardIndicateur
          label="Total projets"
          helpText="Nombre total de projets créés, tous statuts confondus (brouillon, ouvert, en cours, suspendu, clôturé)."
          value={total}
          chart={
            <MiniGraphBarres
              values={[2, 4, 3, 6, 5, 8, total]}
            />
          }
        />

        {/* En cours */}
        <CardIndicateur
          label="En cours"
          helpText="Projets actuellement actifs sur le terrain. Les équipes sont affectées et les tâches progressent."
          value={enCours}
          valueColor={enCours > 0 ? "#2563eb" : "#18181a"}
          chart={
            <MiniGraphProgression
              percentage={total > 0 ? (enCours / total) * 100 : 0}
            />
          }
        />

        {/* Ouverts */}
        <CardIndicateur
          label="Ouverts"
          helpText="Projets validés et prêts à démarrer. En attente du début des travaux."
          value={ouverts}
          valueColor={ouverts > 0 ? "#f59e0b" : "#18181a"}
          chart={
            <MiniGraphCirculaire
              percentage={total > 0 ? ouverts / total : 0}
            />
          }
        />

        {/* Clôturés */}
        <CardIndicateur
          label="Clôturés"
          helpText="Projets terminés et livrés. Travaux achevés et réceptionnés."
          value={clotures}
          valueColor={clotures > 0 ? "#16a34a" : "#18181a"}
          chart={
            <MiniGraphBarres
              values={[1, 2, 3, 4, 5, 6, clotures]}
            />
          }
        />
      </div>
    </TooltipProvider>
  );
}
