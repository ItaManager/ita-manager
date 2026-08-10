/**
 * lib/actions/missions.ts — M19 Missions et frais de mission
 */

import { prisma } from "@/lib/db/prisma";

/**
 * Vérifie si l'employé peut créer une nouvelle mission.
 *
 * RÈGLE BLOQUANTE (M19-MISSIONS.md § 5.6) :
 * Pas de rapport sur une mission passée = pas de nouvelle mission.
 *
 * Bloque si :
 * - Il existe une mission dont dateRetour est passée
 * - ET rapportDeposeLe est null
 * - ET la mission n'est ni clôturée, ni refusée, ni annulée
 *
 * @param employeId - UUID de l'employé
 * @param aujourdhui - Date de référence (par défaut : maintenant)
 * @returns true si création autorisée, false si bloquée
 */
export async function peutCreerMission(
  employeId: string,
  aujourdhui = new Date()
): Promise<boolean> {
  // Normaliser aujourdhui à minuit UTC pour comparaison avec @db.Date
  const aujourdhuiCivile = new Date(aujourdhui);
  aujourdhuiCivile.setUTCHours(0, 0, 0, 0);

  // Chercher une mission bloquante
  const missionBloquante = await prisma.mission.findFirst({
    where: {
      demandeurId: employeId,
      // Date de retour passée
      dateRetour: {
        lt: aujourdhuiCivile,
      },
      // Rapport non déposé
      rapportDeposeLe: null,
      // Mission ni clôturée, ni refusée, ni annulée
      clotureeLe: null,
      refuseeLe: null,
      annuleeLe: null,
    },
    select: { id: true },
  });

  return missionBloquante === null;
}
