"use server";

/**
 * Server Actions — Administration utilisateurs
 *
 * Implémente les 3 garde-fous en dur (C-04) :
 * 1. Impossible de retirer le rôle ADMIN au dernier admin
 * 2. Impossible de désactiver son propre compte
 * 3. Impossible de retirer son propre rôle ADMIN
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

export const listerUtilisateurs = actionProtegee(
  "admin:utilisateurs" as const,
  async (session, params?: { recherche?: string; actifSeulement?: boolean }) => {
    const where = {
      ...(params?.actifSeulement !== false && { actif: true }),
      ...(params?.recherche && {
        email: { contains: params.recherche, mode: "insensitive" as const },
      }),
    };

    const utilisateurs = await prisma.profil.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { creeLe: "desc" },
    });

    return utilisateurs;
  }
);

export const modifierRolesUtilisateur = actionProtegee(
  "admin:utilisateurs" as const,
  async (session, profilId: string, nouveauxRolesIds: string[]) => {
    // GARDE-FOU 3 : Impossible de retirer son propre rôle ADMIN
    if (profilId === session.userId) {
      const profil = await prisma.profil.findUnique({
        where: { id: profilId },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      const aRoleAdmin = profil?.roles.some((pr) => pr.role.code === "ADMIN");

      // Vérifier si le nouvel ensemble de rôles contient ADMIN
      const roles = await prisma.role.findMany({
        where: { id: { in: nouveauxRolesIds } },
      });
      const gardeSonRoleAdmin = roles.some((r) => r.code === "ADMIN");

      if (aRoleAdmin && !gardeSonRoleAdmin) {
        throw new Error(
          "Vous ne pouvez pas retirer votre propre rôle Administrateur."
        );
      }
    }

    // GARDE-FOU 1 : Impossible de retirer le rôle ADMIN au dernier admin
    const roleAdmin = await prisma.role.findUnique({
      where: { code: "ADMIN" },
    });

    if (roleAdmin) {
      const profil = await prisma.profil.findUnique({
        where: { id: profilId },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      const etaitAdmin = profil?.roles.some((pr) => pr.role.code === "ADMIN");

      // Si on retire le rôle ADMIN à ce profil
      const rolesGardes = await prisma.role.findMany({
        where: { id: { in: nouveauxRolesIds } },
      });
      const resteAdmin = rolesGardes.some((r) => r.code === "ADMIN");

      if (etaitAdmin && !resteAdmin) {
        // Compter les autres admins
        const autresAdmins = await prisma.profilRole.count({
          where: {
            role: { code: "ADMIN" },
            profilId: { not: profilId },
            profil: { actif: true },
          },
        });

        if (autresAdmins === 0) {
          throw new Error(
            "Vous êtes le dernier administrateur. Désignez un autre administrateur avant de retirer ce rôle."
          );
        }
      }
    }

    // Supprimer tous les rôles existants
    await prisma.profilRole.deleteMany({
      where: { profilId },
    });

    // Ajouter les nouveaux rôles
    if (nouveauxRolesIds.length > 0) {
      await prisma.profilRole.createMany({
        data: nouveauxRolesIds.map((roleId) => ({
          profilId,
          roleId,
        })),
      });
    }

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "ProfilRole",
        entiteId: profilId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { nouveauxRolesIds },
        commentaire: "Modification des rôles utilisateur",
      },
    });

    return { success: true };
  }
);

export const desactiverUtilisateur = actionProtegee(
  "admin:utilisateurs" as const,
  async (session, profilId: string) => {
    // GARDE-FOU 2 : Impossible de désactiver son propre compte
    if (profilId === session.userId) {
      throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
    }

    await prisma.profil.update({
      where: { id: profilId },
      data: { actif: false },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Profil",
        entiteId: profilId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Désactivation du compte utilisateur",
      },
    });

    return { success: true };
  }
);

export const reactiverUtilisateur = actionProtegee(
  "admin:utilisateurs" as const,
  async (session, profilId: string) => {
    await prisma.profil.update({
      where: { id: profilId },
      data: { actif: true },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Profil",
        entiteId: profilId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: "Réactivation du compte utilisateur",
      },
    });

    return { success: true };
  }
);

export const listerRolesDisponibles = actionProtegee(
  "admin:utilisateurs" as const,
  async (session) => {
    const roles = await prisma.role.findMany({
      orderBy: { libelle: "asc" },
    });

    return roles;
  }
);
