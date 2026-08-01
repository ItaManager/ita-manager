"use server";

import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";

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
