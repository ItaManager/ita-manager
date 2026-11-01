"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DonneesConsommation {
  vehiculeId: string;
  vehiculeCode: string;
  vehiculeDesignation: string;
  flotte: string;
  consommationMensuelle: number[];
  total: number;
}

interface TableauConsommationProps {
  donnees: DonneesConsommation[];
  annee: number;
  totalEnregistrements: number;
  quantiteTotale: number;
}

const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function TableauConsommation({
  donnees,
  annee,
  totalEnregistrements,
  quantiteTotale,
}: TableauConsommationProps) {
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(annee);

  const exporterExcel = () => {
    // Export CSV (compatible Excel)
    import("@/lib/export/carburant-export").then(({ exporterCSV }) => {
      exporterCSV(donnees, anneeSelectionnee, quantiteTotale);
    });
  };

  const exporterPDF = () => {
    import("@/lib/export/carburant-export").then(({ exporterPDF }) => {
      exporterPDF(donnees, anneeSelectionnee, quantiteTotale);
    });
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec filtres et indicateurs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Nombre d'enregistrements
            </span>
            <span className="text-2xl font-semibold text-blue-600">
              {totalEnregistrements}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Quantité totale (L)
            </span>
            <span className="text-2xl font-semibold text-red-600">
              {quantiteTotale.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={anneeSelectionnee.toString()}
            onValueChange={(v) => setAnneeSelectionnee(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((a) => (
                <SelectItem key={a} value={a.toString()}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exporterExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exporterPDF}>
            <FileText className="h-4 w-4 mr-2 text-red-600" />
            PDF
          </Button>
        </div>
      </div>

      {/* Tableau de consommation */}
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="font-semibold text-primary">Flotte</TableHead>
              <TableHead className="font-semibold text-primary">Véhicule</TableHead>
              {MOIS.map((mois) => (
                <TableHead
                  key={mois}
                  className="text-right font-semibold text-primary"
                >
                  {mois}
                </TableHead>
              ))}
              <TableHead className="text-right font-semibold text-primary">
                Quantité totale (L)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donnees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="text-center text-muted-foreground py-8"
                >
                  Aucune donnée de consommation pour {anneeSelectionnee}
                </TableCell>
              </TableRow>
            ) : (
              donnees.map((vehicule) => (
                <TableRow key={vehicule.vehiculeId}>
                  <TableCell className="font-medium">
                    {vehicule.flotte}
                  </TableCell>
                  <TableCell className="text-blue-600 font-mono">
                    {vehicule.vehiculeCode}
                  </TableCell>
                  {vehicule.consommationMensuelle.map((quantite, idx) => (
                    <TableCell
                      key={idx}
                      className="text-right tabular-nums text-sm"
                    >
                      {quantite > 0
                        ? quantite.toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0"}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-red-600 tabular-nums">
                    {vehicule.total.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
