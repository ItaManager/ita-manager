import { verifierAccesPage } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, FileText, DollarSign, Clock, User, AlertCircle } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BoutonCalculer } from "../_components/bouton-calculer";
import { BoutonValiderRH } from "../_components/bouton-valider-rh";
import { BoutonValiderDT } from "../_components/bouton-valider-dt";
import { BoutonValiderDFC } from "../_components/bouton-valider-dfc";
import { BoutonRefuser } from "../_components/bouton-refuser";
import { BoutonCloturer } from "../_components/bouton-cloturer";

type Props = {
  params: { id: string };
};

const STATUT_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OUVERTE: { label: "Ouverte", variant: "outline" },
  VALIDEE_RH: { label: "Validée RH", variant: "secondary" },
  VALIDEE_DT: { label: "Validée DT", variant: "secondary" },
  VALIDEE_DFC: { label: "Validée DFC", variant: "default" },
  CLOTUREE: { label: "Clôturée", variant: "default" },
  REFUSEE: { label: "Refusée", variant: "destructive" },
};

export default async function PeriodePaiePage({ params }: Props) {
  await verifierAccesPage("/paie");

  const periode = await prisma.periodePaie.findUnique({
    where: { id: params.id },
    include: {
      projet: true,
      evenements: {
        orderBy: { creeLe: "desc" },
      },
      _count: {
        select: {
          lignes: true,
          exports: true,
        },
      },
    },
  });

  if (!periode) {
    notFound();
  }

  // Déterminer le statut depuis le dernier événement
  const dernierEvenement = periode.evenements[0];
  let statut = "OUVERTE";

  if (dernierEvenement) {
    switch (dernierEvenement.type) {
      case "OUVERTURE":
        statut = "OUVERTE";
        break;
      case "VALIDATION_RH":
        statut = "VALIDEE_RH";
        break;
      case "VALIDATION_DT":
        statut = "VALIDEE_DT";
        break;
      case "VALIDATION_DFC":
        statut = "VALIDEE_DFC";
        break;
      case "REFUS":
        statut = "REFUSEE";
        break;
      case "CLOTURE":
        statut = "CLOTUREE";
        break;
    }
  }

  const statutInfo = STATUT_CONFIG[statut] || { label: statut, variant: "outline" as const };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/paie"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Retour aux périodes
              </Link>
            </div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="size-6" />
              Période de paie
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(periode.dateDebut), "d MMMM", { locale: fr })} →{" "}
              {format(new Date(periode.dateFin), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <Badge variant={statutInfo.variant} className="text-sm px-4 py-2">
            {statutInfo.label}
          </Badge>
        </div>
      </div>

      {/* Informations générales */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Chantier</p>
              <p className="font-medium">
                <span className="font-mono text-sm text-muted-foreground">
                  {periode.projet.code}
                </span>{" "}
                — {periode.projet.nom}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Période</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                {format(new Date(periode.dateDebut), "d MMM", { locale: fr })} →{" "}
                {format(new Date(periode.dateFin), "d MMM yyyy", { locale: fr })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Lignes de paie</p>
              <p className="font-medium flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                {periode._count.lignes} ligne{periode._count.lignes > 1 ? "s" : ""}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Exports générés</p>
              <p className="font-medium flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                {periode._count.exports} export{periode._count.exports > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions selon le statut */}
      {statut !== "CLOTUREE" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {statut === "OUVERTE" && (
                <>
                  <BoutonCalculer periodeId={periode.id} />
                  {periode._count.lignes > 0 && (
                    <BoutonValiderRH periodeId={periode.id} />
                  )}
                  <BoutonRefuser periodeId={periode.id} />
                </>
              )}

              {statut === "VALIDEE_RH" && (
                <>
                  <BoutonValiderDT periodeId={periode.id} />
                  <BoutonRefuser periodeId={periode.id} />
                </>
              )}

              {statut === "VALIDEE_DT" && (
                <>
                  <BoutonValiderDFC periodeId={periode.id} />
                  <BoutonRefuser periodeId={periode.id} />
                </>
              )}

              {statut === "VALIDEE_DFC" && (
                <>
                  {periode._count.exports > 0 ? (
                    <BoutonCloturer periodeId={periode.id} />
                  ) : (
                    <div className="rounded-md border border-warning-border bg-warning-soft p-3">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="size-4" />
                        Générez au moins un export avant de clôturer la période
                      </p>
                    </div>
                  )}
                </>
              )}

              {statut === "REFUSEE" && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive font-medium">
                    Période refusée
                  </p>
                  {dernierEvenement?.motifRefus && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {dernierEvenement.motifRefus}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des événements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {periode.evenements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun événement enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {periode.evenements.map((evt) => {
                const typeLabels: Record<string, string> = {
                  OUVERTURE: "Ouverture",
                  VALIDATION_RH: "Validation RH",
                  VALIDATION_DT: "Validation DT",
                  VALIDATION_DFC: "Validation DFC",
                  REFUS: "Refus",
                  CLOTURE: "Clôture",
                };

                return (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="mt-1">
                      <Clock className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {typeLabels[evt.type] || evt.type}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(evt.creeLe), "d MMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="size-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {evt.auteurNom}
                        </p>
                      </div>
                      {evt.motifRefus && (
                        <div className="mt-2 rounded-md border border-destructive bg-destructive/10 p-2">
                          <p className="text-xs text-muted-foreground">
                            <strong>Motif :</strong> {evt.motifRefus}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
