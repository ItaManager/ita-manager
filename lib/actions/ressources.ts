"use server";

/**
 * Server Actions — Ressources et matériel (M8)
 *
 * M8 §5 : Circuit B-01 (N+1 puis service compétent)
 * M8 §1.2 : Matériel partageable ou non
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { NatureDemandeRessource } from "@prisma/client";
import { obtenirSuperieurHierarchique } from "@/lib/chaines";

// =====================================================================
// M8 — RESSOURCES ET MATÉRIEL
// =====================================================================

/**
 * Vérifier si une délégation est active à une date donnée
 */
async function delegationActive(
  mandantId: string,
  delegataireId: string,
  date: Date
): Promise<boolean> {
  const delegation = await prisma.delegation.findFirst({
    where: {
      mandantId,
      delegataireId,
      actif: true,
      dateDebut: { lte: date },
      dateFin: { gte: date },
    },
  });
  return !!delegation;
}

/**
 * Créer une demande de ressource (humaine ou matérielle)
 *
 * M8 §4 : Deux natures avec circuits différents
 */
export const creerDemandeRessource = actionProtegee(
  "ressource:demander",
  async (
    session,
    donnees: {
      nature: NatureDemandeRessource;
      projetId: string;
      dateDebut: Date;
      dateFin: Date;
      motif: string;
      lignes: Array<{
        competence?: string;
        quantite?: number;
        materielId?: string;
      }>;
    }
  ) => {
    if (donnees.lignes.length === 0) {
      throw new Error("Au moins une ligne de demande est requise");
    }

    const demande = await prisma.demandeRessource.create({
      data: {
        nature: donnees.nature,
        projetId: donnees.projetId,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
        motif: donnees.motif,
        demandeurId: session.userId,
        demandeurNom: session.email,
        statut: "BROUILLON",
        lignes: {
          create: donnees.lignes,
        },
      },
      include: {
        projet: true,
        lignes: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRessource",
        entiteId: demande.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande de ressource ${donnees.nature} créée`,
      },
    });

    revalidatePath("/ressources/demandes");
    return demande;
  }
);

/**
 * Soumettre une demande de ressource
 *
 * M8 §5 : Circuit B-01 commence (vers N+1)
 */
export const soumettreDemandeRessource = actionProtegee(
  "ressource:demander",
  async (session, demandeId: string) => {
    const demande = await prisma.demandeRessource.findUnique({
      where: { id: demandeId },
      include: { lignes: true },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    if (demande.demandeurId !== session.userId) {
      throw new Error("Vous n'êtes pas l'auteur de cette demande");
    }

    if (demande.statut !== "BROUILLON") {
      throw new Error("Cette demande a déjà été soumise");
    }

    if (demande.lignes.length === 0) {
      throw new Error("La demande doit contenir au moins une ligne");
    }

    await prisma.demandeRessource.update({
      where: { id: demandeId },
      data: { statut: "SOUMISE" },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRessource",
        entiteId: demandeId,
        action: "SOUMISSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Demande soumise pour validation N+1",
      },
    });

    revalidatePath("/ressources/demandes");
    return { success: true };
  }
);

/**
 * Valider une demande (N+1)
 *
 * M8 §5 : Première étape du circuit B-01
 */
export const validerDemandeN1 = actionProtegee(
  "ressource:demander", // Toute personne authentifiée
  async (session, demandeId: string) => {
    const demande = await prisma.demandeRessource.findUnique({
      where: { id: demandeId },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    if (demande.statut !== "SOUMISE") {
      throw new Error("Cette demande ne peut pas être validée");
    }

    // Vérifier autorisation par lien de données (M8 §5)
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Obtenir le supérieur hiérarchique du demandeur via ProfilId -> Employe
    const demandeurProfil = await prisma.profil.findUnique({
      where: { id: demande.demandeurId },
      include: { employe: true },
    });

    if (!demandeurProfil?.employe) {
      throw new Error("Demandeur introuvable ou sans employé associé");
    }

    const superieurId = await obtenirSuperieurHierarchique(
      demandeurProfil.employe.id
    );

    // Autorisation par lien de données : être le supérieur OU délégataire actif
    const estSuperieur = superieurId === profil.employe.id;
    const estDelegataire = superieurId
      ? await delegationActive(superieurId, profil.employe.id, new Date())
      : false;

    if (!estSuperieur && !estDelegataire) {
      // Journaliser le refus
      await prisma.journalEvenement.create({
        data: {
          entite: "DemandeRessource",
          entiteId: demandeId,
          action: "REFUS_ACCES",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Tentative de validation d'une demande sans lien hiérarchique`,
        },
      });
      throw new Error("Vous n'êtes pas autorisé à valider cette demande");
    }

    await prisma.demandeRessource.update({
      where: { id: demandeId },
      data: {
        statut: "VALIDEE_N1",
        valideN1ParId: session.userId,
        valideN1Le: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRessource",
        entiteId: demandeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Validation N+1",
      },
    });

    revalidatePath("/ressources/demandes");
    revalidatePath("/ressources/arbitrage");
    return { success: true };
  }
);

/**
 * Valider une demande (service compétent)
 *
 * M8 §5 : Deuxième étape — RH pour humaine, Logistique pour matérielle
 */
export const validerDemandeService = actionProtegee(
  "ressource:demander",
  async (session, demandeId: string) => {
    const demande = await prisma.demandeRessource.findUnique({
      where: { id: demandeId },
      include: { lignes: { include: { materiel: true } } },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    if (demande.statut !== "VALIDEE_N1") {
      throw new Error("Cette demande n'est pas validée N+1");
    }

    // M8 §5 : Vérifier disponibilité pour demande matérielle
    if (demande.nature === "MATERIELLE") {
      for (const ligne of demande.lignes) {
        if (ligne.materielId) {
          const materiel = await prisma.materiel.findUnique({
            where: { id: ligne.materielId },
            include: {
              affectations: {
                where: {
                  OR: [
                    {
                      AND: [
                        { dateDebut: { lte: demande.dateDebut } },
                        { dateFin: { gte: demande.dateDebut } },
                      ],
                    },
                    {
                      AND: [
                        { dateDebut: { lte: demande.dateFin } },
                        { dateFin: { gte: demande.dateFin } },
                      ],
                    },
                  ],
                },
              },
            },
          });

          // M8 §5 : Matériel en panne ne peut pas être affecté
          if (materiel?.statut === "EN_PANNE") {
            throw new Error(
              `Le matériel ${materiel.designation} est en panne et ne peut pas être affecté`
            );
          }

          // M8 §1.2 : Vérifier affectation concurrente si non partageable
          if (
            materiel &&
            !materiel.partageable &&
            materiel.affectations.length > 0
          ) {
            throw new Error(
              `Le matériel ${materiel.designation} est déjà affecté sur cette période`
            );
          }
        }
      }
    }

    await prisma.demandeRessource.update({
      where: { id: demandeId },
      data: {
        statut: "VALIDEE_SERVICE",
        valideServiceParId: session.userId,
        valideServiceLe: new Date(),
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRessource",
        entiteId: demandeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Validation service ${demande.nature === "HUMAINE" ? "RH" : "Logistique"}`,
      },
    });

    revalidatePath("/ressources/arbitrage");
    return { success: true };
  }
);

/**
 * Refuser une demande avec motif
 */
export const refuserDemandeRessource = actionProtegee(
  "ressource:demander",
  async (
    session,
    donnees: {
      demandeId: string;
      motif: string;
      etape: "N1" | "SERVICE";
    }
  ) => {
    if (!donnees.motif || donnees.motif.trim().length < 10) {
      throw new Error("Le motif de refus doit faire au moins 10 caractères");
    }

    const demande = await prisma.demandeRessource.findUnique({
      where: { id: donnees.demandeId },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    const updateData: any = { statut: "REFUSEE" };

    if (donnees.etape === "N1") {
      updateData.motifRefusN1 = donnees.motif;
      updateData.valideN1ParId = session.userId;
      updateData.valideN1Le = new Date();
    } else {
      updateData.motifRefusService = donnees.motif;
      updateData.valideServiceParId = session.userId;
      updateData.valideServiceLe = new Date();
    }

    await prisma.demandeRessource.update({
      where: { id: donnees.demandeId },
      data: updateData,
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeRessource",
        entiteId: donnees.demandeId,
        action: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Refus ${donnees.etape} : ${donnees.motif.substring(0, 50)}...`,
      },
    });

    revalidatePath("/ressources/demandes");
    revalidatePath("/ressources/arbitrage");
    return { success: true };
  }
);

/**
 * Affecter un matériel à un projet
 *
 * M8 §5 : Dates obligatoires
 */
export const affecterMateriel = actionProtegee(
  "ressource:demander",
  async (
    session,
    donnees: {
      materielId: string;
      projetId: string;
      dateDebut: Date;
      dateFin: Date;
      commentaire?: string;
    }
  ) => {
    // Vérifier que le matériel existe et n'est pas en panne
    const materiel = await prisma.materiel.findUnique({
      where: { id: donnees.materielId },
    });

    if (!materiel) {
      throw new Error("Matériel introuvable");
    }

    if (materiel.statut === "EN_PANNE") {
      throw new Error("Ce matériel est en panne et ne peut pas être affecté");
    }

    // M8 §1.2 : Vérifier affectation concurrente si non partageable
    if (!materiel.partageable) {
      const affectationsConcurrentes = await prisma.affectationMateriel.count({
        where: {
          materielId: donnees.materielId,
          OR: [
            {
              AND: [
                { dateDebut: { lte: donnees.dateDebut } },
                { dateFin: { gte: donnees.dateDebut } },
              ],
            },
            {
              AND: [
                { dateDebut: { lte: donnees.dateFin } },
                { dateFin: { gte: donnees.dateFin } },
              ],
            },
          ],
        },
      });

      if (affectationsConcurrentes > 0) {
        throw new Error(
          "Ce matériel est déjà affecté sur cette période et n'est pas partageable"
        );
      }
    }

    const affectation = await prisma.affectationMateriel.create({
      data: {
        materielId: donnees.materielId,
        projetId: donnees.projetId,
        dateDebut: donnees.dateDebut,
        dateFin: donnees.dateFin,
        commentaire: donnees.commentaire,
        affecteParId: session.userId,
      },
      include: {
        materiel: true,
        projet: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "AffectationMateriel",
        entiteId: affectation.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Affectation ${materiel.designation} au projet ${affectation.projet.code}`,
      },
    });

    revalidatePath("/ressources/planning");
    return affectation;
  }
);

// =====================================================================
// CONSULTATION
// =====================================================================

export type MaterielListItem = {
  id: string;
  codeIta: string;
  designation: string;
  famille: {
    id: string;
    libelle: string;
  };
  statut: string;
  partageable: boolean;
  affectations: number;
};

/**
 * Lister le parc matériel
 */
export const listerMateriel = actionProtegee(
  "materiel:lire",
  async (): Promise<MaterielListItem[]> => {
    const materiel = await prisma.materiel.findMany({
    select: {
      id: true,
      codeIta: true,
      designation: true,
      statut: true,
      partageable: true,
      famille: {
        select: {
          id: true,
          libelle: true,
        },
      },
      _count: {
        select: {
          affectations: true,
        },
      },
    },
    orderBy: [
      { famille: { libelle: 'asc' } },
      { codeIta: 'asc' },
    ],
  });

    return materiel.map((m) => ({
      id: m.id,
      codeIta: m.codeIta,
      designation: m.designation,
      famille: m.famille,
      statut: m.statut,
      partageable: m.partageable,
      affectations: m._count.affectations,
    }));
  }
);
