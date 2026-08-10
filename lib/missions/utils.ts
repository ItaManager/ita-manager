/**
 * lib/missions/utils.ts — M19 Missions et frais de mission
 *
 * Fonctions utilitaires de calcul pour les missions.
 * NE SONT PAS des Server Actions — utilisées en interne et dans les écrans Server Components.
 *
 * IMPORTANT : Pas de "use server" ici.
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

/**
 * Détecte les chevauchements entre une mission et les congés validés.
 *
 * Une mission ne peut pas chevaucher un congé validé par la RH.
 * Cette fonction est appelée par l'écran RH pour signaler les conflits.
 *
 * @param employeId - UUID de l'employé
 * @param dateDepart - Date de départ de la mission
 * @param dateRetour - Date de retour de la mission
 * @returns Liste des congés qui chevauchent la mission
 */
export async function detecterChevauchementConges(
  employeId: string,
  dateDepart: Date,
  dateRetour: Date
) {
  // Normaliser les dates à minuit UTC
  const debut = new Date(dateDepart);
  debut.setUTCHours(0, 0, 0, 0);
  const fin = new Date(dateRetour);
  fin.setUTCHours(0, 0, 0, 0);

  // Chercher les congés validés qui chevauchent la période de la mission
  const congesChevauches = await prisma.absence.findMany({
    where: {
      employeId,
      // Congé validé par RH (décision RH = "VALIDE")
      decisionRH: "VALIDE",
      decisionRHLe: {
        not: null,
      },
      annuleeLe: null,
      // Chevauchement :
      // congé commence avant la fin de la mission
      // ET congé se termine après le début de la mission
      dateDebut: {
        lte: fin,
      },
      dateFin: {
        gte: debut,
      },
    },
    select: {
      id: true,
      dateDebut: true,
      dateFin: true,
      nombreJours: true,
      typeAbsence: {
        select: {
          libelle: true,
        },
      },
    },
  });

  return congesChevauches;
}
