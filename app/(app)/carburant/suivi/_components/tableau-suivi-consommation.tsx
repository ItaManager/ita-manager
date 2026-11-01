"use client";

import { useState, useMemo } from "react";
import { Info, Search, X, Download, Filter, ChevronUp, ChevronDown, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Consommation {
  numero: number;
  date: Date;
  chauffeur: string;
  vehicule: string;
  immatriculation: string;
  typeCarburant: string;
  kmCompteur: number;
  kmParcourus: number;
  litresAjoutes: number;
  prixLitre: number;
  coutTotal: number;
  consoAux100km: number;
  station: string;
  modePaiement: string;
  observations: string;
}

type Filtre = "tous" | "station" | "garage";

type SortColumn = keyof Consommation | null;
type SortDirection = "asc" | "desc";

export function TableauSuiviConsommation() {
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [recherche, setRecherche] = useState("");
  const [openSearch, setOpenSearch] = useState(false);

  // Filtres avancés
  const [filtreVehicule, setFiltreVehicule] = useState<string>("tous");
  const [filtreChauffeur, setFiltreChauffeur] = useState<string>("tous");
  const [filtreTypeCarburant, setFiltreTypeCarburant] = useState<string>("tous");
  const [filtrePeriode, setFiltrePeriode] = useState<string>("tous");
  const [showFiltresAvances, setShowFiltresAvances] = useState(false);

  // Tri
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // TODO: Récupérer les vraies données depuis la base
  const consommations: Consommation[] = [
    {
      numero: 16,
      date: new Date("2026-01-07"),
      chauffeur: "KOUASSI Jean",
      vehicule: "Toyota Yaris",
      immatriculation: "QR-345-ST",
      typeCarburant: "Hybride",
      kmCompteur: 67739,
      kmParcourus: 330,
      litresAjoutes: 36.89,
      prixLitre: 1030,
      coutTotal: 37997,
      consoAux100km: 11.18,
      station: "BP",
      modePaiement: "Ticket carburant",
      observations: "",
    },
    {
      numero: 27,
      date: new Date("2026-01-23"),
      chauffeur: "TOURE Ibrahim",
      vehicule: "Ford Transit",
      immatriculation: "MN-012-OP",
      typeCarburant: "Gasoil",
      kmCompteur: 43387,
      kmParcourus: 224,
      litresAjoutes: 24.40,
      prixLitre: 1336,
      coutTotal: 32598,
      consoAux100km: 10.89,
      station: "Shell",
      modePaiement: "Ticket carburant",
      observations: "",
    },
    {
      numero: 19,
      date: new Date("2026-01-25"),
      chauffeur: "N'GUESSAN François",
      vehicule: "Renault Clio",
      immatriculation: "AB-123-CD",
      typeCarburant: "Super sans plomb",
      kmCompteur: 29696,
      kmParcourus: 184,
      litresAjoutes: 53.41,
      prixLitre: 1060,
      coutTotal: 56615,
      consoAux100km: 29.03,
      station: "Carrefour",
      modePaiement: "Carte bancaire",
      observations: "",
    },
    {
      numero: 23,
      date: new Date("2026-01-26"),
      chauffeur: "KOFFI Marie",
      vehicule: "Peugeot 308",
      immatriculation: "EF-456-GH",
      typeCarburant: "Gasoil",
      kmCompteur: 18341,
      kmParcourus: 87,
      litresAjoutes: 32.80,
      prixLitre: 1140,
      coutTotal: 37392,
      consoAux100km: 37.70,
      station: "Shell",
      modePaiement: "Espèces",
      observations: "",
    },
    {
      numero: 11,
      date: new Date("2026-01-31"),
      chauffeur: "YAO Christophe",
      vehicule: "Citroën C3",
      immatriculation: "IJ-789-KL",
      typeCarburant: "Super",
      kmCompteur: 23021,
      kmParcourus: 164,
      litresAjoutes: 23.43,
      prixLitre: 1064,
      coutTotal: 24929,
      consoAux100km: 14.29,
      station: "BP",
      modePaiement: "Carte carburant",
      observations: "",
    },
    // Données décembre 2025
    {
      numero: 8,
      date: new Date("2025-12-05"),
      chauffeur: "KOUASSI Jean",
      vehicule: "Toyota Yaris",
      immatriculation: "QR-345-ST",
      typeCarburant: "Hybride",
      kmCompteur: 67409,
      kmParcourus: 315,
      litresAjoutes: 35.20,
      prixLitre: 1015,
      coutTotal: 35728,
      consoAux100km: 11.17,
      station: "BP",
      modePaiement: "Carte carburant",
      observations: "",
    },
    {
      numero: 12,
      date: new Date("2025-12-12"),
      chauffeur: "TOURE Ibrahim",
      vehicule: "Ford Transit",
      immatriculation: "MN-012-OP",
      typeCarburant: "Gasoil",
      kmCompteur: 43163,
      kmParcourus: 210,
      litresAjoutes: 22.80,
      prixLitre: 1320,
      coutTotal: 30096,
      consoAux100km: 10.86,
      station: "Shell",
      modePaiement: "Ticket carburant",
      observations: "",
    },
    {
      numero: 15,
      date: new Date("2025-12-18"),
      chauffeur: "N'GUESSAN François",
      vehicule: "Renault Clio",
      immatriculation: "AB-123-CD",
      typeCarburant: "Super sans plomb",
      kmCompteur: 29512,
      kmParcourus: 175,
      litresAjoutes: 50.20,
      prixLitre: 1045,
      coutTotal: 52459,
      consoAux100km: 28.69,
      station: "Total",
      modePaiement: "Carte bancaire",
      observations: "",
    },
    {
      numero: 9,
      date: new Date("2025-12-20"),
      chauffeur: "KOFFI Marie",
      vehicule: "Peugeot 308",
      immatriculation: "EF-456-GH",
      typeCarburant: "Gasoil",
      kmCompteur: 18254,
      kmParcourus: 92,
      litresAjoutes: 34.50,
      prixLitre: 1125,
      coutTotal: 38812,
      consoAux100km: 37.50,
      station: "Garage",
      modePaiement: "Espèces",
      observations: "Consommation élevée",
    },
    {
      numero: 6,
      date: new Date("2025-12-28"),
      chauffeur: "YAO Christophe",
      vehicule: "Citroën C3",
      immatriculation: "IJ-789-KL",
      typeCarburant: "Super",
      kmCompteur: 22857,
      kmParcourus: 158,
      litresAjoutes: 22.60,
      prixLitre: 1050,
      coutTotal: 23730,
      consoAux100km: 14.30,
      station: "BP",
      modePaiement: "Ticket carburant",
      observations: "",
    },
    // Données novembre 2025
    {
      numero: 3,
      date: new Date("2025-11-08"),
      chauffeur: "TOURE Ibrahim",
      vehicule: "Ford Transit",
      immatriculation: "MN-012-OP",
      typeCarburant: "Gasoil",
      kmCompteur: 42953,
      kmParcourus: 198,
      litresAjoutes: 21.50,
      prixLitre: 1305,
      coutTotal: 28057,
      consoAux100km: 10.86,
      station: "Shell",
      modePaiement: "Carte carburant",
      observations: "",
    },
    {
      numero: 5,
      date: new Date("2025-11-15"),
      chauffeur: "YAO Christophe",
      vehicule: "Citroën C3",
      immatriculation: "IJ-789-KL",
      typeCarburant: "Super",
      kmCompteur: 22699,
      kmParcourus: 0,
      litresAjoutes: 20.00,
      prixLitre: 1040,
      coutTotal: 20800,
      consoAux100km: 0,
      station: "BP",
      modePaiement: "Espèces",
      observations: "Compteur non relevé",
    },
  ];

  // Extraire toutes les valeurs uniques pour l'autocomplétion
  const suggestions = useMemo(() => {
    const chauffeurs = new Set<string>();
    const vehicules = new Set<string>();
    const immatriculations = new Set<string>();
    const stations = new Set<string>();

    consommations.forEach((c) => {
      chauffeurs.add(c.chauffeur);
      vehicules.add(c.vehicule);
      immatriculations.add(c.immatriculation);
      stations.add(c.station);
    });

    return {
      chauffeurs: Array.from(chauffeurs).sort(),
      vehicules: Array.from(vehicules).sort(),
      immatriculations: Array.from(immatriculations).sort(),
      stations: Array.from(stations).sort(),
    };
  }, [consommations]);

  // Filtrer les consommations
  const consommationsFiltrees = consommations.filter((c) => {
    // Filtre par circuit
    if (filtre === "station" && c.station === "Garage") return false;
    if (filtre === "garage" && c.station !== "Garage") return false;

    // Filtre par recherche
    if (recherche) {
      const terme = recherche.toLowerCase();
      return (
        c.chauffeur.toLowerCase().includes(terme) ||
        c.vehicule.toLowerCase().includes(terme) ||
        c.immatriculation.toLowerCase().includes(terme) ||
        c.station.toLowerCase().includes(terme)
      );
    }

    return true;
  });

  if (consommations.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune consommation enregistrée.
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
                placeholder="Rechercher par chauffeur, véhicule, immatriculation, station..."
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

                {suggestions.chauffeurs.length > 0 && (
                  <CommandGroup heading="Chauffeurs">
                    {suggestions.chauffeurs
                      .filter((c) =>
                        c.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((chauffeur) => (
                        <CommandItem
                          key={chauffeur}
                          onSelect={() => {
                            setRecherche(chauffeur);
                            setOpenSearch(false);
                          }}
                        >
                          {chauffeur}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.vehicules.length > 0 && (
                  <CommandGroup heading="Véhicules">
                    {suggestions.vehicules
                      .filter((v) =>
                        v.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((vehicule) => (
                        <CommandItem
                          key={vehicule}
                          onSelect={() => {
                            setRecherche(vehicule);
                            setOpenSearch(false);
                          }}
                        >
                          {vehicule}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.immatriculations.length > 0 && (
                  <CommandGroup heading="Immatriculations">
                    {suggestions.immatriculations
                      .filter((i) =>
                        i.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((immatriculation) => (
                        <CommandItem
                          key={immatriculation}
                          onSelect={() => {
                            setRecherche(immatriculation);
                            setOpenSearch(false);
                          }}
                        >
                          <span className="font-mono text-xs">{immatriculation}</span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {suggestions.stations.length > 0 && (
                  <CommandGroup heading="Stations">
                    {suggestions.stations
                      .filter((s) =>
                        s.toLowerCase().includes(recherche.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((station) => (
                        <CommandItem
                          key={station}
                          onSelect={() => {
                            setRecherche(station);
                            setOpenSearch(false);
                          }}
                        >
                          {station}
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
            <span className="font-medium">{consommationsFiltrees.length}</span>
            <span>résultat{consommationsFiltrees.length > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Bouton Export Excel */}
        <Button
          size="sm"
          className="ml-auto rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90 text-white"
          disabled={consommationsFiltrees.length === 0}
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
          Tous ({consommations.length})
        </Button>
        <Button
          variant={filtre === "station" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltre("station")}
        >
          Stations (
          {consommations.filter((c) => c.station !== "Garage").length})
        </Button>
        <Button
          variant={filtre === "garage" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltre("garage")}
        >
          Garage (
          {consommations.filter((c) => c.station === "Garage").length})
        </Button>
      </div>

      {/* Tableau */}
      <div className="rounded-lg border bg-card">
        <div className="bandeau border-b px-6 py-3">
          <h2 className="text-lg font-semibold">
            {consommationsFiltrees.length} distribution
            {consommationsFiltrees.length > 1 ? "s" : ""}
          </h2>
        </div>

        {consommationsFiltrees.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune distribution pour ce filtre.
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="tabulaire w-full">
              <thead className="sticky top-0 z-[5] bg-muted/50">
                <tr className="border-b">
                  <ColonneHeader
                    label="N°"
                    tooltip="Numéro de la distribution"
                  />
                  <ColonneHeader
                    label="Date"
                    tooltip="Date de distribution du carburant"
                  />
                  <ColonneHeader
                    label="Chauffeur"
                    tooltip="Nom du chauffeur"
                  />
                  <ColonneHeader
                    label="Véhicule"
                    tooltip="Marque et modèle du véhicule"
                  />
                  <ColonneHeader
                    label="Immatriculation"
                    tooltip="Plaque d'immatriculation"
                  />
                  <ColonneHeader
                    label="Type Carburant"
                    tooltip="Type de carburant (Diesel, Sans-plomb, Hybride)"
                  />
                  <ColonneHeader
                    label="Km au compteur"
                    tooltip="Kilométrage au compteur lors du plein"
                    align="right"
                  />
                  <ColonneHeader
                    label="Km parcourus"
                    tooltip="Kilomètres parcourus depuis le dernier plein"
                    align="right"
                  />
                  <ColonneHeader
                    label="Litres ajoutés"
                    tooltip="Quantité de carburant ajoutée en litres"
                    align="right"
                  />
                  <ColonneHeader
                    label="Prix/Litre (FCFA)"
                    tooltip="Prix unitaire du litre"
                    align="right"
                  />
                  <ColonneHeader
                    label="Coût total (FCFA)"
                    tooltip="Montant total de la dépense"
                    align="right"
                  />
                  <ColonneHeader
                    label="Conso (L/100km)"
                    tooltip="Consommation aux 100 km"
                    align="right"
                  />
                  <ColonneHeader
                    label="Station"
                    tooltip="Nom de la station-service"
                  />
                  <ColonneHeader
                    label="Mode paiement"
                    tooltip="Moyen de paiement utilisé"
                  />
                  <ColonneHeader
                    label="Observations"
                    tooltip="Remarques éventuelles"
                  />
                </tr>
              </thead>

              <tbody>
                {consommationsFiltrees.map((conso, index) => (
                  <tr
                    key={conso.numero}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {format(conso.date, "dd/MM/yyyy", {
                        locale: fr,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {conso.chauffeur}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {conso.vehicule}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap font-mono">
                      {conso.immatriculation}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {conso.typeCarburant}
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm whitespace-nowrap">
                      {conso.kmCompteur.toLocaleString("fr-FR")} km
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm whitespace-nowrap">
                      {conso.kmParcourus.toLocaleString("fr-FR")} km
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                      {conso.litresAjoutes.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} L
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm whitespace-nowrap">
                      {conso.prixLitre.toLocaleString("fr-FR")} F
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                      {conso.coutTotal.toLocaleString("fr-FR")} F
                    </td>
                    <td className="montant px-4 py-3 text-right text-sm whitespace-nowrap">
                      {conso.consoAux100km.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {conso.station}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {conso.modePaiement}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {conso.observations || "—"}
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
  align = "left",
}: {
  label: string;
  tooltip: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
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
