import { notFound } from "next/navigation";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageParams = Promise<{
  id: string;
}>;

export default async function PageDetailArticle({
  params,
}: {
  params: PageParams;
}) {
  await exigerPermission(PERMISSIONS["referentiel:creer"].code);

  const { id } = await params;

  const article = await prisma.articleStock.findUnique({
    where: { id },
    include: {
      mouvements: {
        take: 10,
        orderBy: { creeLe: "desc" },
      },
    },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ressources/articles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" aria-label="Retour" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{article.designation}</h1>
            <p className="text-muted-foreground mt-1">
              Article de stock · {article.reference}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Modifier
          </Button>
          <Button variant="outline" disabled>
            Désactiver
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Référence
              </label>
              <p className="text-base mt-1 font-mono">{article.reference}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Désignation
              </label>
              <p className="text-base mt-1">{article.designation}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Famille
              </label>
              {article.famille ? (
                <div className="mt-1">
                  <Badge variant="outline">{article.famille}</Badge>
                </div>
              ) : (
                <p className="text-base mt-1 text-muted-foreground italic">
                  Aucune famille
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Unité
              </label>
              <p className="text-base mt-1">{article.unite}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Seuil d&apos;alerte
              </label>
              {article.seuilAlerte ? (
                <p className="text-base mt-1">
                  {article.seuilAlerte.toString()} {article.unite}
                </p>
              ) : (
                <p className="text-base mt-1 text-muted-foreground italic">
                  Non défini
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Statut
              </label>
              <div className="mt-1">
                <Badge variant={article.actif ? "default" : "secondary"}>
                  {article.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Solde actuel, mouvements mensuels et alertes à venir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder pour mouvements récents */}
      <Card>
        <CardHeader>
          <CardTitle>Mouvements récents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Historique des entrées/sorties/transferts à venir
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
