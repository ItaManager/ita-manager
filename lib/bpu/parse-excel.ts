import * as XLSX from "xlsx";

interface LigneBPUParsed {
  numero: string;
  type?: string;
  description: string;
  unite: string;
  prixUnitaireHT: number;
  ordre: number;
}

interface SerieBPUParsed {
  code: string;
  titre: string;
  sousTitre?: string;
  ordre: number;
  lignes: LigneBPUParsed[];
}

interface LotBPUParsed {
  numero: string;
  titre: string;
  categorie?: string;
  ordre: number;
  series: SerieBPUParsed[];
}

export interface BPUParsed {
  nom: string;
  description?: string;
  lots: LotBPUParsed[];
}

/**
 * Parser un fichier Excel BPU
 * Format attendu : similaire à l'image fournie
 */
export function parserBPUExcel(buffer: ArrayBuffer): BPUParsed {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir en JSON avec header
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const lots: LotBPUParsed[] = [];
  let currentLot: LotBPUParsed | null = null;
  let currentSerie: SerieBPUParsed | null = null;
  let ligneOrdre = 0;
  let serieOrdre = 0;
  let lotOrdre = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const cellule0 = String(row[0] || "").trim();
    const cellule1 = String(row[1] || "").trim();

    // Détecter LOT
    if (cellule0.startsWith("LOT")) {
      // Sauvegarder le lot précédent
      if (currentLot && currentSerie) {
        currentLot.series.push(currentSerie);
        lots.push(currentLot);
      }

      const matches = cellule0.match(/LOT\s+(\d+)\s*-\s*(.+)/);
      currentLot = {
        numero: matches ? `LOT ${matches[1]}` : cellule0,
        titre: matches ? matches[2] : cellule0,
        categorie: row[1] ? String(row[1]).trim() : undefined,
        ordre: lotOrdre++,
        series: [],
      };
      currentSerie = null;
      serieOrdre = 0;
      continue;
    }

    // Détecter Série
    if (cellule0.startsWith("Série") || (cellule0.includes("Série") && row.length <= 2)) {
      if (currentSerie && currentLot) {
        currentLot.series.push(currentSerie);
      }

      currentSerie = {
        code: cellule0,
        titre: cellule1 || "",
        sousTitre: undefined,
        ordre: serieOrdre++,
        lignes: [],
      };
      ligneOrdre = 0;
      continue;
    }

    // Détecter sous-titre de série (ligne suivant la série)
    if (currentSerie && currentSerie.lignes.length === 0 && !cellule0.match(/^[A-Z]\s+\d+/)) {
      currentSerie.sousTitre = cellule0;
      continue;
    }

    // Détecter ligne d'article (commence par lettre + numéro, ex: A 101)
    if (cellule0.match(/^[A-Z]\s+\d+/) && currentSerie) {
      const numero = cellule0;
      const type = row[1] ? String(row[1]).trim() : undefined;
      const description = row[2] ? String(row[2]).trim() : "";
      const unite = row[3] ? String(row[3]).trim() : "";
      const prixStr = row[4] ? String(row[4]).replace(/[^\d.,]/g, "").replace(",", ".") : "0";
      const prixUnitaireHT = parseFloat(prixStr) || 0;

      currentSerie.lignes.push({
        numero,
        type,
        description,
        unite,
        prixUnitaireHT,
        ordre: ligneOrdre++,
      });
    }
  }

  // Sauvegarder le dernier lot
  if (currentLot) {
    if (currentSerie) {
      currentLot.series.push(currentSerie);
    }
    lots.push(currentLot);
  }

  return {
    nom: "BPU importé",
    description: `Importé le ${new Date().toLocaleDateString("fr-FR")}`,
    lots,
  };
}
