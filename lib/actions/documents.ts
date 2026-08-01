"use server";

/**
 * Server Actions — Gestion des documents et pièces jointes
 *
 * M3 §7.5 : Les certificats médicaux sont des pièces de classification PARTICULIER.
 * Seule la Direction RH peut les consulter.
 */

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

/**
 * Obtenir une URL signée pour consulter une pièce jointe
 *
 * RÈGLE MÉTIER (M3 §7.5) :
 * - Pièce PARTICULIER → Direction RH ou l'employé concerné uniquement
 * - URL signée avec expiration 5 minutes
 * - Chaque consultation est journalisée
 */
export const obtenirUrlPiece = actionProtegee(
  "employe:lire",
  async (
    session,
    input: {
      absenceId: string;
      pieceId: string;
    }
  ) => {
    // Récupérer l'absence et vérifier l'accès
    const absence = await prisma.absence.findUnique({
      where: { id: input.absenceId },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            profil: {
              select: { id: true },
            },
          },
        },
        typeAbsence: {
          select: {
            id: true,
            libelle: true,
            pieceClassification: true,
          },
        },
      },
    });

    if (!absence) {
      throw new Error("Absence introuvable");
    }

    // Récupérer le profil de l'utilisateur
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        employe: {
          select: { id: true },
        },
        roles: {
          include: {
            role: {
              select: { code: true },
            },
          },
        },
      },
    });

    if (!profil) {
      throw new Error("Profil introuvable");
    }

    // RÈGLE MÉTIER : Si la pièce est de classification PARTICULIER
    if (absence.typeAbsence.pieceClassification) {
      // Vérifier que l'utilisateur est soit :
      // 1. L'employé concerné
      const estEmployeConcerne = profil.employe?.id === absence.employe.id;

      // 2. Direction RH
      const estDRH = profil.roles.some((pr) => pr.role.code === "DRH");

      if (!estEmployeConcerne && !estDRH) {
        // Journaliser le refus
        await prisma.journalEvenement.create({
          data: {
            entite: "Absence",
            entiteId: absence.id,
            action: "REFUS_ACCES",
            auteurId: session.userId,
            auteurNom: session.email,
            details: {
              pieceId: input.pieceId,
              classification: "PARTICULIER",
              typeAbsence: absence.typeAbsence.libelle,
            },
            commentaire: `Tentative de consultation d'une pièce PARTICULIER sans autorisation`,
          },
        });

        throw new Error(
          "Accès refusé : seule la Direction RH peut consulter les pièces de classification PARTICULIER"
        );
      }
    }

    // Générer une URL signée Supabase (expiration 5 minutes)
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from("documents-employes")
      .createSignedUrl(`absences/${input.pieceId}`, 300); // 300 secondes = 5 minutes

    if (error || !data) {
      throw new Error("Impossible de générer l'URL de la pièce");
    }

    // Journaliser la consultation (uniquement pour pièces PARTICULIER)
    if (absence.typeAbsence.pieceClassification) {
      await prisma.journalEvenement.create({
        data: {
          entite: "Absence",
          entiteId: absence.id,
          action: "CONSULTATION_PIECE",
          auteurId: session.userId,
          auteurNom: session.email,
          details: {
            pieceId: input.pieceId,
            classification: "PARTICULIER",
            typeAbsence: absence.typeAbsence.libelle,
          },
          commentaire: `Consultation pièce PARTICULIER : ${absence.typeAbsence.libelle}`,
        },
      });
    }

    return {
      url: data.signedUrl,
      expiresIn: 300, // secondes
    };
  }
);
