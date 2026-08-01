import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerGrilles } from "@/lib/actions/remuneration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Archive, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function GrilleSalarialeListPage() {
  await verifierAccesPage("/remuneration/grille");

  const grilles = await listerGrilles();

  const grillePubliee = grilles.find((g) => g.statut === "PUBLIEE");
  const brouillons = grilles.filter((g) => g.statut === "BROUILLON");
  const archives = grilles.filter((g) => g.statut === "ARCHIVEE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Grille salariale</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion des fourchettes de rémunération par niveau hiérarchique
          </p>
        </div>
        <Button className="rounded-full">
          <Plus className="size-4" />
          Nouvelle version
        </Button>
      </div>

      {/* Grille publiée */}
      {grillePubliee && (
        <Card className="border-success bg-success-soft/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" />
                Version {grillePubliee.version} — Grille en vigueur
              </CardTitle>
              <Badge variant="outline" className="border-success text-success">
                Publiée
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {grillePubliee.dateEffet && (
              <p className="text-sm text-muted-foreground mb-4">
                En application depuis le{" "}
                {format(new Date(grillePubliee.dateEffet), "d MMMM yyyy", {
                  locale: fr,
                })}
              </p>
            )}

            <div className="space-y-3">
              {grillePubliee.echelons.map((echelon) => (
                <div
                  key={echelon.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="font-medium text-sm">{echelon.niveau}</div>
                  <div className="text-right">
                    <div className="text-sm">
                      {Number(echelon.min).toLocaleString("fr-FR")} —{" "}
                      {Number(echelon.max).toLocaleString("fr-FR")} FCFA
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Médiane: {Number(echelon.med).toLocaleString("fr-FR")}{" "}
                      FCFA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brouillons */}
      {brouillons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="size-5" />
            Brouillons ({brouillons.length})
          </h2>

          {brouillons.map((grille) => (
            <Card key={grille.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Version {grille.version}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Brouillon</Badge>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Publier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  Créée le{" "}
                  {format(new Date(grille.creeLe), "d MMMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </div>

                <div className="space-y-2">
                  {grille.echelons.map((echelon) => (
                    <div
                      key={echelon.id}
                      className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                    >
                      <div className="font-medium">{echelon.niveau}</div>
                      <div className="text-muted-foreground">
                        {Number(echelon.min).toLocaleString("fr-FR")} —{" "}
                        {Number(echelon.max).toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Archives */}
      {archives.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            <Archive className="size-4" />
            Versions archivées ({archives.length})
          </summary>

          <div className="mt-4 space-y-3">
            {archives.map((grille) => (
              <Card key={grille.id} className="border-border/50 bg-muted/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        Version {grille.version}
                      </div>
                      {grille.dateEffet && (
                        <div className="text-xs text-muted-foreground">
                          Appliquée du{" "}
                          {format(
                            new Date(grille.dateEffet),
                            "d MMMM yyyy",
                            {
                              locale: fr,
                            }
                          )}{" "}
                          au{" "}
                          {grillePubliee?.dateEffet
                            ? format(
                                new Date(grillePubliee.dateEffet),
                                "d MMMM yyyy",
                                { locale: fr }
                              )
                            : "—"}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">Archivée</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </details>
      )}

      {/* État vide */}
      {grilles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune grille salariale
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez la première version pour définir les fourchettes de
              rémunération par niveau hiérarchique.
            </p>
            <Button className="rounded-full">
              <Plus className="size-4" />
              Créer la première version
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-info bg-info-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Règles de gestion :</strong>
          </p>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Une grille publiée ne peut plus être modifiée (immuable)</li>
            <li>
              La publication archive automatiquement la version précédente
            </li>
            <li>
              Les salaires hors nouvelle fourchette passent en dérogation
              automatique
            </li>
            <li>Fourchette requise : min &lt; médiane &lt; max</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
