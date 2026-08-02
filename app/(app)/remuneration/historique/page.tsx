import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerGrilles } from "@/lib/actions/remuneration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Archive, FileText, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    annee?: string;
    statut?: "BROUILLON" | "PUBLIEE" | "ARCHIVEE";
  }>;
}

export default async function HistoriqueGrillesPage({ searchParams }: PageProps) {
  await verifierAccesPage("/remuneration/grille");

  const params = await searchParams;
  const { annee, statut } = params;

  // Récupérer toutes les grilles
  const grilles = await listerGrilles();

  // Filtrer selon les paramètres
  const grillesFiltrees = grilles.filter((grille) => {
    // Filtre par année
    if (annee) {
      const anneeGrille = new Date(grille.creeLe).getFullYear();
      if (anneeGrille !== parseInt(annee, 10)) {
        return false;
      }
    }

    // Filtre par statut
    if (statut && grille.statut !== statut) {
      return false;
    }

    return true;
  });

  // Extraire les années disponibles
  const annees = Array.from(
    new Set(grilles.map((g) => new Date(g.creeLe).getFullYear()))
  ).sort((a, b) => b - a);

  const getBadgeStatut = (statutGrille: string) => {
    if (statutGrille === "PUBLIEE") {
      return (
        <Badge variant="outline" className="border-success text-success">
          Publiée
        </Badge>
      );
    } else if (statutGrille === "BROUILLON") {
      return <Badge variant="secondary">Brouillon</Badge>;
    } else {
      return <Badge variant="outline">Archivée</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/remuneration/grille">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="size-4" />
            Retour à la grille
          </Button>
        </Link>
      </div>

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold">Historique des grilles salariales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultation de toutes les versions de grille (publiées, brouillons, archivées)
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={annee || "tous"}
                onValueChange={(value) => {
                  const url = new URL(window.location.href);
                  if (value === "tous") {
                    url.searchParams.delete("annee");
                  } else {
                    url.searchParams.set("annee", value);
                  }
                  window.location.href = url.toString();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les années</SelectItem>
                  {annees.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select
                value={statut || "tous"}
                onValueChange={(value) => {
                  const url = new URL(window.location.href);
                  if (value === "tous") {
                    url.searchParams.delete("statut");
                  } else {
                    url.searchParams.set("statut", value);
                  }
                  window.location.href = url.toString();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="BROUILLON">Brouillons</SelectItem>
                  <SelectItem value="PUBLIEE">Publiées</SelectItem>
                  <SelectItem value="ARCHIVEE">Archivées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(annee || statut) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/remuneration/historique";
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des grilles */}
      {grillesFiltrees.length > 0 ? (
        <div className="space-y-4">
          {grillesFiltrees.map((grille) => (
            <Card
              key={grille.id}
              className={
                grille.statut === "PUBLIEE"
                  ? "border-success bg-success-soft/20"
                  : grille.statut === "ARCHIVEE"
                    ? "border-border/50 bg-muted/30"
                    : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {grille.statut === "PUBLIEE" && (
                      <CheckCircle2 className="size-5 text-success" />
                    )}
                    {grille.statut === "BROUILLON" && (
                      <FileText className="size-5 text-muted-foreground" />
                    )}
                    {grille.statut === "ARCHIVEE" && (
                      <Archive className="size-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base">
                      Version {grille.version}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getBadgeStatut(grille.statut)}
                    <Link href={`/remuneration/grille/${grille.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Consulter
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date de création</p>
                    <p className="font-medium">
                      {format(new Date(grille.creeLe), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>

                  {grille.dateEffet && (
                    <div>
                      <p className="text-muted-foreground">Date d'effet</p>
                      <p className="font-medium">
                        {format(new Date(grille.dateEffet), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  )}

                  {grille.valideLe && (
                    <div>
                      <p className="text-muted-foreground">Date de validation</p>
                      <p className="font-medium">
                        {format(new Date(grille.valideLe), "d MMMM yyyy à HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-muted-foreground">Échelons</p>
                    <p className="font-medium">{grille.echelons.length} niveaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune grille trouvée</h3>
            <p className="text-sm text-muted-foreground">
              Aucune grille ne correspond aux filtres sélectionnés.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <Card className="border-info bg-info-soft/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {grilles.filter((g) => g.statut === "PUBLIEE").length}
              </p>
              <p className="text-sm text-muted-foreground">Publiée</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {grilles.filter((g) => g.statut === "BROUILLON").length}
              </p>
              <p className="text-sm text-muted-foreground">
                Brouillon{grilles.filter((g) => g.statut === "BROUILLON").length > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {grilles.filter((g) => g.statut === "ARCHIVEE").length}
              </p>
              <p className="text-sm text-muted-foreground">
                Archivée{grilles.filter((g) => g.statut === "ARCHIVEE").length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
