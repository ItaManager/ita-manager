"use client";

import { useState } from "react";
import { Lock, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Demande {
  ref: string;
  demandeur: string;
  beneficiaire: string;
  destination: string;
  motif: string;
  lignes: string;
  type: string;
  dateSoumission?: Date;
  fournisseurs: string | null;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  dateBC?: Date;
  dateReception?: Date;
  statut: string;
  delai: number | null;
  refBC?: string | null;
  refFacture?: string | null;
}

interface TableauSuiviProps {
  demandes: Demande[];
}

type Filtre = "tous" | "en_cours" | "retards" | "regularisations";

const STATUTS: Record<
  string,
  { label: string; classe: string }
> = {
  BROUILLON: { label: "Brouillon", classe: "statut-neutre" },
  ATTENTE_N1: { label: "Attente N+1", classe: "statut-attente" },
  ATTENTE_ACHATS: { label: "Instruction", classe: "statut-attente" },
  ATTENTE_COMITE: { label: "Comité", classe: "statut-revue" },
  BC_EMIS: { label: "BC émis", classe: "statut-succes" },
  PARTIELLE: { label: "Partielle", classe: "statut-attente" },
  SOLDEE: { label: "Soldée", classe: "statut-succes" },
  REFUSEE: { label: "Refusée", classe: "statut-erreur" },
};

export function TableauSuivi({ demandes }: TableauSuiviProps) {
  const [filtre, setFiltre] = useState<Filtre>("tous");

  // Filtrer les demandes
  const demandesFiltrees = demandes.filter((d) => {
    if (filtre === "tous") return true;
    if (filtre === "en_cours")
      return !["SOLDEE", "REFUSEE"].includes(d.statut);
    if (filtre === "retards") return d.delai !== null && d.delai > 7; // 7 jours
    if (filtre === "regularisations") return d.type === "Régularisation";
    return true;
  });

  // Vérifier si prix visibles (au moins une demande avec montantHT)
  const prixVisibles = demandes.some((d) => d.montantHT !== null);

  if (demandes.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune demande d'achat enregistrée.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les demandes apparaîtront ici dès leur création.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bandeau informatif */}
      <div className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          Les demandes affichées proviennent d'un jeu de démonstration. La
          création de demande arrivera avec le circuit complet — module M14,
          livraison 2.
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Button
          variant={filtre === "tous" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltre("tous")}
        >
          Tous ({demandes.length})
        </Button>
        <Button
          variant={filtre === "en_cours" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltre("en_cours")}
        >
          En cours (
          {demandes.filter((d) => !["SOLDEE", "REFUSEE"].includes(d.statut)).length}
          )
        </Button>
        <Button
          variant={filtre === "retards" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltre("retards")}
        >
          Retards (
          {demandes.filter((d) => d.delai !== null && d.delai > 7).length})
        </Button>
        <Button
          variant={filtre === "regularisations" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltre("regularisations")}
        >
          Régularisations (
          {demandes.filter((d) => d.type === "Régularisation").length})
        </Button>
      </div>

      {/* Tableau */}
      <div className="rounded-lg border bg-card">
        <div className="bandeau border-b px-6 py-3">
          <h2 className="text-lg font-semibold">
            {demandesFiltrees.length} demande
            {demandesFiltrees.length > 1 ? "s" : ""}
          </h2>
        </div>

        {demandesFiltrees.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune demande pour ce filtre.
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="tabulaire w-full">
              <thead className="sticky top-0 z-[5] bg-muted/50">
                <tr className="border-b">
                  {/* Colonne 1 : Ref (sticky left) */}
                  <th className="sticky left-0 z-[10] bg-muted/50 px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Ref
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button aria-label="Information sur Ref">
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Référence unique (auto)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>

                  {/* Colonnes 2-8 : Informations de base */}
                  <ColonneHeader
                    label="Demandeur"
                    tooltip="Employé à l'origine de la demande"
                  />
                  <ColonneHeader
                    label="Bénéficiaire"
                    tooltip="Destinataire final (si différent)"
                  />
                  <ColonneHeader
                    label="Destination"
                    tooltip="Chantier ou service destinataire"
                  />
                  <ColonneHeader
                    label="Motif"
                    tooltip="Justification de la demande"
                  />
                  <ColonneHeader
                    label="Articles"
                    tooltip="Liste des articles demandés"
                  />
                  <ColonneHeader
                    label="Type"
                    tooltip="Régularisation si achat déjà effectué"
                  />
                  <ColonneHeader
                    label="Soumission"
                    tooltip="Date de soumission au N+1"
                  />

                  {/* Colonnes 9-12 : Prix (masqués selon permission) */}
                  <ColonneHeader
                    label="Fournisseurs"
                    tooltip="Liste des fournisseurs retenus"
                    masque={!prixVisibles}
                  />
                  <ColonneHeader
                    label="HT (FCFA)"
                    tooltip="Montant hors taxe"
                    masque={!prixVisibles}
                    align="right"
                  />
                  <ColonneHeader
                    label="TVA (FCFA)"
                    tooltip="Montant de la TVA"
                    masque={!prixVisibles}
                    align="right"
                  />
                  <ColonneHeader
                    label="TTC (FCFA)"
                    tooltip="Montant toutes taxes comprises"
                    masque={!prixVisibles}
                    align="right"
                  />

                  {/* Colonnes 13-14 : Dates */}
                  <ColonneHeader label="Bon Commande" tooltip="Date d'émission du BC" />
                  <ColonneHeader
                    label="Réception"
                    tooltip="Date de réception logistique"
                  />

                  {/* Colonnes 15-16 : Calculés (ƒ) */}
                  <ColonneHeader
                    label="Statut"
                    tooltip="État calculé depuis les événements"
                    calcule
                  />
                  <ColonneHeader
                    label="Délai (j)"
                    tooltip="Jours calendaires entre soumission et BC"
                    calcule
                    align="right"
                  />

                  {/* Colonnes 17-18 : Traçabilité */}
                  <ColonneHeader label="Ref BC" tooltip="Référence du bon de commande" />
                  <ColonneHeader label="Ref Facture" tooltip="Référence de la facture" />
                </tr>
              </thead>

              <tbody>
                {demandesFiltrees.map((demande) => (
                  <tr
                    key={demande.ref}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    {/* Colonne 1 : Ref (sticky) */}
                    <td className="sticky left-0 z-[5] bg-card px-4 py-3 text-sm font-medium">
                      {demande.ref}
                    </td>

                    {/* Colonnes 2-8 */}
                    <td className="px-4 py-3 text-sm">{demande.demandeur}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {demande.beneficiaire}
                    </td>
                    <td className="px-4 py-3 text-sm">{demande.destination}</td>
                    <td className="px-4 py-3 text-sm">{demande.motif}</td>
                    <td className="max-w-xs px-4 py-3 text-sm text-muted-foreground">
                      <div className="truncate">{demande.lignes}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {demande.type === "Régularisation" && (
                        <span className="statut-attente">Régul.</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {demande.dateSoumission
                        ? format(demande.dateSoumission, "dd/MM/yyyy", {
                            locale: fr,
                          })
                        : "—"}
                    </td>

                    {/* Colonnes 9-12 : Prix masqués (C-05) */}
                    <td className="px-4 py-3 text-sm">
                      {demande.fournisseurs !== null ? (
                        demande.fournisseurs
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" aria-label="Masqué" /> masqué
                        </span>
                      )}
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm">
                      {demande.montantHT !== null ? (
                        demande.montantHT.toLocaleString("fr-FR")
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" aria-label="Masqué" /> masqué
                        </span>
                      )}
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm">
                      {demande.montantTVA !== null ? (
                        demande.montantTVA.toLocaleString("fr-FR")
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" aria-label="Masqué" /> masqué
                        </span>
                      )}
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm font-medium">
                      {demande.montantTTC !== null ? (
                        demande.montantTTC.toLocaleString("fr-FR")
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" aria-label="Masqué" /> masqué
                        </span>
                      )}
                    </td>

                    {/* Colonnes 13-14 : Dates */}
                    <td className="px-4 py-3 text-sm">
                      {demande.dateBC
                        ? format(demande.dateBC, "dd/MM/yyyy", { locale: fr })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {demande.dateReception
                        ? format(demande.dateReception, "dd/MM/yyyy", {
                            locale: fr,
                          })
                        : "—"}
                    </td>

                    {/* Colonnes 15-16 : Calculés */}
                    <td className="px-4 py-3 text-sm">
                      {/* R-01 : Couleur + Label, jamais couleur seule */}
                      <span className={`statut ${STATUTS[demande.statut]?.classe ?? "statut-neutre"}`}>
                        {STATUTS[demande.statut]?.label ?? demande.statut}
                      </span>
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm">
                      {demande.delai !== null ? (
                        <span
                          className={
                            demande.delai > 7 ? "text-destructive font-medium" : ""
                          }
                        >
                          {demande.delai}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Colonnes 17-18 : Traçabilité */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {demande.refBC ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {demande.refFacture ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component pour headers avec tooltip
function ColonneHeader({
  label,
  tooltip,
  masque = false,
  calcule = false,
  align = "left",
}: {
  label: string;
  tooltip: string;
  masque?: boolean;
  calcule?: boolean;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          {/* Marquer colonnes calculées avec ƒ */}
          {calcule && (
            <span className="ml-1 text-[9px] text-review" aria-label="Calculé">
              ƒ
            </span>
          )}
          {/* Indiquer colonnes masquées */}
          {masque && (
            <Lock
              className="ml-1 inline h-3 w-3 opacity-50"
              aria-label="Masqué"
            />
          )}
        </span>
        {/* R-03 : Tooltip enrichit, n'explique pas l'essentiel */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label={`Information sur ${label}`}>
              <Info className="h-3 w-3 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </th>
  );
}
