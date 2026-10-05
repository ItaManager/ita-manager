/**
 * Génère un PDF de demande de devis
 * Utilisé côté client uniquement
 */

import jsPDF from "jspdf";

interface Article {
  designation: string;
  quantite: number;
  unite: string;
}

interface DonneesDevis {
  entreprise: {
    nom: string;
    adresse: string;
  };
  demande: {
    ref: string;
    description: string;
    dateBesoin: Date;
  };
  articles: Article[];
}

export function genererPDFDevis(donnees: DonneesDevis): void {
  const doc = new jsPDF();

  // Ajouter le logo ITA en haut à gauche
  // Le logo sera chargé depuis /image.png et converti en base64
  const img = new Image();
  img.src = "/image.png";

  // Attendre que l'image soit chargée avant de générer le PDF
  img.onload = () => {
    // Calculer la hauteur proportionnelle pour une largeur de 35mm
    const largeurLogo = 35;
    const hauteurLogo = (img.height / img.width) * largeurLogo;

    // Ajouter le logo avec ratio préservé
    doc.addImage(img, "PNG", 15, 10, largeurLogo, hauteurLogo);

    continuerGenerationPDF(doc, donnees);
  };

  // Si l'image ne charge pas, générer quand même le PDF sans logo
  img.onerror = () => {
    continuerGenerationPDF(doc, donnees);
  };
}

function continuerGenerationPDF(doc: jsPDF, donnees: DonneesDevis): void {

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(29, 24, 108);
  doc.text("DEMANDE DE DEVIS", 105, 50, { align: "center" });

  // Informations de la demande
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Référence : ${donnees.demande.ref}`, 20, 65);
  doc.text(
    `Date de besoin : ${new Date(donnees.demande.dateBesoin).toLocaleDateString("fr-FR")}`,
    20,
    72
  );

  // Tableau des articles (dessiné manuellement)
  let y = 85;

  // En-tête du tableau avec colonnes ajustées
  doc.setFillColor(29, 24, 108); // Bleu ITA
  doc.rect(15, y, 180, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("#", 17, y + 5);
  doc.text("Désignation", 25, y + 5);
  doc.text("Qté", 90, y + 5);
  doc.text("Unité", 105, y + 5);
  doc.text("Prix U. HT", 125, y + 5);
  doc.text("TVA %", 150, y + 5);
  doc.text("Montant TTC", 168, y + 5);

  y += 8;

  // Lignes du tableau
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  donnees.articles.forEach((article, index) => {
    // Bordure de ligne
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, y, 180, 10);

    // Contenu
    doc.text((index + 1).toString(), 17, y + 7);
    doc.text(article.designation.substring(0, 35), 25, y + 7);
    doc.text(article.quantite.toString(), 92, y + 7);
    doc.text(article.unite, 107, y + 7);
    doc.text("________", 127, y + 7);
    doc.text("____", 152, y + 7);
    doc.text("__________", 170, y + 7);

    y += 10;
  });

  // Pied de page
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Merci de retourner ce devis complété dans les meilleurs délais.",
    105,
    y + 15,
    { align: "center" }
  );

  // Télécharger le PDF
  const nomFichier = `Devis_${donnees.demande.ref}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(nomFichier);
}
