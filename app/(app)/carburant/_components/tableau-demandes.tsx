"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreVertical } from "lucide-react";
import { getBadgeClasses } from "@/lib/ui/badge-styles";
import { BarreRecherche } from "./barre-recherche";
import { ModaleDetailDemande } from "./modale-detail-demande";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableauDemandesProps {
  statut?: string;
  page: number;
}

export function TableauDemandes({
  statut,
  page = 1,
}: TableauDemandesProps) {
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<typeof demandes[0] | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  // TODO: Récupérer les vraies demandes depuis la base
  const demandes = [
    {
      id: "1",
      reference: "DC-2026-0001",
      demandeur: "KOUASSI Jean",
      materiel: "VL-001",
      matricule: "AA-1234-CI",
      typeCarburant: "GASOIL",
      quantite: 50,
      compteurActuel: 12450,
      uniteCompteur: "KILOMETRE",
      circuit: "STATION",
      statut: "BROUILLON",
      creeLe: new Date("2026-10-30"),
      projetNom: "PRJ-001 — Construction immeuble",
    },
    {
      id: "2",
      reference: "DC-2026-0002",
      demandeur: "TOURE Ibrahim",
      materiel: "VL-002",
      matricule: "BB-5678-CI",
      typeCarburant: "SUPER",
      quantite: 40,
      compteurActuel: 8920,
      uniteCompteur: "KILOMETRE",
      circuit: "GARAGE",
      statut: "ATTENTE_VALIDATION",
      creeLe: new Date("2026-10-29"),
    },
    {
      id: "3",
      reference: "DC-2026-0003",
      demandeur: "N'GUESSAN François",
      materiel: "VL-003",
      matricule: "CC-9012-CI",
      typeCarburant: "GASOIL",
      quantite: 60,
      compteurActuel: 3200,
      uniteCompteur: "HEURE",
      circuit: "STATION",
      statut: "VALIDEE",
      creeLe: new Date("2026-10-28"),
      projetNom: "PRJ-002 — Route nationale",
    },
  ];

  const limit = 20;
  const total = demandes.length;
  const debut = (page - 1) * limit;
  const fin = debut + limit;

  // Compter pour les filtres
  const counts = {
    brouillon: demandes.filter((d) => d.statut === "BROUILLON").length,
    enAttente: demandes.filter((d) => d.statut === "ATTENTE_VALIDATION").length,
    validees: demandes.filter((d) => d.statut === "VALIDEE").length,
    livrees: demandes.filter((d) => d.statut === "LIVREE").length,
    refusees: demandes.filter((d) => d.statut === "REFUSEE").length,
    toutes: demandes.length,
  };

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Recherche et filtres */}
      <BarreRecherche counts={counts} />

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
                  Chauffeur
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Véhicule
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Matricule
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Carburant
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quantité (L)
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Circuit
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {demandes.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Aucune demande trouvée
                  </td>
                </tr>
              ) : (
                demandes.slice(debut, fin).map((demande) => (
                  <tr
                    key={demande.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-mono text-foreground">
                      {demande.reference}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">
                      {demande.demandeur}
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground">
                      {demande.materiel}
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground">
                      {demande.matricule}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">
                      {demande.typeCarburant === "GASOIL" ? "Gasoil" : "Super"}
                    </td>
                    <td className="py-4 px-4 text-sm text-right tabular-nums text-foreground">
                      {demande.quantite.toLocaleString("fr-FR")}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">
                      {demande.circuit === "STATION" ? "Station" : "Garage"}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getBadgeClasses("carburant", demande.statut)}>
                        {demande.statut === "BROUILLON" && "Brouillon"}
                        {demande.statut === "ATTENTE_VALIDATION" && "En attente"}
                        {demande.statut === "VALIDEE" && "Validée"}
                        {demande.statut === "LIVREE" && "Livrée"}
                        {demande.statut === "REFUSEE" && "Refusée"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setDemandeSelectionnee(demande);
                              setModaleOuverte(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {debut + 1}-{Math.min(fin, total)} sur {total}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1}>
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={fin >= total}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <ModaleDetailDemande
        ouvert={modaleOuverte}
        onClose={() => {
          setModaleOuverte(false);
          setDemandeSelectionnee(null);
        }}
        demande={demandeSelectionnee}
      />
    </div>
  );
}
