/**
 * lib/actions/missions.ts — M19 Missions et frais de mission
 */

"use server";

import { prisma } from "@/lib/db/prisma";
import { exigerPermission } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { peutCreerMission, detecterChevauchementConges } from "@/lib/missions/utils";

/**
 * Vérifie que l'utilisateur est authentifié et retourne son userId.
 * À utiliser pour les actions sans permission spécifique.
 */
async function obtenirUtilisateurAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  return user.id;
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
    // Authentification — vérifier que l'employeId appartient à l'utilisateur
    const userId = await obtenirUtilisateurAuth();
    const profil = await prisma.profil.findUnique({
      where: { id: userId },
      select: { employeId: true },
    });

    if (profil?.employeId !== input.employeId) {
      return {
        success: false,
        message: "Vous ne pouvez créer une mission que pour votre propre compte",
      };
    }

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
  // Authentification — vérifier que l'employeId appartient à l'utilisateur
  const userId = await obtenirUtilisateurAuth();
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    select: { employeId: true },
  });

  if (profil?.employeId !== input.employeId) {
    return {
      success: false,
      message: "Vous ne pouvez viser que pour votre propre compte",
    };
  }

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

interface ValiderRHInput {
  missionId: string;
  decision: "VALIDER" | "REFUSER";
  motif?: string;
}

/**
 * Validation RH — dernière étape avant versement avance (si fraisEstimes > 0).
 *
 * La RH vérifie que la mission ne chevauche pas un congé validé.
 * Si chevauchement détecté, l'interface affiche un avertissement mais
 * la RH peut quand même valider (cas exceptionnel).
 */
export async function validerRH(input: ValiderRHInput) {
  await exigerPermission("mission:traiter");

  const { missionId, decision, motif } = input;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });

  if (!mission) {
    return { success: false, message: "Mission introuvable" };
  }

  // Vérifier le statut
  if (mission.valideeRhLe !== null || mission.refuseeLe !== null) {
    return { success: false, message: "Cette mission a déjà été traitée" };
  }

  // La mission doit avoir été visée par le N+1
  if (mission.viseeN1Le === null) {
    return { success: false, message: "La mission n'a pas encore été visée par le N+1" };
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
        valideeRhLe: new Date(),
      },
    });
    return { success: true, message: "Mission validée par la RH" };
  } else {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        refuseeLe: new Date(),
        motifRefus: motif,
        etapeRefus: "RH",
      },
    });
    return { success: true, message: "Mission refusée" };
  }
}

interface DeposerRapportInput {
  missionId: string;
  employeId: string;
  objetRealise: string;
  resultats: string;
}

/**
 * Déposer le rapport de mission.
 *
 * RÈGLE BLOQUANTE (§ 5.6) : Un rapport non déposé bloque toute nouvelle demande.
 *
 * Validation :
 * - La mission doit appartenir à l'employé
 * - La mission doit avoir été validée par la RH
 * - Le dateRetour doit être passée
 * - objetRealise ET resultats doivent faire au moins 30 caractères
 *   (empêche les rapports en trois mots)
 */
export async function deposerRapport(input: DeposerRapportInput) {
  // Authentification — vérifier que l'employeId appartient à l'utilisateur
  const userId = await obtenirUtilisateurAuth();
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    select: { employeId: true },
  });

  if (profil?.employeId !== input.employeId) {
    return {
      success: false,
      message: "Vous ne pouvez déposer un rapport que pour votre propre compte",
    };
  }

  const { missionId, employeId, objetRealise, resultats } = input;

  // Vérifier que les champs font au moins 30 caractères
  if (objetRealise.trim().length < 30) {
    return {
      success: false,
      message: "L'objet réalisé doit contenir au moins 30 caractères",
    };
  }

  if (resultats.trim().length < 30) {
    return {
      success: false,
      message: "Les résultats doivent contenir au moins 30 caractères",
    };
  }

  // Récupérer la mission
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });

  if (!mission) {
    return { success: false, message: "Mission introuvable" };
  }

  // Vérifier que la mission appartient à l'employé
  if (mission.demandeurId !== employeId) {
    return { success: false, message: "Cette mission ne vous appartient pas" };
  }

  // Vérifier que la mission a été validée par la RH
  if (!mission.valideeRhLe) {
    return {
      success: false,
      message: "La mission n'a pas encore été validée par la RH",
    };
  }

  // Vérifier que le rapport n'a pas déjà été déposé
  if (mission.rapportDeposeLe) {
    return { success: false, message: "Le rapport a déjà été déposé" };
  }

  // Vérifier que la date de retour est passée
  const aujourdhuiCivile = new Date();
  aujourdhuiCivile.setUTCHours(0, 0, 0, 0);

  if (mission.dateRetour >= aujourdhuiCivile) {
    return {
      success: false,
      message: "Le rapport ne peut être déposé qu'après la date de retour",
    };
  }

  // Créer le rapport et mettre à jour la mission
  await prisma.$transaction([
    prisma.rapportMission.create({
      data: {
        missionId,
        objetRealise: objetRealise.trim(),
        resultats: resultats.trim(),
      },
    }),
    prisma.mission.update({
      where: { id: missionId },
      data: {
        rapportDeposeLe: new Date(),
      },
    }),
  ]);

  return { success: true, message: "Rapport déposé avec succès" };
}
