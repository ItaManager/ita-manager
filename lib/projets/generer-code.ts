import { prisma } from "@/lib/db/prisma";

/**
 * Génère le prochain code projet selon le format configuré dans les paramètres
 *
 * Format par défaut : CH-{YYYY}-{NNN}
 * - {YYYY} : année en cours sur 4 chiffres
 * - {NNN} : numéro séquentiel sur N chiffres (rempli de zéros à gauche)
 *
 * Exemple : CH-2026-001, CH-2026-002, etc.
 *
 * @returns Le code projet généré
 */
export async function genererCodeProjet(): Promise<string> {
  // Lire le format depuis les paramètres
  const paramFormat = await prisma.parametre.findUnique({
    where: { cle: "format.code_projet" },
  });

  const format = paramFormat?.valeur || "CH-{YYYY}-{NNN}";
  const annee = new Date().getFullYear();

  // Remplacer l'année
  let pattern = format.replace("{YYYY}", annee.toString());

  // Extraire le préfixe (tout ce qui précède {NNN})
  const prefix = pattern.split("{NNN}")[0];

  // Trouver le dernier projet avec ce préfixe
  const dernierProjet = await prisma.projet.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: "desc",
    },
  });

  // Calculer le prochain numéro
  let numero = 1;
  if (dernierProjet) {
    // Extraire le numéro du dernier code
    const match = dernierProjet.code.match(/(\d+)$/);
    if (match) {
      numero = parseInt(match[1], 10) + 1;
    }
  }

  // Compter le nombre de N dans le format pour déterminer le padding
  const nCount = (format.match(/N/g) || []).length;
  const numeroFormate = numero.toString().padStart(nCount, "0");

  // Remplacer {NNN} par le numéro formaté
  const codeGenere = pattern.replace("{NNN}", numeroFormate);

  return codeGenere;
}
