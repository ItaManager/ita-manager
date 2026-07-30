import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerDerogations } from "@/lib/actions/remuneration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Dérogations salariales — ITA Manager",
};

export default async function DerogationsPage() {
  await verifierAccesPage("/remuneration/derogations");

  const derogations = await listerDerogations();

  const enAttente = derogations.filter((d) => d.statut === "EN_ATTENTE");
  const validees = derogations.filter((d) => d.statut === "VALIDEE");
  const refusees = derogations.filter((d) => d.statut === "REFUSEE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dérogations salariales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validation des salaires hors grille par la Direction Financière
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{enAttente.length}</p>
              </div>
              <Clock className="size-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold">{validees.length}</p>
              </div>
              <CheckCircle2 className="size-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refusées</p>
                <p className="text-2xl font-bold">{refusees.length}</p>
              </div>
              <XCircle className="size-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dérogations en attente */}
      {enAttente.length > 0 && (
        <Card className="border-warning bg-warning-soft/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="size-5 text-warning" />
              Demandes en attente de validation ({enAttente.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enAttente.map((derogation) => (
                <div
                  key={derogation.id}
                  className="border rounded-lg p-4 bg-background"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">
                        {derogation.employe.prenom} {derogation.employe.nom}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {derogation.employe.matricule}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {Number(derogation.montant).toLocaleString("fr-FR")}{" "}
                        FCFA
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fourchette : {Number(derogation.niveauMin).toLocaleString("fr-FR")} —{" "}
                        {Number(derogation.niveauMax).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      Motif :
                    </div>
                    <div className="text-sm">{derogation.motif}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Demandée le{" "}
                      {format(
                        new Date(derogation.demandeLe),
                        "d MMMM yyyy à HH:mm",
                        { locale: fr }
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XCircle className="size-3.5" />
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Valider
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dérogations validées */}
      {validees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success" />
              Dérogations validées ({validees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validees.map((derogation) => (
                <div
                  key={derogation.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {derogation.employe.prenom} {derogation.employe.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {derogation.employe.matricule} ·{" "}
                      {Number(derogation.montant).toLocaleString("fr-FR")} FCFA
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="border-success text-success"
                    >
                      Validée
                    </Badge>
                    {derogation.decideLe && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(
                          new Date(derogation.decideLe),
                          "d MMM yyyy",
                          { locale: fr }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dérogations refusées */}
      {refusees.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            <XCircle className="size-4" />
            Dérogations refusées ({refusees.length})
          </summary>

          <div className="mt-4">
            <Card>
              <CardContent className="py-4">
                <div className="space-y-3">
                  {refusees.map((derogation) => (
                    <div
                      key={derogation.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {derogation.employe.prenom} {derogation.employe.nom}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {derogation.employe.matricule} ·{" "}
                          {Number(derogation.montant).toLocaleString("fr-FR")}{" "}
                          FCFA
                        </div>
                        {derogation.commentaire && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Motif refus : {derogation.commentaire}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="border-destructive text-destructive"
                        >
                          Refusée
                        </Badge>
                        {derogation.decideLe && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(derogation.decideLe),
                              "d MMM yyyy",
                              { locale: fr }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </details>
      )}

      {/* État vide */}
      {derogations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune dérogation salariale
            </h3>
            <p className="text-sm text-muted-foreground">
              Les demandes de salaires hors grille apparaîtront ici pour
              validation.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-warning bg-warning-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>⚠️ Règle critique :</strong> Tant qu'une dérogation est en
            attente, l'employé est <strong>exclu des exports de paie</strong>.
            Valider ou refuser rapidement pour ne pas bloquer le cycle de paie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
