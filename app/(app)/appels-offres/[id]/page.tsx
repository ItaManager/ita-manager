import { notFound } from "next/navigation";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { detailAppelOffres } from "@/lib/actions/appels-offres";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Calendar, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BoutonsActionsAO } from "./_components/boutons-actions-ao";
import { SectionPieces } from "./_components/section-pieces";
import { SectionConcurrents } from "./_components/section-concurrents";

type Params = Promise<{
  id: string;
}>;

export default async function DossierAOPage({
  params,
}: {
  params: Params;
}) {
  await verifierAccesPage("/appels-offres");

  const { id } = await params;

  let ao;
  try {
    ao = await detailAppelOffres(id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/appels-offres">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4" />
            Retour à la liste
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">{ao.reference}</h1>
              <BadgeStatut statut={ao.statut} />
              <Badge variant="outline">{ao.typeMarche}</Badge>
            </div>

            <p className="text-sm text-foreground font-medium">{ao.maitreOuvrage}</p>
            <p className="text-sm text-muted-foreground mt-1">{ao.objet}</p>
          </div>

          <BoutonsActionsAO appelOffresId={ao.id} statut={ao.statut} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" />
              Date limite de dépôt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {format(new Date(ao.dateLimiteDepot), "d MMMM yyyy", { locale: fr })}
            </div>
          </CardContent>
        </Card>

        {ao.montantEstime && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="size-4" />
                Montant estimé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {Number(ao.montantEstime).toLocaleString("fr-FR")} FCFA
              </div>
            </CardContent>
          </Card>
        )}

        {ao.lieu && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4" />
                Lieu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{ao.lieu}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Décision Go/No-go */}
      {ao.statut === "VEILLE" && (
        <Card className="mb-6 border-warning-border bg-warning-soft">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Cet appel d'offres est en veille. Une décision go/no-go du DG est requise.
            </p>
          </CardContent>
        </Card>
      )}

      {ao.goNoGoDecideLe && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Décision Go/No-go</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Décision : <BadgeStatut statut={ao.statut} />
              </span>
              <span className="text-muted-foreground">
                Le {format(new Date(ao.goNoGoDecideLe), "d MMM yyyy à HH:mm", { locale: fr })}
              </span>
            </div>
            {ao.goNoGoMotif && (
              <p className="text-sm text-muted-foreground mt-2">{ao.goNoGoMotif}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pièces du dossier */}
      <SectionPieces
        appelOffresId={ao.id}
        pieces={ao.pieces}
        statut={ao.statut}
      />

      {/* Concurrents */}
      <div className="mt-6">
        <SectionConcurrents
          appelOffresId={ao.id}
          concurrents={ao.concurrents}
        />
      </div>

      {/* Résultat */}
      {["GAGNE", "PERDU"].includes(ao.statut) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Résultat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Statut :</span>
                <BadgeStatut statut={ao.statut} />
              </div>
              {ao.montantAttribution && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Montant d'attribution :</span>
                  <span className="text-sm font-medium">
                    {Number(ao.montantAttribution).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              )}
              {ao.attributaire && ao.statut === "PERDU" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Attributaire :</span>
                  <span className="text-sm font-medium">{ao.attributaire}</span>
                </div>
              )}
              {ao.dateNotification && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Date de notification :</span>
                  <span className="text-sm font-medium">
                    {format(new Date(ao.dateNotification), "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
