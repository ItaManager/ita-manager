/**
 * Génération de codes matériel selon format flexible (décision 1.1)
 *
 * Jetons supportés :
 * - {FAMILLE}  : code de la famille (ex: AK-VL)
 * - {SEQ:n}    : compteur complété à n chiffres (ex: {SEQ:3} → 005)
 * - {ANNEE}    : année d'acquisition (optionnel)
 *
 * Exemples de formats :
 * - {FAMILLE}{SEQ:2}              → AK-BUL01
 * - {FAMILLE}{SEQ:3}              → AK-PICK006
 * - ITA-{FAMILLE}{SEQ:4}-{ANNEE}  → ITA-VE0001-2022
 */

export interface FamilleFormat {
  code: string;
  formatCode: string;
  prochainNumero: number;
}

/**
 * Génère un code matériel selon le format de la famille
 *
 * @param famille - Famille matériel avec formatCode et prochainNumero
 * @param annee - Année d'acquisition (optionnel, pour jeton {ANNEE})
 * @returns Code généré avec jetons remplacés
 * @throws Error si le format contient un jeton inconnu
 */
export function genererCode(famille: FamilleFormat, annee?: number): string {
  let code = famille.formatCode;
  const jetonsInconnus: string[] = [];

  // Remplacer {FAMILLE}
  code = code.replace(/{FAMILLE}/g, famille.code);

  // Remplacer {SEQ:n}
  code = code.replace(/{SEQ:(\d+)}/g, (match, digits) => {
    const n = parseInt(digits, 10);
    return famille.prochainNumero.toString().padStart(n, '0');
  });

  // Remplacer {ANNEE}
  if (code.includes('{ANNEE}')) {
    if (annee) {
      code = code.replace(/{ANNEE}/g, annee.toString());
    } else {
      jetonsInconnus.push('{ANNEE}');
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

  return code;
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
