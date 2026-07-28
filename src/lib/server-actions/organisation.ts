"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUtilisateur, peutGererComptes } from "@/lib/server-actions/acces";

/**
 * Référentiel organisationnel (Direction → Service → Poste), distinct de
 * Fonction (accès aux modules) — voir le commentaire du modèle Direction
 * dans schema.prisma. Lecture seule à ce jalon : aucune page ne construit
 * encore Direction/Service/Poste (ça viendra avec l'assistant de création de
 * profil), donc pas d'action de création/édition ici — seulement les
 * lectures dont ce futur écran aura besoin.
 *
 * Authentification requise sur chaque fonction (même garde minimale que
 * resoudreResponsableRH()) : ce n'est pas une donnée publique, même si elle
 * n'est pas encore filtrée par sous-module précis.
 */
export async function listerDirections() {
  const utilisateur = await getCurrentUtilisateur();
  if (!utilisateur) redirect("/login");

  return prisma.direction.findMany({
    where: { actif: true },
    orderBy: { ordre: "asc" },
  });
}

export async function listerServices(directionId?: string) {
  const utilisateur = await getCurrentUtilisateur();
  if (!utilisateur) redirect("/login");

  return prisma.service.findMany({
    where: { actif: true, ...(directionId ? { directionId } : {}) },
    orderBy: { ordre: "asc" },
  });
}

/**
 * Quand serviceId est fourni, inclut aussi les postes transverses de la
 * direction (serviceId null) — conforme à MODULE-RH.md §3.1 : "Postes
 * transverses DT toujours proposés dès que Direction = DT, quel que soit le
 * service choisi".
 */
export async function listerPostes(directionId?: string, serviceId?: string) {
  const utilisateur = await getCurrentUtilisateur();
  if (!utilisateur) redirect("/login");

  return prisma.poste.findMany({
    where: {
      actif: true,
      ...(directionId ? { directionId } : {}),
      ...(serviceId ? { OR: [{ serviceId }, { serviceId: null }] } : {}),
    },
    orderBy: { ordre: "asc" },
  });
}

export async function listerGrilleSalariale() {
  const utilisateur = await getCurrentUtilisateur();
  if (!utilisateur) redirect("/login");

  return prisma.grilleSalariale.findMany({ orderBy: { dateModification: "asc" } });
}

/**
 * Gardera la création/édition de Direction/Service/Poste (pas encore
 * construite à ce jalon). Ce projet n'a délibérément pas de rôle technique
 * "Admin" séparé (cf. CLAUDE.md) — peutGererComptes() est la vérification de
 * plus haut privilège déjà existante dans l'app et le mapping le plus proche
 * du "Super Admin" de la maquette source, qui n'a pas d'équivalent réel ici.
 */
export async function peutGererReferentielOrganisationnel(utilisateurId: string): Promise<boolean> {
  const appelant = await getCurrentUtilisateur();
  if (!appelant) redirect("/login");
  return peutGererComptes(utilisateurId);
}
