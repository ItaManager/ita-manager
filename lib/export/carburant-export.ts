/**
 * Utilitaires d'export pour le rapport de consommation carburant
 */

interface DonneesConsommation {
  vehiculeId: string;
  vehiculeCode: string;
  vehiculeDesignation: string;
  flotte: string;
  consommationMensuelle: number[];
  total: number;
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

/**
 * Exporter en CSV (compatible Excel)
 */
export function exporterCSV(
  donnees: DonneesConsommation[],
  annee: number,
  quantiteTotale: number
) {
  // En-têtes
  const headers = ["Flotte", "Véhicule", ...MOIS, "Quantité totale (L)"];

  // Lignes de données
  const rows = donnees.map((v) => [
    v.flotte,
    v.vehiculeCode,
    ...v.consommationMensuelle.map((q) => q.toFixed(2)),
    v.total.toFixed(2),
  ]);

  // Ligne de total
  const totauxMensuels = Array(12).fill(0);
  donnees.forEach((v) => {
    v.consommationMensuelle.forEach((q, idx) => {
      totauxMensuels[idx] += q;
    });
  });
  rows.push([
    "TOTAL",
    "",
    ...totauxMensuels.map((t) => t.toFixed(2)),
    quantiteTotale.toFixed(2),
  ]);

  // Construire le CSV
  const csvContent = [
    `Carburant - Quantité totale / Mois / Véhicule - ${annee}`,
    "",
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  // Télécharger
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `consommation_carburant_${annee}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporter en PDF avec jsPDF (version simple sans autotable)
 */
export async function exporterPDF(
  donnees: DonneesConsommation[],
  annee: number,
  quantiteTotale: number
) {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Titre
  doc.setFontSize(14);
  doc.text(`Rapport Consommation Carburant - ${annee}`, 14, 15);

  doc.setFontSize(10);
  doc.text(`Total véhicules: ${donnees.length}`, 14, 25);
  doc.text(`Quantité totale: ${quantiteTotale.toFixed(2)} L`, 14, 32);

  // Liste simplifiée des véhicules
  let y = 45;
  doc.setFontSize(9);

  donnees.forEach((vehicule, idx) => {
    if (y > 180) {
      doc.addPage();
      y = 15;
    }

    doc.text(
      `${vehicule.vehiculeCode}: ${vehicule.total.toFixed(2)} L`,
      14,
      y
    );
    y += 6;
  });

  doc.save(`consommation_carburant_${annee}.pdf`);
}
