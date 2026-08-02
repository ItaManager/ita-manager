/**
 * M13 L1.5 — Reprise des données — Passe 2 : Tables de correspondance
 *
 * But : Générer les tables de correspondance pour validation humaine.
 *
 * RÈGLES (M13-LOGISTIQUE.md §9.2) :
 * - Le Service Logistique valide les correspondances
 * - Exemples : B → BON, 2B 2M → à ventiler, chANTIER → CHANTIER
 * - **Aucun import sans validation humaine**
 *
 * Sorties :
 * - scripts/reprise-m13/correspondances-etats.json
 * - scripts/reprise-m13/correspondances-codes-doublons.json
 * - scripts/reprise-m13/correspondances-lieux.json
 */

import * as XLSX from 'xlsx';
import { join } from 'path';
import { writeFileSync } from 'fs';

const EXCEL_PATH = join(
  process.cwd(),
  'reference/M13/ITA - CODE MATERIELS ITA INVENTORIES.xlsx'
);

// Mapping proposé des états (à valider par le Service Logistique)
const MAPPING_ETATS_PROPOSE = new Map<string, string>([
  // Mappings évidents
  ['OK', 'DISPONIBLE'],
  ['HS', 'HORS_SERVICE'],
  ['PN', 'PANNE'],

  // Propositions pour validation
  ['BON', 'DISPONIBLE'], // BON → DISPONIBLE
  ['PANNE', 'PANNE'], // PANNE → PANNE (OK)
  ['BON-NEUF', 'DISPONIBLE'], // BON-NEUF → DISPONIBLE
  ['BON - NEUF', 'DISPONIBLE'], // BON - NEUF → DISPONIBLE
  ['NEUF - BON', 'DISPONIBLE'], // NEUF - BON → DISPONIBLE
  ['B', 'DISPONIBLE'], // B → DISPONIBLE (abréviation de BON)
  ['MAUVAIS', 'HORS_SERVICE'], // MAUVAIS → HORS_SERVICE
  ['NEUF PANNE', 'PANNE'], // NEUF PANNE → PANNE
  ['HS EN REPARATION', 'EN_REPARATION'], // HS EN REPARATION → EN_REPARATION

  // Cas complexes nécessitant ventilation (marqués comme À VENTILER)
  ['2B 2M', 'À_VENTILER'], // 2 BON + 2 MAUVAIS → créer 2 lignes DISPONIBLE + 2 HORS_SERVICE
  ['7B 5M', 'À_VENTILER'], // 7 BON + 5 MAUVAIS → créer 7 lignes DISPONIBLE + 5 HORS_SERVICE
  ['08 BON - 10 MAUVAIS', 'À_VENTILER'], // 8 BON + 10 MAUVAIS
  ['2 BON - 2 MAUVAIS', 'À_VENTILER'], // 2 BON + 2 MAUVAIS
  ['3B 1M', 'À_VENTILER'], // 3 BON + 1 MAUVAIS
]);

const FEUILLES_MATERIEL = [
  { feuille: 'VEHICULE L', type: 'VEHICULE_LEGER' },
  { feuille: 'VEHICULES PL', type: 'VEHICULE_LOURD' },
  { feuille: 'ENGINS', type: 'ENGIN' },
  { feuille: 'PETITS MATERIELS', type: 'PETIT_MATERIEL' },
  { feuille: 'CONTENEUR', type: 'CONTENEUR' },
  { feuille: 'MOBILIER DE BUREAU', type: 'MOBILIER' },
];

type CorrespondanceEtat = {
  etatExcel: string;
  nbOccurrences: number;
  propositionStatut: string;
  aValider: boolean;
  commentaire?: string;
};

type ConflitCode = {
  code: string;
  nbOccurrences: number;
  occurrences: Array<{
    feuille: string;
    ligne: number;
    designation: string;
    etat: string;
  }>;
  resolution: 'CONSERVER_PREMIER' | 'AJOUTER_SUFFIXE' | 'FUSIONNER' | 'MANUEL';
  commentaire?: string;
};

type CorrespondanceLieu = {
  lieuExcel: string;
  nbOccurrences: number;
  propositionNormalise: string;
  aValider: boolean;
};

function trouverLigneEntete(data: any[][]): number {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    const hasCode = row.some((cell: any) =>
      cell && String(cell).toUpperCase().includes('CODE')
    );
    if (hasCode) {
      return i;
    }
  }
  return -1;
}

function analyserEtats(workbook: XLSX.WorkBook): Map<string, number> {
  const compteurEtats = new Map<string, number>();

  for (const { feuille } of FEUILLES_MATERIEL) {
    const worksheet = workbook.Sheets[feuille];
    if (!worksheet) continue;

    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as any[][];

    const ligneEntete = trouverLigneEntete(data);
    if (ligneEntete === -1) continue;

    const entete = data[ligneEntete];
    const colEtat = entete.findIndex((c: any) =>
      c && typeof c === 'string' && c.toUpperCase().includes('ETAT')
    );

    if (colEtat === -1) continue;

    for (let i = ligneEntete + 1; i < data.length; i++) {
      const etat = String(data[i][colEtat] || '').trim().toUpperCase();
      if (etat) {
        compteurEtats.set(etat, (compteurEtats.get(etat) || 0) + 1);
      }
    }
  }

  return compteurEtats;
}

function analyserCodesDoublons(workbook: XLSX.WorkBook): Map<string, ConflitCode> {
  const tousLesCodes = new Map<
    string,
    Array<{
      feuille: string;
      ligne: number;
      designation: string;
      etat: string;
    }>
  >();

  for (const { feuille } of FEUILLES_MATERIEL) {
    const worksheet = workbook.Sheets[feuille];
    if (!worksheet) continue;

    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as any[][];

    const ligneEntete = trouverLigneEntete(data);
    if (ligneEntete === -1) continue;

    const entete = data[ligneEntete];
    const colCode = entete.findIndex(
      (c: any) =>
        c && typeof c === 'string' && (c.toUpperCase().includes('CODE') || c.toUpperCase().includes('MATERIEL'))
    );
    const colDesignation = entete.findIndex((c: any) =>
      c && typeof c === 'string' && c.toUpperCase().includes('DESIGNATION')
    );
    const colEtat = entete.findIndex((c: any) =>
      c && typeof c === 'string' && c.toUpperCase().includes('ETAT')
    );

    if (colCode === -1) continue;

    for (let i = ligneEntete + 1; i < data.length; i++) {
      const code = String(data[i][colCode] || '').trim();
      if (!code) continue;

      if (!tousLesCodes.has(code)) {
        tousLesCodes.set(code, []);
      }

      tousLesCodes.get(code)!.push({
        feuille,
        ligne: i + 1,
        designation:
          colDesignation !== -1 ? String(data[i][colDesignation] || '').trim() : '',
        etat: colEtat !== -1 ? String(data[i][colEtat] || '').trim() : '',
      });
    }
  }

  // Ne garder que les doublons
  const conflits = new Map<string, ConflitCode>();
  for (const [code, occurrences] of tousLesCodes.entries()) {
    if (occurrences.length > 1) {
      // Déterminer la résolution proposée
      let resolution: ConflitCode['resolution'] = 'MANUEL';
      let commentaire = '';

      // Si toutes les occurrences ont la même désignation, probablement un inventaire en double
      const designationsUniques = new Set(occurrences.map((o) => o.designation));
      if (designationsUniques.size === 1) {
        resolution = 'FUSIONNER';
        commentaire = 'Même désignation → probablement inventaire en double, fusionner';
      } else if (occurrences.length <= 3) {
        resolution = 'AJOUTER_SUFFIXE';
        commentaire = 'Peu d\'occurrences → ajouter suffixe -A, -B, -C';
      } else {
        resolution = 'MANUEL';
        commentaire = `${occurrences.length} occurrences → résolution manuelle requise`;
      }

      conflits.set(code, {
        code,
        nbOccurrences: occurrences.length,
        occurrences,
        resolution,
        commentaire,
      });
    }
  }

  return conflits;
}

function analyserLieux(workbook: XLSX.WorkBook): Map<string, number> {
  const compteurLieux = new Map<string, number>();

  for (const { feuille } of FEUILLES_MATERIEL) {
    const worksheet = workbook.Sheets[feuille];
    if (!worksheet) continue;

    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as any[][];

    const ligneEntete = trouverLigneEntete(data);
    if (ligneEntete === -1) continue;

    const entete = data[ligneEntete];
    const colLieu = entete.findIndex((c: any) =>
      c && typeof c === 'string' && c.toUpperCase().includes('LIEU')
    );

    if (colLieu === -1) continue;

    for (let i = ligneEntete + 1; i < data.length; i++) {
      const lieu = String(data[i][colLieu] || '').trim();
      if (lieu) {
        compteurLieux.set(lieu, (compteurLieux.get(lieu) || 0) + 1);
      }
    }
  }

  return compteurLieux;
}

function normaliserLieu(lieu: string): string {
  // Normaliser : enlever espaces multiples, mettre en majuscules
  return lieu.toUpperCase().replace(/\s+/g, ' ').trim();
}

async function genererTablesCorrespondance() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  M13 L1.5 — PASSE 2 : TABLES DE CORRESPONDANCE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📂 Fichier source :', EXCEL_PATH, '\n');

  const workbook = XLSX.readFile(EXCEL_PATH);

  // ========================================================
  // 1. CORRESPONDANCES DES ÉTATS
  // ========================================================
  console.log('📝 Génération de la table de correspondance des ÉTATS...\n');

  const compteurEtats = analyserEtats(workbook);
  const correspondancesEtats: CorrespondanceEtat[] = [];

  for (const [etat, nb] of Array.from(compteurEtats.entries()).sort(
    (a, b) => b[1] - a[1]
  )) {
    const proposition = MAPPING_ETATS_PROPOSE.get(etat) || 'MANUEL';
    const aValider = proposition === 'MANUEL' || proposition === 'À_VENTILER';

    let commentaire = '';
    if (proposition === 'À_VENTILER') {
      commentaire =
        'Nécessite ventilation : créer plusieurs lignes de matériel (ex: 2B 2M → 2 DISPONIBLE + 2 HORS_SERVICE)';
    }

    correspondancesEtats.push({
      etatExcel: etat,
      nbOccurrences: nb,
      propositionStatut: proposition,
      aValider,
      commentaire,
    });

    const symbole = aValider ? '❓' : '✅';
    console.log(`  ${symbole} "${etat}" (${nb}×) → ${proposition}`);
    if (commentaire) {
      console.log(`      💡 ${commentaire}`);
    }
  }

  const fichierEtats = join(
    process.cwd(),
    'scripts/reprise-m13/correspondances-etats.json'
  );
  writeFileSync(fichierEtats, JSON.stringify(correspondancesEtats, null, 2));
  console.log(`\n✅ Sauvegardé : ${fichierEtats}\n`);

  // ========================================================
  // 2. CONFLITS DE CODES
  // ========================================================
  console.log('\n📝 Génération de la table de résolution des CODES DOUBLONS...\n');

  const conflits = analyserCodesDoublons(workbook);
  const conflitsArray = Array.from(conflits.values()).sort(
    (a, b) => b.nbOccurrences - a.nbOccurrences
  );

  for (const conflit of conflitsArray.slice(0, 10)) {
    console.log(`  ⚠️  ${conflit.code} (${conflit.nbOccurrences}×)`);
    console.log(`      Résolution proposée : ${conflit.resolution}`);
    if (conflit.commentaire) {
      console.log(`      💡 ${conflit.commentaire}`);
    }
    conflit.occurrences.slice(0, 3).forEach((occ) => {
      console.log(
        `        - ${occ.feuille} L${occ.ligne} : ${occ.designation} (${occ.etat})`
      );
    });
    if (conflit.occurrences.length > 3) {
      console.log(`        ... et ${conflit.occurrences.length - 3} autres`);
    }
    console.log();
  }

  if (conflitsArray.length > 10) {
    console.log(`  ... et ${conflitsArray.length - 10} autres conflits\n`);
  }

  const fichierCodes = join(
    process.cwd(),
    'scripts/reprise-m13/correspondances-codes-doublons.json'
  );
  writeFileSync(fichierCodes, JSON.stringify(conflitsArray, null, 2));
  console.log(`✅ Sauvegardé : ${fichierCodes}\n`);

  // ========================================================
  // 3. NORMALISATION DES LIEUX
  // ========================================================
  console.log('\n📝 Génération de la table de correspondance des LIEUX...\n');

  const compteurLieux = analyserLieux(workbook);
  const correspondancesLieux: CorrespondanceLieu[] = [];

  for (const [lieu, nb] of Array.from(compteurLieux.entries()).sort(
    (a, b) => b[1] - a[1]
  )) {
    const normalise = normaliserLieu(lieu);
    const aValider = lieu !== normalise;

    correspondancesLieux.push({
      lieuExcel: lieu,
      nbOccurrences: nb,
      propositionNormalise: normalise,
      aValider,
    });

    const symbole = aValider ? '⚠️ ' : '✅';
    console.log(`  ${symbole} "${lieu}" (${nb}×) → "${normalise}"`);
  }

  const fichierLieux = join(
    process.cwd(),
    'scripts/reprise-m13/correspondances-lieux.json'
  );
  writeFileSync(fichierLieux, JSON.stringify(correspondancesLieux, null, 2));
  console.log(`\n✅ Sauvegardé : ${fichierLieux}\n`);

  // ========================================================
  // RÉSUMÉ
  // ========================================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TABLES DE CORRESPONDANCE GÉNÉRÉES');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📄 Fichiers générés :`);
  console.log(`  1. correspondances-etats.json (${correspondancesEtats.length} états)`);
  console.log(`  2. correspondances-codes-doublons.json (${conflitsArray.length} conflits)`);
  console.log(`  3. correspondances-lieux.json (${correspondancesLieux.length} lieux)\n`);

  console.log(`⚠️  ACTION REQUISE — VALIDATION HUMAINE\n`);
  console.log(`Le Service Logistique doit valider ces correspondances avant la Passe 3.\n`);
  console.log(`Instructions :`);
  console.log(`  1. Ouvrir les 3 fichiers JSON`);
  console.log(`  2. Vérifier chaque proposition marquée "aValider": true`);
  console.log(`  3. Modifier les propositions si nécessaire`);
  console.log(`  4. Pour les codes doublons, choisir la résolution appropriée :`);
  console.log(`     - CONSERVER_PREMIER : garder première occurrence, ignorer autres`);
  console.log(`     - AJOUTER_SUFFIXE : renommer AK-XXX01 → AK-XXX01-A, AK-XXX01-B, etc.`);
  console.log(`     - FUSIONNER : même matériel inventorié plusieurs fois`);
  console.log(`     - MANUEL : décision cas par cas (voir commentaire)\n`);
  console.log(`Prochaine étape : Passe 3 — Import avec validation\n`);
}

genererTablesCorrespondance().catch(console.error);
