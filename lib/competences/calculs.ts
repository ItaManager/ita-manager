/**
 * lib/competences/calculs.ts — M17 Compétences et taux journaliers
 *
 * Fonctions utilitaires de calcul pour la paie journalière.
 * NE SONT PAS des Server Actions — utilisées en interne et dans les tests.
 *
 * IMPORTANT : Pas de "use server" ici.
 */

import { prisma } from "@/lib/db/prisma";

/**
 * Renvoie le taux en vigueur à une date donnée
 * Code exact de M17-COMPETENCES.md § 3.4
 */
export async function tauxEnVigueur(competenceId: string, date: Date) {
  return await prisma.tauxJournalier.findFirst({
    where: { competenceId, dateEffet: { lte: date } },
    orderBy: { dateEffet: "desc" },
  });
}

/**
 * La compétence d'un agent à une date donnée
 * Code exact de M17-COMPETENCES.md § 3.4
 */
export async function competenceALaDate(employeId: string, date: Date) {
  return await prisma.affectationCompetence.findFirst({
    where: {
      employeId,
      dateEffet: { lte: date },
      OR: [{ dateFin: null }, { dateFin: { gte: date } }],
    },
    include: { competence: true },
  });
}

/**
 * Le montant d'un jour pointé — DEUX lectures historisées
 * Code exact de M17-COMPETENCES.md § 3.4
 *
 * C'EST LE CRITÈRE DE RECETTE LE PLUS IMPORTANT DE M17
 *
 * Renvoie le montant journalier pour un employé à une date donnée :
 * 1. Cherche la compétence de l'employé à cette date
 * 2. Cherche le taux en vigueur pour cette compétence à cette date
 *
 * @param employeId - UUID de l'employé
 * @param jour - Date du jour pointé
 * @returns Le montant journalier, ou null si pas de compétence
 */
export async function montantDuJour(employeId: string, jour: Date): Promise<number | null> {
  const aff = await competenceALaDate(employeId, jour);
  if (!aff) return null; // pas de compétence ce jour-là

  const taux = await prisma.tauxJournalier.findFirst({
    where: { competenceId: aff.competenceId, dateEffet: { lte: jour } },
    orderBy: { dateEffet: "desc" },
  });

  return taux ? parseFloat(taux.montant.toString()) : null;
}
