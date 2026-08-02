import { listerEvenements } from "@/lib/actions/audit";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ListeEvenementsProps {
  curseur?: string;
  entite?: string;
  entiteId?: string;
  action?: string;
  auteurId?: string;
}

const COULEURS_ACTION: Record<string, string> = {
  CREATION: "bg-success-soft text-success dark:bg-success dark:text-success",
  MODIFICATION: "bg-primary-soft text-primary dark:bg-primary dark:text-primary",
  ARCHIVAGE: "bg-warning-soft text-warning dark:bg-warning dark:text-warning",
  REFUS: "bg-destructive-soft text-destructive dark:bg-destructive dark:text-destructive",
  VALIDATION: "bg-review-soft text-review dark:bg-review dark:text-review",
};

export async function ListeEvenements({
  curseur,
  entite,
  entiteId,
  action,
  auteurId,
}: ListeEvenementsProps) {
  const { evenements, prochainCurseur, aPageSuivante } =
    await listerEvenements({
      curseur,
      entite,
      entiteId,
      action,
      auteurId,
    });

  return (
    <Card className="mt-6">
      <CardHeader className="border-b">
        <p className="text-sm text-muted-foreground">
          {evenements.length} événement{evenements.length > 1 ? "s" : ""}
        </p>
      </CardHeader>

      {evenements.length === 0 ? (
        <CardContent className="py-12 text-center">
          <FileText
            className="mx-auto size-12 text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun événement trouvé.
          </p>
        </CardContent>
      ) : (
        <>
          <CardContent className="p-0">
            <div className="divide-y">
              {evenements.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  {/* Icône action */}
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      COULEURS_ACTION[evt.action] || "bg-muted"
                    }`}
                  >
                    <span className="text-xs font-bold">
                      {evt.action.slice(0, 2)}
                    </span>
                  </div>

                  {/* Détails */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={COULEURS_ACTION[evt.action]}
                      >
                        {evt.action}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {evt.entite}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground">
                      {evt.auteurNom}
                      {evt.auteur && evt.auteur.roles.length > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {evt.auteur.roles[0].role.libelle}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {format(
                          new Date(evt.survenuLe),
                          "d MMMM yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </span>
                      <span className="font-mono">ID: {evt.entiteId.slice(0, 8)}</span>
                    </div>

                    {evt.commentaire && (
                      <p className="text-xs text-muted-foreground italic">
                        {evt.commentaire}
                      </p>
                    )}

                    {evt.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary hover:underline">
                          Voir les détails
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-xs">
                          {JSON.stringify(evt.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          {/* Pagination curseur */}
          {aPageSuivante && (
            <div className="border-t p-4 text-center">
              <Button variant="outline" asChild>
                <Link
                  href={`/admin/journal?curseur=${prochainCurseur}${entite ? `&entite=${entite}` : ""}${entiteId ? `&entiteId=${entiteId}` : ""}${action ? `&action=${action}` : ""}${auteurId ? `&auteurId=${auteurId}` : ""}`}
                  className="gap-2"
                >
                  Charger plus
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
