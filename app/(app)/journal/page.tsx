import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { rechercherJournal } from "@/lib/actions/administration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Download } from "lucide-react";
import { BoutonExportJournal } from "./_components/bouton-export-journal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const metadata = {
  title: "Journal d'audit — ITA Manager",
};

type SearchParams = {
  dateDebut?: string;
  dateFin?: string;
  auteurId?: string;
  entite?: string;
  action?: string;
  cursor?: string;
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await verifierAccesPage("/journal");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ScrollText className="size-6" />
            Journal d'audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique des événements et décisions opposables
          </p>
        </div>

        <BoutonExportJournal filtres={searchParams} />
      </div>

      <Suspense fallback={<SqueletteJournal />}>
        <ListeEvenements searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ListeEvenements({ searchParams }: { searchParams: SearchParams }) {
  const { items: evenements, hasNextPage, nextCursor } = await rechercherJournal(
    searchParams
  );

  if (evenements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ScrollText className="size-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-sm text-muted-foreground">Aucun événement trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{evenements.length} événement(s) trouvé(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evenements.map((evt) => (
              <div
                key={evt.id}
                className="rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">
                        {evt.entite}
                      </Badge>
                      <Badge
                        className={
                          evt.action === "CREATION"
                            ? "bg-success/10 text-success border-success"
                            : evt.action === "MODIFICATION"
                            ? "bg-primary/10 text-primary border-primary"
                            : evt.action === "VALIDATION"
                            ? "bg-success/10 text-success border-success"
                            : evt.action === "REFUS"
                            ? "bg-warning/10 text-warning border-warning"
                            : evt.action === "ARCHIVAGE"
                            ? "bg-muted text-muted-foreground border-muted-foreground"
                            : "bg-muted"
                        }
                      >
                        {evt.action}
                      </Badge>
                    </div>
                  </div>

                  <time className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(evt.survenuLe), "d MMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </time>
                </div>

                {evt.commentaire && (
                  <p className="text-sm mb-2">{evt.commentaire}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Par <strong>{evt.auteurNom}</strong>
                  </span>
                  <span className="font-mono text-xs">ID: {evt.entiteId}</span>
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-6 text-center">
              <a
                href={`/journal?${new URLSearchParams({
                  ...searchParams,
                  cursor: nextCursor || "",
                }).toString()}`}
                className="text-sm text-primary hover:underline"
              >
                Charger plus d'événements
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardContent className="py-4 text-xs text-muted-foreground">
          <strong>Note :</strong> Le journal d'audit est en ajout seul. Aucune action de
          l'application ne permet de le modifier ni d'en supprimer une ligne. Les valeurs
          sensibles (salaires, RIB, numéros CNPS) n'y figurent pas — seuls les
          identifiants sont enregistrés.
        </CardContent>
      </Card>
    </div>
  );
}

function SqueletteJournal() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
