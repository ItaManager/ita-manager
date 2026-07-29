import { listerDirections } from "@/lib/actions/organisation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Users, Briefcase, Info, Lock } from "lucide-react";

export async function ListeDirections() {
  const directions = await listerDirections();

  if (directions.length === 0) {
    return (
      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertDescription>
          Aucune direction enregistrée. La création des directions est réservée
          au Super Admin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <Lock className="size-4 text-blue-600" aria-hidden="true" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Lecture seule.</strong> La création et la modification des
          directions sont réservées au Super Admin pour éviter les
          réorganisations non maîtrisées.
        </AlertDescription>
      </Alert>

      {directions.map((direction) => (
        <Card key={direction.id}>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-6" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {direction.libelle}
                  <Badge variant="outline" className="font-mono text-xs">
                    {direction.code}
                  </Badge>
                  {direction.reserveAdmin && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="mr-1 size-3" aria-hidden="true" />
                      Admin
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ordre d'affichage : {direction.ordre}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Services */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4 text-primary" aria-hidden="true" />
                  Services
                </h3>
                {direction._count.services > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Cette direction compte{" "}
                      <strong>{direction._count.services}</strong> service
                      {direction._count.services > 1 ? "s" : ""}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Consultez l'écran{" "}
                      <a
                        href="/organisation/services"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Services
                      </a>{" "}
                      pour voir le détail.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun service dans cette direction.
                  </p>
                )}
              </div>

              {/* Postes */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="size-4 text-primary" aria-hidden="true" />
                  Postes
                </h3>
                {direction._count.postes > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Cette direction compte{" "}
                      <strong>{direction._count.postes}</strong> poste
                      {direction._count.postes > 1 ? "s" : ""}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Consultez l'écran{" "}
                      <a
                        href="/organisation/postes"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Postes
                      </a>{" "}
                      pour voir le détail.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun poste dans cette direction.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertDescription className="text-sm">
          <strong>Pourquoi lecture seule ?</strong> Une direction structure
          l'ensemble des circuits d'approbation (DECISIONS.md section B). La
          créer, la renommer ou l'archiver déclenche des effets en cascade sur
          les services, les postes, les affectations et les rôles. Ces opérations
          sont donc réservées au Super Admin, qui en comprend les implications.
        </AlertDescription>
      </Alert>
    </div>
  );
}
