/**
 * M13 L1.5 — Reprise des données — Passe 1 : Normalisation
 *
 * But : Analyser le fichier Excel sans écriture en base.
 * Produit un rapport détaillé des problèmes détectés.
 *
 * RÈGLES (M13-LOGISTIQUE.md §9.2) :
 * - Compter codes en doublon
 * - Identifier états non reconnus
 * - Détecter dates illisibles
 * - Lister lieux en texte libre
 * - **AUCUNE ÉCRITURE EN BASE**
 */

import * as XLSX from 'xlsx';
import { join } from 'path';

const EXCEL_PATH = join(
  process.cwd(),
  'reference/M13/ITA - CODE MATERIELS ITA INVENTORIES.xlsx'
);

// Mapping des états Excel vers StatutMateriel
const ETATS_CONNUS = new Map<string, string>([
  ['OK', 'DISPONIBLE'],
  ['HS', 'HORS_SERVICE'],
  ['PN', 'PANNE'],
]);

// Feuilles à analyser par TypeMateriel
const FEUILLES_MATERIEL = [
  { feuille: 'VEHICULE L', type: 'VEHICULE_LEGER' },
  { feuille: 'VEHICULES PL', type: 'VEHICULE_LOURD' },
  { feuille: 'ENGINS', type: 'ENGIN' },
  { feuille: 'PETITS MATERIELS', type: 'PETIT_MATERIEL' },
  { feuille: 'CONTENEUR', type: 'CONTENEUR' },
  { feuille: 'MOBILIER DE BUREAU', type: 'MOBILIER' },
];

type ProblemeNormalisation = {
  ligne: number;
  code: string;
  champ: string;
  valeur: any;
  probleme: string;
};

type RapportFeuille = {
  feuille: string;
  type: string;
  nbLignes: number;
  nbLignesVides: number;
  problemes: ProblemeNormalisation[];
};

type RapportGlobal = {
  dateAnalyse: Date;
  fichier: string;
  feuilles: RapportFeuille[];
  codesDoublons: Map<string, number>;
  etatsNonReconnus: Map<string, number>;
  datesIllisibles: number;
  lieuxTexteLibre: Map<string, number>;
  totalProblemes: number;
};

function trouverLigneEntete(data: any[][]): number {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    const hasCode = row.some((cell: any) =>
      cell && String(cell).toUpperCase().includes('CODE')
    );
    const hasDesignation = row.some((cell: any) =>
      cell && String(cell).toUpperCase().includes('DESIGNATION')
    );
    if (hasCode || hasDesignation) {
      return i;
    }
  }
  return -1;
}

function convertirDateExcel(dateSerial: any): Date | null {
  // Excel stocke les dates comme nombre de jours depuis 1900-01-01
  // (avec bug 1900 = année bissextile)
  if (typeof dateSerial !== 'number' || isNaN(dateSerial)) {
    return null;
  }

  // Date de base Excel : 1899-12-30 (corrige le bug 1900)
  const baseDate = new Date(1899, 11, 30);
  const date = new Date(baseDate.getTime() + dateSerial * 24 * 60 * 60 * 1000);

  // Vérifier que la date est valide et raisonnable (1990-2030)
  if (
    date.getFullYear() < 1990 ||
    date.getFullYear() > 2030 ||
    isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function analyserFeuille(
  workbook: XLSX.WorkBook,
  nomFeuille: string,
  typeMateriel: string
): RapportFeuille | null {
  console.log(`\n📋 Analyse de la feuille "${nomFeuille}" (${typeMateriel})...`);

  const worksheet = workbook.Sheets[nomFeuille];
  if (!worksheet) {
    console.log(`  ⚠️  Feuille "${nomFeuille}" non trouvée`);
    return null;
  }

  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  }) as any[][];

  if (data.length === 0) {
    console.log(`  ⚠️  Feuille vide`);
    return null;
  }

  // Trouver la ligne d'entête
  const ligneEntete = trouverLigneEntete(data);
  if (ligneEntete === -1) {
    console.log(`  ⚠️  Ligne d'entête non trouvée`);
    return null;
  }

  const entete = data[ligneEntete].map((col: any) => String(col).trim());
  console.log(`  ✅ Entête trouvée à la ligne ${ligneEntete + 1}`);

  // Mapper les colonnes
  const colCode = entete.findIndex(
    (c) => c.toUpperCase().includes('CODE') || c.toUpperCase().includes('MATERIEL')
  );
  const colDesignation = entete.findIndex((c) =>
    c.toUpperCase().includes('DESIGNATION')
  );
  const colEtat = entete.findIndex((c) => c.toUpperCase().includes('ETAT'));
  const colLieu = entete.findIndex((c) => c.toUpperCase().includes('LIEU'));
  const colDate = entete.findIndex(
    (c) =>
      c.toUpperCase().includes('DATE') && c.toUpperCase().includes('ACQUISITION')
  );

  if (colCode === -1 || colDesignation === -1) {
    console.log(`  ⚠️  Colonnes CODE ou DESIGNATION non trouvées`);
    return null;
  }

  console.log(`  Colonnes détectées :`);
  console.log(`    - CODE: colonne ${colCode + 1} (${entete[colCode]})`);
  console.log(`    - DESIGNATION: colonne ${colDesignation + 1} (${entete[colDesignation]})`);
  if (colEtat !== -1)
    console.log(`    - ETAT: colonne ${colEtat + 1} (${entete[colEtat]})`);
  if (colLieu !== -1)
    console.log(`    - LIEU: colonne ${colLieu + 1} (${entete[colLieu]})`);
  if (colDate !== -1)
    console.log(`    - DATE: colonne ${colDate + 1} (${entete[colDate]})`);

  // Analyser les données
  const problemes: ProblemeNormalisation[] = [];
  let nbLignesVides = 0;

  for (let i = ligneEntete + 1; i < data.length; i++) {
    const row = data[i];
    const code = String(row[colCode] || '').trim();
    const designation = String(row[colDesignation] || '').trim();

    // Ignorer les lignes vides (pas de code ni désignation)
    if (!code && !designation) {
      nbLignesVides++;
      continue;
    }

    // Vérifier le code
    if (!code) {
      problemes.push({
        ligne: i + 1,
        code: '(vide)',
        champ: 'CODE',
        valeur: '',
        probleme: 'Code manquant',
      });
    }

    // Vérifier la désignation
    if (!designation) {
      problemes.push({
        ligne: i + 1,
        code,
        champ: 'DESIGNATION',
        valeur: '',
        probleme: 'Désignation manquante',
      });
    }

    // Vérifier l'état
    if (colEtat !== -1) {
      const etat = String(row[colEtat] || '').trim().toUpperCase();
      if (etat && !ETATS_CONNUS.has(etat)) {
        problemes.push({
          ligne: i + 1,
          code,
          champ: 'ETAT',
          valeur: etat,
          probleme: `État non reconnu (attendu: ${Array.from(ETATS_CONNUS.keys()).join(', ')})`,
        });
      }
    }

    // Vérifier la date
    if (colDate !== -1) {
      const dateValeur = row[colDate];
      if (dateValeur) {
        const dateConvertie = convertirDateExcel(dateValeur);
        if (!dateConvertie) {
          problemes.push({
            ligne: i + 1,
            code,
            champ: 'DATE_ACQUISITION',
            valeur: dateValeur,
            probleme: 'Date illisible ou invalide',
          });
        }
      }
    }
  }

  const nbLignes = data.length - ligneEntete - 1 - nbLignesVides;

  console.log(`  📊 Résultat :`);
  console.log(`    - Lignes de données : ${nbLignes}`);
  console.log(`    - Lignes vides ignorées : ${nbLignesVides}`);
  console.log(`    - Problèmes détectés : ${problemes.length}`);

  return {
    feuille: nomFeuille,
    type: typeMateriel,
    nbLignes,
    nbLignesVides,
    problemes,
  };
}

async function genererRapport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  M13 L1.5 — REPRISE DES DONNÉES — PASSE 1 : NORMALISATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📂 Fichier :', EXCEL_PATH);

  // Lire le fichier Excel
  const workbook = XLSX.readFile(EXCEL_PATH);

  const rapport: RapportGlobal = {
    dateAnalyse: new Date(),
    fichier: EXCEL_PATH,
    feuilles: [],
    codesDoublons: new Map(),
    etatsNonReconnus: new Map(),
    datesIllisibles: 0,
    lieuxTexteLibre: new Map(),
    totalProblemes: 0,
  };

  // Analyser chaque feuille
  for (const { feuille, type } of FEUILLES_MATERIEL) {
    const rapportFeuille = analyserFeuille(workbook, feuille, type);
    if (rapportFeuille) {
      rapport.feuilles.push(rapportFeuille);
    }
  }

  // Analyser les codes doublons (toutes feuilles confondues)
  console.log('\n\n🔍 Analyse globale des codes...');
  const tousLesCodes = new Map<string, number>();
  for (const feuille of rapport.feuilles) {
    const worksheet = workbook.Sheets[feuille.feuille];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const ligneEntete = trouverLigneEntete(data);
    const entete = data[ligneEntete];
    const colCode = entete.findIndex(
      (c: string) => c && (c.toUpperCase().includes('CODE') || c.toUpperCase().includes('MATERIEL'))
    );

    for (let i = ligneEntete + 1; i < data.length; i++) {
      const code = String(data[i][colCode] || '').trim();
      if (code) {
        tousLesCodes.set(code, (tousLesCodes.get(code) || 0) + 1);
      }
    }
  }

  // Identifier les doublons
  for (const [code, count] of tousLesCodes.entries()) {
    if (count > 1) {
      rapport.codesDoublons.set(code, count);
    }
  }

  // Agréger les statistiques globales
  for (const feuille of rapport.feuilles) {
    for (const pb of feuille.problemes) {
      if (pb.champ === 'ETAT' && pb.valeur) {
        rapport.etatsNonReconnus.set(
          pb.valeur,
          (rapport.etatsNonReconnus.get(pb.valeur) || 0) + 1
        );
      }
      if (pb.champ === 'DATE_ACQUISITION') {
        rapport.datesIllisibles++;
      }
    }
    rapport.totalProblemes += feuille.problemes.length;
  }

  // Afficher le rapport
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RAPPORT DE NORMALISATION — PASSE 1');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📅 Date d'analyse : ${rapport.dateAnalyse.toLocaleString('fr-FR')}\n`);

  console.log('📊 SYNTHÈSE GLOBALE\n');
  console.log(`  Feuilles analysées : ${rapport.feuilles.length}`);
  const totalLignes = rapport.feuilles.reduce((sum, f) => sum + f.nbLignes, 0);
  console.log(`  Lignes de données : ${totalLignes}`);
  console.log(`  Problèmes détectés : ${rapport.totalProblemes}\n`);

  if (rapport.codesDoublons.size > 0) {
    console.log('🚨 CODES EN DOUBLON\n');
    for (const [code, count] of Array.from(rapport.codesDoublons.entries()).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  ⚠️  ${code} : ${count} occurrences`);
    }
    console.log();
  } else {
    console.log('✅ Aucun code en doublon\n');
  }

  if (rapport.etatsNonReconnus.size > 0) {
    console.log('⚠️  ÉTATS NON RECONNUS\n');
    console.log(`  Attendus : ${Array.from(ETATS_CONNUS.keys()).join(', ')}\n`);
    for (const [etat, count] of Array.from(rapport.etatsNonReconnus.entries()).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  ⚠️  "${etat}" : ${count} occurrence(s)`);
    }
    console.log();
  } else {
    console.log('✅ Tous les états sont reconnus\n');
  }

  if (rapport.datesIllisibles > 0) {
    console.log(`⚠️  DATES ILLISIBLES : ${rapport.datesIllisibles}\n`);
  } else {
    console.log('✅ Toutes les dates sont valides\n');
  }

  // Détail par feuille
  console.log('\n📋 DÉTAIL PAR FEUILLE\n');
  for (const feuille of rapport.feuilles) {
    console.log(`═══ ${feuille.feuille} (${feuille.type}) ═══`);
    console.log(`  Lignes : ${feuille.nbLignes}`);
    console.log(`  Problèmes : ${feuille.problemes.length}\n`);

    if (feuille.problemes.length > 0) {
      // Grouper par type de problème
      const parType = new Map<string, ProblemeNormalisation[]>();
      for (const pb of feuille.problemes) {
        const key = `${pb.champ}: ${pb.probleme}`;
        if (!parType.has(key)) {
          parType.set(key, []);
        }
        parType.get(key)!.push(pb);
      }

      for (const [type, pbs] of parType.entries()) {
        console.log(`  ${type} (${pbs.length})`);
        // Afficher max 5 exemples
        for (const pb of pbs.slice(0, 5)) {
          console.log(
            `    L${pb.ligne} : ${pb.code} → "${pb.valeur}"`
          );
        }
        if (pbs.length > 5) {
          console.log(`    ... et ${pbs.length - 5} autres`);
        }
        console.log();
      }
    }
  }

  // Recommandations
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RECOMMANDATIONS POUR LA PASSE 2');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (rapport.codesDoublons.size > 0) {
    console.log('1. ✋ CORRIGER LES CODES EN DOUBLON');
    console.log('   → Décider quel code conserver ou ajouter suffixe (-A, -B)\n');
  }

  if (rapport.etatsNonReconnus.size > 0) {
    console.log('2. 📝 CRÉER TABLE DE CORRESPONDANCE DES ÉTATS');
    console.log('   → Mapper chaque état non reconnu vers StatutMateriel');
    console.log('   → Exemples de mapping possibles :');
    for (const etat of rapport.etatsNonReconnus.keys()) {
      console.log(`      "${etat}" → ?`);
    }
    console.log();
  }

  if (rapport.datesIllisibles > 0) {
    console.log('3. 📅 CORRIGER LES DATES ILLISIBLES');
    console.log('   → Vérifier le format des dates dans Excel');
    console.log('   → Accepter dates manquantes (nullable)\n');
  }

  console.log('\n⚠️  AUCUNE ÉCRITURE EN BASE — Rapport uniquement ✅\n');
  console.log('Prochaine étape : Passe 2 — Tables de correspondance\n');
}

genererRapport().catch(console.error);
