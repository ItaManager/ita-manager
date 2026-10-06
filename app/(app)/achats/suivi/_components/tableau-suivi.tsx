"use client";

import { useState, useMemo } from "react";
import { Lock, Info, Search, X, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

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
  const [recherche, setRecherche] = useState("");
  const [openSearch, setOpenSearch] = useState(false);

  // Fonction d'export Excel
  const exporterVersExcel = () => {
    // Préparer les données pour l'export
    const donneesExport = demandesFiltrees.map((d) => ({
      "Référence": d.ref,
      "Demandeur": d.demandeur,
      "Bénéficiaire": d.beneficiaire,
      "Destination": d.destination,
      "Motif": d.motif,
      "Articles": d.lignes,
      "Type": d.type === "Régularisation" ? "Régularisation" : "Standard",
      "Date soumission": d.dateSoumission
        ? format(d.dateSoumission, "dd/MM/yyyy", { locale: fr })
        : "",
      "Fournisseurs": d.fournisseurs ?? "",
      "Montant TTC (FCFA)": d.montantTTC ?? "",
      "Date BC": d.dateBC
        ? format(d.dateBC, "dd/MM/yyyy", { locale: fr })
        : "",
      "Date réception": d.dateReception
        ? format(d.dateReception, "dd/MM/yyyy", { locale: fr })
        : "",
      "Statut": STATUTS[d.statut]?.label ?? d.statut,
      "Délai (jours)": d.delai ?? "",
      "Ref BC": d.refBC ?? "",
      "Ref Facture": d.refFacture ?? "",
    }));

    // Créer le classeur Excel
    const ws = XLSX.utils.json_to_sheet(donneesExport);
    const wb = XLSX.utils.book_new();

    // Ajuster la largeur des colonnes
    const colonnes = [
      { wch: 15 }, // Référence
      { wch: 20 }, // Demandeur
      { wch: 20 }, // Bénéficiaire
      { wch: 25 }, // Destination
      { wch: 40 }, // Motif
      { wch: 50 }, // Articles
      { wch: 15 }, // Type
      { wch: 15 }, // Date soumission
      { wch: 30 }, // Fournisseurs
      { wch: 18 }, // Montant TTC
      { wch: 12 }, // Date BC
      { wch: 15 }, // Date réception
      { wch: 15 }, // Statut
      { wch: 12 }, // Délai
      { wch: 15 }, // Ref BC
      { wch: 15 }, // Ref Facture
    ];
    ws["!cols"] = colonnes;

    // Styliser les en-têtes (ligne 1)
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        fill: { fgColor: { rgb: "1D186C" } }, // Bleu ITA
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // Styliser les lignes de données (alternance de couleurs)
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const isEven = row % 2 === 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          fill: { fgColor: { rgb: isEven ? "F3F4F6" : "FFFFFF" } }, // Alternance gris clair / blanc
          font: { sz: 11 },
          alignment: {
            horizontal: col === 9 ? "right" : "left", // Montant aligné à droite
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          },
        };
      }
    }

    // Figer la première ligne (en-têtes)
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, "Demandes d'achat");

    // Générer le nom du fichier avec la date
    const dateExport = format(new Date(), "yyyy-MM-dd_HHmm", { locale: fr });
    const nomFichier = `demandes-achat_${dateExport}.xlsx`;

    // Télécharger le fichier
    XLSX.writeFile(wb, nomFichier);
  };

  // Extraire toutes les valeurs uniques pour l'autocomplétion
  const suggestions = useMemo(() => {
    const refs = new Set<string>();
    const demandeurs = new Set<string>();
    const destinations = new Set<string>();
    const fournisseurs = new Set<string>();
    const statuts = new Set<string>();

    demandes.forEach((d) => {
      refs.add(d.ref);
      demandeurs.add(d.demandeur);
      destinations.add(d.destination);
      if (d.fournisseurs) {
        d.fournisseurs.split(",").forEach((f) => fournisseurs.add(f.trim()));
      }
      statuts.add(STATUTS[d.statut]?.label ?? d.statut);
    });

    return {
      refs: Array.from(refs).sort(),
      demandeurs: Array.from(demandeurs).sort(),
      destinations: Array.from(destinations).sort(),
      fournisseurs: Array.from(fournisseurs).sort(),
      statuts: Array.from(statuts).sort(),
    };
  }, [demandes]);

  // Filtrer les demandes
  const demandesFiltrees = demandes.filter((d) => {
    // Filtre par type
    if (filtre === "en_cours" && ["SOLDEE", "REFUSEE"].includes(d.statut))
      return false;
    if (filtre === "retards" && (d.delai === null || d.delai <= 7))
      return false;
    if (filtre === "regularisations" && d.type !== "Régularisation")
      return false;

    // Filtre par recherche
    if (recherche) {
      const terme = recherche.toLowerCase();
      const statutLabel = STATUTS[d.statut]?.label?.toLowerCase() ?? "";
      return (
        d.ref.toLowerCase().includes(terme) ||
        d.demandeur.toLowerCase().includes(terme) ||
        d.beneficiaire.toLowerCase().includes(terme) ||
        d.destination.toLowerCase().includes(terme) ||
        d.motif.toLowerCase().includes(terme) ||
        d.lignes.toLowerCase().includes(terme) ||
        d.fournisseurs?.toLowerCase().includes(terme) ||
        statutLabel.includes(terme) ||
        d.refBC?.toLowerCase().includes(terme) ||
        d.refFacture?.toLowerCase().includes(terme)
      );
    }

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
      {/* Barre de recherche avec autocomplétion */}
      <div className="flex items-center gap-3">
        <Popover open={openSearch} onOpenChange={setOpenSearch}>
          <PopoverTrigger asChild>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par référence, demandeur, destination..."
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setOpenSearch(true);
                }}
                onFocus={() => setOpenSearch(true)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {recherche && (
                <button
                  onClick={() => {
                    setRecherche("");
                    setOpenSearch(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandInput placeholder="Rechercher..." value={recherche} />
              <CommandList>
                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

                {suggestions.refs.length > 0 && (
                  <CommandGroup heading="Références">
                    {suggestions.refs
                      .filter((ref) =>
                        ref.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((ref) => (
                        <CommandItem
                          key={ref}
                          onSelect={() => {
                            setRecherche(ref);
                            setOpenSearch(false);
                          }}
                        >
                          <span className="font-mono text-xs">{ref}</span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.demandeurs.length > 0 && (
                  <CommandGroup heading="Demandeurs">
                    {suggestions.demandeurs
                      .filter((d) =>
                        d.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((demandeur) => (
                        <CommandItem
                          key={demandeur}
                          onSelect={() => {
                            setRecherche(demandeur);
                            setOpenSearch(false);
                          }}
                        >
                          {demandeur}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.destinations.length > 0 && (
                  <CommandGroup heading="Destinations">
                    {suggestions.destinations
                      .filter((d) =>
                        d.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((destination) => (
                        <CommandItem
                          key={destination}
                          onSelect={() => {
                            setRecherche(destination);
                            setOpenSearch(false);
                          }}
                        >
                          {destination}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.fournisseurs.length > 0 && (
                  <CommandGroup heading="Fournisseurs">
                    {suggestions.fournisseurs
                      .filter((f) =>
                        f.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((fournisseur) => (
                        <CommandItem
                          key={fournisseur}
                          onSelect={() => {
                            setRecherche(fournisseur);
                            setOpenSearch(false);
                          }}
                        >
                          {fournisseur}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.statuts.length > 0 && (
                  <CommandGroup heading="Statuts">
                    {suggestions.statuts
                      .filter((s) =>
                        s.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((statut) => (
                        <CommandItem
                          key={statut}
                          onSelect={() => {
                            setRecherche(statut);
                            setOpenSearch(false);
                          }}
                        >
                          {statut}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {recherche && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{demandesFiltrees.length}</span>
            <span>résultat{demandesFiltrees.length > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Bouton Export Excel */}
        <Button
          size="sm"
          onClick={exporterVersExcel}
          className="ml-auto rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90 text-white"
          disabled={demandesFiltrees.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter Excel
        </Button>
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

                  {/* Colonnes 9-10 : Prix (masqués selon permission) */}
                  <ColonneHeader
                    label="Fournisseurs"
                    tooltip="Liste des fournisseurs retenus"
                    masque={!prixVisibles}
                  />
                  <ColonneHeader
                    label="Montant (FCFA)"
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
                    <td className="sticky left-0 z-[5] bg-card px-4 py-3 text-sm font-medium whitespace-nowrap">
                      {demande.ref}
                    </td>

                    {/* Colonnes 2-8 */}
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{demande.demandeur}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {demande.beneficiaire}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{demande.destination}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[200px] truncate">{demande.motif}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="max-w-[300px] truncate">{demande.lignes}</div>
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

                    {/* Colonnes 9-10 : Prix masqués (C-05) */}
                    <td className="px-4 py-3 text-sm">
                      {demande.fournisseurs !== null ? (
                        <div className="max-w-[200px] truncate">{demande.fournisseurs}</div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Lock className="h-3 w-3" aria-label="Masqué" /> masqué
                        </span>
                      )}
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                      {demande.montantTTC !== null ? (
                        demande.montantTTC.toLocaleString("fr-FR")
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Lock className="h-3 w-3" aria-label="Masqué" /> masqué
                        </span>
                      )}
                    </td>

                    {/* Colonnes 13-14 : Dates */}
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {demande.dateBC
                        ? format(demande.dateBC, "dd/MM/yyyy", { locale: fr })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
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
