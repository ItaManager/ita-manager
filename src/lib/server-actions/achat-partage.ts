"use server";

import { redirect } from "next/navigation";
import type { RoleValidationAchat } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUtilisateur,
  possedeAccesModule,
  possedeAccesSousModule,
  peutValiderDirectionGenerale,
} from "@/lib/server-actions/acces";

/**
 * Un rôle du circuit parallèle = diffusion à quiconque a un accès réel au
 * module/sous-module correspondant, jamais une personne nommée (cf.
 * CLAUDE.md). RH/DG réutilisent les signaux déjà établis ailleurs dans le
 * projet plutôt que d'en inventer de nouveaux.
 */
async function peutValiderDT(utilisateurId: string): Promise<boolean> {
  return possedeAccesModule(utilisateurId, "direction-technique");
}

async function peutValiderRHAchat(utilisateurId: string): Promise<boolean> {
  return possedeAccesSousModule(utilisateurId, "rh", "creation-profil");
}

async function peutValiderDFC(utilisateurId: string): Promise<boolean> {
  return possedeAccesModule(utilisateurId, "dfc");
}

async function peutValiderDGAchat(utilisateurId: string): Promise<boolean> {
  return peutValiderDirectionGenerale(utilisateurId);
}

const VERIFICATEURS_PAR_ROLE: Record<
  RoleValidationAchat,
  (utilisateurId: string) => Promise<boolean>
> = {
  DT: peutValiderDT,
  RH: peutValiderRHAchat,
  DFC: peutValiderDFC,
  DG: peutValiderDGAchat,
};

/** Authentification requise — probe de permission, pas une donnée publique. */
export async function peutValiderRoleAchat(
  utilisateurId: string,
  role: RoleValidationAchat,
): Promise<boolean> {
  const appelant = await getCurrentUtilisateur();
  if (!appelant) redirect("/login");
  return VERIFICATEURS_PAR_ROLE[role](utilisateurId);
}

/** Sous-ensemble de DT/RH/DFC/DG pour lesquels cet utilisateur est habilité. */
export async function rolesEligibles(utilisateurId: string): Promise<RoleValidationAchat[]> {
  const roles: RoleValidationAchat[] = ["DT", "RH", "DFC", "DG"];
  const resultats = await Promise.all(roles.map((role) => peutValiderRoleAchat(utilisateurId, role)));
  return roles.filter((_, index) => resultats[index]);
}

/**
 * Premier Utilisateur actif avec accès achat/traitement-achat — même forme
 * que resoudreResponsableRH()/resoudreLogisticien() : sert uniquement à
 * router DemandeIndex vers un individu résolu (étape 3, broadcast-vers-un-
 * seul), jamais une vérification d'autorisation (peutGererComptes/
 * requireAccesModule restent les seules garde-fous réels).
 *
 * Garde d'authentification minimale + select restreint à l'id : l'unique
 * appelant (achat-demandes.ts) n'utilise jamais que `.id` — retourner
 * l'Utilisateur complet (email, téléphone, numeroWave...) exposerait des
 * données personnelles sans besoin.
 */
export async function resoudreResponsableAchat() {
  const utilisateur = await getCurrentUtilisateur();
  if (!utilisateur) redirect("/login");

  const acces = await prisma.accesUtilisateur.findFirst({
    where: {
      actif: true,
      utilisateur: { statut: "ACTIF" },
      sousModule: { code: "traitement-achat", actif: true, module: { code: "achat" } },
    },
    include: { utilisateur: { select: { id: true } } },
    orderBy: { utilisateur: { dateCreation: "asc" } },
  });
  return acces?.utilisateur ?? null;
}
