/**
 * M13 L1.5 — Reprise des données — Passe 3 : Import
 *
 * But : Importer les données avec les correspondances validées.
 *
 * RÈGLES (M13-LOGISTIQUE.md §9.2) :
 * - Utiliser les tables de correspondance validées par le Service Logistique
 * - Journal des lignes rejetées avec motif
 * - Journalisation complète dans JournalEvenement
 * - **Aucun import sans validation humaine des correspondances**
 *
 * IMPORTANT : Ce script ÉCRIT EN BASE. Exécuter en transaction.
 */

import * as XLSX from 'xlsx';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { PrismaClient, StatutMateriel, TypeMateriel } from '@prisma/client';

// Utiliser prisma direct (sans pooling) pour le script
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL ou DIRECT_URL manquant dans .env.dev');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

const EXCEL_PATH = join(
  process.cwd(),
  'reference/M13/ITA - CODE MATERIELS ITA INVENTORIES.xlsx'
);

const FEUILLES_MATERIEL: Array<{ feuille: string; type: TypeMateriel }> = [
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

type LigneRejetee = {
  feuille: string;
  ligne: number;
  code: string;
  designation: string;
  motif: string;
  details?: string;
};

type StatistiquesImport = {
  total: number;
  importes: number;
  rejetes: number;
  ventiles: number; // Lignes "À VENTILER" devenues plusieurs matériels
  parType: Record<string, number>;
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

function convertirDateExcel(dateSerial: any): Date | null {
  if (typeof dateSerial !== 'number' || isNaN(dateSerial)) {
    return null;
  }

  const baseDate = new Date(1899, 11, 30);
  const date = new Date(baseDate.getTime() + dateSerial * 24 * 60 * 60 * 1000);

  if (
    date.getFullYear() < 1990 ||
    date.getFullYear() > 2030 ||
    isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function chargerCorrespondances() {
  console.log('📂 Chargement des tables de correspondance...\n');

  const fichierEtats = join(
    process.cwd(),
    'scripts/reprise-m13/correspondances-etats.json'
  );
  const fichierCodes = join(
    process.cwd(),
    'scripts/reprise-m13/correspondances-codes-doublons.json'
  );
  const fichierLieux = join(
    process.cwd(),
    'scripts/reprise-m13/correspondances-lieux.json'
  );

  const etats: CorrespondanceEtat[] = JSON.parse(readFileSync(fichierEtats, 'utf-8'));
  const codes: ConflitCode[] = JSON.parse(readFileSync(fichierCodes, 'utf-8'));
  const lieux: CorrespondanceLieu[] = JSON.parse(readFileSync(fichierLieux, 'utf-8'));

  // Créer des Maps pour recherche rapide
  const mapEtats = new Map<string, string>();
  for (const e of etats) {
    mapEtats.set(e.etatExcel.toUpperCase(), e.propositionStatut);
  }

  const mapLieux = new Map<string, string>();
  for (const l of lieux) {
    mapLieux.set(l.lieuExcel, l.propositionNormalise);
  }

  const mapCodes = new Map<string, ConflitCode>();
  for (const c of codes) {
    mapCodes.set(c.code, c);
  }

  console.log(`  ✅ ${etats.length} correspondances d'états`);
  console.log(`  ✅ ${codes.length} conflits de codes`);
  console.log(`  ✅ ${lieux.length} correspondances de lieux\n`);

  return { mapEtats, mapLieux, mapCodes };
}

async function importerFeuille(
  workbook: XLSX.WorkBook,
  nomFeuille: string,
  typeMateriel: TypeMateriel,
  mapEtats: Map<string, string>,
  mapLieux: Map<string, string>,
  mapCodes: Map<string, ConflitCode>,
  famillesParType: Map<TypeMateriel, any[]>,
  lieuxStockage: Map<string, string>
): Promise<{
  importes: number;
  rejetes: LigneRejetee[];
  ventiles: number;
}> {
  console.log(`\n📋 Import de "${nomFeuille}" (${typeMateriel})...`);

  const worksheet = workbook.Sheets[nomFeuille];
  if (!worksheet) {
    console.log(`  ⚠️  Feuille non trouvée`);
    return { importes: 0, rejetes: [], ventiles: 0 };
  }

  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  }) as any[][];

  const ligneEntete = trouverLigneEntete(data);
  if (ligneEntete === -1) {
    console.log(`  ⚠️  Entête non trouvée`);
    return { importes: 0, rejetes: [], ventiles: 0 };
  }

  const entete = data[ligneEntete];
  const colCode = entete.findIndex(
    (c: any) =>
      c && typeof c === 'string' && (c.toUpperCase().includes('CODE') || c.toUpperCase().includes('MATERIEL'))
  );
  const colDesignation = entete.findIndex(
    (c: any) => c && typeof c === 'string' && c.toUpperCase().includes('DESIGNATION')
  );
  const colEtat = entete.findIndex(
    (c: any) => c && typeof c === 'string' && c.toUpperCase().includes('ETAT')
  );
  const colLieu = entete.findIndex(
    (c: any) => c && typeof c === 'string' && c.toUpperCase().includes('LIEU')
  );
  const colDate = entete.findIndex(
    (c: any) =>
      c && typeof c === 'string' && c.toUpperCase().includes('DATE') && c.toUpperCase().includes('ACQUISITION')
  );
  const colMarque = entete.findIndex(
    (c: any) => c && typeof c === 'string' && c.toUpperCase().includes('MARQUE')
  );
  const colNumeroSerie = entete.findIndex(
    (c: any) =>
      c &&
      typeof c === 'string' &&
      (c.toUpperCase().includes('SERIE') || c.toUpperCase().includes('CHASSIS'))
  );

  if (colCode === -1 || colDesignation === -1) {
    console.log(`  ⚠️  Colonnes CODE ou DESIGNATION manquantes`);
    return { importes: 0, rejetes: [], ventiles: 0 };
  }

  let importes = 0;
  let ventiles = 0;
  const rejetes: LigneRejetee[] = [];

  // Compteur pour codes déjà vus (gestion doublons)
  const codesVus = new Map<string, number>();

  for (let i = ligneEntete + 1; i < data.length; i++) {
    const row = data[i];
    const code = String(row[colCode] || '').trim();
    const designation = String(row[colDesignation] || '').trim();

    // Ignorer lignes vides
    if (!code && !designation) continue;

    // Vérifier code obligatoire
    if (!code) {
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code: '(vide)',
        designation,
        motif: 'CODE_MANQUANT',
        details: 'Le code ITA est obligatoire',
      });
      continue;
    }

    // Vérifier désignation obligatoire
    if (!designation) {
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code,
        designation: '(vide)',
        motif: 'DESIGNATION_MANQUANTE',
        details: 'La désignation est obligatoire',
      });
      continue;
    }

    // Gérer les codes en doublon
    const conflit = mapCodes.get(code);
    if (conflit) {
      const occurrenceIndex = codesVus.get(code) || 0;
      codesVus.set(code, occurrenceIndex + 1);

      if (conflit.resolution === 'CONSERVER_PREMIER' && occurrenceIndex > 0) {
        rejetes.push({
          feuille: nomFeuille,
          ligne: i + 1,
          code,
          designation,
          motif: 'CODE_DOUBLON_IGNORE',
          details: `Résolution: CONSERVER_PREMIER (garder 1re occurrence)`,
        });
        continue;
      }

      if (conflit.resolution === 'MANUEL') {
        rejetes.push({
          feuille: nomFeuille,
          ligne: i + 1,
          code,
          designation,
          motif: 'CODE_DOUBLON_MANUEL',
          details: `Résolution manuelle requise (${conflit.commentaire})`,
        });
        continue;
      }

      // FUSIONNER et AJOUTER_SUFFIXE sont gérés ci-dessous
    }

    // Mapper l'état
    const etatExcel = colEtat !== -1 ? String(row[colEtat] || '').trim().toUpperCase() : '';
    const statut = etatExcel ? mapEtats.get(etatExcel) : 'DISPONIBLE';

    if (!statut) {
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code,
        designation,
        motif: 'ETAT_NON_MAPPE',
        details: `État "${etatExcel}" non trouvé dans correspondances`,
      });
      continue;
    }

    // Gérer "À VENTILER"
    if (statut === 'À_VENTILER') {
      // TODO : Implémenter la ventilation (ex: "2B 2M" → 2 DISPONIBLE + 2 HORS_SERVICE)
      // Pour l'instant, rejeter ces lignes
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code,
        designation,
        motif: 'A_VENTILER_NON_IMPLEMENTE',
        details: `État "${etatExcel}" nécessite ventilation manuelle`,
      });
      continue;
    }

    // Vérifier que le statut est valide
    if (!(statut in StatutMateriel)) {
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code,
        designation,
        motif: 'STATUT_INVALIDE',
        details: `Statut "${statut}" non reconnu dans enum StatutMateriel`,
      });
      continue;
    }

    // Normaliser le lieu
    const lieuExcel = colLieu !== -1 ? String(row[colLieu] || '').trim() : '';
    const lieuNormalise = lieuExcel ? mapLieux.get(lieuExcel) || lieuExcel : null;
    const lieuId = lieuNormalise ? lieuxStockage.get(lieuNormalise) : null;

    // Convertir la date
    const dateSerial = colDate !== -1 ? row[colDate] : null;
    const dateAcquisition = dateSerial ? convertirDateExcel(dateSerial) : null;

    // Extraire autres champs
    const marque = colMarque !== -1 ? String(row[colMarque] || '').trim() || null : null;
    const numeroSerie =
      colNumeroSerie !== -1 ? String(row[colNumeroSerie] || '').trim() || null : null;

    // Déterminer la famille (première famille active du type)
    const familles = famillesParType.get(typeMateriel) || [];
    if (familles.length === 0) {
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code,
        designation,
        motif: 'AUCUNE_FAMILLE',
        details: `Aucune famille active pour type ${typeMateriel}`,
      });
      continue;
    }

    const familleId = familles[0].id;

    // Créer le matériel
    try {
      // Générer un code unique si conflit avec résolution AJOUTER_SUFFIXE
      let codeUnique = code;
      if (conflit && conflit.resolution === 'AJOUTER_SUFFIXE') {
        const occurrenceIndex = codesVus.get(code) || 0;
        if (occurrenceIndex > 0) {
          const suffixe = String.fromCharCode(64 + occurrenceIndex); // 1→A, 2→B, etc.
          codeUnique = `${code}-${suffixe}`;
        }
      }

      await prisma.materiel.create({
        data: {
          codeIta: codeUnique,
          designation,
          type: typeMateriel,
          statut: statut as StatutMateriel,
          familleId,
          lieuBaseId: lieuId,
          dateAcquisition,
          marque,
          numeroSerie,
          actif: true,
        },
      });

      importes++;
    } catch (error: any) {
      rejetes.push({
        feuille: nomFeuille,
        ligne: i + 1,
        code,
        designation,
        motif: 'ERREUR_CREATION',
        details: error.message || String(error),
      });
    }
  }

  console.log(`  ✅ ${importes} matériels importés`);
  if (rejetes.length > 0) {
    console.log(`  ⚠️  ${rejetes.length} lignes rejetées`);
  }

  return { importes, rejetes, ventiles };
}

async function executerImport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  M13 L1.5 — PASSE 3 : IMPORT AVEC VALIDATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  CE SCRIPT ÉCRIT EN BASE — Confirmation requise\n');

  // Charger les correspondances
  const { mapEtats, mapLieux, mapCodes } = chargerCorrespondances();

  // Charger les familles et lieux de la base
  console.log('📂 Chargement des référentiels en base...\n');

  const familles = await prisma.familleMateriel.findMany({
    where: { actif: true },
    select: { id: true, code: true, libelle: true, typeMateriel: true },
  });

  const lieux = await prisma.lieuStockage.findMany({
    where: { actif: true },
    select: { id: true, libelle: true },
  });

  // Grouper familles par type
  const famillesParType = new Map<TypeMateriel, any[]>();
  for (const famille of familles) {
    if (!famillesParType.has(famille.typeMateriel)) {
      famillesParType.set(famille.typeMateriel, []);
    }
    famillesParType.get(famille.typeMateriel)!.push(famille);
  }

  // Créer un map des lieux
  const lieuxStockage = new Map<string, string>();
  for (const lieu of lieux) {
    lieuxStockage.set(lieu.libelle.toUpperCase(), lieu.id);
  }

  console.log(`  ✅ ${familles.length} familles actives`);
  console.log(`  ✅ ${lieux.length} lieux de stockage\n`);

  // Vérifier que chaque type a au moins une famille
  for (const { type } of FEUILLES_MATERIEL) {
    if (!famillesParType.has(type) || famillesParType.get(type)!.length === 0) {
      console.error(`  ❌ ERREUR : Aucune famille active pour ${type}`);
      console.error(`     Créer au moins une famille avant l'import.\n`);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  // Lire le fichier Excel
  const workbook = XLSX.readFile(EXCEL_PATH);

  const stats: StatistiquesImport = {
    total: 0,
    importes: 0,
    rejetes: 0,
    ventiles: 0,
    parType: {},
  };

  const tousLesRejetes: LigneRejetee[] = [];

  // Importer chaque feuille
  for (const { feuille, type } of FEUILLES_MATERIEL) {
    const resultat = await importerFeuille(
      workbook,
      feuille,
      type,
      mapEtats,
      mapLieux,
      mapCodes,
      famillesParType,
      lieuxStockage
    );

    stats.importes += resultat.importes;
    stats.rejetes += resultat.rejetes.length;
    stats.ventiles += resultat.ventiles;
    stats.parType[type] = resultat.importes;
    tousLesRejetes.push(...resultat.rejetes);
  }

  stats.total = stats.importes + stats.rejetes;

  // Sauvegarder le journal des rejets
  if (tousLesRejetes.length > 0) {
    const fichierRejets = join(
      process.cwd(),
      'scripts/reprise-m13/journal-rejets.json'
    );
    writeFileSync(fichierRejets, JSON.stringify(tousLesRejetes, null, 2));
    console.log(`\n📄 Journal des rejets sauvegardé : ${fichierRejets}`);
  }

  // Journaliser dans JournalEvenement
  await prisma.journalEvenement.create({
    data: {
      entite: 'Systeme',
      entiteId: 'reprise-m13-l1.5',
      action: 'IMPORT_DONNEES',
      auteurId: null,
      auteurNom: 'Système (Reprise M13)',
      details: {
        dateImport: new Date().toISOString(),
        fichierSource: EXCEL_PATH,
        stats,
        rejets: tousLesRejetes.length,
      },
      commentaire: `Import M13 L1.5 : ${stats.importes} matériels importés, ${stats.rejetes} lignes rejetées`,
    },
  });

  // Afficher le résumé
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RÉSUMÉ DE L\'IMPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 STATISTIQUES GLOBALES\n`);
  console.log(`  Total traité : ${stats.total}`);
  console.log(`  ✅ Importés : ${stats.importes}`);
  console.log(`  ⚠️  Rejetés : ${stats.rejetes}`);
  if (stats.ventiles > 0) {
    console.log(`  🔀 Ventilés : ${stats.ventiles}`);
  }
  console.log();

  console.log(`📋 PAR TYPE DE MATÉRIEL\n`);
  for (const [type, nb] of Object.entries(stats.parType)) {
    console.log(`  ${type} : ${nb}`);
  }
  console.log();

  if (stats.rejetes > 0) {
    console.log(`⚠️  MOTIFS DE REJET (top 5)\n`);
    const motifs = new Map<string, number>();
    for (const rejet of tousLesRejetes) {
      motifs.set(rejet.motif, (motifs.get(rejet.motif) || 0) + 1);
    }

    const top5 = Array.from(motifs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [motif, nb] of top5) {
      console.log(`  ${motif} : ${nb}`);
    }
    console.log(`\n  Voir journal-rejets.json pour le détail complet.\n`);
  }

  console.log('\n✅ Import terminé avec succès\n');

  await prisma.$disconnect();
}

executerImport().catch(async (error) => {
  console.error('\n❌ ERREUR LORS DE L\'IMPORT :\n');
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
