/**
 * Génération de codes matériel selon format flexible (décision 1.1)
 *
 * Jetons supportés :
 * - {FAMILLE}  : code de la famille (ex: AK-VL)
 * - {SEQ:n}    : compteur complété à n chiffres (ex: {SEQ:3} → 005)
 * - {ANNEE}    : année d'acquisition (si absente → année courante)
 *
 * Exemples de formats :
 * - {FAMILLE}{SEQ:2}              → AK-BUL01
 * - {FAMILLE}{SEQ:3}              → AK-PICK006
 * - ITA-{FAMILLE}{SEQ:4}-{ANNEE}  → ITA-VE0001-2022
 */

import type { PrismaClient } from '@prisma/client';

export interface FamilleFormat {
  code: string;
  formatCode: string;
  prochainNumero: number;
}

export interface ResultatGeneration {
  code: string;
  warning?: string;
}

/**
 * Génère un code matériel selon le format de la famille
 *
 * @param famille - Famille matériel avec formatCode et prochainNumero
 * @param annee - Année d'acquisition (optionnel)
 * @returns Objet avec code généré et warning optionnel
 * @throws Error si le format contient un jeton inconnu
 */
export function genererCode(
  famille: FamilleFormat,
  annee?: number
): ResultatGeneration {
  let code = famille.formatCode;
  const jetonsInconnus: string[] = [];
  let warning: string | undefined;

  // Remplacer {FAMILLE}
  code = code.replace(/{FAMILLE}/g, famille.code);

  // Remplacer {SEQ:n}
  code = code.replace(/{SEQ:(\d+)}/g, (match, digits) => {
    const n = parseInt(digits, 10);
    return famille.prochainNumero.toString().padStart(n, '0');
  });

  // Remplacer {ANNEE} — si absente, utiliser année courante
  if (code.includes('{ANNEE}')) {
    const anneeUtilisee = annee ?? new Date().getFullYear();
    code = code.replace(/{ANNEE}/g, anneeUtilisee.toString());

    if (!annee) {
      warning = "année courante — date d'acquisition non renseignée";
    }
  }

  // Détecter jetons inconnus restants
  const jetonsRestants = code.match(/{[^}]+}/g);
  if (jetonsRestants) {
    jetonsInconnus.push(...jetonsRestants);
  }

  if (jetonsInconnus.length > 0) {
    throw new Error(
      `Jetons inconnus dans le format "${famille.formatCode}": ${jetonsInconnus.join(', ')}`
    );
  }

  return { code, warning };
}

/**
 * Calcule le prochain numéro depuis les codes existants en base
 *
 * Le compteur stocké est une optimisation, pas la source de vérité.
 * À la reprise, 3000 matériels arrivent avec leurs codes — aucun compteur
 * ne sera à jour.
 *
 * @param prisma - Client Prisma
 * @param familleId - ID de la famille
 * @param formatCode - Format de code de la famille
 * @returns Prochain numéro de séquence
 */
export async function calculerProchainNumero(
  prisma: PrismaClient,
  familleId: string,
  formatCode: string
): Promise<number> {
  const dernier = await prisma.materiel.findFirst({
    where: { familleId },
    orderBy: { codeIta: 'desc' },
    select: { codeIta: true },
  });

  if (!dernier) {
    return 1;
  }

  // Extraire la séquence du dernier code
  const digitsSeq = extraireDigitsSeq(formatCode);
  if (!digitsSeq) {
    return 1;
  }

  // Chercher la séquence numérique dans le code
  // Exemple : AK-VL012 → extraire 012
  const matches = dernier.codeIta.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return 1;
  }

  // Prendre le dernier groupe de chiffres (la séquence)
  const dernierNumero = parseInt(matches[matches.length - 1], 10);
  return dernierNumero + 1;
}

/**
 * Valide qu'un format de code contient au moins {SEQ:n}
 *
 * @param formatCode - Format à valider
 * @returns true si valide, false sinon
 */
export function validerFormat(formatCode: string): boolean {
  return /{SEQ:\d+}/.test(formatCode);
}

/**
 * Extrait le nombre de chiffres du séquence depuis le format
 *
 * @param formatCode - Format de code
 * @returns Nombre de chiffres ou null si pas de {SEQ:n}
 */
export function extraireDigitsSeq(formatCode: string): number | null {
  const match = formatCode.match(/{SEQ:(\d+)}/);
  return match ? parseInt(match[1], 10) : null;
}
