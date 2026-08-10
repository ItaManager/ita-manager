/**
 * lib/actions/missions.ts — M19 Missions et frais de mission
 */

"use server";

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
 * Génère la prochaine référence de mission.
 * Format : MIS-YYYY-NNNN
 */
async function genererReference(): Promise<string> {
  const annee = new Date().getFullYear();
  const prefixe = `MIS-${annee}-`;

  // Trouver la dernière référence de l'année
  const derniere = await prisma.mission.findFirst({
    where: {
      reference: {
        startsWith: prefixe,
      },
    },
    orderBy: {
      reference: "desc",
    },
    select: {
      reference: true,
    },
  });

  let numero = 1;
  if (derniere) {
    const dernierNumero = parseInt(derniere.reference.split("-")[2]);
    numero = dernierNumero + 1;
  }

  return `${prefixe}${numero.toString().padStart(4, "0")}`;
}

interface LigneFraisInput {
  categorie: string;
  libelle: string;
  montant: number;
}

interface CreerMissionInput {
  employeId: string;
  objet: string;
  destination: string;
  moyenTransport: string;
  dateDepart: Date;
  dateRetour: Date;
  projetId: string | null;
  lignesFrais: LigneFraisInput[];
}

/**
 * Crée une nouvelle demande de mission.
 */
export async function creerMission(input: CreerMissionInput) {
  try {
    // Vérifier le blocage
    const peut = await peutCreerMission(input.employeId);
    if (!peut) {
      const missionBloquante = await prisma.mission.findFirst({
        where: {
          demandeurId: input.employeId,
          dateRetour: {
            lt: new Date(),
          },
          rapportDeposeLe: null,
          clotureeLe: null,
          refuseeLe: null,
          annuleeLe: null,
        },
        select: {
          reference: true,
          objet: true,
          dateRetour: true,
          fraisEstimes: true,
        },
      });

      return {
        success: false,
        message: `Vous avez une mission passée sans rapport : ${missionBloquante?.reference} (${missionBloquante?.objet}). Retour prévu le ${new Date(missionBloquante?.dateRetour!).toLocaleDateString("fr-FR")}. Avance de ${missionBloquante?.fraisEstimes.toString()} F. Déposez d'abord votre rapport avant de créer une nouvelle mission.`,
      };
    }

    // Générer la référence
    const reference = await genererReference();

    // Calculer le total des frais estimés
    const fraisEstimes = input.lignesFrais.reduce((sum, l) => sum + l.montant, 0);

    // Créer la mission et ses lignes de frais
    const mission = await prisma.mission.create({
      data: {
        reference,
        demandeurId: input.employeId,
        objet: input.objet,
        destination: input.destination,
        moyenTransport: input.moyenTransport as any,
        dateDepart: input.dateDepart,
        dateRetour: input.dateRetour,
        fraisEstimes,
        projetId: input.projetId,
        soumiseLe: new Date(),
        lignesFrais: {
          create: input.lignesFrais.map((ligne) => ({
            moment: "ESTIMATION" as const,
            categorie: ligne.categorie as any,
            libelle: ligne.libelle,
            montant: ligne.montant,
          })),
        },
      },
    });

    return {
      success: true,
      message: `Mission ${reference} créée avec succès`,
      missionId: mission.id,
    };
  } catch (error) {
    console.error("Erreur création mission:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la création de la mission",
    };
  }
}

interface VisaerN1Input {
  missionId: string;
  decision: "VALIDER" | "REFUSER";
  motif?: string;
  employeId: string; // ID de l'employé qui décide (depuis son profil)
}

/**
 * Visa du N+1 — contrôle par lien de données, pas par permission.
 *
 * Le supérieur est récupéré depuis l'affectation du demandeur.
 * Si pas de supérieur (DG), la mission passe directement à la RH.
 */
export async function visaerN1(input: VisaerN1Input) {
  const { missionId, decision, motif, employeId } = input;

  // Récupérer la mission avec le demandeur et son affectation
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      demandeur: {
        include: {
          affectations: {
            where: {
              dateFin: null, // Affectation en cours
            },
            select: {
              superieurId: true,
            },
          },
        },
      },
    },
  });

  if (!mission) {
    return { success: false, message: "Mission introuvable" };
  }

  // Vérifier le statut
  if (mission.viseeN1Le !== null || mission.refuseeLe !== null) {
    return { success: false, message: "Cette mission a déjà été traitée" };
  }

  // Récupérer l'affectation en cours du demandeur
  const affectation = mission.demandeur.affectations[0];

  if (!affectation) {
    return { success: false, message: "Le demandeur n'a pas d'affectation active" };
  }

  // Pas de supérieur → DG → passer direct à RH
  if (!affectation.superieurId) {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        viseeN1Le: new Date(),
        // Mission passe directement à validation RH
      },
    });
    return { success: true, message: "Mission validée automatiquement (pas de supérieur)" };
  }

  // Vérifier que l'utilisateur est bien le supérieur
  const estSuperieur = affectation.superieurId === employeId;

  if (!estSuperieur) {
    return { success: false, message: "Vous n'êtes pas le supérieur hiérarchique de ce demandeur" };
  }

  // Validation : motif obligatoire pour refus
  if (decision === "REFUSER" && !motif) {
    return { success: false, message: "Le motif du refus est obligatoire" };
  }

  // Appliquer la décision
  if (decision === "VALIDER") {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        viseeN1Le: new Date(),
      },
    });
    return { success: true, message: "Mission visée par le N+1" };
  } else {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        refuseeLe: new Date(),
        motifRefus: motif,
        etapeRefus: "N1",
      },
    });
    return { success: true, message: "Mission refusée" };
  }
}
