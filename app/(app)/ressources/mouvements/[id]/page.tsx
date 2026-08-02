import { notFound } from "next/navigation";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const SENS_CONFIG = {
  ENTREE: { label: "Entrée", variant: "default" as const, color: "text-success" },
  SORTIE: { label: "Sortie", variant: "destructive" as const, color: "text-destructive" },
  AJUSTEMENT: { label: "Ajustement", variant: "secondary" as const, color: "text-warning" },
} as const;

type PageParams = Promise<{
  id: string;
}>;

export default async function PageDetailMouvement({
  params,
}: {
  params: PageParams;
}) {
  await exigerPermission(PERMISSIONS["stock:mouvementer"].code);

  const { id } = await params;

  const bon = await prisma.bonMouvement.findUnique({
    where: { id },
    include: {
      mouvements: {
        include: {
          articleStock: {
            select: {
              id: true,
              designation: true,
              reference: true,
            },
          },
        },
      },
      lieuOrigine: {
        select: { id: true, libelle: true },
      },
      lieuDestination: {
        select: { id: true, libelle: true },
      },
    },
  });

  if (!bon) {
    notFound();
  }

  const sensConfig = SENS_CONFIG[bon.sens];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ressources/mouvements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" aria-label="Retour" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-mono">{bon.reference}</h1>
            <p className="text-muted-foreground mt-1">
              Bon de mouvement · {sensConfig.label}
            </p>
          </div>
        </div>

        <Badge variant={sensConfig.variant}>{sensConfig.label}</Badge>
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
              <p className="text-base mt-1 font-mono">{bon.reference}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Date du mouvement
              </label>
              <p className="text-base mt-1">
                {format(new Date(bon.dateMouvement), "PPP", { locale: fr })}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Sens
              </label>
              <div className="mt-1">
                <Badge variant={sensConfig.variant}>{sensConfig.label}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Émetteur
              </label>
              <p className="text-base mt-1">{bon.emetteurNom}</p>
            </div>

            {bon.valideParId && bon.valideLe && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Validation
                </label>
                <p className="text-base mt-1 text-success">
                  Validé le {format(new Date(bon.valideLe), "PPP", { locale: fr })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails du mouvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Motif
              </label>
              <p className="text-base mt-1">{bon.motif}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Itinéraire
              </label>
              <div className="flex items-center gap-2 mt-1">
                {bon.lieuOrigine ? (
                  <span className="text-base">{bon.lieuOrigine.libelle}</span>
                ) : (
                  <span className="text-muted-foreground italic">Externe</span>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-label="vers" />
                {bon.lieuDestination ? (
                  <span className="text-base">{bon.lieuDestination.libelle}</span>
                ) : (
                  <span className="text-muted-foreground italic">Externe</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lignes du mouvement */}
      <Card>
        <CardHeader>
          <CardTitle>Articles ({bon.mouvements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bon.mouvements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun article dans ce bon de mouvement
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Montant total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bon.mouvements.map((mouvement) => {
                  const prixUnitaire = mouvement.prixUnitaire
                    ? parseFloat(mouvement.prixUnitaire.toString())
                    : 0;
                  const quantite = parseFloat(mouvement.quantite.toString());
                  const montantTotal = prixUnitaire * quantite;

                  return (
                    <TableRow key={mouvement.id}>
                      <TableCell className="font-mono text-sm">
                        {mouvement.articleStock.reference}
                      </TableCell>
                      <TableCell>{mouvement.articleStock.designation}</TableCell>
                      <TableCell className="text-right">
                        {mouvement.quantite.toString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {prixUnitaire > 0
                          ? `${prixUnitaire.toLocaleString("fr-FR")} FCFA`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {prixUnitaire > 0
                          ? `${montantTotal.toLocaleString("fr-FR")} FCFA`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
