import { statistiquesAchats } from "@/lib/actions/achats";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

export async function IndicateursAchats() {
  const stats = await statistiquesAchats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* À valider */}
        <CardIndicateur
          label="À valider (N+1)"
          helpText="Demandes d'achat de vos subordonnés en attente de votre validation."
          value={stats.aValider}
          valueColor={stats.aValider > 0 ? "#f59e0b" : "#18181a"}
          chart={
            <MiniGraphProgression
              percentage={
                stats.totalDemandes > 0
                  ? (stats.aValider / stats.totalDemandes) * 100
                  : 0
              }
            />
          }
        />

        {/* À instruire */}
        <CardIndicateur
          label="À instruire"
          helpText="Demandes validées par le N+1 en attente d'instruction par le Service Achats (consultation fournisseurs, prix)."
          value={stats.aInstruire}
          valueColor={stats.aInstruire > 0 ? "#1d186c" : "#18181a"}
          chart={
            <MiniGraphBarres
              values={[2, 3, 5, 4, 6, 5, stats.aInstruire]}
            />
          }
        />

        {/* Bons de commande */}
        <CardIndicateur
          label="Bons de commande"
          helpText="Demandes instruites prêtes pour émission du bon de commande."
          value={stats.bonsCommande}
          chart={
            <MiniGraphCirculaire
              percentage={
                stats.totalDemandes > 0
                  ? stats.bonsCommande / stats.totalDemandes
                  : 0
              }
            />
          }
        />

        {/* Montant en cours */}
        <CardIndicateur
          label="Montant en cours"
          helpText="Montant total TTC des demandes d'achat non encore facturées."
          value={`${stats.montantEnCours.toLocaleString("fr-FR")} F`}
          chart={
            <MiniGraphBarres
              values={[1200000, 1500000, 1800000, 1600000, 2000000, 1900000, stats.montantEnCours]}
            />
          }
        />
      </div>
  );
}
