"use server";

/**
 * Server Actions — Module M1 Organisation
 *
 * Opérations CRUD pour :
 * - Directions (consultation uniquement — création réservée admin)
 * - Services
 * - Postes
 *
 * Toutes les actions utilisent actionProtegee() et enregistrent dans JournalEvenement.
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

const PERMISSIONS = {
  ORGANISATION_CONSULTER: "organisation:consulter" as const,
  ORGANISATION_MODIFIER: "organisation:modifier" as const,
};
import type { NiveauHierarchique } from "@prisma/client";

// =====================================================================
// SCHEMAS DE VALIDATION
// =====================================================================

const SchemaService = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(20, "20 caractères maximum")
    .regex(/^[A-Z_]+$/, "Le code doit être en MAJUSCULES (A-Z, _)"),
  libelle: z
    .string()
    .min(1, "Le libellé est requis")
    .max(100, "100 caractères maximum"),
  directionId: z.string().cuid("ID de direction invalide"),
  ordre: z.number().int().min(0).default(0),
});

const SchemaPoste = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(20, "20 caractères maximum")
    .regex(/^[A-Z_]+$/, "Le code doit être en MAJUSCULES (A-Z, _)"),
  libelle: z
    .string()
    .min(1, "Le libellé est requis")
    .max(100, "100 caractères maximum"),
  niveau: z.enum(["DIRECTION", "CADRE", "SUPPORT", "OPERATIONNEL"]),
  directionId: z.string().cuid("ID de direction invalide"),
  serviceId: z.string().cuid().nullable(),
  reserveAdmin: z.boolean().default(false),
  titulaireUnique: z.boolean().default(false),
  ouvreDroitConges: z.boolean().default(true),
});

// =====================================================================
// ACTIONS — SERVICES
// =====================================================================

export const listerServices = actionProtegee(
  PERMISSIONS.ORGANISATION_CONSULTER,
  async (
    session,
    params?: {
      directionId?: string;
      recherche?: string;
      page?: number;
      limite?: number;
    }
  ) => {
    const page = params?.page ?? 1;
    const limite = params?.limite ?? 25;
    const offset = (page - 1) * limite;

    const where = {
      archiveLe: null,
      ...(params?.directionId && { directionId: params.directionId }),
      ...(params?.recherche && {
        OR: [
          { code: { contains: params.recherche, mode: "insensitive" as const } },
          { libelle: { contains: params.recherche, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        include: {
          direction: true,
          _count: {
            select: { postes: { where: { archiveLe: null } } },
          },
        },
        orderBy: [{ directionId: "asc" }, { ordre: "asc" }, { libelle: "asc" }],
        skip: offset,
        take: limite,
      }),
    ]);

    return {
      services,
      total,
      page,
      totalPages: Math.ceil(total / limite),
    };
  }
);

export const creerService = actionProtegee(
  PERMISSIONS.ORGANISATION_MODIFIER,
  async (session, data: z.infer<typeof SchemaService>) => {
    const valide = SchemaService.parse(data);

    // Vérifier si un service avec ce code existe déjà (R-04 : retourner l'existant)
    const existant = await prisma.service.findUnique({
      where: { code: valide.code },
    });

    if (existant) {
      return { service: existant, cree: false };
    }

    // Vérifier que la direction existe
    const direction = await prisma.direction.findUnique({
      where: { id: valide.directionId },
    });

    if (!direction) {
      throw new Error("Direction introuvable");
    }

    const service = await prisma.service.create({
      data: valide,
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Service",
        entiteId: service.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { service: valide },
      },
    });

    return { service, cree: true };
  }
);

export const modifierService = actionProtegee(
  PERMISSIONS.ORGANISATION_MODIFIER,
  async (
    session,
    id: string,
    data: Partial<z.infer<typeof SchemaService>>
  ) => {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service || service.archiveLe) {
      throw new Error("Service introuvable");
    }

    const avant = { ...service };
    const apres = { ...service, ...data };

    const modifie = await prisma.service.update({
      where: { id },
      data,
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Service",
        entiteId: id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { avant, apres },
      },
    });

    return modifie;
  }
);

export const archiverService = actionProtegee(
  PERMISSIONS.ORGANISATION_MODIFIER,
  async (session, id: string) => {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        postes: {
          where: { archiveLe: null },
        },
      },
    });

    if (!service || service.archiveLe) {
      throw new Error("Service introuvable");
    }

    // Vérifier qu'il n'y a pas de postes actifs
    if (service.postes.length > 0) {
      throw new Error(
        `Impossible d'archiver ce service : ${service.postes.length} poste(s) actif(s) y sont rattachés.`
      );
    }

    const archive = await prisma.service.update({
      where: { id },
      data: { archiveLe: new Date() },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Service",
        entiteId: id,
        action: "ARCHIVAGE",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    return archive;
  }
);

// =====================================================================
// ACTIONS — POSTES
// =====================================================================

export const listerPostes = actionProtegee(
  PERMISSIONS.ORGANISATION_CONSULTER,
  async (
    session,
    params?: {
      directionId?: string;
      serviceId?: string;
      niveau?: NiveauHierarchique;
      recherche?: string;
      page?: number;
      limite?: number;
    }
  ) => {
    const page = params?.page ?? 1;
    const limite = params?.limite ?? 25;
    const offset = (page - 1) * limite;

    const where = {
      archiveLe: null,
      ...(params?.directionId && { directionId: params.directionId }),
      ...(params?.serviceId && { serviceId: params.serviceId }),
      ...(params?.niveau && { niveau: params.niveau }),
      ...(params?.recherche && {
        OR: [
          { code: { contains: params.recherche, mode: "insensitive" as const } },
          { libelle: { contains: params.recherche, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, postes] = await Promise.all([
      prisma.poste.count({ where }),
      prisma.poste.findMany({
        where,
        include: {
          direction: true,
          service: true,
        },
        orderBy: [
          { directionId: "asc" },
          { serviceId: "asc" },
          { niveau: "asc" },
          { libelle: "asc" },
        ],
        skip: offset,
        take: limite,
      }),
    ]);

    return {
      postes,
      total,
      page,
      totalPages: Math.ceil(total / limite),
    };
  }
);

export const creerPoste = actionProtegee(
  PERMISSIONS.ORGANISATION_MODIFIER,
  async (session, data: z.infer<typeof SchemaPoste>) => {
    const valide = SchemaPoste.parse(data);

    // Vérifier si un poste avec ce code existe déjà (R-04 : retourner l'existant)
    const existant = await prisma.poste.findUnique({
      where: { code: valide.code },
    });

    if (existant) {
      return { poste: existant, cree: false };
    }

    // Vérifier que la direction existe
    const direction = await prisma.direction.findUnique({
      where: { id: valide.directionId },
    });

    if (!direction) {
      throw new Error("Direction introuvable");
    }

    // Si serviceId fourni, vérifier qu'il existe et appartient à la direction
    if (valide.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: valide.serviceId },
      });

      if (!service || service.archiveLe) {
        throw new Error("Service introuvable");
      }

      if (service.directionId !== valide.directionId) {
        throw new Error("Le service ne fait pas partie de cette direction");
      }
    }

    const poste = await prisma.poste.create({
      data: valide,
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Poste",
        entiteId: poste.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { poste: valide },
      },
    });

    return { poste, cree: true };
  }
);

export const modifierPoste = actionProtegee(
  PERMISSIONS.ORGANISATION_MODIFIER,
  async (session, id: string, data: Partial<z.infer<typeof SchemaPoste>>) => {
    const poste = await prisma.poste.findUnique({
      where: { id },
    });

    if (!poste || poste.archiveLe) {
      throw new Error("Poste introuvable");
    }

    // Si reserveAdmin, seul ADMIN peut modifier
    if (poste.reserveAdmin) {
      // Vérifier si l'utilisateur a le rôle ADMIN
      const profil = await prisma.profil.findUnique({
        where: { id: session.userId },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      const estAdmin = profil?.roles.some((pr) => pr.role.code === "ADMIN");

      if (!estAdmin) {
        throw new Error(
          "Modification réservée aux administrateurs pour ce poste"
        );
      }
    }

    const avant = { ...poste };
    const apres = { ...poste, ...data };

    const modifie = await prisma.poste.update({
      where: { id },
      data,
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Poste",
        entiteId: id,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { avant, apres },
      },
    });

    return modifie;
  }
);

export const archiverPoste = actionProtegee(
  PERMISSIONS.ORGANISATION_MODIFIER,
  async (session, id: string) => {
    const poste = await prisma.poste.findUnique({
      where: { id },
    });

    if (!poste || poste.archiveLe) {
      throw new Error("Poste introuvable");
    }

    // Si reserveAdmin, seul ADMIN peut archiver
    if (poste.reserveAdmin) {
      const profil = await prisma.profil.findUnique({
        where: { id: session.userId },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      const estAdmin = profil?.roles.some((pr) => pr.role.code === "ADMIN");

      if (!estAdmin) {
        throw new Error(
          "Archivage réservé aux administrateurs pour ce poste"
        );
      }
    }

    // TODO M2 : vérifier qu'aucun employé n'occupe ce poste
    // Pour M1, on archive sans vérification d'occupation

    const archive = await prisma.poste.update({
      where: { id },
      data: { archiveLe: new Date() },
    });

    // Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Poste",
        entiteId: id,
        action: "ARCHIVAGE",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    return archive;
  }
);

// =====================================================================
// ACTIONS — DIRECTIONS (consultation uniquement)
// =====================================================================

export const listerDirections = actionProtegee(
  PERMISSIONS.ORGANISATION_CONSULTER,
  async (session) => {
    const directions = await prisma.direction.findMany({
      where: { archiveLe: null },
      include: {
        _count: {
          select: {
            services: { where: { archiveLe: null } },
            postes: { where: { archiveLe: null } },
          },
        },
      },
      orderBy: { ordre: "asc" },
    });

    return directions;
  }
);

export const obtenirDirection = actionProtegee(
  PERMISSIONS.ORGANISATION_CONSULTER,
  async (session, id: string) => {
    const direction = await prisma.direction.findUnique({
      where: { id },
      include: {
        services: {
          where: { archiveLe: null },
          orderBy: { ordre: "asc" },
        },
        postes: {
          where: { archiveLe: null },
          orderBy: { libelle: "asc" },
        },
      },
    });

    if (!direction || direction.archiveLe) {
      throw new Error("Direction introuvable");
    }

    return direction;
  }
);
