import { listerDemandesAvecCalculs } from "@/lib/actions/achats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { BarreRechercheAchats } from "./barre-recherche-achats";
import { PaginationDemandes } from "./pagination-demandes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ListeDemandesProps {
  recherche?: string;
  filtre?: "toutes" | "brouillon" | "attente-n1" | "attente-achats" | "bc-emis" | "soldees" | "refusees";
  page?: number;
  limit?: number;
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

export async function ListeDemandes({
  recherche,
  filtre = "toutes",
  page = 1,
  limit = 20,
}: ListeDemandesProps) {
  // Récupérer toutes les demandes
  const toutesLesDemandes = await listerDemandesAvecCalculs();

  // Filtrer selon le filtre actif
  let demandes = toutesLesDemandes;
  if (filtre === "brouillon") {
    demandes = toutesLesDemandes.filter((d) => d.statut === "BROUILLON");
  } else if (filtre === "attente-n1") {
    demandes = toutesLesDemandes.filter((d) => d.statut === "ATTENTE_N1");
  } else if (filtre === "attente-achats") {
    demandes = toutesLesDemandes.filter((d) => d.statut === "ATTENTE_ACHATS");
  } else if (filtre === "bc-emis") {
    demandes = toutesLesDemandes.filter((d) => d.statut === "BC_EMIS");
  } else if (filtre === "soldees") {
    demandes = toutesLesDemandes.filter((d) => d.statut === "SOLDEE");
  } else if (filtre === "refusees") {
    demandes = toutesLesDemandes.filter((d) => d.statut === "REFUSEE");
  }

  // Filtrer par recherche
  if (recherche) {
    const termeRecherche = recherche.toLowerCase();
    demandes = demandes.filter(
      (d) =>
        d.ref.toLowerCase().includes(termeRecherche) ||
        d.motif.toLowerCase().includes(termeRecherche) ||
        d.demandeur.toLowerCase().includes(termeRecherche)
    );
  }

  // Pagination
  const total = demandes.length;
  const debut = (page - 1) * limit;
  const fin = debut + limit;
  const demandesPaginees = demandes.slice(debut, fin);

  // Compter pour les filtres
  const counts = {
    toutes: toutesLesDemandes.length,
    brouillon: toutesLesDemandes.filter((d) => d.statut === "BROUILLON").length,
    attenteN1: toutesLesDemandes.filter((d) => d.statut === "ATTENTE_N1").length,
    attenteAchats: toutesLesDemandes.filter((d) => d.statut === "ATTENTE_ACHATS").length,
    bcEmis: toutesLesDemandes.filter((d) => d.statut === "BC_EMIS").length,
    soldees: toutesLesDemandes.filter((d) => d.statut === "SOLDEE").length,
    refusees: toutesLesDemandes.filter((d) => d.statut === "REFUSEE").length,
  };

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Recherche et filtres */}
      <BarreRechercheAchats counts={counts} />

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Référence
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Demandeur
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Destination
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Motif
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Montant TTC
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date soumission
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {demandesPaginees.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {recherche
                      ? "Aucune demande ne correspond à votre recherche."
                      : "Aucune demande trouvée."}
                  </td>
                </tr>
              ) : (
                demandesPaginees.map((demande) => {
                  const statutInfo = STATUT_LABELS[demande.statut] || {
                    label: demande.statut,
                    variant: "outline" as const,
                  };

                  return (
                    <tr
                      key={demande.ref}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      {/* Référence */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-foreground">
                          {demande.ref}
                        </div>
                      </td>

                      {/* Demandeur */}
                      <td className="py-3 px-4 text-sm text-foreground">
                        {demande.demandeur}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {demande.destination}
                      </td>

                      {/* Motif */}
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground max-w-xs truncate">
                          {demande.motif}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {demande.lignes}
                        </div>
                      </td>

                      {/* Montant TTC */}
                      <td className="py-3 px-4">
                        {demande.montantTTC !== null ? (
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            {demande.montantTTC.toLocaleString("fr-FR")} F
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-4">
                        <Badge variant={statutInfo.variant}>
                          {statutInfo.label}
                        </Badge>
                      </td>

                      {/* Date soumission */}
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {demande.dateSoumission
                          ? format(demande.dateSoumission, "dd/MM/yyyy", { locale: fr })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            asChild
                          >
                            <Link href={`/achats/${demande.ref}`}>
                              <Eye className="size-4" />
                              <span className="sr-only">Voir détails</span>
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationDemandes total={total} page={page} limit={limit} />
      </div>
    </div>
  );
}
