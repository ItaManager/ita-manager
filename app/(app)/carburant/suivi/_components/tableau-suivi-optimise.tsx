"use client";

import { useState, useMemo } from "react";
import {
  Info,
  Search,
  X,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Fuel,
  DollarSign,
  Activity,
} from "lucide-react";
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
import {
  format,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Consommation {
  numero: number;
  date: Date;
  chauffeur: string;
  vehicule: string;
  immatriculation: string;
  typeCarburant: string;
  compteurPrecedent: number;
  kmCompteur: number;
  uniteCompteur: string;
  kmParcourus: number;
  litresAjoutes: number;
  pleinComplet: boolean;
  coutTotal: number;
  consoAux100km: number;
  station: string;
  modePaiement: string;
  numeroFacture: string;
  observations: string;
}

interface DonneesInitiales {
  consommations: Consommation[];
  statistiques: {
    totalDistributions: number;
    totalLitres: number;
    totalCout: number;
    totalKm: number;
    consoMoyenne: number;
  };
  filtres: {
    vehicules: string[];
    chauffeurs: string[];
    stations: string[];
    typesCarburant: string[];
    immatriculations: string[];
  };
}

type SortColumn = keyof Consommation | null;
type SortDirection = "asc" | "desc";

interface TableauSuiviOptimiseProps {
  donneesInitiales: DonneesInitiales;
}

export function TableauSuiviOptimise({ donneesInitiales }: TableauSuiviOptimiseProps) {
  const [recherche, setRecherche] = useState("");
  const [openSearch, setOpenSearch] = useState(false);

  // Filtres avancés
  const [filtreVehicule, setFiltreVehicule] = useState<string>("tous");
  const [filtreChauffeur, setFiltreChauffeur] = useState<string>("tous");
  const [filtreTypeCarburant, setFiltreTypeCarburant] =
    useState<string>("tous");
  const [filtrePeriode, setFiltrePeriode] = useState<string>("tous");
  const [filtreStation, setFiltreStation] = useState<string>("tous");
  const [showFiltresAvances, setShowFiltresAvances] = useState(false);

  // Filtre par dates personnalisées
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");

  // Tri
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Recherche dans l'analyse par véhicule
  const [rechercheVehicule, setRechercheVehicule] = useState("");

  // Utiliser les données récupérées depuis la base
  const consommations = donneesInitiales.consommations;
  const options = donneesInitiales.filtres;

  // Fonction pour obtenir la plage de dates selon le filtre période
  const getPeriodRange = (periode: string): [Date, Date] | null => {
    const now = new Date();
    switch (periode) {
      case "mois-actuel":
        return [startOfMonth(now), endOfMonth(now)];
      case "mois-precedent":
        return [
          startOfMonth(subMonths(now, 1)),
          endOfMonth(subMonths(now, 1)),
        ];
      case "3-mois":
        return [startOfMonth(subMonths(now, 2)), endOfMonth(now)];
      case "6-mois":
        return [startOfMonth(subMonths(now, 5)), endOfMonth(now)];
      case "annee":
        return [startOfMonth(subMonths(now, 11)), endOfMonth(now)];
      default:
        return null;
    }
  };

  // Fonction pour déterminer si une consommation est anormale
  const isAnomalieConsommation = (conso: Consommation): string | null => {
    if (conso.consoAux100km === 0 && conso.kmParcourus === 0)
      return "Compteur non relevé";
    if (conso.consoAux100km > 30) return "Consommation excessive";
    if (conso.consoAux100km > 20) return "Consommation élevée";
    return null;
  };

  // Filtrer et trier les consommations
  const consommationsFiltrees = useMemo(() => {
    let filtered = [...consommations];

    // Filtre par dates personnalisées (prioritaire sur filtrePeriode)
    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);

      filtered = filtered.filter((c) =>
        isWithinInterval(c.date, { start: debut, end: fin })
      );
    }
    // Filtre par période prédéfinie si pas de dates personnalisées
    else if (filtrePeriode !== "tous") {
      const range = getPeriodRange(filtrePeriode);
      if (range) {
        const [start, end] = range;
        filtered = filtered.filter((c) =>
          isWithinInterval(c.date, { start, end })
        );
      }
    }

    // Filtre par véhicule
    if (filtreVehicule !== "tous") {
      filtered = filtered.filter((c) => c.vehicule === filtreVehicule);
    }

    // Filtre par chauffeur
    if (filtreChauffeur !== "tous") {
      filtered = filtered.filter((c) => c.chauffeur === filtreChauffeur);
    }

    // Filtre par type carburant
    if (filtreTypeCarburant !== "tous") {
      filtered = filtered.filter(
        (c) => c.typeCarburant === filtreTypeCarburant
      );
    }

    // Filtre par station
    if (filtreStation !== "tous") {
      if (filtreStation === "garage") {
        filtered = filtered.filter((c) => c.station === "Garage");
      } else if (filtreStation === "stations") {
        filtered = filtered.filter((c) => c.station !== "Garage");
      }
    }

    // Filtre par recherche
    if (recherche) {
      const terme = recherche.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.chauffeur.toLowerCase().includes(terme) ||
          c.vehicule.toLowerCase().includes(terme) ||
          c.immatriculation.toLowerCase().includes(terme) ||
          c.station.toLowerCase().includes(terme)
      );
    }

    // Tri
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal instanceof Date && bVal instanceof Date) {
          return sortDirection === "asc"
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return 0;
      });
    }

    return filtered;
  }, [
    consommations,
    filtrePeriode,
    filtreVehicule,
    filtreChauffeur,
    filtreTypeCarburant,
    filtreStation,
    recherche,
    sortColumn,
    sortDirection,
    dateDebut,
    dateFin,
  ]);

  // Calcul des indicateurs de synthèse
  const indicateurs = useMemo(() => {
    const totalLitres = consommationsFiltrees.reduce(
      (sum, c) => sum + c.litresAjoutes,
      0
    );
    const totalCout = consommationsFiltrees.reduce(
      (sum, c) => sum + c.coutTotal,
      0
    );
    const totalKm = consommationsFiltrees.reduce(
      (sum, c) => sum + c.kmParcourus,
      0
    );
    const consoMoyenne =
      consommationsFiltrees.filter((c) => c.consoAux100km > 0).reduce(
        (sum, c) => sum + c.consoAux100km,
        0
      ) /
      consommationsFiltrees.filter((c) => c.consoAux100km > 0).length;

    return {
      totalLitres,
      totalCout,
      totalKm,
      consoMoyenne: isNaN(consoMoyenne) ? 0 : consoMoyenne,
      nombrePleins: consommationsFiltrees.length,
    };
  }, [consommationsFiltrees]);

  // Analyse par véhicule
  const analyseParVehicule = useMemo(() => {
    const vehiculesMap = new Map<
      string,
      {
        vehicule: string;
        immatriculation: string;
        nombrePleins: number;
        totalLitres: number;
        totalCout: number;
        totalKm: number;
        consoMoyenne: number;
      }
    >();

    consommationsFiltrees.forEach((c) => {
      const key = `${c.vehicule}-${c.immatriculation}`;
      if (!vehiculesMap.has(key)) {
        vehiculesMap.set(key, {
          vehicule: c.vehicule,
          immatriculation: c.immatriculation,
          nombrePleins: 0,
          totalLitres: 0,
          totalCout: 0,
          totalKm: 0,
          consoMoyenne: 0,
        });
      }

      const stats = vehiculesMap.get(key)!;
      stats.nombrePleins++;
      stats.totalLitres += c.litresAjoutes;
      stats.totalCout += c.coutTotal;
      stats.totalKm += c.kmParcourus;
    });

    // Calculer la consommation moyenne par véhicule
    let result = Array.from(vehiculesMap.values()).map((stats) => ({
      ...stats,
      consoMoyenne:
        stats.totalKm > 0 ? (stats.totalLitres / stats.totalKm) * 100 : 0,
    }));

    // Filtrer par recherche
    if (rechercheVehicule) {
      const terme = rechercheVehicule.toLowerCase();
      result = result.filter(
        (v) =>
          v.vehicule.toLowerCase().includes(terme) ||
          v.immatriculation.toLowerCase().includes(terme)
      );
    }

    // Trier par coût total décroissant
    return result.sort((a, b) => b.totalCout - a.totalCout);
  }, [consommationsFiltrees, rechercheVehicule]);

  // Données pagination
  const totalPages = Math.ceil(consommationsFiltrees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const consommationsPaginees = consommationsFiltrees.slice(
    startIndex,
    endIndex
  );

  // Fonction de tri
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Nombre de filtres actifs
  const filtresActifs =
    (filtreVehicule !== "tous" ? 1 : 0) +
    (filtreChauffeur !== "tous" ? 1 : 0) +
    (filtreTypeCarburant !== "tous" ? 1 : 0) +
    (filtrePeriode !== "tous" || (dateDebut && dateFin) ? 1 : 0) +
    (filtreStation !== "tous" ? 1 : 0);

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
    <div className="space-y-6">
      {/* Indicateurs de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consommation totale
            </CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {indicateurs.totalLitres.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              L
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {indicateurs.totalCout.toLocaleString("fr-FR")} F
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Km parcourus</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {indicateurs.totalKm.toLocaleString("fr-FR")} km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conso moyenne
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {indicateurs.consoMoyenne.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">L/100km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pleins</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {indicateurs.nombrePleins}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse par véhicule */}
      {analyseParVehicule.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b border-border space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Analyse par véhicule</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consommation totale de chaque véhicule sur la période filtrée
              </p>
            </div>

            {/* Barre de recherche et export */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un véhicule ou immatriculation..."
                  value={rechercheVehicule}
                  onChange={(e) => setRechercheVehicule(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {rechercheVehicule && (
                  <button
                    onClick={() => setRechercheVehicule("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={analyseParVehicule.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="tabulaire w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Véhicule
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Immatriculation
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pleins
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total litres
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total coût (FCFA)
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Km parcourus
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Conso moy. (L/100km)
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyseParVehicule.map((stats, index) => (
                  <tr
                    key={`${stats.vehicule}-${stats.immatriculation}`}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 text-sm font-medium">
                      {stats.vehicule}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {stats.immatriculation}
                    </td>
                    <td className="montant py-3 px-4 text-right text-sm tabular-nums">
                      {stats.nombrePleins}
                    </td>
                    <td className="montant py-3 px-4 text-right text-sm font-medium tabular-nums">
                      {stats.totalLitres.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      L
                    </td>
                    <td className="montant py-3 px-4 text-right text-sm font-medium tabular-nums">
                      {stats.totalCout.toLocaleString("fr-FR")} F
                    </td>
                    <td className="montant py-3 px-4 text-right text-sm tabular-nums">
                      {stats.totalKm.toLocaleString("fr-FR")} km
                    </td>
                    <td
                      className={`montant py-3 px-4 text-right text-sm font-medium tabular-nums ${
                        stats.consoMoyenne > 20
                          ? "text-orange-600"
                          : ""
                      }`}
                    >
                      {stats.consoMoyenne > 0
                        ? stats.consoMoyenne.toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {/* Recherche */}
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

                  {options.chauffeurs.length > 0 && (
                    <CommandGroup heading="Chauffeurs">
                      {options.chauffeurs
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

                  {options.vehicules.length > 0 && (
                    <CommandGroup heading="Véhicules">
                      {options.vehicules
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

                  {options.immatriculations.length > 0 && (
                    <CommandGroup heading="Immatriculations">
                      {options.immatriculations
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
                            <span className="font-mono text-xs">
                              {immatriculation}
                            </span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {options.stations.length > 0 && (
                    <CommandGroup heading="Stations">
                      {options.stations
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

          {/* Bouton filtres avancés */}
          <Button
            variant={showFiltresAvances ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFiltresAvances(!showFiltresAvances)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {filtresActifs > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filtresActifs}
              </Badge>
            )}
          </Button>

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

        {/* Filtres avancés (panneau déroulant) */}
        {showFiltresAvances && (
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Période */}
              <div className="space-y-2">
                <Label htmlFor="periode" className="text-xs font-medium">
                  Période
                </Label>
                <Select
                  value={filtrePeriode}
                  onValueChange={(value) => {
                    setFiltrePeriode(value);
                    // Réinitialiser les dates personnalisées quand on sélectionne une période
                    if (value !== "tous") {
                      setDateDebut("");
                      setDateFin("");
                    }
                  }}
                >
                  <SelectTrigger id="periode">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    <SelectItem value="mois-actuel">Mois en cours</SelectItem>
                    <SelectItem value="mois-precedent">
                      Mois précédent
                    </SelectItem>
                    <SelectItem value="3-mois">3 derniers mois</SelectItem>
                    <SelectItem value="6-mois">6 derniers mois</SelectItem>
                    <SelectItem value="annee">12 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date début */}
              <div className="space-y-2">
                <Label htmlFor="dateDebut" className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date début
                </Label>
                <input
                  id="dateDebut"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => {
                    setDateDebut(e.target.value);
                    // Réinitialiser filtrePeriode quand on sélectionne des dates
                    if (e.target.value && dateFin) {
                      setFiltrePeriode("tous");
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Date fin */}
              <div className="space-y-2">
                <Label htmlFor="dateFin" className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date fin
                </Label>
                <input
                  id="dateFin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => {
                    setDateFin(e.target.value);
                    // Réinitialiser filtrePeriode quand on sélectionne des dates
                    if (dateDebut && e.target.value) {
                      setFiltrePeriode("tous");
                    }
                  }}
                  min={dateDebut}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Véhicule */}
              <div className="space-y-2">
                <Label htmlFor="vehicule" className="text-xs font-medium">
                  Véhicule
                </Label>
                <Select
                  value={filtreVehicule}
                  onValueChange={setFiltreVehicule}
                >
                  <SelectTrigger id="vehicule">
                    <SelectValue placeholder="Tous les véhicules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    {options.vehicules.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chauffeur */}
              <div className="space-y-2">
                <Label htmlFor="chauffeur" className="text-xs font-medium">
                  Chauffeur
                </Label>
                <Select
                  value={filtreChauffeur}
                  onValueChange={setFiltreChauffeur}
                >
                  <SelectTrigger id="chauffeur">
                    <SelectValue placeholder="Tous les chauffeurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    {options.chauffeurs.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type carburant */}
              <div className="space-y-2">
                <Label htmlFor="type-carburant" className="text-xs font-medium">
                  Type carburant
                </Label>
                <Select
                  value={filtreTypeCarburant}
                  onValueChange={setFiltreTypeCarburant}
                >
                  <SelectTrigger id="type-carburant">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    {options.typesCarburant.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Station */}
              <div className="space-y-2">
                <Label htmlFor="station" className="text-xs font-medium">
                  Station
                </Label>
                <Select value={filtreStation} onValueChange={setFiltreStation}>
                  <SelectTrigger id="station">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    <SelectItem value="stations">Stations-service</SelectItem>
                    <SelectItem value="garage">Garage ITA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bouton réinitialiser */}
            {filtresActifs > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltrePeriode("tous");
                    setFiltreVehicule("tous");
                    setFiltreChauffeur("tous");
                    setFiltreTypeCarburant("tous");
                    setFiltreStation("tous");
                    setDateDebut("");
                    setDateFin("");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Compteur résultats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            {consommationsFiltrees.length}
          </span>
          <span>
            distribution{consommationsFiltrees.length > 1 ? "s" : ""} trouvée
            {consommationsFiltrees.length > 1 ? "s" : ""}
          </span>
          {consommationsFiltrees.length !== consommations.length && (
            <span>sur {consommations.length} au total</span>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-lg border bg-card">
        {consommationsFiltrees.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune distribution pour ces critères.
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="tabulaire w-full">
                <thead className="sticky top-0 z-[5] bg-muted/50">
                  <tr className="border-b">
                    <ColonneHeaderSortable
                      label="N°"
                      tooltip="Numéro de la distribution"
                      column="numero"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Date"
                      tooltip="Date de distribution du carburant"
                      column="date"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Chauffeur"
                      tooltip="Nom du chauffeur"
                      column="chauffeur"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Véhicule"
                      tooltip="Marque et modèle du véhicule"
                      column="vehicule"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeader
                      label="Immatriculation"
                      tooltip="Plaque d'immatriculation"
                    />
                    <ColonneHeaderSortable
                      label="Type Carburant"
                      tooltip="Type de carburant (Super, Super sans plomb, Gasoil, Hybride)"
                      column="typeCarburant"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Km au compteur"
                      tooltip="Kilométrage au compteur lors du plein"
                      align="right"
                      column="kmCompteur"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Km parcourus"
                      tooltip="Kilomètres parcourus depuis le dernier plein"
                      align="right"
                      column="kmParcourus"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Litres ajoutés"
                      tooltip="Quantité de carburant ajoutée en litres"
                      align="right"
                      column="litresAjoutes"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Coût total (FCFA)"
                      tooltip="Montant total de la dépense"
                      align="right"
                      column="coutTotal"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Conso (L/100km)"
                      tooltip="Consommation aux 100 km"
                      align="right"
                      column="consoAux100km"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <ColonneHeaderSortable
                      label="Station"
                      tooltip="Nom de la station-service"
                      column="station"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
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
                  {consommationsPaginees.map((conso, index) => {
                    const anomalie = isAnomalieConsommation(conso);
                    const isAnomalie = anomalie !== null;

                    return (
                      <tr
                        key={conso.numero}
                        className={`border-b last:border-0 hover:bg-muted/30 ${
                          isAnomalie ? "bg-orange-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {startIndex + index + 1}
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
                          {conso.kmParcourus > 0 ? (
                            <>{conso.kmParcourus.toLocaleString("fr-FR")} km</>
                          ) : (
                            <span className="text-orange-600">—</span>
                          )}
                        </td>
                        <td className="montant px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                          {conso.litresAjoutes.toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          L
                        </td>
                        <td className="montant px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                          {conso.coutTotal.toLocaleString("fr-FR")} F
                        </td>
                        <td className="montant px-4 py-3 text-right text-sm whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {conso.consoAux100km > 0 ? (
                              <>
                                {isAnomalie && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{anomalie}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <span
                                  className={
                                    isAnomalie ? "text-orange-600 font-medium" : ""
                                  }
                                >
                                  {conso.consoAux100km.toLocaleString("fr-FR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="text-orange-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />—
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{anomalie}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} • {startIndex + 1}-
                  {Math.min(endIndex, consommationsFiltrees.length)} sur{" "}
                  {consommationsFiltrees.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Précédent
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 py-1 text-sm text-muted-foreground">
                              ...
                            </span>
                          )}
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper component pour headers avec tooltip simple
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
      <div
        className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
      >
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

// Helper component pour headers triables
function ColonneHeaderSortable({
  label,
  tooltip,
  column,
  sortColumn,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string;
  tooltip: string;
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  align?: "left" | "right";
}) {
  const isActive = sortColumn === column;

  return (
    <th
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div
        className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
      >
        <button
          onClick={() => onSort(column)}
          className="flex items-center gap-1 group hover:text-foreground transition-colors"
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {label}
          </span>
          {isActive ? (
            sortDirection === "asc" ? (
              <ChevronUp className="h-3 w-3 text-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-foreground" />
            )
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-50" />
          )}
        </button>
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
