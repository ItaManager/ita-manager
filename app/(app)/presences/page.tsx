import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerPointages } from "@/lib/actions/presences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, AlertCircle } from "lucide-react";

export default async function RegistrePresencesPage() {
  await verifierAccesPage("/presences");

  const { items: pointages } = await listerPointages({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Registre des présences</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique des pointages bureau
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pointages récents ({pointages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pointages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun pointage enregistré
            </p>
          ) : (
            <div className="space-y-2">
              {pointages.map((pointage) => (
                <div
                  key={pointage.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {pointage.employe.prenom} {pointage.employe.nom}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pointage.employe.matricule}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm">
                        {format(new Date(pointage.horodatage), "HH:mm")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(pointage.horodatage), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          pointage.type === "ARRIVEE" ? "default" : "secondary"
                        }
                      >
                        {pointage.type === "ARRIVEE" ? "Arrivée" : "Départ"}
                      </Badge>

                      {pointage.estCorrection && (
                        <Badge variant="outline" className="text-xs">
                          Correction
                        </Badge>
                      )}

                      {pointage.estAnomalie && (
                        <Badge
                          variant="outline"
                          className="border-warning text-warning"
                        >
                          <AlertCircle className="size-3 mr-1" />
                          Anomalie
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-info bg-info-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note :</strong> Le registre des présences est à titre
            informatif uniquement. Les pointages bureau n'ont aucun effet sur la
            paie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
