/**
 * Contrôle d'accès pour les pages
 * Vérifie si l'utilisateur a les permissions requises et redirige vers /403 si refusé
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NAV_PERMISSIONS } from "./nav-permissions";

/**
 * Vérifie l'accès à une page
 * @param pathname - Route de la page (ex: "/paie")
 * @returns userId si accès autorisé, redirige vers /403 sinon
 */
export async function verifierAccesPage(pathname: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si pas connecté, rediriger vers connexion
  if (!user) {
    redirect("/connexion");
  }

  // Récupérer les permissions requises pour cette route
  const requiredPermissions = NAV_PERMISSIONS[pathname];

  // Si aucune permission requise, autoriser l'accès
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return user.id;
  }

  // Charger les permissions de l'utilisateur
  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  const userPermissions =
    profil?.roles.flatMap((pr) => pr.role.permissions.map((rp) => rp.permission.code)) || [];

  // Vérifier si l'utilisateur a au moins une des permissions requises
  const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

  if (!hasPermission) {
    // Logger le refus d'accès (non-bloquant)
    try {
      await prisma.journalEvenement.create({
        data: {
          entite: "Page",
          entiteId: pathname,
          action: "ACCES_REFUSE",
          auteurId: user.id,
          auteurNom: user.email || "Inconnu",
          details: {
            route: pathname,
            permissionsRequises: requiredPermissions,
            permissionsUtilisateur: userPermissions,
          },
          commentaire: `Accès refusé à ${pathname} - permissions insuffisantes`,
        },
      });
    } catch (error) {
      // Ignorer les erreurs de journalisation (ne pas bloquer l'accès)
      console.warn("Erreur lors de la journalisation du refus d'accès:", error);
    }

    redirect("/403");
  }

  return user.id;
}
