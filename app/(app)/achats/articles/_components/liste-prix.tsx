"use client";

import { useState, useMemo } from "react";
import { Search, X, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

interface Prix {
  id: string;
  prixHT: number;
  article: {
    designation: string;
    unite: {
      libelle: string;
    };
  };
  fournisseur: {
    nom: string;
  };
}

interface ListePrixProps {
  prix: Prix[];
  onAjouterClick: () => void;
}

export function ListePrix({ prix, onAjouterClick }: ListePrixProps) {
  const [recherche, setRecherche] = useState("");

  // Filtrer les prix selon la recherche
  const prixFiltres = useMemo(() => {
    if (!recherche) return prix;

    const terme = recherche.toLowerCase();
    return prix.filter((p) =>
      p.article.designation.toLowerCase().includes(terme) ||
      p.fournisseur.nom.toLowerCase().includes(terme) ||
      p.article.unite.libelle.toLowerCase().includes(terme)
    );
  }, [prix, recherche]);

  // Fonction d'export Excel
  const exporterVersExcel = () => {
    const donneesExport = prixFiltres.map((p) => ({
      "Article": p.article.designation,
      "Unité": p.article.unite.libelle,
      "Fournisseur": p.fournisseur.nom,
      "Prix HT (FCFA)": Number(p.prixHT),
    }));

    const ws = XLSX.utils.json_to_sheet(donneesExport);
    const wb = XLSX.utils.book_new();

    // Largeurs de colonnes
    ws["!cols"] = [
      { wch: 50 }, // Article
      { wch: 15 }, // Unité
      { wch: 30 }, // Fournisseur
      { wch: 18 }, // Prix HT
    ];

    // Styliser les en-têtes
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        fill: { fgColor: { rgb: "1D186C" } },
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

    // Styliser les lignes de données
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const isEven = row % 2 === 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          fill: { fgColor: { rgb: isEven ? "F3F4F6" : "FFFFFF" } },
          font: { sz: 11 },
          alignment: {
            horizontal: col === 3 ? "right" : "left",
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

    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, "Bordereau de prix");

    const dateExport = format(new Date(), "yyyy-MM-dd_HHmm", { locale: fr });
    const nomFichier = `bordereau-prix_${dateExport}.xlsx`;

    XLSX.writeFile(wb, nomFichier);
  };

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex items-center gap-3">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par article, fournisseur, unité..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9 pr-9 rounded-md"
          />
          {recherche && (
            <button
              onClick={() => setRecherche("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Compteur de résultats */}
        {recherche && (
          <Badge variant="secondary" className="h-9 px-3 text-sm font-medium">
            {prixFiltres.length} résultat{prixFiltres.length > 1 ? "s" : ""}
          </Badge>
        )}

        {/* Boutons d'actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            onClick={exporterVersExcel}
            className="rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90 text-white"
            disabled={prixFiltres.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
          <Button
            size="sm"
            onClick={onAjouterClick}
            className="rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un prix
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-lg border bg-card">
        <div className="bandeau border-b px-6 py-3">
          <h2 className="text-lg font-semibold">
            {prixFiltres.length} prix enregistré{prixFiltres.length > 1 ? "s" : ""}
          </h2>
        </div>

        {prixFiltres.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {recherche
                ? "Aucun prix trouvé pour cette recherche."
                : "Aucun prix enregistré."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {recherche
                ? "Essayez avec d'autres termes de recherche."
                : "Cliquez sur 'Ajouter un prix' pour commencer."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabulaire w-full">
              <thead className="sticky top-0 z-[5] bg-muted/50">
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Unité
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Prix HT (FCFA)
                  </th>
                </tr>
              </thead>
              <tbody>
                {prixFiltres.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-3 text-sm">{p.article.designation}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {p.article.unite.libelle}
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      {p.fournisseur.nom}
                    </td>
                    <td className="montant px-6 py-3 text-right text-sm font-medium whitespace-nowrap tabular-nums">
                      {Number(p.prixHT).toLocaleString("fr-FR")}
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
