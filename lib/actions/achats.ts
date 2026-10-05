"use server";

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { actionProtegee } from "@/lib/auth/guard";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// M14 — Achats — Server Actions
// Référentiels : Unités, Articles, Fournisseurs, Prix Fournisseur
// ============================================================================

/**
 * Normalise une chaîne pour comparaison insensible à la casse et aux accents.
 * Utilisé pour détecter les doublons dans les combobox créables.
 */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ============================================================================
// UNITÉS
// ============================================================================

export const listerUnites = actionProtegee("achat:demander", async () => {
  return await prisma.unite.findMany({
    orderBy: { libelle: "asc" },
    select: { id: true, libelle: true },
  });
});

export const creerUnite = actionProtegee(
  "achat:instruire",
  async (session, libelle: string) => {
    const norm = normaliser(libelle);

    // Cherche un doublon via la contrainte unique (indexé)
    const existant = await prisma.unite.findFirst({
      where: {
        libelle: {
          equals: libelle,
          mode: "insensitive",
        },
      },
    });

    // R-04 : retourne l'existant sans erreur
    if (existant) return existant;

    // Crée la nouvelle unité
    const unite = await prisma.unite.create({
      data: {
        libelle: libelle.trim(),
        creePar: session.userId,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Unite",
        entiteId: unite.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { libelle: unite.libelle },
      },
    });

    return unite;
  },
);

// ============================================================================
// ARTICLES
// ============================================================================

export const listerArticles = actionProtegee("achat:demander", async () => {
  return await prisma.article.findMany({
    where: { actif: true },
    orderBy: { designation: "asc" },
    include: {
      unite: { select: { libelle: true } },
    },
  });
});

export const creerArticle = actionProtegee(
  "referentiel:creer",
  async (session, designation: string, uniteId: string) => {
    const norm = normaliser(designation);

    // CORRECTION 9 : Recherche indexée via designationNormalisee
    const existant = await prisma.article.findUnique({
      where: { designationNormalisee: norm },
      include: { unite: true },
    });

    // R-04 : retourne l'existant sans erreur
    if (existant) return existant;

    // Crée le nouvel article
    const article = await prisma.article.create({
      data: {
        designation: designation.trim(),
        designationNormalisee: norm,
        uniteId,
        creePar: session.userId,
      },
      include: { unite: true },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Article",
        entiteId: article.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { designation: article.designation, uniteId },
      },
    });

    return article;
  },
);

// ============================================================================
// FOURNISSEURS
// ============================================================================

export const listerFournisseurs = actionProtegee("achat:instruire", async () => {
  return await prisma.fournisseur.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });
});

export const listerTousFournisseurs = actionProtegee("referentiel:creer", async () => {
  return await prisma.fournisseur.findMany({
    orderBy: { creeLe: "desc" },
    select: {
      id: true,
      nom: true,
      numeroWave: true,
      actif: true,
      creeLe: true,
      creePar: true,
    },
  });
});

export const creerFournisseur = actionProtegee(
  "referentiel:creer",
  async (session, nom: string, numeroWave?: string) => {
    const norm = normaliser(nom);

    // CORRECTION 9 : Recherche indexée via nomNormalise
    const existant = await prisma.fournisseur.findUnique({
      where: { nomNormalise: norm },
    });

    // R-04 : retourne l'existant sans erreur
    if (existant) return existant;

    // Crée le nouveau fournisseur
    const fournisseur = await prisma.fournisseur.create({
      data: {
        nom: nom.trim(),
        nomNormalise: norm,
        numeroWave: numeroWave?.trim() || null,
        creePar: session.userId,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Fournisseur",
        entiteId: fournisseur.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          nom: fournisseur.nom,
          avecNumeroWave: !!numeroWave,
        },
        commentaire: numeroWave
          ? "Fournisseur créé avec numéro Wave (donnée sensible)"
          : "Fournisseur créé sans numéro Wave",
      },
    });

    return fournisseur;
  },
);

export const modifierFournisseur = actionProtegee(
  "referentiel:creer",
  async (
    session,
    fournisseurId: string,
    nom: string,
    numeroWave?: string | null
  ) => {
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id: fournisseurId },
    });

    if (!fournisseur) {
      throw new Error("Fournisseur introuvable");
    }

    const norm = normaliser(nom);

    // Vérifier qu'aucun autre fournisseur n'a ce nom
    const conflit = await prisma.fournisseur.findUnique({
      where: { nomNormalise: norm },
    });

    if (conflit && conflit.id !== fournisseurId) {
      throw new Error("Un autre fournisseur porte déjà ce nom");
    }

    const avant = {
      nom: fournisseur.nom,
      numeroWave: fournisseur.numeroWave,
    };

    const apres = await prisma.fournisseur.update({
      where: { id: fournisseurId },
      data: {
        nom: nom.trim(),
        nomNormalise: norm,
        numeroWave: numeroWave === undefined ? fournisseur.numeroWave : (numeroWave?.trim() || null),
      },
    });

    // Journalisation avec attention spéciale si numeroWave modifié
    const numeroWaveModifie =
      numeroWave !== undefined && avant.numeroWave !== apres.numeroWave;

    await prisma.journalEvenement.create({
      data: {
        entite: "Fournisseur",
        entiteId: fournisseurId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { avant, apres },
        commentaire: numeroWaveModifie
          ? "ATTENTION : Numéro Wave modifié (donnée sensible de paiement)"
          : "Modification fournisseur",
      },
    });

    return apres;
  }
);

export const archiverFournisseur = actionProtegee(
  "referentiel:creer",
  async (session, fournisseurId: string, archiver: boolean) => {
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id: fournisseurId },
    });

    if (!fournisseur) {
      throw new Error("Fournisseur introuvable");
    }

    await prisma.fournisseur.update({
      where: { id: fournisseurId },
      data: { actif: !archiver },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "Fournisseur",
        entiteId: fournisseurId,
        action: archiver ? "ARCHIVAGE" : "REACTIVATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { nom: fournisseur.nom },
        commentaire: archiver
          ? "Fournisseur archivé"
          : "Fournisseur réactivé",
      },
    });

    return { success: true };
  }
);

// ============================================================================
// PRIX FOURNISSEUR (Bordereau de prix)
// ============================================================================

export const listerPrixFournisseur = actionProtegee(
  "referentiel:creer",
  async () => {
    return await prisma.prixFournisseur.findMany({
      where: { actif: true },
      orderBy: [
        { article: { designation: "asc" } },
        { fournisseur: { nom: "asc" } },
      ],
      include: {
        article: {
          include: {
            unite: { select: { libelle: true } },
          },
        },
        fournisseur: { select: { nom: true } },
      },
    });
  },
);

export const ajouterPrixFournisseur = actionProtegee(
  "referentiel:creer",
  async (session, articleId: string, fournisseurId: string, prixHT: number) => {
    // Vérifie l'existence du couple (contrainte unique)
    const existant = await prisma.prixFournisseur.findFirst({
      where: { articleId, fournisseurId, actif: true },
    });

    if (existant) {
      throw new Error("Ce prix existe déjà pour ce couple article-fournisseur");
    }

    const prix = await prisma.prixFournisseur.create({
      data: {
        articleId,
        fournisseurId,
        prixHT,
        creePar: session.userId,
      },
      include: {
        article: true,
        fournisseur: true,
      },
    });

    await prisma.journalEvenement.create({
      data: {
        entite: "PrixFournisseur",
        entiteId: prix.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { articleId, fournisseurId, prixHT },
      },
    });

    return prix;
  },
);

// ============================================================================
// TABLEAU DE SUIVI DES DEMANDES
// ============================================================================

/**
 * Calcule le statut d'une demande d'achat à partir de ses événements.
 * M14-ACHATS.md § 9.2 — Statut calculé, pas stocké.
 */
function calculerStatut(
  evenements: Array<{ type: string }>,
): string {
  const types = evenements.map((e) => e.type);

  if (types.includes("REFUS")) return "REFUSEE";
  if (types.includes("RECEPTION")) {
    // Vérifier si toutes les lignes sont soldées (à implémenter avec compteurs)
    // Pour le pilote, on considère SOLDEE si réception complète
    return "SOLDEE";
  }
  if (types.includes("FACTURATION")) return "SOLDEE";
  if (types.includes("EMISSION_BC")) return "BC_EMIS";
  if (types.includes("TRANSMISSION_COMITE")) return "ATTENTE_COMITE";
  if (types.includes("INSTRUCTION")) return "ATTENTE_ACHATS";
  if (types.includes("VALIDATION_N1")) return "ATTENTE_ACHATS";
  if (types.includes("REFUS_N1")) return "REFUSEE";
  if (types.includes("SOUMISSION")) return "ATTENTE_N1";

  return "BROUILLON";
}

/**
 * Calcule le délai entre soumission et BC (CORRECTION 7).
 * Compare les DATES, pas les timestamps (lundi 17h → mardi 9h = 1 jour).
 */
function calculerDelai(
  evenements: Array<{ type: string; timestamp: Date }>,
): number | null {
  const soumission = evenements.find((e) => e.type === "SOUMISSION");
  const bc = evenements.find((e) => e.type === "EMISSION_BC");

  if (!soumission || !bc) return null;

  const jour = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const delai = Math.round(
    (jour(bc.timestamp).getTime() - jour(soumission.timestamp).getTime()) /
      86400000,
  );

  return delai;
}

export const listerDemandesAvecCalculs = actionProtegee(
  "achat:demander",
  async (session) => {
    // Charger les permissions de l'utilisateur pour masquage prix
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });

    const permissions =
      profil?.roles.flatMap((pr) =>
        pr.role.permissions.map((rp) => rp.permission.code),
      ) ?? [];

    // Charger toutes les demandes avec leurs événements
    const demandes = await prisma.demandeAchat.findMany({
      orderBy: { creeLe: "desc" },
      include: {
        demandeur: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        beneficiaire: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        lignes: {
          include: {
            article: { select: { designation: true } },
            fournisseur: { select: { nom: true } },
          },
        },
        evenements: {
          orderBy: { timestamp: "asc" },
          select: { type: true, timestamp: true },
        },
      },
    });

    // CORRECTION 8 : Batch loading pour résoudre destinations (pas de N+1)
    const destinationIds = [
      ...new Set(demandes.map((d) => d.destinationId)),
    ];
    const [projets, services] = await Promise.all([
      prisma.projet.findMany({
        where: { id: { in: destinationIds } },
        select: { id: true, nom: true },
      }),
      prisma.service.findMany({
        where: { id: { in: destinationIds } },
        select: { id: true, libelle: true },
      }),
    ]);

    const destinationLibelles = new Map([
      ...projets.map((p) => [p.id, `Chantier ${p.nom}`] as const),
      ...services.map((s) => [s.id, `Service ${s.libelle}`] as const),
    ]);

    // CORRECTION 2 : Masquage du prix basé sur permissions, pas identité
    const voitPrix =
      permissions.includes("achat:instruire") ||
      permissions.includes("achat:valider") ||
      permissions.includes("achat:facturer");

    // Construire la projection avec 18 colonnes
    return demandes.map((demande) => {
      const statut = calculerStatut(demande.evenements);
      const delai = calculerDelai(demande.evenements);

      // Agréger les lignes
      const lignesResume = demande.lignes
        .map(
          (l) =>
            `${l.article?.designation ?? "Article supprimé"} (${Number(l.quantite)} ${l.unite})`,
        )
        .join(", ");

      // CORRECTION 6 : TVA stockée par ligne, pas en dur
      const montantHT = demande.lignes.reduce(
        (sum, l) => sum + Number(l.prixUnitaire ?? 0) * Number(l.quantite),
        0,
      );
      const montantTTC = demande.lignes.reduce(
        (sum, l) =>
          sum +
          Number(l.prixUnitaire ?? 0) *
            Number(l.quantite) *
            (1 + Number(l.tauxTva ?? 0) / 100),
        0,
      );

      const fournisseursUniques = [
        ...new Set(
          demande.lignes
            .map((l) => l.fournisseur?.nom)
            .filter((n): n is string => !!n),
        ),
      ];

      return {
        // 1-8 : Colonnes de base
        ref: demande.ref,
        demandeur: `${demande.demandeur.prenom} ${demande.demandeur.nom}`,
        beneficiaire:
          demande.beneficiaireId === demande.demandeurId
            ? "—"
            : `${demande.beneficiaire.prenom} ${demande.beneficiaire.nom}`,
        destination: destinationLibelles.get(demande.destinationId) ?? "—",
        motif: demande.description,
        lignes: lignesResume,
        type: demande.type === "REGULARISATION" ? "Régularisation" : "—",
        dateSoumission: demande.evenements.find(
          (e) => e.type === "SOUMISSION",
        )?.timestamp,

        // 9-12 : Prix masqués selon permission (CORRECTION 2 + C-05)
        fournisseurs: voitPrix ? fournisseursUniques.join(", ") : null,
        montantHT: voitPrix ? montantHT : null,
        montantTVA: voitPrix ? montantTTC - montantHT : null,
        montantTTC: voitPrix ? montantTTC : null,

        // 13-14 : Dates de circuit
        dateBC: demande.evenements.find((e) => e.type === "EMISSION_BC")
          ?.timestamp,
        dateReception: demande.evenements.find((e) => e.type === "RECEPTION")
          ?.timestamp,

        // 15-16 : Calculés (ƒ)
        statut, // CORRECTION 5 : enum StatutDemandeAchat, pas String
        delai, // CORRECTION 7 : jours calendaires

        // 17-18 : Traçabilité
        refBC: demande.refBC,
        refFacture: demande.refFacture,
      };
    });
  },
);

/**
 * Récupère une demande d'achat par sa référence avec tous ses détails
 */
export const obtenirDemande = actionProtegee(
  "achat:demander",
  async (session, ref: string) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { ref },
      include: {
        demandeur: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        beneficiaire: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        lignes: {
          include: {
            article: {
              select: {
                id: true,
                designation: true,
                unite: { select: { libelle: true } },
              },
            },
            fournisseur: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
        evenements: {
          orderBy: { timestamp: "asc" },
          select: {
            id: true,
            type: true,
            auteurNom: true,
            timestamp: true,
            details: true,
          },
        },
      },
    });

    if (!demande) {
      throw new Error("Demande d'achat introuvable");
    }

    // Résoudre la destination (projet ou service)
    const [projet, service] = await Promise.all([
      prisma.projet.findUnique({
        where: { id: demande.destinationId },
        select: { id: true, nom: true },
      }),
      prisma.service.findUnique({
        where: { id: demande.destinationId },
        select: { id: true, libelle: true },
      }),
    ]);

    const destination = projet
      ? { id: projet.id, nom: `Chantier ${projet.nom}` }
      : service
        ? { id: service.id, nom: `Service ${service.libelle}` }
        : null;

    // Calculer le statut
    const statut = calculerStatut(demande.evenements);

    // Calculer prixUnitaireTTC pour chaque ligne et convertir tous les Decimal en number
    const lignesAvecTTC = demande.lignes.map((ligne) => ({
      id: ligne.id,
      demandeId: ligne.demandeId,
      articleId: ligne.articleId,
      designation: ligne.designation,
      quantite: Number(ligne.quantite),
      unite: ligne.unite,
      fournisseurId: ligne.fournisseurId,
      prixUnitaire: ligne.prixUnitaire ? Number(ligne.prixUnitaire) : null,
      tauxTva: ligne.tauxTva ? Number(ligne.tauxTva) : null,
      prixUnitaireTTC: ligne.prixUnitaire
        ? Number(ligne.prixUnitaire) * (1 + Number(ligne.tauxTva ?? 0) / 100)
        : null,
      article: ligne.article,
      fournisseur: ligne.fournisseur,
    }));

    return {
      id: demande.id,
      ref: demande.ref,
      type: demande.type,
      demandeurId: demande.demandeurId,
      beneficiaireId: demande.beneficiaireId,
      destinationId: demande.destinationId,
      description: demande.description,
      dateBesoin: demande.dateBesoin,
      urgent: demande.urgent,
      creeLe: demande.creeLe,
      refBC: demande.refBC,
      refFacture: demande.refFacture,
      demandeur: demande.demandeur,
      beneficiaire: demande.beneficiaire,
      destination,
      statut,
      lignes: lignesAvecTTC,
      evenements: demande.evenements,
    };
  },
);

// ============================================================================
// CIRCUIT DE VALIDATION DES DEMANDES D'ACHAT
// ============================================================================

/**
 * Crée une nouvelle demande d'achat en brouillon
 */
export const creerDemande = actionProtegee(
  "achat:demander",
  async (session, data: {
    beneficiaireId: string;
    destinationId: string;
    description: string;
    dateBesoin: Date;
    urgent: boolean;
    type: "INITIALE" | "REGULARISATION";
    lignes: Array<{
      articleId: string;
      designation: string;
      quantite: number;
      unite: string;
    }>;
  }) => {
    // Récupérer l'employé du profil
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Générer la référence
    const annee = new Date().getFullYear();
    const count = await prisma.demandeAchat.count({
      where: {
        ref: {
          startsWith: `DA-${annee}-`,
        },
      },
    });
    const ref = `DA-${annee}-${String(count + 1).padStart(3, "0")}`;

    // Créer la demande
    const demande = await prisma.demandeAchat.create({
      data: {
        ref,
        type: data.type,
        demandeurId: profil.employe.id,
        beneficiaireId: data.beneficiaireId,
        destinationId: data.destinationId,
        description: data.description,
        dateBesoin: data.dateBesoin,
        urgent: data.urgent,
        lignes: {
          create: data.lignes.map((ligne) => ({
            articleId: ligne.articleId,
            designation: ligne.designation,
            quantite: ligne.quantite,
            unite: ligne.unite,
          })),
        },
      },
      include: {
        lignes: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demande.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande ${ref} créée en brouillon`,
      },
    });

    return demande;
  }
);

/**
 * Soumet une demande au N+1 hiérarchique
 */
export const soumettreDemande = actionProtegee(
  "achat:demander",
  async (session, demandeId: string) => {
    // Récupérer l'employé du profil
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Vérifier que la demande appartient à l'utilisateur
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
    });

    if (!demande || demande.demandeurId !== profil.employe.id) {
      throw new Error("Demande introuvable");
    }

    // Créer l'événement de soumission
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "SOUMISSION",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "SOUMISSION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande ${demande.ref} soumise au N+1`,
      },
    });
  }
);

/**
 * Valide une demande par le N+1 hiérarchique
 * Utilise obtenirSuperieurHierarchique pour vérifier l'autorisation
 */
export const validerDemandeN1 = actionProtegee(
  "achat:demander",
  async (session, demandeId: string) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
      include: {
        demandeur: true,
      },
    });

    if (!demande) throw new Error("Demande introuvable");

    // Vérifier autorisation hiérarchique (comme M3 déciderN1)
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error("Aucun employé associé à ce compte");
    }

    // Import de la fonction de chaîne hiérarchique
    const { obtenirSuperieurHierarchique } = await import("@/lib/chaines");

    const superieurId = await obtenirSuperieurHierarchique(demande.demandeur.id);

    if (superieurId !== profil.employe.id) {
      // Journaliser tentative refusée
      await prisma.journalEvenement.create({
        data: {
          entite: "DemandeAchat",
          entiteId: demandeId,
          action: "REFUS_ACCES",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Tentative de validation sans lien hiérarchique`,
        },
      });
      throw new Error("Vous n'êtes pas le N+1 de ce demandeur");
    }

    // Créer l'événement de validation
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "VALIDATION_N1",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "VALIDATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande ${demande.ref} validée par N+1`,
      },
    });
  }
);

/**
 * Refuse une demande par le N+1
 */
export const refuserDemandeN1 = actionProtegee(
  "achat:demander",
  async (session, demandeId: string, motif: string) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
      include: {
        demandeur: true,
      },
    });

    if (!demande) throw new Error("Demande introuvable");

    // Vérifier autorisation hiérarchique
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) throw new Error("Aucun employé associé");

    const { obtenirSuperieurHierarchique } = await import("@/lib/chaines");

    const superieurId = await obtenirSuperieurHierarchique(demande.demandeur.id);

    if (superieurId !== profil.employe.id) {
      throw new Error("Vous n'êtes pas le N+1 de ce demandeur");
    }

    // Créer l'événement de refus
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { motif },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "REFUS",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande ${demande.ref} refusée: ${motif}`,
      },
    });
  }
);

/**
 * Instruit une demande (Chef Service Achats)
 * Sélection fournisseurs et saisie prix
 */
export const instruireDemande = actionProtegee(
  "achat:instruire",
  async (session, demandeId: string, data: {
    lignes: Array<{
      ligneId: string;
      fournisseurId: string;
      prixUnitaire: number;
      tauxTva: number;
    }>;
  }) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
    });

    if (!demande) throw new Error("Demande introuvable");

    // Mettre à jour les lignes avec prix
    for (const ligne of data.lignes) {
      await prisma.ligneAchat.update({
        where: { id: ligne.ligneId },
        data: {
          fournisseurId: ligne.fournisseurId,
          prixUnitaire: ligne.prixUnitaire,
          tauxTva: ligne.tauxTva,
        },
      });
    }

    // Créer l'événement d'instruction
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Demande ${demande.ref} instruite`,
      },
    });
  }
);

/**
 * Émet un bon de commande
 */
export const emettreBonCommande = actionProtegee(
  "achat:instruire",
  async (session, demandeId: string, data: {
    numeroBC: string;
    dateEmission: Date;
  }) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
    });

    if (!demande) throw new Error("Demande introuvable");

    // Mettre à jour la référence BC
    await prisma.demandeAchat.update({
      where: { id: demandeId },
      data: { refBC: data.numeroBC },
    });

    // Créer l'événement
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "EMISSION_BC",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { numeroBC: data.numeroBC, dateEmission: data.dateEmission },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "EMISSION_BC",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `BC ${data.numeroBC} émis`,
      },
    });
  }
);

/**
 * Enregistre une réception
 */
export const enregistrerReception = actionProtegee(
  "achat:receptionner",
  async (session, demandeId: string, data: {
    lignes: Array<{
      ligneId: string;
      quantiteRecue: number;
    }>;
    dateReception: Date;
  }) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
    });

    if (!demande) throw new Error("Demande introuvable");

    // Mettre à jour les quantités reçues
    for (const ligne of data.lignes) {
      await prisma.ligneAchat.update({
        where: { id: ligne.ligneId },
        data: {
          quantiteRecue: {
            increment: ligne.quantiteRecue,
          },
        },
      });
    }

    // Créer l'événement
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "RECEPTION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: { dateReception: data.dateReception },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "RECEPTION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Réception enregistrée`,
      },
    });
  }
);

/**
 * Saisit une facture
 */
export const saisirFacture = actionProtegee(
  "achat:facturer",
  async (session, demandeId: string, data: {
    numeroFacture: string;
    montantHT: number;
    montantTVA: number;
    montantTTC: number;
    dateFacture: Date;
  }) => {
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
    });

    if (!demande) throw new Error("Demande introuvable");

    // Mettre à jour la référence facture
    await prisma.demandeAchat.update({
      where: { id: demandeId },
      data: { refFacture: data.numeroFacture },
    });

    // Créer l'événement
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "FACTURATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          numeroFacture: data.numeroFacture,
          montantHT: data.montantHT,
          montantTVA: data.montantTVA,
          montantTTC: data.montantTTC,
          dateFacture: data.dateFacture,
        },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "FACTURATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Facture ${data.numeroFacture} saisie`,
      },
    });
  }
);

// ============================================================================
// STATISTIQUES POUR INDICATEURS
// ============================================================================

/**
 * Statistiques pour les indicateurs du module Achats
 */
export const statistiquesAchats = actionProtegee(
  "achat:demander",
  async (session) => {
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
        employe: true,
      },
    });

    const permissions =
      profil?.roles.flatMap((pr) =>
        pr.role.permissions.map((rp) => rp.permission.code)
      ) ?? [];

    // Charger toutes les demandes pour analyse
    const demandes = await prisma.demandeAchat.findMany({
      include: {
        lignes: true,
        evenements: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    // Compter demandes en attente de validation
    let aValider = 0;
    if (permissions.includes("achat:demander") && profil?.employe) {
      const affectationsSubordonnes = await prisma.affectation.findMany({
        where: {
          superieurId: profil.employe.id,
          dateFin: null,
        },
        select: { employeId: true },
      });

      const subordinesIds = affectationsSubordonnes.map((a) => a.employeId);

      if (subordinesIds.length > 0) {
        const demandesSubordonnes = demandes.filter(
          (d) =>
            subordinesIds.includes(d.demandeurId) &&
            d.evenements[0]?.type === "SOUMISSION"
        );
        aValider = demandesSubordonnes.length;
      }
    }

    // Compter demandes à instruire
    const aInstruire = demandes.filter(
      (d) => d.evenements[0]?.type === "VALIDATION_N1"
    ).length;

    // Compter bons de commande à émettre
    const bonsCommande = demandes.filter((d) => {
      const dernier = d.evenements[0]?.type;
      return (
        dernier === "INSTRUCTION" ||
        dernier === "AVIS_COMITE" ||
        dernier === "TRANSMISSION_COMITE"
      );
    }).length;

    // Calculer montant total en cours (demandes non facturées)
    const montantEnCours = demandes
      .filter((d) => !d.refFacture)
      .reduce((sum, d) => {
        const montantDemande = d.lignes.reduce((s, l) => {
          const prix = Number(l.prixUnitaire ?? 0);
          const qte = Number(l.quantite);
          const tva = Number(l.tauxTva ?? 0);
          return s + prix * qte * (1 + tva / 100);
        }, 0);
        return sum + montantDemande;
      }, 0);

    return {
      aValider,
      aInstruire,
      bonsCommande,
      montantEnCours: Math.round(montantEnCours),
      totalDemandes: demandes.length,
    };
  }
);

// ============================================================================
// GÉNÉRATION DE DEMANDE DE DEVIS
// ============================================================================

/**
 * Récupère les données nécessaires pour générer un PDF de demande de devis
 * Retourne les informations d'ITA et les articles sélectionnés
 */
export const obtenirDonneesDevis = actionProtegee(
  "achat:instruire",
  async (session, refDemande: string, ligneIds: string[]) => {
    // Récupérer la demande
    const demande = await prisma.demandeAchat.findUnique({
      where: { ref: refDemande },
      include: {
        lignes: {
          where: {
            id: { in: ligneIds },
          },
          include: {
            article: {
              select: {
                designation: true,
              },
            },
          },
        },
      },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    // TODO: Réactiver cette vérification en production
    // Vérifier que la demande est au bon statut
    // const evenements = await prisma.evenementAchat.findMany({
    //   where: { demandeId: demande.id },
    //   orderBy: { timestamp: "desc" },
    //   take: 1,
    // });

    // const statut = calculerStatut(evenements);
    // if (statut !== "ATTENTE_ACHATS") {
    //   throw new Error("Cette demande ne peut pas générer de devis (statut incorrect)");
    // }

    // Retourner les données pour le PDF
    return {
      entreprise: {
        nom: "ITA SARL",
        adresse: "Abidjan, Côte d'Ivoire",
        // TODO: Ajouter logo en base64 si nécessaire
      },
      demande: {
        ref: demande.ref,
        description: demande.description,
        dateBesoin: demande.dateBesoin,
      },
      articles: demande.lignes.map((ligne) => ({
        designation: ligne.designation,
        quantite: Number(ligne.quantite),
        unite: ligne.unite,
      })),
    };
  }
);

// ============================================================================
// INSTRUCTION DES LIGNES D'ACHAT
// ============================================================================

/**
 * Fonction interne pour uploader un fichier vers Supabase Storage
 * Utilisée uniquement par instruireLigneAchat
 */
async function uploadDocumentVersSupabase(
  file: File,
  userId: string,
  userEmail: string
): Promise<string> {
  // Types acceptés
  const typesAcceptes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  // Vérifications de base
  if (!typesAcceptes.includes(file.type)) {
    throw new Error(
      "Types acceptés : PDF, Images (JPG, PNG, WebP), Word (DOC, DOCX)"
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Le fichier ne doit pas dépasser 10 MB");
  }

  // Créer client Supabase avec service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Générer un nom unique pour le fichier avec extension appropriée
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split(".").pop() || "pdf";
  const fileName = `devis/${timestamp}-${randomStr}.${extension}`;

  // Convertir File en ArrayBuffer puis Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from("documents-achats")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Erreur lors de l'upload vers Supabase Storage: ${error.message}`
    );
  }

  // Obtenir l'URL publique
  const {
    data: { publicUrl },
  } = supabase.storage.from("documents-achats").getPublicUrl(fileName);

  // Logger l'upload
  await prisma.journalEvenement.create({
    data: {
      entite: "DocumentAchat",
      entiteId: fileName,
      action: "UPLOAD",
      auteurId: userId,
      auteurNom: userEmail,
      details: {
        fileName,
        fileSize: file.size,
        url: publicUrl,
        bucket: "documents-achats",
        storage: "supabase",
      },
    },
  });

  return publicUrl;
}

/**
 * Instruire une ligne d'achat : prix TTC, fournisseur, documents
 * Règle : documents réutilisés si même fournisseur pour plusieurs articles
 */
export const instruireLigneAchat = actionProtegee(
  "achat:instruire",
  async (
    session,
    input: {
      ligneId: string;
      prixUnitaireTTC: number;
      fournisseurId: string;
      fichiers?: Array<{
        name: string;
        type: string;
        size: number;
        base64: string;
      }>;
    }
  ) => {
    const { ligneId, prixUnitaireTTC, fournisseurId, fichiers: fichiersBase64 } = input;

    // Convertir les fichiers base64 en File objects
    const fichiers: File[] = [];
    if (fichiersBase64 && fichiersBase64.length > 0) {
      for (const f of fichiersBase64) {
        // Décoder le base64
        const base64Data = f.base64.split(',')[1]; // Enlever le préfixe data:...;base64,
        const buffer = Buffer.from(base64Data, 'base64');
        // Créer un File-like object (Blob avec name)
        const blob = new Blob([buffer], { type: f.type });
        const file = new File([blob], f.name, { type: f.type });
        fichiers.push(file);
      }
    }

    // Vérifications
    if (prixUnitaireTTC <= 0) {
      throw new Error("Le prix doit être supérieur à zéro");
    }

    // Récupérer la ligne et vérifier qu'elle existe
    const ligne = await prisma.ligneAchat.findUnique({
      where: { id: ligneId },
      include: {
        demande: {
          select: { id: true, ref: true },
        },
      },
    });

    if (!ligne) {
      throw new Error("Ligne d'achat introuvable");
    }

    // Vérifier le fournisseur
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id: fournisseurId },
    });

    if (!fournisseur) {
      throw new Error("Fournisseur introuvable");
    }

    // Gérer l'upload des documents
    let documentsDevis: any = undefined;

    // Si des fichiers sont fournis, uploader tous
    if (fichiers && fichiers.length > 0) {
      const documentsUploades = [];

      for (const fichier of fichiers) {
        const url = await uploadDocumentVersSupabase(
          fichier,
          session.userId,
          session.email
        );

        documentsUploades.push({
          url,
          nom: fichier.name,
          taille: fichier.size,
          type: fichier.type,
          uploadeLe: new Date().toISOString(),
        });
      }

      documentsDevis = documentsUploades;
    } else {
      // Si pas de fichier fourni, vérifier si ce fournisseur a déjà des documents uploadés
      // pour d'autres lignes de la même demande
      const ligneAvecDocuments = await prisma.ligneAchat.findFirst({
        where: {
          demandeId: ligne.demandeId,
          fournisseurId,
          documentsDevis: { not: Prisma.DbNull },
        },
        select: { documentsDevis: true },
      });

      if (ligneAvecDocuments?.documentsDevis) {
        // Réutiliser les documents du même fournisseur
        documentsDevis = ligneAvecDocuments.documentsDevis;
      } else {
        // Pas de fichier fourni et pas de documents existants pour ce fournisseur
        throw new Error(
          "Veuillez uploader au moins un document du fournisseur (premier article de ce fournisseur)"
        );
      }
    }

    // Mettre à jour la ligne
    const ligneMAJ = await prisma.ligneAchat.update({
      where: { id: ligneId },
      data: {
        prixUnitaire: prixUnitaireTTC,
        fournisseurId,
        documentsDevis,
      },
    });

    // Logger l'instruction
    await prisma.journalEvenement.create({
      data: {
        entite: "LigneAchat",
        entiteId: ligneId,
        action: "INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          demandeRef: ligne.demande.ref,
          designation: ligne.designation,
          prixUnitaireTTC,
          fournisseurNom: fournisseur.nom,
          nbDocuments: documentsDevis?.length || 0,
        },
      },
    });

    return ligneMAJ;
  }
);

/**
 * Instruire plusieurs lignes d'achat en une seule fois
 * Un seul fournisseur, un seul upload de documents, prix différents par ligne
 */
export const instruireLotLignes = actionProtegee(
  "achat:instruire",
  async (
    session,
    input: {
      ligneIds: string[];
      fournisseurId: string;
      prix: Array<{ ligneId: string; prixUnitaireTTC: number }>;
      fichiers?: Array<{
        name: string;
        type: string;
        size: number;
        base64: string;
      }>;
    }
  ) => {
    const { ligneIds, fournisseurId, prix, fichiers: fichiersBase64 } = input;

    // Vérifications
    if (ligneIds.length === 0) {
      throw new Error("Aucune ligne sélectionnée");
    }

    if (!fournisseurId) {
      throw new Error("Veuillez sélectionner un fournisseur");
    }

    // Vérifier que toutes les lignes ont un prix
    if (prix.length !== ligneIds.length) {
      throw new Error("Tous les articles doivent avoir un prix");
    }

    for (const p of prix) {
      if (p.prixUnitaireTTC <= 0) {
        throw new Error("Tous les prix doivent être supérieurs à zéro");
      }
    }

    // Vérifier le fournisseur
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id: fournisseurId },
    });

    if (!fournisseur) {
      throw new Error("Fournisseur introuvable");
    }

    // Vérifier que toutes les lignes existent et appartiennent à la même demande
    const lignes = await prisma.ligneAchat.findMany({
      where: { id: { in: ligneIds } },
      include: {
        demande: {
          select: { id: true, ref: true },
        },
      },
    });

    if (lignes.length !== ligneIds.length) {
      throw new Error("Certaines lignes sont introuvables");
    }

    const demandeIds = [...new Set(lignes.map((l) => l.demandeId))];
    if (demandeIds.length > 1) {
      throw new Error("Toutes les lignes doivent appartenir à la même demande");
    }

    // Upload des documents (une seule fois pour tout le lot)
    let documentsDevis: any = undefined;

    if (fichiersBase64 && fichiersBase64.length > 0) {
      const documentsUploades = [];

      // Convertir base64 en File
      for (const f of fichiersBase64) {
        const base64Data = f.base64.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([buffer], { type: f.type });
        const file = new File([blob], f.name, { type: f.type });

        // Upload vers Supabase
        const url = await uploadDocumentVersSupabase(
          file,
          session.userId,
          session.email
        );

        documentsUploades.push({
          url,
          nom: f.name,
          taille: f.size,
          type: f.type,
          uploadeLe: new Date().toISOString(),
        });
      }

      documentsDevis = documentsUploades;
    } else {
      throw new Error("Veuillez uploader au moins un document");
    }

    // Mettre à jour toutes les lignes en une transaction
    const updates = ligneIds.map((ligneId) => {
      const prixLigne = prix.find((p) => p.ligneId === ligneId);
      if (!prixLigne) {
        throw new Error(`Prix manquant pour la ligne ${ligneId}`);
      }

      return prisma.ligneAchat.update({
        where: { id: ligneId },
        data: {
          prixUnitaire: prixLigne.prixUnitaireTTC,
          fournisseurId,
          documentsDevis,
        },
      });
    });

    await prisma.$transaction(updates);

    // Créer un événement journal pour chaque ligne
    const journalPromises = lignes.map((ligne) => {
      const prixLigne = prix.find((p) => p.ligneId === ligne.id);
      return prisma.journalEvenement.create({
        data: {
          entite: "LigneAchat",
          entiteId: ligne.id,
          action: "INSTRUCTION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Instruction : ${ligne.designation} - ${prixLigne?.prixUnitaireTTC} FCFA (${fournisseur.nom})`,
          details: {
            fournisseur: fournisseur.nom,
            prixUnitaire: prixLigne?.prixUnitaireTTC,
            documentsCount: documentsDevis?.length || 0,
            instructionLot: true,
            nombreArticles: ligneIds.length,
          },
        },
      });
    });

    await Promise.all(journalPromises);

    return {
      success: true,
      nombreLignes: ligneIds.length,
      fournisseur: fournisseur.nom,
    };
  }
);

// ============================================================================
// CRITÈRES DE SÉLECTION FOURNISSEUR
// ============================================================================

/**
 * Lister tous les critères de sélection actifs
 */
export const listerCriteres = actionProtegee(
  "achat:instruire",
  async (session) => {
    try {
      const criteres = await prisma.critereSelection.findMany({
        where: { actif: true },
        orderBy: { libelle: "asc" },
      });

      return criteres;
    } catch (error: any) {
      console.error("[listerCriteres] Erreur:", error);
      throw new Error(`Impossible de lister les critères: ${error.message}`);
    }
  }
);

/**
 * Créer un nouveau critère de sélection personnalisé
 */
export const creerCritere = actionProtegee(
  "achat:instruire",
  async (session, input: { libelle: string; description?: string }) => {
    const { libelle, description } = input;

    // Vérifier que le libellé n'existe pas déjà
    const existant = await prisma.critereSelection.findUnique({
      where: { libelle },
    });

    if (existant) {
      throw new Error("Un critère avec ce libellé existe déjà");
    }

    const critere = await prisma.critereSelection.create({
      data: {
        libelle,
        description: description || null,
        creePar: session.email,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "CritereSelection",
        entiteId: critere.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Nouveau critère : ${libelle}`,
      },
    });

    return critere;
  }
);

/**
 * Valider l'instruction avec sélection des fournisseurs et critères
 */
export const validerInstructionAvecCriteres = actionProtegee(
  "achat:instruire",
  async (
    session,
    input: {
      demandeId: string;
      selections: Array<{
        ligneId: string;
        fournisseurRetenu: string; // fournisseurId
      }>;
      criteresIds: string[]; // IDs des critères sélectionnés
      commentaire?: string;
    }
  ) => {
    const { demandeId, selections, criteresIds, commentaire } = input;

    // Validations
    if (selections.length === 0) {
      throw new Error("Aucun fournisseur sélectionné");
    }

    if (criteresIds.length === 0) {
      throw new Error("Veuillez sélectionner au moins un critère de sélection");
    }

    // Récupérer la demande
    const demande = await prisma.demandeAchat.findUnique({
      where: { id: demandeId },
      include: {
        lignes: true,
      },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    // Récupérer les critères pour avoir leurs libellés
    const criteres = await prisma.critereSelection.findMany({
      where: { id: { in: criteresIds } },
    });

    const criteresData = criteres.map((c) => ({
      id: c.id,
      libelle: c.libelle,
    }));

    // Récupérer les lignes pour avoir leurs désignations
    const lignesIds = selections.map((s) => s.ligneId);
    const lignesData = await prisma.ligneAchat.findMany({
      where: { id: { in: lignesIds } },
      select: { id: true, designation: true },
    });

    // Mettre à jour chaque ligne avec le fournisseur retenu et les critères
    const updates = selections.map((sel) => {
      return prisma.ligneAchat.update({
        where: { id: sel.ligneId },
        data: {
          fournisseurId: sel.fournisseurRetenu,
          criteres: {
            criteres: criteresData,
            commentaire: commentaire || null,
          },
        },
      });
    });

    await prisma.$transaction(updates);

    // Créer l'événement INSTRUCTION
    await prisma.evenementAchat.create({
      data: {
        demandeId,
        type: "INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          articles: lignesData.map((l) => l.designation),
          criteres: criteresData.map((c) => c.libelle),
          commentaire: commentaire || null,
        },
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demandeId,
        action: "VALIDATION_INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Validation instruction : ${selections.length} article(s), ${criteresData.length} critère(s)`,
        details: {
          refDemande: demande.ref,
          criteres: criteresData,
          commentaire,
        },
      },
    });

    return { success: true, refDemande: demande.ref };
  }
);

/**
 * Valider l'instruction complète d'une demande d'achat
 * Crée un événement INSTRUCTION et passe la demande au statut suivant
 */
export const validerInstructionDemande = actionProtegee(
  "achat:instruire",
  async (session, refDemande: string) => {
    // Récupérer la demande avec ses lignes
    const demande = await prisma.demandeAchat.findUnique({
      where: { ref: refDemande },
      include: {
        lignes: {
          select: {
            id: true,
            designation: true,
            prixUnitaire: true,
            fournisseurId: true,
            documentsDevis: true,
          },
        },
      },
    });

    if (!demande) {
      throw new Error("Demande introuvable");
    }

    // Vérifier que toutes les lignes sont instruites
    const lignesNonInstruites = demande.lignes.filter(
      (ligne) =>
        !ligne.prixUnitaire || !ligne.fournisseurId || !ligne.documentsDevis
    );

    if (lignesNonInstruites.length > 0) {
      throw new Error(
        `${lignesNonInstruites.length} article(s) ne sont pas encore instruits. Tous les articles doivent avoir un prix, un fournisseur et un devis PDF.`
      );
    }

    // Créer l'événement INSTRUCTION
    const evenement = await prisma.evenementAchat.create({
      data: {
        demandeId: demande.id,
        type: "INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          nbLignesInstruites: demande.lignes.length,
          montantTotal: demande.lignes.reduce(
            (sum, ligne) => sum + Number(ligne.prixUnitaire || 0),
            0
          ),
        },
      },
    });

    // Logger la validation
    await prisma.journalEvenement.create({
      data: {
        entite: "DemandeAchat",
        entiteId: demande.id,
        action: "VALIDATION_INSTRUCTION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          demandeRef: demande.ref,
          nbLignes: demande.lignes.length,
          evenementId: evenement.id,
        },
      },
    });

    return evenement;
  }
);
