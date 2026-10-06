import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LigneBPU {
  numero: string;
  type?: string | null;
  description: string;
  unite: string;
  prixUnitaireHT: number;
}

interface SerieBPU {
  code: string;
  titre: string;
  sousTitre?: string | null;
  lignes: LigneBPU[];
}

interface LotBPU {
  numero: string;
  titre: string;
  categorie?: string | null;
  series: SerieBPU[];
}

interface BPUExport {
  nom: string;
  lots: LotBPU[];
  projet?: {
    code: string;
    nom: string;
  };
}

/**
 * Exporter un BPU vers Excel avec format professionnel
 */
export function exporterBPUVersExcel(bpu: BPUExport): Blob {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  // Pour chaque lot
  bpu.lots.forEach((lot, lotIndex) => {
    // Titre du lot (merge cells)
    wsData.push([lot.numero + " - " + lot.titre]);
    if (lot.categorie) {
      wsData.push([lot.categorie]);
    }
    wsData.push([]); // Ligne vide

    // Pour chaque série
    lot.series.forEach((serie) => {
      // Titre de la série (fond orange)
      wsData.push([serie.code + " - " + serie.titre]);
      if (serie.sousTitre) {
        wsData.push([serie.sousTitre]);
      }

      // En-têtes de colonnes
      wsData.push(["N°", "Type", "Description", "Unité", "Prix U €HT"]);

      // Lignes d'articles
      serie.lignes.forEach((ligne) => {
        wsData.push([
          ligne.numero,
          ligne.type || "",
          ligne.description,
          ligne.unite,
          Number(ligne.prixUnitaireHT),
        ]);
      });

      wsData.push([]); // Ligne vide entre séries
    });

    if (lotIndex < bpu.lots.length - 1) {
      wsData.push([]); // Ligne vide entre lots
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 10 },  // N°
    { wch: 20 },  // Type
    { wch: 80 },  // Description
    { wch: 10 },  // Unité
    { wch: 15 },  // Prix
  ];

  // Style des cellules (simplifié car xlsx ne supporte pas tous les styles)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  // Appliquer les styles basiques
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) continue;

      const cellValue = String(ws[cellAddress].v || "");

      // Titres de lots (LOT X)
      if (cellValue.startsWith("LOT")) {
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "C0C0C0" } },
          font: { bold: true, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // Titres de séries (Série X)
      if (cellValue.startsWith("Série")) {
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "FFA500" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // En-têtes de colonnes
      if (cellValue === "N°" || cellValue === "Type" || cellValue === "Description" ||
          cellValue === "Unité" || cellValue === "Prix U €HT") {
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "D3D3D3" } },
          font: { bold: true, sz: 10 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "BPU");

  // Générer le fichier
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Télécharger le BPU en Excel
 */
export function telechargerBPU(bpu: BPUExport, nomFichier?: string) {
  const blob = exporterBPUVersExcel(bpu);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier || `BPU_${format(new Date(), "yyyy-MM-dd_HHmm", { locale: fr })}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
