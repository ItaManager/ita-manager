import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerAppelsOffres, statistiquesAppelsOffres } from "@/lib/actions/appels-offres";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BoutonNouvelAO } from "./_components/bouton-nouvel-ao";
import { FiltresAO } from "./_components/filtres-ao";

export const metadata = {
  title: "Appels d'offres — ITA Manager",
};

type SearchParams = Promise<{
  statut?: string;
  typeMarche?: string;
  recherche?: string;
  cursor?: string;
}>;

export default async function AppelsOffresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await verifierAccesPage("/appels-offres");

  const params = await searchParams;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-6" />
            Appels d'offres
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des opportunités commerciales
          </p>
        </div>

        <BoutonNouvelAO />
      </div>

      <Suspense fallback={<SqueletteStatistiques />}>
        <StatistiquesAO />
      </Suspense>

      <div className="mt-6">
        <FiltresAO />
      </div>

      <Suspense fallback={<SqueletteListe />}>
        <ListeAO searchParams={params} />
      </Suspense>
    </div>
  );
}

async function StatistiquesAO() {
  const stats = await statistiquesAppelsOffres();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            En veille
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.enVeille}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Go validé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.enGo}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Constitution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.enConstitution}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Soumis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.soumis}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Gagnés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{stats.gagnes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Perdus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">{stats.perdus}</div>
        </CardContent>
      </Card>

      <Card className="border-success-soft bg-success-soft/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <TrendingUp className="size-3" />
            Taux de réussite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{stats.tauxReussite}%</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ListeAO({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const { items: appelsOffres, hasNextPage, nextCursor } = await listerAppelsOffres({
    statut: searchParams.statut as any,
    typeMarche: searchParams.typeMarche as any,
    rechercheTexte: searchParams.recherche,
    cursor: searchParams.cursor,
  });

  if (appelsOffres.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="py-12 text-center">
          <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {searchParams.statut || searchParams.recherche
              ? "Aucun appel d'offres ne correspond à vos critères"
              : "Aucun appel d'offres enregistré"}
          </p>
          {!searchParams.statut && !searchParams.recherche && (
            <p className="text-xs text-muted-foreground mt-2">
              Créez votre premier appel d'offres pour commencer
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {appelsOffres.map((ao) => (
        <Link key={ao.id} href={`/appels-offres/${ao.id}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{ao.reference}</span>
                    <BadgeStatut statut={ao.statut} />
                    <Badge variant="outline" className="text-xs">
                      {ao.typeMarche}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {ao.maitreOuvrage}
                  </p>

                  <p className="text-sm line-clamp-1">{ao.objet}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      Dépôt :{" "}
                      <time className="font-medium">
                        {format(new Date(ao.dateLimiteDepot), "d MMM yyyy", { locale: fr })}
                      </time>
                    </span>

                    {ao.montantEstime && (
                      <span>
                        Estimé :{" "}
                        <span className="font-medium">
                          {Number(ao.montantEstime).toLocaleString("fr-FR")} FCFA
                        </span>
                      </span>
                    )}

                    {(ao as any).pieces && (ao as any).pieces.length > 0 && (
                      <span>
                        Pièces : {(ao as any).pieces.filter((p: any) => p.deposeLe).length}/{(ao as any).pieces.length}
                      </span>
                    )}

                    {(ao as any).concurrents && (ao as any).concurrents.length > 0 && (
                      <span>{(ao as any).concurrents.length} concurrent(s)</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {hasNextPage && nextCursor && (
        <div className="flex justify-center pt-4">
          <Link
            href={`/appels-offres?${new URLSearchParams({
              ...searchParams,
              cursor: nextCursor,
            }).toString()}`}
          >
            <Button variant="outline" size="sm">
              Charger plus
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function BadgeStatut({ statut }: { statut: string }) {
  const config = {
    VEILLE: { label: "Veille", variant: "secondary" as const },
    GO: { label: "Go", variant: "default" as const },
    ABANDONNE: { label: "Abandonné", variant: "secondary" as const },
    CONSTITUTION: { label: "Constitution", variant: "default" as const },
    SOUMIS: { label: "Soumis", variant: "default" as const },
    GAGNE: { label: "Gagné", variant: "default" as const },
    PERDU: { label: "Perdu", variant: "outline" as const },
  };

  const { label, variant } = config[statut as keyof typeof config] || {
    label: statut,
    variant: "secondary" as const,
  };

  return (
    <Badge
      variant={variant}
      className={statut === "GAGNE" ? "bg-success text-success-foreground" : undefined}
    >
      {label}
    </Badge>
  );
}

function SqueletteStatistiques() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-3 bg-muted rounded w-16" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SqueletteListe() {
  return (
    <div className="space-y-4 mt-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="py-4">
            <div className="h-4 bg-muted rounded w-32 mb-2" />
            <div className="h-3 bg-muted rounded w-48 mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
