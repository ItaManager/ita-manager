import { notFound } from "next/navigation";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { listerProjets } from "@/lib/actions/projets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ActionsLieu } from "./_components/actions-lieu";

const NATURE_LABELS: Record<string, string> = {
  SITE: "Site",
  CHANTIER: "Chantier",
  GARAGE: "Garage",
  MAGASIN: "Magasin",
  BUREAU: "Bureau",
};

type PageParams = Promise<{
  id: string;
}>;

export default async function PageDetailLieu({
  params,
}: {
  params: PageParams;
}) {
  await exigerPermission(PERMISSIONS["materiel:lire"].code);

  const { id } = await params;

  const [lieu, projets] = await Promise.all([
    prisma.lieuStockage.findUnique({
      where: { id },
      include: {
        projet: {
          select: { id: true, code: true, nom: true },
        },
      },
    }),
    listerProjets(),
  ]);

  if (!lieu) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ressources/lieux">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" aria-label="Retour" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{lieu.libelle}</h1>
            <p className="text-muted-foreground mt-1">
              Lieu de stockage · {NATURE_LABELS[lieu.nature]}
            </p>
          </div>
        </div>

        <ActionsLieu lieu={lieu} projets={projets} />
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
                Libellé
              </label>
              <p className="text-base mt-1">{lieu.libelle}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nature
              </label>
              <div className="mt-1">
                <Badge variant="outline">{NATURE_LABELS[lieu.nature]}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Statut
              </label>
              <div className="mt-1">
                <Badge variant={lieu.actif ? "default" : "secondary"}>
                  {lieu.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rattachement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Projet associé
              </label>
              {lieu.projet ? (
                <p className="text-base mt-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    {lieu.projet.code}
                  </span>{" "}
                  — {lieu.projet.nom}
                </p>
              ) : (
                <p className="text-base mt-1 text-muted-foreground italic">
                  Aucun projet associé
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder pour futures sections */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire et mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Historique des mouvements de stock à venir
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
