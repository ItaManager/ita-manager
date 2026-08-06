import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerTableauPieces } from "@/lib/actions/logistique";
import { AlertTriangle, Clock, FileX, Package } from "lucide-react";
import { TableauPieces } from "./_components/tableau-pieces";
import { FiltresTableauPieces } from "./_components/filtres-tableau-pieces";
import { Card, CardContent } from "@/components/ui/card";
import type { TypeMateriel } from "@prisma/client";

export const metadata = {
  title: "Tableau Pièces Administratives — ITA Manager",
};

interface SearchParams {
  typeMateriel?: TypeMateriel;
  recherche?: string;
  masquerCouts?: string;
}

export default async function TableauPiecesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await verifierAccesPage("/ressources/pieces");

  const params = await searchParams;

  const { lignes, colonnes } = await listerTableauPieces({
    typeMateriel: params.typeMateriel,
    recherche: params.recherche,
  });

  // Calculer les métriques
  let piecesPerimees = 0;
  let echeancesProches = 0;
  let piecesManquantes = 0;

  for (const ligne of lignes) {
    for (const cellule of Object.values(ligne.pieces)) {
      if (!cellule.applicable) continue;

      if (!cellule.piece) {
        piecesManquantes++;
      } else if (cellule.etat === "PERIME") {
        piecesPerimees++;
      } else if (cellule.etat === "EN_ALERTE") {
        echeancesProches++;
      }
    }
  }

  const materielsAffiches = lignes.length;
  const masquerCouts = params.masquerCouts === "true";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Tableau Pièces Administratives
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi par matériel de toutes les pièces obligatoires
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pièces périmées
                </p>
                <p className="text-2xl font-semibold text-destructive mt-1 tabular-nums">
                  {piecesPerimees}
                </p>
              </div>
              <AlertTriangle className="size-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Échéances proches
                </p>
                <p className="text-2xl font-semibold text-warning mt-1 tabular-nums">
                  {echeancesProches}
                </p>
              </div>
              <Clock className="size-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pièces manquantes
                </p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                  {piecesManquantes}
                </p>
              </div>
              <FileX className="size-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Matériels affichés
                </p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                  {materielsAffiches}
                </p>
              </div>
              <Package className="size-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <FiltresTableauPieces
        typeMaterielActif={params.typeMateriel}
        rechercheInitiale={params.recherche}
        masquerCoutsInitial={masquerCouts}
      />

      {/* Tableau */}
      <TableauPieces
        lignes={lignes}
        colonnes={colonnes}
        masquerCouts={masquerCouts}
      />
    </div>
  );
}
