import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerEcheances, type PieceEcheance } from "@/lib/actions/logistique";
import { calculerEtatPiece, comparerUrgence, type EtatPiece } from "@/lib/logistique/echeances";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Échéances Pièces Administratives — ITA Manager",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EcheancesPage(props: {
  searchParams: SearchParams;
}) {
  await verifierAccesPage("/ressources/echeances");

  const searchParams = await props.searchParams;
  const filtreEtat = (searchParams.etat as EtatPiece | undefined);

  // Récupérer toutes les pièces
  const piecesRaw = await listerEcheances({});

  // Calculer l'état pour chaque pièce
  const piecesAvecEtat = piecesRaw.map((piece) => {
    const infoEtat = calculerEtatPiece(
      piece.dateExpiration,
      piece.type.delaiAlerteJours
    );

    return {
      ...piece,
      infoEtat,
    };
  });

  // Filtrer par état si demandé
  const piecesFiltrees = filtreEtat
    ? piecesAvecEtat.filter((p) => p.infoEtat.etat === filtreEtat)
    : piecesAvecEtat;

  // Trier par urgence
  const piecesTriees = piecesFiltrees.sort((a, b) =>
    comparerUrgence(a.infoEtat, b.infoEtat)
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Échéances Pièces Administratives
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi des assurances, visites techniques et autres pièces
        </p>
      </div>

      <div className="space-y-4">
        {piecesTriees.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune pièce administrative à afficher
              </p>
            </CardContent>
          </Card>
        )}

        {piecesTriees.map((piece) => (
          <Card
            key={piece.id}
            className={
              piece.infoEtat.etat === "PERIME"
                ? "border-destructive bg-destructive/5"
                : piece.infoEtat.etat === "EN_ALERTE"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                : ""
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-sm">
                      {piece.materiel.codeIta}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {piece.materiel.designation}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {piece.type.libelle}
                    {piece.emetteur && (
                      <>
                        {" · "}
                        {piece.emetteur}
                      </>
                    )}
                    {piece.numero && (
                      <>
                        {" · "}
                        N° {piece.numero}
                      </>
                    )}
                  </div>
                </div>

                {/* Badge d'état — R-01 : TEXTE, pas que couleur */}
                <Badge
                  variant={
                    piece.infoEtat.etat === "PERIME"
                      ? "destructive"
                      : piece.infoEtat.etat === "EN_ALERTE"
                      ? "outline"
                      : "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  {piece.infoEtat.etat === "PERIME" && (
                    <AlertTriangle className="size-3" />
                  )}
                  {piece.infoEtat.etat === "EN_ALERTE" && (
                    <AlertTriangle className="size-3 text-orange-600" />
                  )}
                  {piece.infoEtat.etat === "VALIDE" && (
                    <CheckCircle2 className="size-3" />
                  )}
                  {piece.infoEtat.etat === "PERIME"
                    ? "PÉRIMÉ"
                    : piece.infoEtat.etat === "EN_ALERTE"
                    ? "EN ALERTE"
                    : "VALIDE"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              {/* Libellé explicite — R-01 */}
              <p
                className={
                  piece.infoEtat.etat === "PERIME"
                    ? "text-sm font-medium text-destructive"
                    : piece.infoEtat.etat === "EN_ALERTE"
                    ? "text-sm font-medium text-orange-600 dark:text-orange-500"
                    : "text-sm text-muted-foreground"
                }
              >
                {piece.infoEtat.libelle}
              </p>

              {piece.materiel.lieuBase && (
                <p className="text-xs text-muted-foreground mt-2">
                  Lieu : {piece.materiel.lieuBase.libelle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
