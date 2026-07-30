"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import bcrypt from "bcrypt";
import { startOfDay, endOfDay } from "date-fns";

// =====================================================================
// M12 — PRÉSENCES BUREAU
// =====================================================================

/**
 * Génère un code de pointage à 5 chiffres pour un employé.
 * Hache le code avec bcrypt avant stockage.
 * Régénérer un code invalide l'ancien.
 */
export const genererCodePointage = actionProtegee(
  "presence:gererCodes",
  async (session, employeId: string) => {
    // Générer un code aléatoire à 5 chiffres
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    // Hacher le code
    const codeHash = await bcrypt.hash(code, 10);

    // Upsert : remplace l'ancien code s'il existe
    await prisma.codePointage.upsert({
      where: { employeId },
      update: {
        codeHash,
        genereParId: session.userId,
        genereLe: new Date(),
      },
      create: {
        employeId,
        codeHash,
        genereParId: session.userId,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "CodePointage",
        entiteId: employeId,
        action: "REGENERATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Code de pointage régénéré",
      },
    });

    // Retourner le code en clair UNIQUEMENT à ce moment
    // Il ne sera plus jamais accessible ensuite
    return { code };
  }
);

/**
 * Enregistre un pointage (arrivée ou départ) via la borne.
 * Authentification par jeton d'appareil + code employé à 5 chiffres.
 */
export async function enregistrerPointage(
  jetonAppareil: string,
  code: string
): Promise<{ success: boolean; message: string; employe?: { prenom: string } }> {
  // Vérifier le jeton d'appareil
  const jetonHash = await bcrypt.hash(jetonAppareil, 10);
  const appareil = await prisma.appareilBorne.findFirst({
    where: {
      jetonHash,
      actif: true,
    },
  });

  if (!appareil) {
    // Message générique pour ne pas révéler si l'appareil existe
    return { success: false, message: "Accès non autorisé" };
  }

  // Mettre à jour le dernier accès
  await prisma.appareilBorne.update({
    where: { id: appareil.id },
    data: { dernierAcces: new Date() },
  });

  // Trouver l'employé par code haché
  const codesPointage = await prisma.codePointage.findMany({
    include: {
      employe: {
        select: {
          id: true,
          prenom: true,
          archiveLe: true,
        },
      },
    },
  });

  let employeTrouve: typeof codesPointage[0] | null = null;
  for (const cp of codesPointage) {
    const match = await bcrypt.compare(code, cp.codeHash);
    if (match) {
      employeTrouve = cp;
      break;
    }
  }

  if (!employeTrouve || employeTrouve.employe.archiveLe) {
    // Message générique pour ne pas révéler si le code existe
    return { success: false, message: "Code invalide" };
  }

  // Vérifier les pointages du jour
  const aujourdHui = new Date();
  const pointagesDuJour = await prisma.pointageBureau.findMany({
    where: {
      employeId: employeTrouve.employeId,
      horodatage: {
        gte: startOfDay(aujourdHui),
        lte: endOfDay(aujourdHui),
      },
      estCorrection: false, // Ne compter que les pointages réels
    },
    orderBy: { horodatage: "desc" },
  });

  // Déterminer le type : ARRIVEE si 0 ou nombre pair, DEPART si impair
  const nombrePointages = pointagesDuJour.length;
  const type = nombrePointages % 2 === 0 ? "ARRIVEE" : "DEPART";

  // Anomalie si 3e pointage ou plus
  const estAnomalie = nombrePointages >= 2;

  // Enregistrer le pointage
  await prisma.pointageBureau.create({
    data: {
      employeId: employeTrouve.employeId,
      type,
      estAnomalie,
    },
  });

  const message =
    type === "ARRIVEE"
      ? `Bonjour ${employeTrouve.employe.prenom}, arrivée enregistrée`
      : `Au revoir ${employeTrouve.employe.prenom}, départ enregistré`;

  return {
    success: true,
    message: estAnomalie ? `${message} (anomalie détectée)` : message,
    employe: { prenom: employeTrouve.employe.prenom },
  };
}

/**
 * Liste les pointages avec filtres et pagination curseur.
 */
export const listerPointages = actionProtegee(
  "employe:lire",
  async (
    session,
    options?: {
      employeId?: string;
      dateDebut?: Date;
      dateFin?: Date;
      anomaliesSeules?: boolean;
      cursor?: string;
      limit?: number;
    }
  ) => {
    const limit = options?.limit ?? 25;

    const where: any = {};

    if (options?.employeId) {
      where.employeId = options.employeId;
    }

    if (options?.dateDebut || options?.dateFin) {
      where.horodatage = {};
      if (options.dateDebut) {
        where.horodatage.gte = startOfDay(options.dateDebut);
      }
      if (options.dateFin) {
        where.horodatage.lte = endOfDay(options.dateFin);
      }
    }

    if (options?.anomaliesSeules) {
      where.estAnomalie = true;
    }

    const pointages = await prisma.pointageBureau.findMany({
      where,
      include: {
        employe: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { horodatage: "desc" },
      take: limit + 1,
      ...(options?.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    });

    const hasNextPage = pointages.length > limit;
    const items = hasNextPage ? pointages.slice(0, limit) : pointages;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return { items, nextCursor, hasNextPage };
  }
);

/**
 * Corriger un pointage erroné (DRH uniquement).
 * Ajoute une ligne rectificative, ne modifie pas l'existante.
 */
export const corrigerPointage = actionProtegee(
  "presence:corriger",
  async (
    session,
    employeId: string,
    date: Date,
    type: "ARRIVEE" | "DEPART",
    motif: string
  ) => {
    if (!motif || motif.trim().length < 10) {
      throw new Error("Le motif doit contenir au moins 10 caractères");
    }

    // Créer la ligne de correction
    const correction = await prisma.pointageBureau.create({
      data: {
        employeId,
        type,
        horodatage: date,
        estCorrection: true,
        corrigePar: session.userId,
        motif,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "PointageBureau",
        entiteId: correction.id,
        action: "CORRECTION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: motif,
      },
    });

    return correction;
  }
);

/**
 * Enregistrer un nouvel appareil de pointage.
 * Génère un jeton unique, le retourne en clair une seule fois.
 */
export const enregistrerAppareil = actionProtegee(
  "presence:gererBornes",
  async (session, libelle: string, emplacement?: string) => {
    // Générer un jeton aléatoire sécurisé (32 caractères)
    const jeton = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join("");

    // Hacher le jeton
    const jetonHash = await bcrypt.hash(jeton, 10);

    const appareil = await prisma.appareilBorne.create({
      data: {
        jetonHash,
        libelle,
        emplacement: emplacement || null,
        creePar: session.userId,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "AppareilBorne",
        entiteId: appareil.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Appareil ${libelle} enregistré`,
      },
    });

    // Retourner le jeton en clair UNIQUEMENT à ce moment
    return { appareil, jeton };
  }
);

/**
 * Révoquer un appareil de pointage.
 * Il ne pourra plus enregistrer de pointages.
 */
export const revoquerAppareil = actionProtegee(
  "presence:gererBornes",
  async (session, appareilId: string) => {
    const appareil = await prisma.appareilBorne.update({
      where: { id: appareilId },
      data: {
        actif: false,
        revoqueLe: new Date(),
        revoquePar: session.userId,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "AppareilBorne",
        entiteId: appareil.id,
        action: "REVOCATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Appareil ${appareil.libelle} révoqué`,
      },
    });

    return appareil;
  }
);

/**
 * Lister les appareils de pointage.
 */
export const listerAppareils = actionProtegee(
  "presence:gererBornes",
  async (session, options?: { actifsSeuls?: boolean }) => {
    const where: any = {};

    if (options?.actifsSeuls) {
      where.actif = true;
    }

    return await prisma.appareilBorne.findMany({
      where,
      orderBy: { creeLe: "desc" },
    });
  }
);

/**
 * Lister les employés avec leur code de pointage.
 */
export const listerCodesPointage = actionProtegee(
  "presence:gererCodes",
  async (session) => {
    const employes = await prisma.employe.findMany({
      where: {
        archiveLe: null, // Seulement les employés actifs
      },
      include: {
        codePointage: {
          select: {
            genereLe: true,
          },
        },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return employes.map((e) => ({
      id: e.id,
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      aUnCode: !!e.codePointage,
      codeGenereLe: e.codePointage?.genereLe || null,
    }));
  }
);
