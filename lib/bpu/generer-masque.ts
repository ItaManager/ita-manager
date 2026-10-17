import * as XLSX from "xlsx";

/**
 * Génère un fichier Excel masque pour l'import de BPU
 * Structure attendue : LOT → Série → Articles
 */
export function genererMasqueBPU(): Blob {
  const wsData: any[][] = [];

  // En-tête explicatif
  wsData.push([
    "MASQUE D'IMPORT BPU - Bordereau de Prix Unitaires",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "Instructions : Respectez la structure ci-dessous (LOT → Série → Articles)",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([]); // Ligne vide

  // Exemple LOT 1
  wsData.push(["LOT 1 - TERRASSEMENT ET GROS ŒUVRE", "", "", "", ""]);
  wsData.push([
    "Série T01 - Terrassement général",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "N°",
    "Type",
    "Description",
    "Unité",
    "Prix U €HT",
  ]);
  wsData.push([
    "A 101",
    "Fourniture",
    "Décapage et évacuation de terre végétale",
    "m³",
    15000,
  ]);
  wsData.push([
    "A 102",
    "Main d'œuvre",
    "Terrassement en déblai pour fondations",
    "m³",
    12000,
  ]);
  wsData.push([
    "A 103",
    "Fourniture",
    "Remblai compacté par couches",
    "m³",
    18000,
  ]);
  wsData.push([]); // Ligne vide entre séries

  wsData.push([
    "Série T02 - Fondations et soubassements",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "N°",
    "Type",
    "Description",
    "Unité",
    "Prix U €HT",
  ]);
  wsData.push([
    "A 201",
    "Fourniture",
    "Béton de propreté dosé à 150 kg/m³",
    "m³",
    45000,
  ]);
  wsData.push([
    "A 202",
    "Fourniture",
    "Semelle filante béton armé B25",
    "m³",
    85000,
  ]);
  wsData.push([
    "A 203",
    "Main d'œuvre",
    "Coffrage et ferraillage semelles",
    "m²",
    12000,
  ]);
  wsData.push([]); // Ligne vide entre lots

  // Exemple LOT 2
  wsData.push(["LOT 2 - MAÇONNERIE ET ÉLÉVATION", "", "", "", ""]);
  wsData.push([
    "Série M01 - Murs et cloisons",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "N°",
    "Type",
    "Description",
    "Unité",
    "Prix U €HT",
  ]);
  wsData.push([
    "B 101",
    "Fourniture",
    "Agglos creux 15x20x40 chaînés",
    "m²",
    18000,
  ]);
  wsData.push([
    "B 102",
    "Fourniture",
    "Agglos pleins 10x20x40 pour cloisons",
    "m²",
    12000,
  ]);
  wsData.push([
    "B 103",
    "Main d'œuvre",
    "Montage murs agglos avec joints",
    "m²",
    8500,
  ]);
  wsData.push([]); // Ligne vide

  wsData.push([
    "Série M02 - Enduits et finitions",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "N°",
    "Type",
    "Description",
    "Unité",
    "Prix U €HT",
  ]);
  wsData.push([
    "B 201",
    "Fourniture",
    "Enduit ciment intérieur taloché",
    "m²",
    4500,
  ]);
  wsData.push([
    "B 202",
    "Fourniture",
    "Enduit tyrolien extérieur",
    "m²",
    6500,
  ]);
  wsData.push([]); // Ligne vide

  // Exemple LOT 3
  wsData.push(["LOT 3 - CHARPENTE ET COUVERTURE", "", "", "", ""]);
  wsData.push([
    "Série C01 - Structure charpente",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "N°",
    "Type",
    "Description",
    "Unité",
    "Prix U €HT",
  ]);
  wsData.push([
    "C 101",
    "Fourniture",
    "Charpente métallique pour toiture",
    "kg",
    1200,
  ]);
  wsData.push([
    "C 102",
    "Main d'œuvre",
    "Pose et montage charpente",
    "kg",
    800,
  ]);
  wsData.push([]); // Ligne vide

  wsData.push([
    "Série C02 - Couverture",
    "",
    "",
    "",
    "",
  ]);
  wsData.push([
    "N°",
    "Type",
    "Description",
    "Unité",
    "Prix U €HT",
  ]);
  wsData.push([
    "C 201",
    "Fourniture",
    "Bacs acier nervurés 75/100e",
    "m²",
    12000,
  ]);
  wsData.push([
    "C 202",
    "Fourniture",
    "Faîtage et accessoires métalliques",
    "ml",
    8000,
  ]);
  wsData.push([
    "C 203",
    "Main d'œuvre",
    "Pose couverture et accessoires",
    "m²",
    5000,
  ]);

  // Créer le workbook
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 50 }, // N° ou Titre
    { wch: 20 }, // Type
    { wch: 80 }, // Description
    { wch: 10 }, // Unité
    { wch: 15 }, // Prix
  ];

  // Styles (si supporté par la bibliothèque)
  // Les lignes LOT en gras
  // Les lignes Série avec fond orange
  // Les en-têtes de tableau avec fond gris

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BPU Exemple");

  // Générer le blob
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Télécharge le fichier masque
 */
export function telechargerMasqueBPU(nomFichier: string = "Masque_BPU.xlsx") {
  const blob = genererMasqueBPU();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
