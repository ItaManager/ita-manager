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
  "admin:utilisateurs",
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
  "admin:utilisateurs",
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
  "admin:utilisateurs",
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
  "admin:utilisateurs",
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
  "admin:utilisateurs",
  async (session) => {
    const roles = await prisma.role.findMany({
      orderBy: { libelle: "asc" },
    });

    return roles;
  }
);

export const listerEmployesSansCompte = actionProtegee(
  "admin:utilisateurs",
  async (session) => {
    // Récupérer tous les employés qui n'ont pas de compte utilisateur
    const employes = await prisma.employe.findMany({
      where: {
        profil: null, // Pas de compte utilisateur lié
      },
      include: {
        affectations: {
          where: { dateFin: null }, // Affectation active
          include: {
            poste: {
              include: {
                service: {
                  select: { libelle: true },
                },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    // Transformer pour retourner seulement les champs nécessaires
    return employes.map((employe) => {
      const affectation = employe.affectations[0];
      const poste = affectation?.poste;
      return {
        id: employe.id,
        matricule: employe.matricule,
        nom: employe.nom,
        prenom: employe.prenom,
        poste: poste?.service
          ? {
              libelle: poste.libelle,
              service: {
                libelle: poste.service.libelle,
              },
            }
          : null,
      };
    });
  }
);

const inviterUtilisateurSchema = z.object({
  employeId: z.string().min(1, "L'employé est requis"),
  email: z.string().email("Email invalide"),
  rolesIds: z.array(z.string()).min(1, "Au moins un rôle est requis"),
});

export const inviterUtilisateur = actionProtegee(
  "admin:utilisateurs",
  async (session, input: z.infer<typeof inviterUtilisateurSchema>) => {
    // Validation
    const validated = inviterUtilisateurSchema.parse(input);

    // Vérifier que l'employé existe et n'a pas déjà de compte
    const employe = await prisma.employe.findUnique({
      where: { id: validated.employeId },
      include: { profil: true },
    });

    if (!employe) {
      throw new Error("Employé introuvable");
    }

    if (employe.profil) {
      throw new Error("Cet employé a déjà un compte utilisateur");
    }

    // Vérifier que l'email n'est pas déjà utilisé
    const emailExistant = await prisma.profil.findUnique({
      where: { email: validated.email },
    });

    if (emailExistant) {
      throw new Error("Cette adresse email est déjà utilisée");
    }

    // Créer le compte utilisateur dans Supabase Auth
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin = createAdminClient();

    // Inviter l'utilisateur via Supabase Auth
    // Cela crée le compte ET envoie l'email d'invitation Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      validated.email,
      {
        data: {
          employeId: validated.employeId,
          nom: employe.nom,
          prenom: employe.prenom,
          mfaObligatoire: true, // Forcer la configuration MFA à la première connexion
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup-mfa`,
      }
    );

    if (authError || !authData.user) {
      throw new Error(`Erreur lors de la création du compte : ${authError?.message || "Utilisateur non créé"}`);
    }

    const profilId = authData.user.id;

    // Générer 3 codes de secours pour la MFA
    const { genererCodesSecours } = await import("@/lib/auth/mfa");
    const codesSecours = await genererCodesSecours();

    try {
      // Créer le profil, les rôles et les codes de secours en transaction
      await prisma.$transaction(async (tx) => {
        // Mettre à jour le profil (créé automatiquement par le trigger)
        await tx.profil.update({
          where: { id: profilId },
          data: {
            actif: true,
            employeId: validated.employeId,
          },
        });

        // Assigner les rôles
        await tx.profilRole.createMany({
          data: validated.rolesIds.map((roleId) => ({
            profilId,
            roleId,
          })),
        });

        // Stocker les codes de secours MFA (hachés avec bcrypt)
        const bcrypt = await import("bcrypt");
        await tx.codeSecoursMfa.createMany({
          data: await Promise.all(
            codesSecours.map(async (code) => ({
              profilId,
              codeHache: await bcrypt.hash(code, 10),
            }))
          ),
        });

        // Audit
        await tx.journalEvenement.create({
          data: {
            entite: "Profil",
            entiteId: profilId,
            action: "CREATION",
            auteurId: session.userId,
            auteurNom: session.email,
            details: {
              employeId: validated.employeId,
              email: validated.email,
              rolesIds: validated.rolesIds,
              mfaObligatoire: true,
            },
            commentaire: "Invitation d'un nouvel utilisateur avec MFA obligatoire",
          },
        });
      });

      // Envoyer notre propre email d'invitation personnalisé via Resend
      // (en plus de l'email Supabase)
      const { envoyerEmailInvitation } = await import("@/lib/email/invitation");
      await envoyerEmailInvitation({
        email: validated.email,
        prenom: employe.prenom,
        nom: employe.nom,
        lienInvitation: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup-mfa`,
      });
    } catch (error) {
      // En cas d'erreur, supprimer le compte Supabase Auth créé
      await supabaseAdmin.auth.admin.deleteUser(profilId);
      throw error;
    }

    return { success: true, profilId };
  }
);
