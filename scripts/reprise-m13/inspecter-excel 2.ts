/**
 * Script d'inspection du fichier Excel de reprise M13
 *
 * But : Comprendre la structure des données avant normalisation
 */

import * as XLSX from 'xlsx';
import { join } from 'path';

const EXCEL_PATH = join(process.cwd(), 'reference/M13/ITA - CODE MATERIELS ITA INVENTORIES.xlsx');

async function inspecterExcel() {
  console.log('📊 Inspection du fichier Excel de reprise M13\n');
  console.log('Fichier :', EXCEL_PATH, '\n');

  // Lire le fichier Excel
  const workbook = XLSX.readFile(EXCEL_PATH);

  console.log('📋 Feuilles disponibles :');
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`  ${idx + 1}. ${name}`);
  });
  console.log();

  // Analyser les feuilles pertinentes (inventaire des matériels)
  const feuillesPertinentes = workbook.SheetNames.filter(name =>
    name.includes('VEHICULE') ||
    name.includes('ENGINS') ||
    name.includes('PETITS MATERIELS') ||
    name.includes('CONTENEUR') ||
    name.includes('MOBILIER')
  );

  console.log(`🎯 Feuilles pertinentes détectées (${feuillesPertinentes.length}) :`);
  feuillesPertinentes.forEach(name => console.log(`  - ${name}`));
  console.log();

  // Analyser la première feuille pertinente
  const premiereFeuille = feuillesPertinentes[0];
  if (!premiereFeuille) {
    console.log('⚠️  Aucune feuille pertinente trouvée');
    return;
  }

  console.log(`🔍 Analyse détaillée de : "${premiereFeuille}"\n`);

  const worksheet = workbook.Sheets[premiereFeuille];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

  if (data.length === 0) {
    console.log('⚠️  Feuille vide');
    return;
  }

  // Trouver la ligne d'entête (contient "CODE" ou "DESIGNATION")
  let ligneEntete = -1;
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    const hasCode = row.some((cell: any) =>
      cell && String(cell).toUpperCase().includes('CODE')
    );
    const hasDesignation = row.some((cell: any) =>
      cell && String(cell).toUpperCase().includes('DESIGNATION')
    );
    if (hasCode || hasDesignation) {
      ligneEntete = i;
      break;
    }
  }

  if (ligneEntete === -1) {
    console.log('⚠️  Ligne d\'entête non trouvée');
    console.log('📝 Premières 10 lignes brutes :\n');
    for (let i = 0; i < Math.min(10, data.length); i++) {
      console.log(`Ligne ${i + 1}:`, data[i].filter(c => c !== '').join(' | '));
    }
    return;
  }

  console.log(`✅ Ligne d'entête trouvée à la ligne ${ligneEntete + 1}\n`);

  // Afficher l'entête
  const entete = data[ligneEntete].map((col: any) => String(col).trim());
  console.log('📌 Colonnes détectées :');
  entete.forEach((col: any, idx: number) => {
    if (col) {
      console.log(`  ${idx + 1}. ${col}`);
    }
  });
  console.log();

  // Statistiques
  const nbLignes = data.length - ligneEntete - 1; // -1 pour l'entête
  console.log(`📈 Statistiques :`);
  console.log(`  Lignes de données : ${nbLignes}`);
  console.log(`  Colonnes : ${entete.filter(c => c).length}`);
  console.log();

  // Afficher 5 premières lignes de données
  console.log('📝 Échantillon (5 premières lignes de données) :\n');
  for (let i = ligneEntete + 1; i <= Math.min(ligneEntete + 5, data.length - 1); i++) {
    console.log(`Ligne ${i - ligneEntete} :`);
    const row = data[i];
    entete.forEach((col: any, idx: number) => {
      if (col) {
        const valeur = row[idx];
        console.log(`  ${col}: ${valeur || '(vide)'}`);
      }
    });
    console.log();
  }

  // Analyser les valeurs uniques pour certaines colonnes clés
  console.log('🔎 Valeurs uniques par colonne (colonnes clés) :\n');

  // Convertir en objets (à partir de la ligne d'entête)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  range.s.r = ligneEntete; // Start from header row
  const dataObjets = XLSX.utils.sheet_to_json(worksheet, { range }) as Record<string, any>[];

  // Colonnes d'intérêt (à ajuster selon l'entête réelle)
  const colonnesInteret = entete.filter((col: string) =>
    col && (
      col.toLowerCase().includes('etat') ||
      col.toLowerCase().includes('statut') ||
      col.toLowerCase().includes('lieu') ||
      col.toLowerCase().includes('type') ||
      col.toLowerCase().includes('famille') ||
      col.toLowerCase().includes('code')
    )
  );

  colonnesInteret.forEach((colonne: string) => {
    const valeursUniques = new Set<string>();
    dataObjets.forEach(row => {
      const valeur = row[colonne];
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        valeursUniques.add(String(valeur).trim());
      }
    });

    console.log(`${colonne} (${valeursUniques.size} valeurs uniques) :`);
    const valeurs = Array.from(valeursUniques).sort();
    if (valeurs.length <= 20) {
      valeurs.forEach(v => console.log(`  - ${v}`));
    } else {
      valeurs.slice(0, 20).forEach(v => console.log(`  - ${v}`));
      console.log(`  ... et ${valeurs.length - 20} autres`);
    }
    console.log();
  });
}

inspecterExcel().catch(console.error);
