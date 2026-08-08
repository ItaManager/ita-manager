import { listerTousContrats } from "@/lib/actions/employes";
import { AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

export async function ListeTaches() {
  const tousLesContrats = await listerTousContrats();
  const contratsActifs = tousLesContrats.filter((c) => c.actif);

  // Contrats en alerte (expiration < 60j)
  const contratsEnAlerte = contratsActifs
    .filter((c) => c.niveauAlerte === "danger" || c.niveauAlerte === "warning")
    .sort((a, b) => {
      if (!a.dateFin || !b.dateFin) return 0;
      return new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime();
    });

  if (contratsEnAlerte.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Aucun contrat nécessitant votre attention. Tous les contrats sont à jour.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contratsEnAlerte.map((contrat) => {
        const joursRestants = contrat.dateFin
          ? differenceInDays(new Date(contrat.dateFin), new Date())
          : null;

        const estDanger = contrat.niveauAlerte === "danger";

        return (
          <div
            key={contrat.id}
            className="flex items-start gap-3 p-3"
          >
            <AlertTriangle
              className={`size-4 mt-0.5 shrink-0 ${
                estDanger ? "text-red-600" : "text-orange-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                CDD de {contrat.employe.prenom} {contrat.employe.nom.toUpperCase()} expire dans {joursRestants} jour{joursRestants && joursRestants > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contrat.employe.matricule} · Échéance : {contrat.dateFin &&
                  format(new Date(contrat.dateFin), "dd/MM/yyyy", {
                    locale: fr,
                  })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
