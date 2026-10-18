import { notFound } from "next/navigation";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ISSUE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CONFORME: { label: "Conforme", variant: "default" },
  AVEC_RESERVE: { label: "Avec réserve", variant: "secondary" },
  NON_CONFORME: { label: "Non conforme", variant: "destructive" },
};

type PageParams = Promise<{
  id: string;
}>;

export default async function PageDetailReception({
  params,
}: {
  params: PageParams;
}) {
  await exigerPermission(PERMISSIONS["reception:controler"].code);

  const { id } = await params;

  const reception = await prisma.reception.findUnique({
    where: { id },
    include: {
      lignes: {
        include: {
          articleStock: {
            select: {
              reference: true,
              designation: true,
              unite: true,
            },
          },
        },
      },
    },
  });

  if (!reception) {
    notFound();
  }

  const estEnAttente = !reception.issue;
  const issueConfig = reception.issue ? ISSUE_LABELS[reception.issue] : null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ressources/receptions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" aria-label="Retour" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold">{reception.reference}</h1>
            <p className="text-muted-foreground mt-1">
              Réception de marchandise
            </p>
          </div>
        </div>

        {estEnAttente && (
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Refuser
            </Button>
            <Button disabled>
              Valider
            </Button>
          </div>
        )}
      </div>

      {/* En-tête de la réception */}
      <Card>
        <CardHeader>
          <CardTitle>En-tête</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Référence
              </label>
              <p className="text-sm mt-1 font-mono">{reception.reference}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Date de réception
              </label>
              <p className="text-sm mt-1">
                {new Date(reception.dateReception).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fournisseur
              </label>
              <p className="text-sm mt-1">{reception.fournisseurNom}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Issue de la réception
              </label>
              <div className="mt-1">
                {issueConfig ? (
                  <Badge variant={issueConfig.variant}>{issueConfig.label}</Badge>
                ) : (
                  <Badge variant="outline">En attente de validation</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails de la réception */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la réception</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Réceptionné par
              </label>
              <p className="text-sm mt-1">{reception.receptionneParNom}</p>
            </div>

            {reception.valideParId && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Validé le
                  </label>
                  <p className="text-sm mt-1">
                    {reception.valideLe
                      ? new Date(reception.valideLe).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                </div>
              </>
            )}

            {reception.motifRefus && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Motif de refus
                </label>
                <p className="text-sm mt-1">{reception.motifRefus}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lignes de réception */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes de réception</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-sm">Article</th>
                  <th className="text-left py-2 px-4 font-medium text-sm">Désignation</th>
                  <th className="text-right py-2 px-4 font-medium text-sm">Qté commandée</th>
                  <th className="text-right py-2 px-4 font-medium text-sm">Qté livrée</th>
                  <th className="text-right py-2 px-4 font-medium text-sm">Écart</th>
                  <th className="text-center py-2 px-4 font-medium text-sm">Conforme</th>
                </tr>
              </thead>
              <tbody>
                {reception.lignes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune ligne de réception
                    </td>
                  </tr>
                ) : (
                  reception.lignes.map((ligne) => (
                    <tr key={ligne.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-mono text-sm">{ligne.articleStock.reference}</td>
                      <td className="py-2 px-4">{ligne.articleStock.designation}</td>
                      <td className="py-2 px-4 text-right">
                        {ligne.quantiteCommandee.toString()} {ligne.articleStock.unite}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {ligne.quantiteLivree.toString()} {ligne.articleStock.unite}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {ligne.ecart.toString()} {ligne.articleStock.unite}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <Badge variant={ligne.conforme ? "default" : "destructive"}>
                          {ligne.conforme ? "Oui" : "Non"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
