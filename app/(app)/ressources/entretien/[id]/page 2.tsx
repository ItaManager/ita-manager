import { Suspense } from "react";
import { notFound } from "next/navigation";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { obtenirEntretien, calculerTCO } from "@/lib/actions/entretien";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, Gauge, Coins, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { TypeEntretien } from "@prisma/client";

type PageParams = Promise<{
  id: string;
}>;

const TYPE_LABELS: Record<TypeEntretien, { label: string; variant: "default" | "secondary" | "outline" }> = {
  PREVENTIF: { label: "Préventif", variant: "default" },
  CURATIF: { label: "Curatif", variant: "secondary" },
  REVISION: { label: "Révision", variant: "outline" },
};

export default async function PageDetailEntretien({
  params,
}: {
  params: PageParams;
}) {
  await exigerPermission(PERMISSIONS["entretien:planifier"].code);

  const { id } = await params;

  // Charger les données en parallèle
  let entretien;
  let tco;

  try {
    [entretien, tco] = await Promise.all([
      obtenirEntretien(id),
      calculerTCO(""), // Sera rempli avec l'ID du matériel
    ]);
  } catch (error) {
    notFound();
  }

  // Recalculer TCO avec le bon ID
  tco = await calculerTCO(entretien.materiel.id);

  const statut = entretien.dateFin ? "TERMINE" : "EN_COURS";
  const typeConfig = TYPE_LABELS[entretien.type];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ressources/entretien">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Détail de l'entretien</h1>
          <p className="text-muted-foreground mt-2">
            {entretien.materiel.codeIta} - {entretien.materiel.designation}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
          <Badge variant={statut === "EN_COURS" ? "secondary" : "default"}>
            {statut === "EN_COURS" ? "En cours" : "Terminé"}
          </Badge>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
              <CardDescription>Détails de l'entretien</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Date de début</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entretien.dateDebut).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {entretien.dateFin && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Date de fin</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entretien.dateFin).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Technicien</div>
                  <div className="text-sm text-muted-foreground">
                    {entretien.technicien}
                  </div>
                </div>
              </div>

              {entretien.compteur && (
                <div className="flex items-start gap-3">
                  <Gauge className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Compteur</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {entretien.compteur.toLocaleString("fr-FR")}
                    </div>
                  </div>
                </div>
              )}

              {entretien.cout && (
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Coût</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {entretien.cout.toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })} F
                    </div>
                  </div>
                </div>
              )}

              {entretien.plan && (
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Plan d'entretien</div>
                    <div className="text-sm text-muted-foreground">
                      {entretien.plan.description}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TCO */}
          <Card>
            <CardHeader>
              <CardTitle>Coût total de possession (TCO)</CardTitle>
              <CardDescription>
                Coûts cumulés du matériel depuis l'acquisition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Acquisition</span>
                  <span className="font-mono text-sm">
                    {tco.coutAcquisition.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} F
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entretiens</span>
                  <span className="font-mono text-sm">
                    {tco.coutEntretiens.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} F
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pièces administratives</span>
                  <span className="font-mono text-sm">
                    {tco.coutPieces.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} F
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-mono text-lg font-semibold">
                    {tco.total.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} F
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description et observations */}
        {(entretien.description || entretien.observations) && (
          <Card>
            <CardHeader>
              <CardTitle>Détails supplémentaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {entretien.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Description</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {entretien.description}
                  </p>
                </div>
              )}

              {entretien.observations && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Observations</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {entretien.observations}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {!entretien.dateFin && (
          <div className="flex justify-end">
            <Button disabled>Terminer l'entretien</Button>
          </div>
        )}
      </Suspense>
    </div>
  );
}
