import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
} from "@/components/indicateurs";

export async function IndicateursCarburant() {
  // TODO: Récupérer les vraies stats depuis la base
  const stats = {
    demandesEnAttente: 5,
    stockGasoil: 1200, // Litres
    stockSuper: 800,
    consommationMois: 3500,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardIndicateur
        label="Demandes en attente"
        helpText="Demandes de carburant en attente de validation ou de distribution"
        value={stats.demandesEnAttente}
        valueColor={stats.demandesEnAttente > 0 ? "#f59e0b" : "#18181a"}
        chart={<MiniGraphBarres values={[2, 4, 3, 6, 5]} />}
      />

      <CardIndicateur
        label="Stock Gasoil"
        helpText="Quantité de gasoil disponible dans les cuves (litres)"
        value={`${stats.stockGasoil} L`}
        chart={
          <MiniGraphCirculaire
            percentage={stats.stockGasoil / 2000}
          />
        }
      />

      <CardIndicateur
        label="Stock Super"
        helpText="Quantité de super disponible dans les cuves (litres)"
        value={`${stats.stockSuper} L`}
        chart={
          <MiniGraphCirculaire
            percentage={stats.stockSuper / 1500}
          />
        }
      />

      <CardIndicateur
        label="Consommation du mois"
        helpText="Quantité totale de carburant distribuée ce mois"
        value={`${stats.consommationMois.toLocaleString("fr-FR")} L`}
        chart={
          <MiniGraphBarres
            values={[2800, 3200, 2900, 3400, 3100, stats.consommationMois]}
          />
        }
      />
    </div>
  );
}
