import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerTousContrats } from "@/lib/actions/employes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileSignature, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export const metadata = {
  title: "Contrats — ITA Manager",
};

export default async function ContratsPage() {
  await verifierAccesPage("/contrats");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <FileSignature className="size-6" />
          Contrats
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue globale des contrats actifs avec alertes échéances CDD
        </p>
      </div>

      <Suspense fallback={<SqueletteContrats />}>
        <ListeContrats />
      </Suspense>
    </div>
  );
}

async function ListeContrats() {
  const contrats = await listerTousContrats();

  // Séparer contrats actifs des autres
  const contratsActifs = contrats.filter((c) => c.actif);
  const contratsInactifs = contrats.filter((c) => !c.actif);

  // Compter alertes
  const alertes30j = contratsActifs.filter((c) => c.niveauAlerte === "danger").length;
  const alertes60j = contratsActifs.filter((c) => c.niveauAlerte === "warning").length;

  return (
    <div className="space-y-6">
      {/* Alertes échéances */}
      {(alertes30j > 0 || alertes60j > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {alertes30j > 0 && (
            <Alert className="border-destructive">
              <AlertTriangle className="size-4 text-destructive" />
              <AlertDescription>
                <strong className="text-destructive">{alertes30j} CDD à échéance &lt; 30 jours</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  Renouvellement ou tacite reconduction imminente
                </span>
              </AlertDescription>
            </Alert>
          )}

          {alertes60j > 0 && (
            <Alert className="border-warning-border bg-warning-soft">
              <AlertTriangle className="size-4 text-warning" />
              <AlertDescription>
                <strong className="text-warning">{alertes60j} CDD à échéance &lt; 60 jours</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  Préparer le renouvellement ou la clôture
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contrats actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{contratsActifs.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CDD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {contratsActifs.filter((c) => c.typeContrat === "CDD").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CDI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {contratsActifs.filter((c) => c.typeContrat === "CDI").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste contrats actifs */}
      <Card>
        <CardHeader>
          <CardTitle>Contrats actifs ({contratsActifs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contratsActifs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun contrat actif
            </p>
          ) : (
            <div className="space-y-3">
              {contratsActifs.map((contrat) => (
                <Link
                  key={contrat.id}
                  href={`/employes/${contrat.employe.id}`}
                  className="block rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {contrat.employe.nom} {contrat.employe.prenom}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {contrat.employe.matricule}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          Début : {format(new Date(contrat.dateDebut), "d MMM yyyy", { locale: fr })}
                        </span>

                        {contrat.dateFin && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            Fin : {format(new Date(contrat.dateFin), "d MMM yyyy", { locale: fr })}
                          </span>
                        )}

                        {contrat.derniersAvenants > 0 && (
                          <span className="text-xs">
                            {contrat.derniersAvenants} avenant(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={contrat.typeContrat === "CDI" ? "default" : "secondary"}
                      >
                        {contrat.typeContrat}
                      </Badge>

                      {!contrat.signe && (
                        <Badge variant="outline" className="text-warning border-warning">
                          Non signé
                        </Badge>
                      )}

                      {contrat.niveauAlerte === "danger" && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="size-3" />
                          &lt; 30j
                        </Badge>
                      )}

                      {contrat.niveauAlerte === "warning" && (
                        <Badge className="gap-1 bg-warning text-warning-foreground">
                          <AlertTriangle className="size-3" />
                          &lt; 60j
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SqueletteContrats() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
