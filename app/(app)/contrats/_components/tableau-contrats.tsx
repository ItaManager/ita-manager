"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Contrat = {
  id: string;
  employe: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    typeMainOeuvre: string;
  };
  typeContrat: string;
  dateDebut: Date;
  dateFin?: Date;
  signe: boolean;
  salaire?: number;
  derniersAvenants: number;
  actif: boolean;
  niveauAlerte: "danger" | "warning" | null;
};

type TableauContratsProps = {
  contrats: Contrat[];
  total: number;
  pages: number;
  pageActuelle: number;
};

export function TableauContrats({
  contrats,
  total,
  pages,
  pageActuelle,
}: TableauContratsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = useState(
    searchParams.get("recherche") || ""
  );

  const handleRecherche = (value: string) => {
    setRecherche(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("recherche", value);
    } else {
      params.delete("recherche");
    }
    params.delete("page");
    router.push(`/contrats?${params.toString()}`);
  };

  const handleFiltreTypeContrat = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "tous") {
      params.delete("typeContrat");
    } else {
      params.set("typeContrat", value);
    }
    params.delete("page");
    router.push(`/contrats?${params.toString()}`);
  };

  const handleFiltreEcheance = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "tous") {
      params.delete("echeance");
    } else {
      params.set("echeance", value);
    }
    params.delete("page");
    router.push(`/contrats?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/contrats?${params.toString()}`);
  };

  const calculerJoursRestants = (dateFin?: Date): number | null => {
    if (!dateFin) return null;
    const now = new Date();
    const fin = new Date(dateFin);
    const diff = fin.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getBadgeEcheance = (joursRestants: number | null) => {
    if (joursRestants === null) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          CDI
        </Badge>
      );
    }

    if (joursRestants < 30) {
      return (
        <Badge variant="destructive" className="gap-1.5">
          CRITIQUE - {joursRestants}j
        </Badge>
      );
    }

    if (joursRestants < 60) {
      return (
        <Badge className="gap-1.5 bg-orange-100 text-orange-700 border-orange-200">
          ALERTE - {joursRestants}j
        </Badge>
      );
    }

    return (
      <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-200">
        OK - {joursRestants}j
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Rechercher par matricule ou nom..."
          value={recherche}
          onChange={(e) => handleRecherche(e.target.value)}
          className="max-w-md"
        />

        <Select
          defaultValue={searchParams.get("typeContrat") || "tous"}
          onValueChange={handleFiltreTypeContrat}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les types</SelectItem>
            <SelectItem value="CDI">CDI</SelectItem>
            <SelectItem value="CDD">CDD</SelectItem>
            <SelectItem value="INTERIM">Intérim</SelectItem>
            <SelectItem value="STAGE">Stage</SelectItem>
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get("echeance") || "tous"}
          onValueChange={handleFiltreEcheance}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Toutes échéances</SelectItem>
            <SelectItem value="30j">moins de 30j</SelectItem>
            <SelectItem value="60j">moins de 60j</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Début</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contrats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucun contrat enregistré
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les contrats apparaîtront ici une fois les employés créés
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              contrats.map((contrat) => {
                const joursRestants = calculerJoursRestants(contrat.dateFin);
                return (
                  <TableRow
                    key={contrat.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(
                        `/employes/${contrat.employe.id}?onglet=contrats`
                      )
                    }
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {contrat.employe.nom} {contrat.employe.prenom}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {contrat.employe.matricule}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contrat.typeContrat === "CDD" ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                          CDD
                        </Badge>
                      ) : contrat.typeContrat === "CDI" ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          CDI
                        </Badge>
                      ) : (
                        <Badge variant="outline">{contrat.typeContrat}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(contrat.dateDebut), "dd/MM/yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      {contrat.dateFin ? (
                        format(new Date(contrat.dateFin), "dd/MM/yyyy", {
                          locale: fr,
                        })
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getBadgeEcheance(joursRestants)}</TableCell>
                    <TableCell>
                      {contrat.signe ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Signé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Non signé
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageActuelle === 1}
            onClick={() => handlePageChange(pageActuelle - 1)}
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {pageActuelle} sur {pages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pageActuelle === pages}
            onClick={() => handlePageChange(pageActuelle + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
