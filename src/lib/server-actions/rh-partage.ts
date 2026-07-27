"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUtilisateur, possedeAccesSousModule } from "@/lib/server-actions/acces";

/**
 * Signal "est RH" utilisé pour valider missions et relevés d'activité —
 * généralisation directe du pattern déjà établi au Lot 3 (accès à
 * carburant/depots = responsable Logistique) : aucun sous-module de
 * validation dédié n'est seedé, on réutilise l'accès au sous-module
 * RH-exclusif "creation-profil" comme signal de facto.
 */
/** Authentification requise — probe de permission, pas une donnée publique. */
export async function peutValiderRH(utilisateurId: string): Promise<boolean> {
  const appelant = await getCurrentUtilisateur();
  if (!appelant) redirect("/login");
  return possedeAccesSousModule(utilisateurId, "rh", "creation-profil");
}

/**
 * Même forme que resoudreResponsableLogistique() (Lot 3) : premier
 * Utilisateur actif (statut ACTIF, pas seulement AccesUtilisateur.actif)
 * ayant accès à rh/creation-profil, par ancienneté de compte. Limitation
 * connue : ne généralise pas à plusieurs responsables RH simultanés.
 *
 * Garde d'authentification minimale + select restreint à l'id : les trois
 * appelants (demande-rh-projet.ts, rh-missions.ts, rh-releves.ts)
 * n'utilisent jamais que `.id` — retourner l'Utilisateur complet exposerait
 * des données personnelles sans besoin.
 */
export async function resoudreResponsableRH() {
  const utilisateur = await getCurrentUtilisateur();
  if (!utilisateur) redirect("/login");

  const acces = await prisma.accesUtilisateur.findFirst({
    where: {
      actif: true,
      utilisateur: { statut: "ACTIF" },
      sousModule: { code: "creation-profil", actif: true, module: { code: "rh" } },
    },
    include: { utilisateur: { select: { id: true } } },
    orderBy: { utilisateur: { dateCreation: "asc" } },
  });

  return acces?.utilisateur ?? null;
}
