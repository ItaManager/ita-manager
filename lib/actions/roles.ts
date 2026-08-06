/**
 * Server Actions — Gestion des rôles et permissions (M11 Administration)
 *
 * Permettre au Super Admin de :
 * - Créer des rôles personnalisés
 * - Modifier les permissions d'un rôle
 * - Assigner des rôles aux utilisateurs
 *
 * Sécurité : Seul le Super Admin (permission admin:parametres) peut modifier les rôles
 */

"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee, PERMISSIONS, type PermissionCode } from "@/lib/auth/guard";
import { z } from "zod";

// =============================================================================
// SCHÉMAS DE VALIDATION
// =============================================================================

const schemaCreerRole = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z_]+$/, "Le code doit être en MAJUSCULES (ex: RESP_ALERTES)"),
  libelle: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

const schemaModifierPermissions = z.object({
  roleId: z.string().uuid(),
  permissionsCodes: z.array(z.string()),
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Lister tous les rôles avec leurs permissions
 */
export const listerRoles = actionProtegee(
  "admin:parametres",
  async (session) => {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        profils: {
          include: {
            profil: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    return {
      success: true,
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        libelle: role.libelle,
        description: role.description,
        permissions: role.permissions.map((rp) => ({
          code: rp.permission.code,
          libelle: rp.permission.libelle,
          domaine: rp.permission.domaine,
        })),
        nbUtilisateurs: role.profils.length,
      })),
    };
  }
);

/**
 * Lister toutes les permissions disponibles
 */
export const listerPermissions = actionProtegee(
  "admin:parametres",
  async (session) => {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { domaine: "asc" },
        { code: "asc" },
      ],
    });

    return {
      success: true,
      permissions: permissions.map((p) => ({
        code: p.code,
        libelle: p.libelle,
        domaine: p.domaine,
      })),
    };
  }
);

/**
 * Créer un nouveau rôle personnalisé
 */
export const creerRole = actionProtegee(
  "admin:parametres",
  async (session, input: z.infer<typeof schemaCreerRole>) => {
    const validated = schemaCreerRole.parse(input);

    // Vérifier que le code n'existe pas déjà
    const existe = await prisma.role.findUnique({
      where: { code: validated.code },
    });

    if (existe) {
      return {
        success: false,
        error: `Un rôle avec le code "${validated.code}" existe déjà`,
      };
    }

    const role = await prisma.role.create({
      data: {
        code: validated.code,
        libelle: validated.libelle,
        description: validated.description || null,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Role",
        entiteId: role.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Création du rôle "${validated.libelle}" (${validated.code})`,
      },
    });

    return {
      success: true,
      roleId: role.id,
    };
  }
);

/**
 * Modifier les permissions d'un rôle
 */
export const modifierPermissionsRole = actionProtegee(
  "admin:parametres",
  async (session, input: z.infer<typeof schemaModifierPermissions>) => {
    const validated = schemaModifierPermissions.parse(input);

    // Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id: validated.roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return {
        success: false,
        error: "Rôle introuvable",
      };
    }

    // Protection : Ne pas modifier les rôles système critiques
    const rolesProtégés = ["ADMIN", "DG", "DRH", "DFC"];
    if (rolesProtégés.includes(role.code)) {
      return {
        success: false,
        error: `Le rôle "${role.code}" est protégé et ne peut pas être modifié via l'interface`,
      };
    }

    // Vérifier que toutes les permissions existent
    const permissionsExistantes = await prisma.permission.findMany({
      where: {
        code: {
          in: validated.permissionsCodes,
        },
      },
    });

    if (permissionsExistantes.length !== validated.permissionsCodes.length) {
      return {
        success: false,
        error: "Certaines permissions sont invalides",
      };
    }

    // Transaction : supprimer les anciennes permissions et ajouter les nouvelles
    await prisma.$transaction(async (tx) => {
      // Supprimer toutes les permissions actuelles
      await tx.rolePermission.deleteMany({
        where: { roleId: validated.roleId },
      });

      // Ajouter les nouvelles permissions
      await tx.rolePermission.createMany({
        data: permissionsExistantes.map((p) => ({
          roleId: validated.roleId,
          permissionId: p.id,
        })),
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "Role",
          entiteId: validated.roleId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          details: {
            ancien: role.permissions.map((rp) => rp.permission.code),
            nouveau: validated.permissionsCodes,
          },
          commentaire: `Modification des permissions du rôle "${role.libelle}"`,
        },
      });
    });

    return {
      success: true,
    };
  }
);

/**
 * Supprimer un rôle personnalisé (uniquement les rôles non-système)
 */
export const supprimerRole = actionProtegee(
  "admin:parametres",
  async (session, roleId: string) => {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        profils: true,
      },
    });

    if (!role) {
      return {
        success: false,
        error: "Rôle introuvable",
      };
    }

    // Protection : Ne pas supprimer les rôles système
    const rolesProtégés = ["ADMIN", "DG", "DRH", "RH", "DFC", "DT", "CT", "CC", "CE", "AD"];
    if (rolesProtégés.includes(role.code)) {
      return {
        success: false,
        error: `Le rôle "${role.code}" est un rôle système et ne peut pas être supprimé`,
      };
    }

    // Vérifier qu'aucun utilisateur n'a ce rôle
    if (role.profils.length > 0) {
      return {
        success: false,
        error: `Impossible de supprimer ce rôle : ${role.profils.length} utilisateur(s) l'utilisent encore`,
      };
    }

    // Supprimer (les permissions seront supprimées automatiquement via CASCADE)
    await prisma.role.delete({
      where: { id: roleId },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "Role",
        entiteId: roleId,
        action: "SUPPRESSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Suppression du rôle "${role.libelle}" (${role.code})`,
      },
    });

    return {
      success: true,
    };
  }
);
