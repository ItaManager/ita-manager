import { listerTousContrats } from "@/lib/actions/employes";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
} from "@/components/indicateurs";

export async function IndicateursContrats() {
  const tousLesContrats = await listerTousContrats();

  const contratsActifs = tousLesContrats.filter((c) => c.actif);
  const cddActifs = contratsActifs.filter((c) => c.typeContrat === "CDD");
  const cdiActifs = contratsActifs.filter((c) => c.typeContrat === "CDI");

  // Contrats avec alerte d'expiration (danger = 30j, warning = 60j)
  const contratsEnAlerte = contratsActifs.filter(
    (c) => c.niveauAlerte === "danger" || c.niveauAlerte === "warning"
  );

  const pourcentageCDD = contratsActifs.length > 0
    ? cddActifs.length / contratsActifs.length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total contrats actifs */}
      <CardIndicateur
        label="Contrats actifs"
        helpText="Nombre total de contrats de travail en cours (CDI, CDD, Intérim, Stage)."
        value={contratsActifs.length}
        chart={
          <MiniGraphBarres
            values={[45, 48, 52, 55, 58, 61, contratsActifs.length]}
          />
        }
      />

      {/* CDD actifs */}
      <CardIndicateur
        label="CDD en cours"
        helpText="Contrats à durée déterminée actifs. Ces contrats nécessitent un suivi d'expiration."
        value={cddActifs.length}
        chart={
          <MiniGraphCirculaire percentage={pourcentageCDD} />
        }
      />

      {/* CDI actifs */}
      <CardIndicateur
        label="CDI en cours"
        helpText="Contrats à durée indéterminée actifs. Ces contrats n'ont pas de date de fin."
        value={cdiActifs.length}
        chart={
          <MiniGraphBarres
            values={[20, 22, 24, 26, 28, 30, cdiActifs.length]}
          />
        }
      />

      {/* Contrats expirant bientôt */}
      <CardIndicateur
        label="Expiration prochaine"
        helpText="CDD expirant dans les 60 prochains jours. Nécessitent un renouvellement ou une clôture."
        value={contratsEnAlerte.length}
        valueColor={contratsEnAlerte.length > 0 ? "#dc2626" : "#18181a"}
        chart={
          <MiniGraphBarres
            values={[8, 7, 6, 5, 4, 3, contratsEnAlerte.length]}
            color={contratsEnAlerte.length > 0 ? "#dc2626" : "#13850b"}
          />
        }
      />
    </div>
  );
}
