import { Suspense } from "react";
import { notFound } from "next/navigation";
import { obtenirDemande } from "@/lib/actions/achats";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, MapPin, FileText, Package } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{
    ref: string;
  }>;
}

const STATUT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  BROUILLON: { label: "Brouillon", variant: "outline" },
  ATTENTE_N1: { label: "Attente N+1", variant: "secondary" },
  ATTENTE_ACHATS: { label: "Attente Achats", variant: "secondary" },
  ATTENTE_COMITE: { label: "Attente Comité", variant: "secondary" },
  BC_EMIS: { label: "BC émis", variant: "default" },
  SOLDEE: { label: "Soldée", variant: "default" },
  REFUSEE: { label: "Refusée", variant: "destructive" },
};

export default async function PageDetailDemande({ params }: PageProps) {
  await verifierAccesPage("/achats");
  const { ref } = await params;

  let demande;
  try {
    demande = await obtenirDemande(ref);
  } catch {
    notFound();
  }

  const statutInfo = STATUT_LABELS[demande.statut] || {
    label: demande.statut,
    variant: "outline" as const,
  };

  // Calculer le montant total TTC
  const montantTotal = demande.lignes.reduce((sum, ligne) => {
    return sum + (ligne.prixUnitaireTTC || 0) * ligne.quantite;
  }, 0);

  return (
    <ModuleLayout
      titre={`Demande ${ref}`}
      description="Détails de la demande d'achat"
      retour={{ href: "/achats", label: "Retour aux demandes" }}
    >
      <div className="space-y-6">
        {/* En-tête avec statut */}
        <div className="bg-white rounded-xl border border-[#0000001a] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#1D186C] mb-2">
                Demande {ref}
              </h2>
              <Badge variant={statutInfo.variant} className="text-sm">
                {statutInfo.label}
              </Badge>
            </div>
            {demande.urgent && (
              <Badge variant="destructive">Urgent</Badge>
            )}
          </div>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-xl border border-[#0000001a] p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Informations générales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Demandeur
                  </p>
                  <p className="text-foreground">
                    {demande.demandeur.matricule} — {demande.demandeur.prenom}{" "}
                    {demande.demandeur.nom}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Bénéficiaire
                  </p>
                  <p className="text-foreground">
                    {demande.beneficiaire.matricule} —{" "}
                    {demande.beneficiaire.prenom} {demande.beneficiaire.nom}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Destination
                  </p>
                  <p className="text-foreground">
                    {demande.destination?.nom || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date de besoin
                  </p>
                  <p className="text-foreground">
                    {format(new Date(demande.dateBesoin), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type de demande
                  </p>
                  <p className="text-foreground">
                    {demande.type === "INITIALE" ? "Initiale" : "Régularisation"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Motif / Description
                  </p>
                  <p className="text-foreground">{demande.description || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles demandés */}
        <div className="bg-white rounded-xl border border-[#0000001a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="size-5 text-[#1D186C]" />
            <h3 className="text-lg font-semibold text-foreground">
              Articles demandés
            </h3>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Désignation
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quantité
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Unité
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Prix U. TTC
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Montant TTC
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Fournisseur
                  </th>
                </tr>
              </thead>
              <tbody>
                {demande.lignes.map((ligne, index) => {
                  const montantLigne =
                    (ligne.prixUnitaireTTC || 0) * ligne.quantite;
                  return (
                    <tr
                      key={ligne.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {ligne.designation}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground text-right tabular-nums">
                        {ligne.quantite}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {ligne.unite}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground text-right tabular-nums">
                        {ligne.prixUnitaireTTC
                          ? `${ligne.prixUnitaireTTC.toLocaleString("fr-FR")} F`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground text-right tabular-nums font-medium">
                        {ligne.prixUnitaireTTC
                          ? `${montantLigne.toLocaleString("fr-FR")} F`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {ligne.fournisseur?.nom || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr>
                  <td
                    colSpan={5}
                    className="py-3 px-4 text-sm font-medium text-right"
                  >
                    Total TTC :
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-right tabular-nums text-[#1D186C]">
                    {montantTotal > 0
                      ? `${montantTotal.toLocaleString("fr-FR")} F`
                      : "—"}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Historique des événements */}
        {demande.evenements.length > 0 && (
          <div className="bg-white rounded-xl border border-[#0000001a] p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Historique
            </h3>
            <div className="space-y-3">
              {demande.evenements.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-3 text-sm pb-3 border-b border-border last:border-0"
                >
                  <div className="w-32 text-muted-foreground tabular-nums">
                    {format(new Date(evt.timestamp), "dd/MM/yyyy HH:mm", {
                      locale: fr,
                    })}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      {evt.type}
                    </span>
                    {evt.auteur && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {evt.auteur.prenom} {evt.auteur.nom}
                      </span>
                    )}
                    {evt.commentaire && (
                      <p className="text-muted-foreground mt-1">
                        {evt.commentaire}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
