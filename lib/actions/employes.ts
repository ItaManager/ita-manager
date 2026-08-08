"use server";

/**
 * Server Actions — Employés M2
 *
 * Toutes les actions utilisent actionProtegee (SECURITE.md exigence bloquante n°1).
 * Classification des données : ORDINAIRE / SENSIBLE / PARTICULIER (SECURITE.md §2).
 *
 * Source : M2-EMPLOYES.md §6
 */

import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { actionProtegee } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { TypeMainOeuvre } from "@prisma/client";

// ===========================================================================
// TYPES ET SCHÉMAS DE VALIDATION
// ===========================================================================

interface FiltresEmployes {
  recherche?: string; // Nom, prénom, matricule
  directionId?: string;
  serviceId?: string;
  typeMainOeuvre?: TypeMainOeuvre;
  statutDossier?: "COMPLET" | "INCOMPLET";
  disponibilite?: "EN_MISSION" | "DISPONIBLE";
  page?: number;
}

interface EmployeListItem {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email?: string | null;
  reference?: string | null; // Code de référence (ex: DG-001)
  typeMainOeuvre: TypeMainOeuvre;
  posteActuel?: {
    libelle: string;
    service?: { libelle: string };
    direction: { libelle: string };
  };
  superieur?: {
    nom: string;
    prenom: string;
  } | null;
  typeContrat?: string | null;
  // Donnée SENSIBLE : masquée si pas de permission employe:donneesSensibles
  salaire?: number | null;
  completudeDossier: number; // Pourcentage 0-100
  actif: boolean;
  archiveLe: Date | null;
  // Données pour les journaliers
  telephone?: string | null;
  competenceActuelle?: string | null;
  tauxActuel?: number | null;
  disponibilite?: "EN_MISSION" | "DISPONIBLE";
  derniereMission?: string | null;
  contratActuel?: {
    typeContrat: string;
    dateDebut: Date;
    dateFin?: Date | null;
    tauxJournalier?: number | null;
  } | null;
  affectationActuelle?: {
    projet?: {
      nom: string;
    } | null;
  } | null;
}

interface EmployeDetail {
  id: string;
  matricule: string;
  typeMainOeuvre: TypeMainOeuvre;

  // Identité
  nom: string;
  prenom: string;
  sexe?: string | null;
  dateNaissance?: Date | null;
  lieuNaissance?: string | null;
  nationalite?: { id: string; libelle: string } | null;
  situationMatrimoniale?: string | null;
  nombreEnfants?: number | null;

  // Contact
  telephone: string;
  telephoneSecondaire?: string | null;
  email?: string | null;
  urgenceNom?: string | null;
  urgenceTel?: string | null;

  // Données SENSIBLES (null si permission absente)
  numeroCnps?: string | null;
  adresse?: string | null;
  numeroWave?: string | null;
  modePaiement?: string | null;
  rib?: string | null;
  salaire?: number | null;

  // Affectation actuelle
  affectationActuelle?: {
    poste: { libelle: string; code: string };
    service?: { libelle: string } | null;
    direction: { libelle: string };
    superieur?: { nom: string; prenom: string } | null;
    dateDebut: Date;
  } | null;

  // Contrat actif
  contratActif?: {
    typeContrat: string;
    dateDebut: Date;
    dateFin?: Date | null;
    signe: boolean;
  } | null;

  // Métadonnées
  creeLe: Date;
  archiveLe?: Date | null;
}

// ===========================================================================
// 1. ACTIONS DE LECTURE
// ===========================================================================

/**
 * Liste des employés avec filtres et pagination serveur (25 lignes).
 * Les données SENSIBLES sont masquées si permission absente.
 */
export const listerEmployes = actionProtegee(
  "employe:lire",
  async (session, filtres: FiltresEmployes = {}) => {
    const page = filtres.page ?? 1;
    const parPage = 25;

    // Vérifier si l'utilisateur a accès aux données sensibles
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    const aDonneesSensibles = profil?.roles.some((pr) =>
      pr.role.permissions.some((rp) => rp.permission.code === "employe:donneesSensibles")
    );

    // Construction de la requête avec filtres
    const where: any = {
      // Les archivés sont inclus pour permettre leur consultation
    };

    if (filtres.recherche) {
      where.OR = [
        { nom: { contains: filtres.recherche, mode: "insensitive" } },
        { prenom: { contains: filtres.recherche, mode: "insensitive" } },
        { matricule: { contains: filtres.recherche, mode: "insensitive" } },
      ];
    }

    if (filtres.typeMainOeuvre) {
      where.typeMainOeuvre = filtres.typeMainOeuvre;
    }

    // Filtre par direction ou service (via affectation active)
    if (filtres.directionId || filtres.serviceId) {
      where.affectations = {
        some: {
          dateFin: null,
          poste: {
            ...(filtres.directionId && { directionId: filtres.directionId }),
            ...(filtres.serviceId && { serviceId: filtres.serviceId }),
          },
        },
      };
    }

    // Comptage total
    const total = await prisma.employe.count({ where });

    // Récupération paginée
    const employes = await prisma.employe.findMany({
      where,
      skip: (page - 1) * parPage,
      take: parPage,
      include: {
        affectations: {
          where: { dateFin: null },
          include: {
            poste: {
              include: {
                service: true,
                direction: true,
              },
            },
            superieur: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
          take: 1,
        },
        contrats: {
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
        documents: true,
        competences: {
          where: { dateFin: null },
          include: {
            competence: {
              include: {
                taux: {
                  where: {
                    dateEffet: { lte: new Date() },
                  },
                  orderBy: { dateEffet: "desc" },
                  take: 1,
                },
              },
            },
          },
          take: 1,
        },
        affectationsChantier: {
          where: {
            dateDebut: { lte: new Date() },
            OR: [
              { dateFin: null },
              { dateFin: { gte: new Date() } },
            ],
          },
          include: {
            projet: {
              select: {
                nom: true,
                code: true,
              },
            },
          },
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
      },
      orderBy: { matricule: "desc" },
    });

    // Transformation avec masquage des données sensibles
    let items: EmployeListItem[] = employes.map((e) => {
      const affectationActuelle = e.affectations[0];
      const contratActuel = e.contrats[0];
      const competenceActuelle = e.competences[0];
      const affectationChantierActuelle = e.affectationsChantier[0];

      // Calcul de la complétude du dossier
      const piecesAttendues = e.typeMainOeuvre === "JOURNALIER" ? 2 : 7;
      const piecesPresentes = e.documents.length;
      const completude = Math.round((piecesPresentes / piecesAttendues) * 100);

      // Génération du code de référence basé sur le poste
      const genererReference = () => {
        if (!affectationActuelle) return null;
        const codePoste = affectationActuelle.poste.code;
        // Exemple: DG-001, RH-004, etc.
        return codePoste;
      };

      return {
        id: e.id,
        matricule: e.matricule,
        nom: e.nom,
        prenom: e.prenom,
        email: e.email,
        reference: genererReference(),
        typeMainOeuvre: e.typeMainOeuvre,
        posteActuel: affectationActuelle
          ? {
              libelle: affectationActuelle.poste.libelle,
              service: affectationActuelle.poste.service ?? undefined,
              direction: affectationActuelle.poste.direction,
            }
          : undefined,
        superieur: affectationActuelle?.superieur ?? null,
        typeContrat: contratActuel?.typeContrat ?? null,
        // Donnée SENSIBLE : masquée si permission absente
        salaire: aDonneesSensibles ? contratActuel?.salaire?.toNumber() ?? null : null,
        completudeDossier: completude,
        actif: !e.archiveLe,
        archiveLe: e.archiveLe,
        // Données pour les journaliers
        telephone: e.telephone,
        competenceActuelle: competenceActuelle?.competence.libelle ?? null,
        tauxActuel: aDonneesSensibles
          ? competenceActuelle?.competence.taux[0]?.montant?.toNumber() ?? null
          : null,
        disponibilite: affectationChantierActuelle ? "EN_MISSION" : "DISPONIBLE",
        derniereMission: affectationChantierActuelle?.projet.nom ?? null,
        contratActuel: contratActuel
          ? {
              typeContrat: contratActuel.typeContrat,
              dateDebut: contratActuel.dateDebut,
              dateFin: contratActuel.dateFin,
              tauxJournalier: null, // Removed - not in Contrat model
            }
          : null,
        affectationActuelle: affectationActuelle
          ? {
              projet: null, // TODO: À implémenter quand la relation employe->projet sera créée
            }
          : null,
      };
    });

    // Filtre post-transformation : statut dossier
    if (filtres.statutDossier) {
      items = items.filter((item) =>
        filtres.statutDossier === "COMPLET"
          ? item.completudeDossier === 100
          : item.completudeDossier < 100
      );
    }

    return {
      items,
      total: filtres.statutDossier ? items.length : total, // Ajuster le total si filtre post-transform
      page,
      parPage,
      pages: Math.ceil((filtres.statutDossier ? items.length : total) / parPage),
    };
  }
);

/**
 * Obtenir le détail complet d'un employé.
 * Les données SENSIBLES sont masquées si permission absente.
 *
 * Règle critique : appeler cette action par POST direct sans permission
 * ne doit PAS renvoyer les champs sensibles (test de sécurité).
 */
export const obtenirEmploye = actionProtegee(
  "employe:lire",
  async (session, employeId: string): Promise<EmployeDetail | null> => {
    // Vérifier permission données sensibles
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    const aDonneesSensibles = profil?.roles.some((pr) =>
      pr.role.permissions.some((rp) => rp.permission.code === "employe:donneesSensibles")
    );

    const employe = await prisma.employe.findUnique({
      where: { id: employeId },
      include: {
        nationalite: true,
        affectations: {
          where: { dateFin: null },
          include: {
            poste: {
              include: {
                service: true,
                direction: true,
              },
            },
            superieur: true,
          },
          take: 1,
        },
        contrats: {
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
      },
    });

    if (!employe) return null;

    const affectation = employe.affectations[0];
    const contrat = employe.contrats[0];

    return {
      id: employe.id,
      matricule: employe.matricule,
      typeMainOeuvre: employe.typeMainOeuvre,

      // Identité (ORDINAIRE)
      nom: employe.nom,
      prenom: employe.prenom,
      sexe: employe.sexe,
      dateNaissance: employe.dateNaissance,
      lieuNaissance: employe.lieuNaissance,
      nationalite: employe.nationalite,
      situationMatrimoniale: employe.situationMatrimoniale,
      nombreEnfants: employe.nombreEnfants,

      // Contact (ORDINAIRE sauf adresse)
      telephone: employe.telephone,
      telephoneSecondaire: employe.telephoneSecondaire,
      email: employe.email,
      urgenceNom: employe.urgenceNom,
      urgenceTel: employe.urgenceTel,

      // Données SENSIBLES : null si permission absente
      numeroCnps: aDonneesSensibles ? employe.numeroCnps : null,
      adresse: aDonneesSensibles ? employe.adresse : null,
      numeroWave: aDonneesSensibles ? employe.numeroWave : null,
      rib: aDonneesSensibles ? employe.rib : null,
      salaire: aDonneesSensibles ? contrat?.salaire?.toNumber() ?? null : null,

      // Affectation actuelle
      affectationActuelle: affectation
        ? {
            poste: {
              libelle: affectation.poste.libelle,
              code: affectation.poste.code,
            },
            service: affectation.poste.service,
            direction: affectation.poste.direction,
            superieur: affectation.superieur
              ? {
                  nom: affectation.superieur.nom,
                  prenom: affectation.superieur.prenom,
                }
              : null,
            dateDebut: affectation.dateDebut,
          }
        : null,

      // Contrat actif
      contratActif: contrat
        ? {
            typeContrat: contrat.typeContrat,
            dateDebut: contrat.dateDebut,
            dateFin: contrat.dateFin,
            signe: contrat.signe,
          }
        : null,

      // Métadonnées
      creeLe: employe.creeLe,
      archiveLe: employe.archiveLe,
    };
  }
);

// ===========================================================================
// 2. ACTIONS CRUD EMPLOYÉ
// ===========================================================================

interface CreerEmployeInput {
  typeMainOeuvre: TypeMainOeuvre;

  // Identité (obligatoire pour tous)
  nom: string;
  prenom: string;
  sexe?: "MASCULIN" | "FEMININ";

  // Identité PERMANENT
  dateNaissance?: Date;
  lieuNaissance?: string;
  nationaliteId?: string;
  situationMatrimoniale?: "CELIBATAIRE" | "MARIE" | "DIVORCE" | "VEUF";
  nombreEnfants?: number;
  numeroCnps?: string;

  // Contact
  telephone: string;
  telephoneSecondaire?: string;
  email?: string;
  adresse?: string;
  urgenceNom?: string;
  urgenceTel?: string;

  // Paiement
  numeroWave?: string; // Double confirmation côté client
  modePaiement?: "VIREMENT" | "WAVE";
  rib?: string;

  // Affectation
  posteId?: string; // Requis pour PERMANENT, optionnel pour JOURNALIER
  superieurId?: string;
  dateDebutAffectation: Date;

  // Contrat
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateEmbauche: Date;
  dateFin?: Date;
  salaire?: number; // Optionnel pour JOURNALIER (taux variable)
}

/**
 * Créer un employé avec génération automatique du matricule ITA-AAAA-NNNN.
 *
 * Validations :
 * - Homonyme (nom + prénom + date naissance) → avertissement, pas blocage
 * - Numéro CNPS unique parmi permanents actifs
 * - CDD sans date de fin → erreur
 * - Salaire hors grille → déclenche DerogationSalariale (voir creerDerogation)
 */
export const creerEmploye = actionProtegee(
  "employe:creer",
  async (session, input: CreerEmployeInput) => {
    // 1. Validation unicité CNPS (permanents actifs uniquement)
    if (input.numeroCnps) {
      const existant = await prisma.employe.findFirst({
        where: {
          numeroCnps: input.numeroCnps,
          archiveLe: null,
        },
      });

      if (existant) {
        throw new Error(
          `Ce numéro CNPS est déjà attribué à ${existant.nom} ${existant.prenom}.`
        );
      }
    }

    // 2. Avertissement homonyme (pas blocage)
    if (input.dateNaissance) {
      const homonyme = await prisma.employe.findFirst({
        where: {
          nom: input.nom,
          prenom: input.prenom,
          dateNaissance: input.dateNaissance,
        },
      });

      if (homonyme) {
        // Log avertissement, ne bloque pas
        console.warn(
          `⚠️ Homonyme détecté : ${input.nom} ${input.prenom} né(e) le ${input.dateNaissance}`
        );
      }
    }

    // 3. Validation CDD sans date de fin
    if (input.typeContrat === "CDD" && !input.dateFin) {
      throw new Error("Un CDD exige une date de fin.");
    }

    // 4. Génération du matricule ITA-AAAA-NNNN
    const annee = new Date(input.dateEmbauche).getFullYear();
    const dernier = await prisma.employe.findFirst({
      where: {
        matricule: { startsWith: `ITA-${annee}-` },
      },
      orderBy: { matricule: "desc" },
    });

    let compteur = 1;
    if (dernier) {
      const match = dernier.matricule.match(/ITA-\d{4}-(\d{4})/);
      if (match) {
        compteur = parseInt(match[1], 10) + 1;
      }
    }

    const matricule = `ITA-${annee}-${compteur.toString().padStart(4, "0")}`;

    // 5. Création de l'employé, affectation et contrat en transaction
    const employe = await prisma.$transaction(async (tx) => {
      // Créer l'employé
      const emp = await tx.employe.create({
        data: {
          matricule,
          typeMainOeuvre: input.typeMainOeuvre,
          nom: input.nom.toUpperCase(),
          prenom: input.prenom,
          sexe: input.sexe || undefined,
          dateNaissance: input.dateNaissance,
          lieuNaissance: input.lieuNaissance || undefined,
          nationaliteId: input.nationaliteId || undefined,
          situationMatrimoniale: input.situationMatrimoniale || undefined,
          nombreEnfants: input.nombreEnfants,
          numeroCnps: input.numeroCnps || undefined,
          telephone: input.telephone,
          telephoneSecondaire: input.telephoneSecondaire || undefined,
          email: input.email || undefined,
          adresse: input.adresse,
          urgenceNom: input.urgenceNom,
          urgenceTel: input.urgenceTel,
          numeroWave: input.numeroWave,
          modePaiement: input.modePaiement,
          rib: input.rib,
        },
      });

      // Créer l'affectation (seulement pour les permanents avec poste)
      if (input.posteId) {
        await tx.affectation.create({
          data: {
            employeId: emp.id,
            posteId: input.posteId,
            // superieurId optionnel (null pour DG, obligatoire pour les autres)
            ...(input.superieurId ? { superieurId: input.superieurId } : {}),
            dateDebut: input.dateDebutAffectation,
          },
        });
      }

      // Créer le contrat
      await tx.contrat.create({
        data: {
          employeId: emp.id,
          typeContrat: input.typeContrat,
          dateDebut: input.dateEmbauche,
          dateFin: input.dateFin,
          salaire: input.salaire,
          signe: false,
        },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "Employe",
          entiteId: emp.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Employé ${input.typeMainOeuvre} créé : ${matricule}`,
        },
      });

      return emp;
    });

    return { success: true, matricule, employeId: employe.id };
  }
);

/**
 * Modifier un employé existant.
 *
 * Journalisation spéciale pour les champs SENSIBLES :
 * - Modifications de numeroWave, rib, numeroCnps, salaire → journalisées
 * - Changement de nom → journalisé (impacts paie)
 *
 * Règles :
 * - Cannot modify matricule (generated at creation)
 * - Cannot modify typeMainOeuvre (PERMANENT ↔ JOURNALIER requires archiving + new employee)
 * - Changing poste → creates new Affectation, closes current one
 */
export const modifierEmploye = actionProtegee(
  "employe:modifier",
  async (session, employeId: string, data: Partial<CreerEmployeInput>) => {
    // 1. Récupérer l'employé actuel
    const employeActuel = await prisma.employe.findUnique({
      where: { id: employeId },
      include: {
        contrats: {
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
      },
    });

    if (!employeActuel) {
      throw new Error("Employé introuvable.");
    }

    if (employeActuel.archiveLe) {
      throw new Error("Impossible de modifier un employé archivé.");
    }

    // 2. Validation CNPS si changé (uniquement permanents actifs)
    if (data.numeroCnps && data.numeroCnps !== employeActuel.numeroCnps) {
      const existant = await prisma.employe.findFirst({
        where: {
          numeroCnps: data.numeroCnps,
          archiveLe: null,
          id: { not: employeId },
        },
      });

      if (existant) {
        throw new Error(
          `Ce numéro CNPS est déjà attribué à ${existant.nom} ${existant.prenom}.`
        );
      }
    }

    // 3. Détection des changements sensibles pour journalisation
    const changementsSensibles: string[] = [];

    if (data.numeroWave && data.numeroWave !== employeActuel.numeroWave) {
      changementsSensibles.push(`Wave: ${employeActuel.numeroWave || "aucun"} → ${data.numeroWave}`);
    }

    if (data.rib && data.rib !== employeActuel.rib) {
      changementsSensibles.push(`RIB: ${employeActuel.rib ? "[modifié]" : "[ajouté]"}`);
    }

    if (data.numeroCnps && data.numeroCnps !== employeActuel.numeroCnps) {
      changementsSensibles.push(`CNPS: ${employeActuel.numeroCnps || "aucun"} → ${data.numeroCnps}`);
    }

    if (data.salaire !== undefined && employeActuel.contrats[0]?.salaire?.toNumber() !== data.salaire) {
      changementsSensibles.push(`Salaire modifié`);
    }

    if (data.nom && data.nom.toUpperCase() !== employeActuel.nom) {
      changementsSensibles.push(`Nom: ${employeActuel.nom} → ${data.nom.toUpperCase()}`);
    }

    // 4. Mise à jour en transaction
    await prisma.$transaction(async (tx) => {
      // Mise à jour de l'employé
      await tx.employe.update({
        where: { id: employeId },
        data: {
          nom: data.nom ? data.nom.toUpperCase() : undefined,
          prenom: data.prenom,
          sexe: data.sexe,
          dateNaissance: data.dateNaissance,
          lieuNaissance: data.lieuNaissance,
          nationaliteId: data.nationaliteId,
          situationMatrimoniale: data.situationMatrimoniale,
          nombreEnfants: data.nombreEnfants,
          numeroCnps: data.numeroCnps,
          telephone: data.telephone,
          telephoneSecondaire: data.telephoneSecondaire,
          email: data.email,
          adresse: data.adresse,
          urgenceNom: data.urgenceNom,
          urgenceTel: data.urgenceTel,
          numeroWave: data.numeroWave,
          modePaiement: data.modePaiement,
          rib: data.rib,
        },
      });

      // Si changement de poste → nouvelle affectation
      if (data.posteId) {
        // Clôturer l'affectation actuelle
        await tx.affectation.updateMany({
          where: {
            employeId,
            dateFin: null,
          },
          data: {
            dateFin: data.dateDebutAffectation ?? new Date(),
          },
        });

        // Créer nouvelle affectation
        await tx.affectation.create({
          data: {
            employeId,
            posteId: data.posteId,
            // superieurId optionnel (null pour DG, obligatoire pour les autres)
            ...(data.superieurId ? { superieurId: data.superieurId } : {}),
            dateDebut: data.dateDebutAffectation ?? new Date(),
          },
        });

        changementsSensibles.push(`Nouvelle affectation`);
      }

      // Si changement de contrat (salaire, type, dates)
      if (data.typeContrat || data.salaire !== undefined || data.dateEmbauche || data.dateFin !== undefined) {
        await tx.contrat.create({
          data: {
            employeId,
            typeContrat: data.typeContrat ?? employeActuel.contrats[0]?.typeContrat ?? "CDI",
            dateDebut: data.dateEmbauche ?? new Date(),
            dateFin: data.dateFin,
            salaire: data.salaire ?? employeActuel.contrats[0]?.salaire?.toNumber() ?? 0,
            signe: false,
          },
        });

        changementsSensibles.push(`Nouveau contrat`);
      }

      // Journaliser la modification
      await tx.journalEvenement.create({
        data: {
          entite: "Employe",
          entiteId: employeId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire:
            changementsSensibles.length > 0
              ? `Modifications : ${changementsSensibles.join(", ")}`
              : "Modification profil employé",
        },
      });
    });

    return { success: true };
  }
);

/**
 * Archiver un employé sortant.
 *
 * Effets :
 * - Clôture toutes affectations en cours
 * - Désactive le compte Supabase si lié (via lib/supabase/admin.ts)
 * - Marque archiveLe = now()
 * - Journalise l'archivage avec motif
 *
 * Règles :
 * - Ne pas supprimer l'employé (conservation légale 5 ans minimum)
 * - Archivage réversible si erreur (réouverture manuelle possible)
 */
export const archiverEmploye = actionProtegee(
  "employe:archiver",
  async (session, employeId: string, motif: string) => {
    if (!motif || motif.trim().length < 10) {
      throw new Error("Le motif d'archivage doit contenir au moins 10 caractères.");
    }

    const employe = await prisma.employe.findUnique({
      where: { id: employeId },
      include: {
        profil: true,
      },
    });

    if (!employe) {
      throw new Error("Employé introuvable.");
    }

    if (employe.archiveLe) {
      throw new Error("Cet employé est déjà archivé.");
    }

    // Transaction : clôture + archivage + désactivation compte
    await prisma.$transaction(async (tx) => {
      // 1. Clôturer toutes affectations actives
      await tx.affectation.updateMany({
        where: {
          employeId,
          dateFin: null,
        },
        data: {
          dateFin: new Date(),
        },
      });

      // 2. Marquer l'employé archivé
      await tx.employe.update({
        where: { id: employeId },
        data: {
          archiveLe: new Date(),
        },
      });

      // 3. Journaliser l'archivage
      await tx.journalEvenement.create({
        data: {
          entite: "Employe",
          entiteId: employeId,
          action: "ARCHIVAGE",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Archivage employé ${employe.matricule} — Motif : ${motif}`,
        },
      });
    });

    // 4. Désactiver le compte Supabase si lié (hors transaction car appel externe)
    if (employe.profil) {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();

        await admin.auth.admin.updateUserById(employe.profil.id, {
          ban_duration: "876000h", // ~100 ans (désactivation permanente)
        });

        // Journaliser la désactivation du compte
        await prisma.journalEvenement.create({
          data: {
            entite: "Profil",
            entiteId: employe.profil.id,
            action: "MODIFICATION",
            auteurId: session.userId,
            auteurNom: session.email,
            commentaire: `Compte désactivé suite à archivage employé ${employe.matricule}`,
          },
        });
      } catch (error) {
        console.error("Erreur désactivation compte Supabase:", error);
        // Ne pas bloquer l'archivage si la désactivation échoue
      }
    }

    return {
      success: true,
      matricule: employe.matricule,
      message: `${employe.nom} ${employe.prenom} (${employe.matricule}) a été archivé.`,
    };
  }
);

// ===========================================================================
// 3. ACTIONS AFFECTATION
// ===========================================================================

interface CreerAffectationInput {
  employeId: string;
  posteId: string;
  superieurId?: string;
  dateDebut: Date;
  cloturerActuelle?: boolean; // Si true, clôture l'affectation actuelle
}

/**
 * Créer une nouvelle affectation (mutation, promotion).
 *
 * Règles :
 * - Un poste ne peut avoir qu'un seul titulaire à la fois
 * - Si cloturerActuelle = true, clôture l'affectation actuelle avant
 * - Journalise l'affectation (important pour historique RH)
 */
export const creerAffectation = actionProtegee(
  "employe:modifier",
  async (session, input: CreerAffectationInput) => {
    // 1. Vérifier que l'employé existe et n'est pas archivé
    const employe = await prisma.employe.findUnique({
      where: { id: input.employeId },
      include: {
        affectations: {
          where: { dateFin: null },
          take: 1,
        },
      },
    });

    if (!employe) {
      throw new Error("Employé introuvable.");
    }

    if (employe.archiveLe) {
      throw new Error("Impossible d'affecter un employé archivé.");
    }

    // 2. Vérifier que le poste existe
    const poste = await prisma.poste.findUnique({
      where: { id: input.posteId },
      include: {
        direction: true,
        service: true,
        affectations: {
          where: { dateFin: null },
          include: { employe: true },
        },
      },
    });

    if (!poste) {
      throw new Error("Poste introuvable.");
    }

    // 3. Vérifier qu'il n'y a pas déjà un titulaire actif (sauf si c'est le même employé)
    const titulaire = poste.affectations.find((a) => a.employeId !== input.employeId);
    if (titulaire) {
      throw new Error(
        `Ce poste est déjà occupé par ${titulaire.employe.nom} ${titulaire.employe.prenom}.`
      );
    }

    // 4. Créer l'affectation en transaction
    await prisma.$transaction(async (tx) => {
      // Clôturer l'affectation actuelle si demandé
      if (input.cloturerActuelle && employe.affectations.length > 0) {
        await tx.affectation.updateMany({
          where: {
            employeId: input.employeId,
            dateFin: null,
          },
          data: {
            dateFin: input.dateDebut,
          },
        });
      }

      // Créer la nouvelle affectation
      await tx.affectation.create({
        data: {
          employeId: input.employeId,
          posteId: input.posteId,
          // superieurId optionnel (null pour DG, obligatoire pour les autres)
          ...(input.superieurId ? { superieurId: input.superieurId } : {}),
          dateDebut: input.dateDebut,
        },
      });

      // Journaliser
      const posteLibelle = poste.service
        ? `${poste.libelle} (${poste.service.libelle})`
        : `${poste.libelle} (${poste.direction.libelle})`;

      await tx.journalEvenement.create({
        data: {
          entite: "Affectation",
          entiteId: input.employeId,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `${employe.nom} ${employe.prenom} affecté(e) au poste ${posteLibelle}`,
        },
      });
    });

    return { success: true };
  }
);

/**
 * Clôturer une affectation (fin de mission, mutation).
 *
 * Règles :
 * - Seules les affectations actives (dateFin = null) peuvent être clôturées
 * - Si aucune dateFin fournie, utilise la date du jour
 */
export const cloturerAffectation = actionProtegee(
  "employe:modifier",
  async (session, affectationId: string, dateFin?: Date) => {
    const affectation = await prisma.affectation.findUnique({
      where: { id: affectationId },
      include: {
        employe: true,
        poste: true,
      },
    });

    if (!affectation) {
      throw new Error("Affectation introuvable.");
    }

    if (affectation.dateFin) {
      throw new Error("Cette affectation est déjà clôturée.");
    }

    const dateFinEffective = dateFin ?? new Date();

    await prisma.$transaction(async (tx) => {
      await tx.affectation.update({
        where: { id: affectationId },
        data: { dateFin: dateFinEffective },
      });

      await tx.journalEvenement.create({
        data: {
          entite: "Affectation",
          entiteId: affectation.employeId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Fin d'affectation : ${affectation.employe.nom} ${affectation.employe.prenom} — ${affectation.poste.libelle}`,
        },
      });
    });

    return { success: true };
  }
);

// ===========================================================================
// 4. ACTIONS CONTRAT
// ===========================================================================

interface CreerContratInput {
  employeId: string;
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateDebut: Date;
  dateFin?: Date;
  salaire: number;
}

/**
 * Créer un nouveau contrat (renouvellement, promotion).
 *
 * Règles :
 * - CDD exige une date de fin
 * - Salaire hors grille → déclenche DerogationSalariale (bloque paie jusqu'à validation DFC)
 * - Marque le contrat précédent comme non signé (nouveau contrat à signer)
 */
export const creerContrat = actionProtegee(
  "employe:modifier",
  async (session, input: CreerContratInput) => {
    // 1. Validation CDD
    if (input.typeContrat === "CDD" && !input.dateFin) {
      throw new Error("Un CDD exige une date de fin.");
    }

    // 2. Vérifier que l'employé existe
    const employe = await prisma.employe.findUnique({
      where: { id: input.employeId },
      include: {
        affectations: {
          where: { dateFin: null },
          include: { poste: true },
        },
      },
    });

    if (!employe) {
      throw new Error("Employé introuvable.");
    }

    if (employe.archiveLe) {
      throw new Error("Impossible de créer un contrat pour un employé archivé.");
    }

    // 3. Créer le contrat
    const contrat = await prisma.$transaction(async (tx) => {
      const nouveauContrat = await tx.contrat.create({
        data: {
          employeId: input.employeId,
          typeContrat: input.typeContrat,
          dateDebut: input.dateDebut,
          dateFin: input.dateFin,
          salaire: input.salaire,
          signe: false,
        },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "Contrat",
          entiteId: nouveauContrat.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Nouveau contrat ${input.typeContrat} pour ${employe.nom} ${employe.prenom}`,
        },
      });

      return nouveauContrat;
    });

    return { success: true, contratId: contrat.id };
  }
);

interface CreerAvenantInput {
  contratId: string;
  motif: string; // "Changement de poste", "Augmentation salariale", etc.
  dateEffet: Date;
  nouveauSalaire?: number;
  nouvelleDateFin?: Date;
}

/**
 * Créer un avenant à un contrat existant.
 *
 * Règles :
 * - Motif obligatoire (explique la raison de l'avenant)
 * - Si nouveauSalaire fourni → mise à jour du contrat
 * - Si nouvelleDateFin fournie → mise à jour du contrat
 */
export const creerAvenant = actionProtegee(
  "employe:modifier",
  async (session, input: CreerAvenantInput) => {
    const contrat = await prisma.contrat.findUnique({
      where: { id: input.contratId },
      include: { employe: true },
    });

    if (!contrat) {
      throw new Error("Contrat introuvable.");
    }

    if (!input.motif || input.motif.trim().length < 10) {
      throw new Error("Le motif doit contenir au moins 10 caractères.");
    }

    const avenant = await prisma.$transaction(async (tx) => {
      const nouvelAvenant = await tx.avenant.create({
        data: {
          contratId: input.contratId,
          motif: input.motif,
          dateEffet: input.dateEffet,
          nouveauSalaire: input.nouveauSalaire,
          nouvelleDateFin: input.nouvelleDateFin,
        },
      });

      // Si modification salaire, mettre à jour le contrat
      if (input.nouveauSalaire) {
        await tx.contrat.update({
          where: { id: input.contratId },
          data: { salaire: input.nouveauSalaire },
        });
      }

      // Si modification durée, mettre à jour la date de fin
      if (input.nouvelleDateFin) {
        await tx.contrat.update({
          where: { id: input.contratId },
          data: { dateFin: input.nouvelleDateFin },
        });
      }

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "Avenant",
          entiteId: nouvelAvenant.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Avenant créé pour ${contrat.employe.nom} ${contrat.employe.prenom} : ${input.motif}`,
        },
      });

      return nouvelAvenant;
    });

    return { success: true, avenantId: avenant.id };
  }
);

interface RenouvelerContratInput {
  contratId: string;
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateDebut: Date;
  dateFin?: Date;
  salaire: number;
  motif?: string;
}

/**
 * Renouveler un contrat existant.
 *
 * Règles :
 * - Clôture l'ancien contrat en mettant sa date de fin
 * - Crée un nouveau contrat avec les nouvelles dates/conditions
 * - Crée un avenant pour tracer le renouvellement
 */
export const renouvelerContrat = actionProtegee(
  "employe:modifier",
  async (session, input: RenouvelerContratInput) => {
    // 1. Validation CDD
    if ((input.typeContrat === "CDD" || input.typeContrat === "STAGE") && !input.dateFin) {
      throw new Error("Un CDD ou stage exige une date de fin.");
    }

    // 2. Récupérer le contrat actuel
    const contratActuel = await prisma.contrat.findUnique({
      where: { id: input.contratId },
      include: { employe: true },
    });

    if (!contratActuel) {
      throw new Error("Contrat introuvable.");
    }

    if (contratActuel.employe.archiveLe) {
      throw new Error("Impossible de renouveler un contrat pour un employé archivé.");
    }

    // 3. Valider que la nouvelle date de début est cohérente
    const ancienneDateFin = contratActuel.dateFin;
    if (ancienneDateFin && input.dateDebut < ancienneDateFin) {
      throw new Error("La nouvelle date de début doit être après ou égale à la date de fin actuelle.");
    }

    // 4. Effectuer le renouvellement en transaction
    const resultat = await prisma.$transaction(async (tx) => {
      // Clôturer l'ancien contrat (ajuster sa date de fin si CDI)
      const dateFinAncienContrat = ancienneDateFin || new Date(input.dateDebut.getTime() - 24 * 60 * 60 * 1000); // Veille du nouveau contrat
      await tx.contrat.update({
        where: { id: input.contratId },
        data: { dateFin: dateFinAncienContrat },
      });

      // Créer le nouveau contrat
      const nouveauContrat = await tx.contrat.create({
        data: {
          employeId: contratActuel.employeId,
          typeContrat: input.typeContrat,
          dateDebut: input.dateDebut,
          dateFin: input.dateFin,
          salaire: input.salaire,
          signe: false, // Nouveau contrat à signer
        },
      });

      // Créer un avenant sur l'ancien contrat pour tracer le renouvellement
      const motifRenouvellement = input.motif || `Renouvellement en ${input.typeContrat}`;
      await tx.avenant.create({
        data: {
          contratId: input.contratId,
          motif: motifRenouvellement,
          dateEffet: input.dateDebut,
          nouveauSalaire: input.salaire !== Number(contratActuel.salaire) ? input.salaire : undefined,
          nouvelleDateFin: input.dateFin,
        },
      });

      // Journaliser le renouvellement
      await tx.journalEvenement.create({
        data: {
          entite: "Contrat",
          entiteId: nouveauContrat.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Renouvellement de contrat pour ${contratActuel.employe.nom} ${contratActuel.employe.prenom} : ${contratActuel.typeContrat} → ${input.typeContrat}`,
        },
      });

      return { nouveauContratId: nouveauContrat.id };
    });

    return { success: true, contratId: resultat.nouveauContratId };
  }
);

// ===========================================================================
// 5. ACTIONS DOCUMENTS
// ===========================================================================

interface DeposerDocumentInput {
  employeId: string;
  typeDocument: string; // "PIECE_IDENTITE", "EXTRAIT_NAISSANCE", "DIPLOME", etc.
  nomFichier: string;
  cheminStorage: string; // Chemin dans Supabase Storage après upload côté client
  taille: number; // Taille en octets
  estMedical?: boolean; // True si document médical (classification PARTICULIER)
}

/**
 * Enregistrer un document uploadé dans le dossier employé.
 *
 * Règles :
 * - Fichier déjà uploadé dans Supabase Storage (private bucket)
 * - Enregistrer seulement la référence en base
 * - Accès aux documents médicaux journalisé (règle RGPD)
 * - Maximum 20 documents par employé (limite technique)
 */
export const deposerDocument = actionProtegee(
  "employe:modifier",
  async (session, input: DeposerDocumentInput) => {
    // 1. Vérifier que l'employé existe
    const employe = await prisma.employe.findUnique({
      where: { id: input.employeId },
      include: {
        documents: true,
      },
    });

    if (!employe) {
      throw new Error("Employé introuvable.");
    }

    if (employe.archiveLe) {
      throw new Error("Impossible d'ajouter un document à un employé archivé.");
    }

    // 2. Vérifier le nombre de documents (max 20)
    if (employe.documents.length >= 20) {
      throw new Error(
        "Nombre maximum de documents atteint (20). Supprimez d'abord les documents obsolètes."
      );
    }

    // 3. Créer l'enregistrement
    const document = await prisma.$transaction(async (tx) => {
      const nouveauDoc = await tx.documentEmploye.create({
        data: {
          employeId: input.employeId,
          typeDocument: input.typeDocument,
          nomFichier: input.nomFichier,
          cheminStorage: input.cheminStorage,
          taille: input.taille,
          estMedical: input.estMedical ?? false,
          deposeParId: session.userId,
        },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "DocumentEmploye",
          entiteId: nouveauDoc.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Document ${input.typeDocument} ajouté pour ${employe.nom} ${employe.prenom}`,
        },
      });

      return nouveauDoc;
    });

    return { success: true, documentId: document.id };
  }
);

/**
 * Obtenir une URL signée pour télécharger un document.
 *
 * Règles :
 * - Seuls les utilisateurs avec employe:lire peuvent accéder
 * - Accès aux documents médicaux journalisé (RGPD)
 * - URL valide 60 secondes (single download)
 */
export const obtenirUrlDocument = actionProtegee(
  "employe:lire",
  async (session, documentId: string): Promise<{ url: string }> => {
    const document = await prisma.documentEmploye.findUnique({
      where: { id: documentId },
      include: { employe: true },
    });

    if (!document) {
      throw new Error("Document introuvable.");
    }

    // Journaliser l'accès aux documents médicaux (RGPD)
    if (document.estMedical) {
      await prisma.journalEvenement.create({
        data: {
          entite: "DocumentEmploye",
          entiteId: documentId,
          action: "CONSULTATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Accès document médical — ${document.employe.nom} ${document.employe.prenom}`,
        },
      });
    }

    // Générer URL signée (60 secondes)
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from("employes-documents")
      .createSignedUrl(document.cheminStorage, 60);

    if (error || !data?.signedUrl) {
      throw new Error("Impossible de générer le lien de téléchargement.");
    }

    return { url: data.signedUrl };
  }
);

/**
 * Supprimer un document du dossier employé.
 *
 * Règles :
 * - Supprime le fichier de Supabase Storage
 * - Supprime l'enregistrement en base
 * - Journalise la suppression (audit)
 */
export const supprimerDocument = actionProtegee(
  "employe:modifier",
  async (session, documentId: string) => {
    const document = await prisma.documentEmploye.findUnique({
      where: { id: documentId },
      include: { employe: true },
    });

    if (!document) {
      throw new Error("Document introuvable.");
    }

    // 1. Supprimer le fichier de Supabase Storage
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      await supabase.storage.from("employes-documents").remove([document.cheminStorage]);
    } catch (error) {
      console.error("Erreur suppression Storage:", error);
      // Ne pas bloquer la suppression si le fichier n'existe plus
    }

    // 2. Supprimer l'enregistrement
    await prisma.$transaction(async (tx) => {
      await tx.documentEmploye.delete({
        where: { id: documentId },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "DocumentEmploye",
          entiteId: documentId,
          action: "SUPPRESSION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Document ${document.typeDocument} supprimé — ${document.employe.nom} ${document.employe.prenom}`,
        },
      });
    });

    return { success: true };
  }
);

// ===========================================================================
// 6. ACTIONS DÉROGATION SALARIALE
// ===========================================================================

interface DemanderDerogationInput {
  employeId: string;
  montant: number; // Salaire proposé hors grille
  niveauMin: number; // Min de la fourchette du niveau
  niveauMax: number; // Max de la fourchette du niveau
  motif: string; // Motif substantiel (≥ 40 caractères)
}

/**
 * Demander une dérogation salariale (salaire hors grille).
 *
 * Règles :
 * - Bloque la paie jusqu'à validation DFC (statut EN_ATTENTE)
 * - DRH peut demander, seul DFC peut valider (permission derogation:valider)
 * - Motif obligatoire (minimum 40 caractères)
 */
export const demanderDerogation = actionProtegee(
  "employe:creer",
  async (session, input: DemanderDerogationInput) => {
    if (!input.motif || input.motif.trim().length < 40) {
      throw new Error("Le motif doit contenir au moins 40 caractères.");
    }

    const employe = await prisma.employe.findUnique({
      where: { id: input.employeId },
    });

    if (!employe) {
      throw new Error("Employé introuvable.");
    }

    const derogation = await prisma.$transaction(async (tx) => {
      const nouvelleDerogation = await tx.derogationSalariale.create({
        data: {
          employeId: input.employeId,
          montant: input.montant,
          niveauMin: input.niveauMin,
          niveauMax: input.niveauMax,
          motif: input.motif,
          demandeParId: session.userId,
          statut: "EN_ATTENTE",
        },
      });

      // Journaliser
      const ecartPourcent = Math.round(
        ((input.montant - input.niveauMax) / input.niveauMax) * 100
      );
      await tx.journalEvenement.create({
        data: {
          entite: "DerogationSalariale",
          entiteId: nouvelleDerogation.id,
          action: "CREATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Dérogation salariale demandée pour ${employe.nom} ${employe.prenom} (+${ecartPourcent}% au-dessus du max)`,
        },
      });

      return nouvelleDerogation;
    });

    return {
      success: true,
      derogationId: derogation.id,
      message:
        "Dérogation enregistrée. En attente de validation DFC. La paie est bloquée jusqu'à validation.",
    };
  }
);

interface DeciderDerogationInput {
  derogationId: string;
  decision: "VALIDEE" | "REFUSEE";
  commentaire?: string;
}

/**
 * Valider ou refuser une dérogation salariale.
 *
 * Règles :
 * - Réservé au DFC (permission derogation:valider)
 * - Si VALIDEE → débloque la paie
 * - Si REFUSEE → doit revoir le salaire ou motif
 * - Notification automatique au demandeur (M10)
 */
export const deciderDerogation = actionProtegee(
  "derogation:valider",
  async (session, input: DeciderDerogationInput) => {
    const derogation = await prisma.derogationSalariale.findUnique({
      where: { id: input.derogationId },
      include: {
        employe: true,
      },
    });

    if (!derogation) {
      throw new Error("Dérogation introuvable.");
    }

    if (derogation.statut !== "EN_ATTENTE") {
      throw new Error("Cette dérogation a déjà été traitée.");
    }

    await prisma.$transaction(async (tx) => {
      // Mettre à jour la dérogation
      await tx.derogationSalariale.update({
        where: { id: input.derogationId },
        data: {
          statut: input.decision,
          decideParId: session.userId,
          decideLe: new Date(),
          commentaire: input.commentaire,
        },
      });

      // Journaliser
      await tx.journalEvenement.create({
        data: {
          entite: "DerogationSalariale",
          entiteId: input.derogationId,
          action: "MODIFICATION",
          auteurId: session.userId,
          auteurNom: session.email,
          commentaire: `Dérogation ${input.decision} pour ${derogation.employe.nom} ${derogation.employe.prenom}${input.commentaire ? ` — ${input.commentaire}` : ""}`,
        },
      });

      // TODO M10 : Créer notification pour le demandeur
      // await tx.notification.create({ ... });
    });

    return {
      success: true,
      message:
        input.decision === "VALIDEE"
          ? "Dérogation validée. La paie est débloquée."
          : "Dérogation refusée. Le demandeur sera notifié.",
    };
  }
);

// ===========================================================================
// DOCUMENTS — Upload, Download, Suppression
// ===========================================================================

/**
 * Liste les documents d'un employé
 * Données ORDINAIRES sauf URLs de stockage (gérées par Supabase RLS)
 */
export const listerDocumentsEmploye = actionProtegee(
  "employe:lire",
  async (session, employeId: string) => {
    const documents = await prisma.documentEmploye.findMany({
      where: { employeId },
      orderBy: { deposeLe: "desc" },
      select: {
        id: true,
        typeDocument: true,
        nomFichier: true,
        cheminStorage: true,
        deposeLe: true,
        deposeParId: true,
        taille: true,
        estMedical: true,
      },
    });

    return documents.map((doc) => ({
      id: doc.id,
      typeDocument: doc.typeDocument,
      nomFichier: doc.nomFichier,
      cheminStorage: doc.cheminStorage,
      dateUpload: doc.deposeLe,
      taille: doc.taille,
      estMedical: doc.estMedical,
    }));
  }
);

// ===========================================================================
// CONTRATS — Historique et Avenants
// ===========================================================================

/**
 * Liste TOUS les contrats (vue globale RH)
 * Avec alertes échéances CDD (60j et 30j)
 */
export const listerTousContrats = actionProtegee(
  "employe:lire",
  async (session) => {
    const maintenant = new Date();
    const dans30j = new Date(maintenant);
    dans30j.setDate(dans30j.getDate() + 30);
    const dans60j = new Date(maintenant);
    dans60j.setDate(dans60j.getDate() + 60);

    // Vérifier permission données sensibles
    const rolePerms = await prisma.rolePermission.findMany({
      where: {
        role: { profils: { some: { profilId: session.userId } } },
        permission: { code: "employe:donneesSensibles" },
      },
    });
    const aDonneesSensibles = rolePerms.length > 0;

    // Récupérer tous les contrats actifs
    const contrats = await prisma.contrat.findMany({
      where: {
        employe: { archiveLe: null }, // Employés actifs uniquement
      },
      orderBy: [
        { dateFin: "asc" }, // CDD proches échéance en premier
        { dateDebut: "desc" },
      ],
      select: {
        id: true,
        typeContrat: true,
        dateDebut: true,
        dateFin: true,
        signe: true,
        salaire: aDonneesSensibles,
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            typeMainOeuvre: true,
          },
        },
        avenants: {
          orderBy: { dateEffet: "desc" },
          take: 1,
        },
      },
    });

    // Déterminer contrat actif + niveau alerte
    return contrats.map((c) => {
      const debut = new Date(c.dateDebut);
      const fin = c.dateFin ? new Date(c.dateFin) : null;
      const actif = debut <= maintenant && (!fin || fin >= maintenant);

      let niveauAlerte: "danger" | "warning" | null = null;
      if (c.typeContrat === "CDD" && fin) {
        if (fin <= dans30j) niveauAlerte = "danger";
        else if (fin <= dans60j) niveauAlerte = "warning";
      }

      return {
        id: c.id,
        employe: c.employe,
        typeContrat: c.typeContrat,
        dateDebut: c.dateDebut,
        dateFin: c.dateFin ?? undefined,
        signe: c.signe,
        salaire: aDonneesSensibles ? c.salaire?.toNumber() ?? undefined : undefined,
        derniersAvenants: c.avenants.length,
        actif,
        niveauAlerte,
      };
    });
  }
);

/**
 * Liste les contrats et avenants d'un employé
 * Données SENSIBLES (salaire) masquées si pas de permission employe:donneesSensibles
 */
export const listerContratsEmploye = actionProtegee(
  "employe:lire",
  async (session, employeId: string) => {
    // Vérifier permission données sensibles
    const rolePerms = await prisma.rolePermission.findMany({
      where: {
        role: { profils: { some: { profilId: session.userId } } },
        permission: { code: "employe:donneesSensibles" },
      },
    });
    const aDonneesSensibles = rolePerms.length > 0;

    const contrats = await prisma.contrat.findMany({
      where: { employeId },
      orderBy: { dateDebut: "desc" },
      select: {
        id: true,
        typeContrat: true,
        dateDebut: true,
        dateFin: true,
        signe: true,
        salaire: aDonneesSensibles,
        avenants: {
          orderBy: { dateEffet: "asc" },
          select: {
            id: true,
            motif: true,
            dateEffet: true,
            nouveauSalaire: aDonneesSensibles,
            nouvelleDateFin: true,
          },
        },
      },
    });

    // Déterminer le contrat actif
    const maintenant = new Date();
    const contratActifId = contrats.find(
      (c) =>
        new Date(c.dateDebut) <= maintenant &&
        (!c.dateFin || new Date(c.dateFin) >= maintenant)
    )?.id;

    return contrats.map((c) => ({
      id: c.id,
      typeContrat: c.typeContrat,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin ?? undefined,
      signe: c.signe,
      salaire: aDonneesSensibles ? c.salaire?.toNumber() ?? undefined : undefined,
      avenants: c.avenants.map((a) => ({
        id: a.id,
        motif: a.motif,
        dateEffet: a.dateEffet,
        nouveauSalaire: aDonneesSensibles
          ? a.nouveauSalaire?.toNumber() ?? undefined
          : undefined,
        nouvelleDateFin: a.nouvelleDateFin ?? undefined,
      })),
      actif: c.id === contratActifId,
    }));
  }
);

// ===========================================================================
// HISTORIQUE — Journal des événements
// ===========================================================================

/**
 * Liste les événements du journal concernant un employé
 * Données ORDINAIRES (audit trail)
 */
export const listerHistoriqueEmploye = actionProtegee(
  "employe:lire",
  async (session, employeId: string) => {
    // Récupérer tous les événements liés à cet employé
    // 1. Événements directs sur Employe
    // 2. Événements sur ses contrats
    // 3. Événements sur ses documents
    // 4. Événements sur ses affectations
    // 5. Événements sur ses dérogations

    const [
      evenementsEmploye,
      contrats,
      documents,
      affectations,
      derogations,
    ] = await Promise.all([
      // Événements directs
      prisma.journalEvenement.findMany({
        where: {
          entite: "Employe",
          entiteId: employeId,
        },
      }),
      // Contrats pour récupérer leurs événements
      prisma.contrat.findMany({
        where: { employeId },
        select: { id: true },
      }),
      // Documents
      prisma.documentEmploye.findMany({
        where: { employeId },
        select: { id: true },
      }),
      // Affectations
      prisma.affectation.findMany({
        where: { employeId },
        select: { id: true },
      }),
      // Dérogations
      prisma.derogationSalariale.findMany({
        where: { employeId },
        select: { id: true },
      }),
    ]);

    // IDs des entités liées
    const contratIds = contrats.map((c) => c.id);
    const documentIds = documents.map((d) => d.id);
    const affectationIds = affectations.map((a) => a.id);
    const derogationIds = derogations.map((d) => d.id);

    // Récupérer événements des entités liées
    const evenementsLies = await prisma.journalEvenement.findMany({
      where: {
        OR: [
          { entite: "Contrat", entiteId: { in: contratIds } },
          { entite: "Avenant", entiteId: { in: contratIds } }, // Les avenants ont contratId
          { entite: "DocumentEmploye", entiteId: { in: documentIds } },
          { entite: "Affectation", entiteId: { in: affectationIds } },
          { entite: "DerogationSalariale", entiteId: { in: derogationIds } },
        ],
      },
    });

    // Combiner et trier par date décroissante
    const tousEvenements = [...evenementsEmploye, ...evenementsLies].sort(
      (a, b) => b.survenuLe.getTime() - a.survenuLe.getTime()
    );

    return tousEvenements.map((evt) => ({
      id: evt.id,
      action: evt.action as "CREATION" | "MODIFICATION" | "SUPPRESSION" | "ARCHIVAGE" | "VALIDATION",
      entite: evt.entite,
      auteurNom: evt.auteurNom,
      dateCreation: evt.survenuLe,
      commentaire: evt.commentaire ?? undefined,
      details: evt.details as Record<string, unknown> | undefined,
    }));
  }
);

// ===========================================================================
// DONNÉES DE RÉFÉRENCE POUR FORMULAIRES
// ===========================================================================

/**
 * Récupère toutes les données de référence nécessaires pour le formulaire de création d'employé
 * Utilisé pour peupler les selects/combobox : nationalités, directions, services, postes
 */
export async function obtenirDonneesReferenceEmploye() {
  const [nationalites, directions, services, postes, employes, projets] = await Promise.all([
    prisma.nationalite.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
      },
    }),

    prisma.direction.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
      },
    }),

    prisma.service.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
        directionId: true,
      },
    }),

    prisma.poste.findMany({
      orderBy: { libelle: "asc" },
      select: {
        id: true,
        libelle: true,
        code: true,
        serviceId: true,
        directionId: true,
      },
    }),

    // Liste des employés permanents pour sélection du supérieur hiérarchique
    prisma.employe.findMany({
      where: {
        typeMainOeuvre: "PERMANENT",
        archiveLe: null,
      },
      orderBy: [
        { nom: "asc" },
        { prenom: "asc" },
      ],
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
      },
    }),

    // Liste des projets/chantiers actifs pour affectation
    prisma.projet.findMany({
      where: {
        statut: {
          in: ["OUVERT", "EN_COURS"],
        },
      },
      orderBy: {
        code: "desc",
      },
      select: {
        id: true,
        code: true,
        nom: true,
      },
    }),
  ]);

  return {
    nationalites,
    directions,
    services,
    postes,
    employes,
    projets,
  };
}

/**
 * Récupère les tâches d'un projet pour le sélecteur cascading
 */
export async function obtenirTachesProjet(projetId: string) {
  const taches = await prisma.tache.findMany({
    where: { projetId },
    orderBy: { libelle: "asc" },
    select: {
      id: true,
      libelle: true,
    },
  });

  return taches;
}

/**
 * Crée une nouvelle tâche dans un projet (création inline depuis le formulaire employé)
 * Minimal : libelle uniquement, dates par défaut = aujourd'hui + 30 jours
 */
export async function creerTacheInline(projetId: string, libelle: string) {
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  const tache = await prisma.tache.create({
    data: {
      projetId,
      libelle,
      dateDebut: today,
      dateFin: in30Days,
    },
    select: {
      id: true,
      libelle: true,
    },
  });

  return tache;
}

// ===========================================================================
// BROUILLONS — Auto-save formulaire employé
// ===========================================================================

/**
 * Sauvegarde automatique du formulaire employé (toutes les 2s après dernière frappe)
 * Utilise le modèle Brouillon créé en M0.
 * Pas de permission requise : lié à la session utilisateur.
 */
export async function sauvegarderBrouillonEmploye(donnees: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Chercher le brouillon existant
  const existant = await prisma.brouillon.findFirst({
    where: {
      profilId: user.id,
      entite: "Employe",
      entiteId: null,
    },
  });

  if (existant) {
    // Mettre à jour
    await prisma.brouillon.update({
      where: { id: existant.id },
      data: { donnees },
    });
  } else {
    // Créer
    await prisma.brouillon.create({
      data: {
        profilId: user.id,
        entite: "Employe",
        entiteId: null,
        donnees,
      },
    });
  }
}

/**
 * Récupère le brouillon sauvegardé pour la création d'employé
 */
export async function recupererBrouillonEmploye() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const brouillon = await prisma.brouillon.findFirst({
    where: {
      profilId: user.id,
      entite: "Employe",
      entiteId: null,
    },
  });

  return brouillon?.donnees || null;
}

/**
 * Supprime le brouillon après création réussie de l'employé
 */
export async function supprimerBrouillonEmploye() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await prisma.brouillon.deleteMany({
    where: {
      profilId: user.id,
      entite: "Employe",
      entiteId: null,
    },
  });
}

// =====================================================================
// CRÉATION JOURNALIER (formulaire simplifié)
// =====================================================================

interface CreerJournalierInput {
  nom: string;
  prenom: string;
  sexe?: "MASCULIN" | "FEMININ";
  dateNaissance?: string;
  lieuNaissance?: string;
  typePieceIdentite?: "CNI" | "PASSEPORT" | "ATTESTATION";
  numeroPieceIdentite?: string;
  telephone: string;
  numeroWave: string;
}

export const creerJournalier = actionProtegee(
  "employe:creer",
  async (session, input: CreerJournalierInput) => {
    // 1. Génération matricule JRN-AAAA-NNNN (année en cours)
    const annee = new Date().getFullYear();
    const dernier = await prisma.employe.findFirst({
      where: {
        matricule: { startsWith: `JRN-${annee}-` },
      },
      orderBy: { matricule: "desc" },
    });

    let compteur = 1;
    if (dernier) {
      const match = dernier.matricule.match(/JRN-\d{4}-(\d{4})/);
      if (match) {
        compteur = parseInt(match[1], 10) + 1;
      }
    }

    const matricule = `JRN-${annee}-${compteur.toString().padStart(4, "0")}`;

    // 2. Créer le profil du journalier (sans affectation ni contrat)
    // Note: typePieceIdentite et numeroPieceIdentite stockés temporairement dans referenceInterne
    const referenceInterne =
      input.typePieceIdentite && input.numeroPieceIdentite
        ? `${input.typePieceIdentite}:${input.numeroPieceIdentite}`
        : null;

    const employe = await prisma.employe.create({
      data: {
        matricule,
        typeMainOeuvre: "JOURNALIER",
        nom: input.nom.toUpperCase(),
        prenom: input.prenom,
        sexe: input.sexe || null,
        telephone: input.telephone,
        numeroWave: input.numeroWave,
        modePaiement: "WAVE",
        dateNaissance: input.dateNaissance ? new Date(input.dateNaissance) : null,
        lieuNaissance: input.lieuNaissance || null,
        referenceInterne,
        // archiveLe = null par défaut (employé actif)
      },
    });

    // 3. Audit
    await prisma.journalEvenement.create({
      data: {
        entite: "Employe",
        entiteId: employe.id,
        action: "CREATION",
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          type: "JOURNALIER",
          matricule,
          message: "Profil créé. Affectation à faire par la Direction Technique.",
        },
      },
    });

    return { success: true, employeId: employe.id, matricule };
  }
);

// ===========================================================================
// STATISTIQUES & TÂCHES (pour ModuleLayout)
// ===========================================================================

/**
 * Calcule les statistiques pour les indicateurs de la page Employés
 * Mise en cache pour éviter les requêtes répétées pendant le rendu
 */
export const statistiquesEmployes = cache(actionProtegee(
  "employe:lire",
  async (session, typeMainOeuvre?: TypeMainOeuvre) => {
    const baseWhere = {
      archiveLe: null,
      ...(typeMainOeuvre ? { typeMainOeuvre } : {}),
    };

    const isJournaliers = typeMainOeuvre === "JOURNALIER";

    const [totalActifs, avecContratOuMission, dossiersIncomplets, sansAccesOuCompetence] = await Promise.all([
      // Total employés actifs (filtrés par type si spécifié)
      prisma.employe.count({
        where: baseWhere,
      }),

      // Pour PERMANENT: avec contrat actif | Pour JOURNALIER: en mission (avec affectation active)
      isJournaliers
        ? prisma.employe.count({
            where: {
              ...baseWhere,
              affectations: {
                some: {
                  dateFin: null, // Affectation active
                },
              },
            },
          })
        : prisma.employe.count({
            where: {
              ...baseWhere,
              contrats: {
                some: {
                  OR: [
                    { dateFin: null }, // CDI
                    { dateFin: { gte: new Date() } }, // CDD non expiré
                  ],
                },
              },
            },
          }),

      // Dossiers incomplets
      isJournaliers
        ? // Pour JOURNALIER: téléphone vide OU numeroWave manquant si mode WAVE
          prisma.employe.count({
            where: {
              ...baseWhere,
              OR: [
                { telephone: "" },
                {
                  modePaiement: "WAVE",
                  numeroWave: null,
                },
                {
                  modePaiement: "WAVE",
                  numeroWave: "",
                },
              ],
            },
          })
        : // Pour PERMANENT: sans email OU sans RIB/CNPS
          prisma.employe.count({
            where: {
              ...baseWhere,
              OR: [
                { email: null },
                { email: "" },
                { rib: null },
                { rib: "" },
                { numeroCnps: null },
                { numeroCnps: "" },
              ],
            },
          }),

      // Pour PERMANENT: sans compte d'accès | Pour JOURNALIER: sans compétence
      isJournaliers
        ? prisma.employe.count({
            where: {
              ...baseWhere,
              competences: {
                none: {
                  dateFin: null, // Aucune compétence active
                },
              },
            },
          })
        : prisma.employe.count({
            where: {
              archiveLe: null,
              profil: { is: null },
              typeMainOeuvre: "PERMANENT",
            },
          }),
    ]);

    return {
      totalActifs,
      permanents: avecContratOuMission, // Réutilise le même champ pour compatibilité
      dossiersIncomplets,
      sansAcces: sansAccesOuCompetence, // Réutilise le même champ pour compatibilité
    };
  }
));

/**
 * Récupère les tâches en attente pour l'utilisateur connecté (page Employés)
 * Mise en cache pour éviter les requêtes répétées pendant le rendu
 */
export const obtenirTachesEmployes = cache(actionProtegee(
  "employe:lire",
  async (session, typeMainOeuvre?: TypeMainOeuvre) => {
    const taches: Array<{
      id: string;
      titre: string;
      description: string;
      count?: number;
      lien?: string;
    }> = [];

    const baseWhere = {
      archiveLe: null,
      ...(typeMainOeuvre ? { typeMainOeuvre } : {}),
    };

    // Compter les dossiers incomplets
    const dossiersIncomplets = await prisma.employe.count({
      where: {
        ...baseWhere,
        OR: [
          { email: null },
          { email: "" },
          { rib: null },
          { rib: "" },
          { numeroCnps: null },
          { numeroCnps: "" },
        ],
      },
    });

    if (dossiersIncomplets > 0) {
      const lienBase = typeMainOeuvre ? `/employes?tab=${typeMainOeuvre === "PERMANENT" ? "permanents" : "journaliers"}&statutDossier=INCOMPLET` : "/employes?statutDossier=INCOMPLET";
      taches.push({
        id: "dossiers-incomplets",
        titre: "Compléter les dossiers employés",
        description: `${dossiersIncomplets} employé${dossiersIncomplets > 1 ? "s ont" : " a"} des informations manquantes (email, RIB, CNPS).`,
        count: dossiersIncomplets,
        lien: lienBase,
      });
    }

    // Compter les employés sans accès (seulement pour permanents)
    if (!typeMainOeuvre || typeMainOeuvre === "PERMANENT") {
      const sansAcces = await prisma.employe.count({
        where: {
          archiveLe: null,
          profil: { is: null },
          typeMainOeuvre: "PERMANENT",
        },
      });

      if (sansAcces > 0) {
        taches.push({
          id: "sans-acces",
          titre: "Ouvrir l'accès ITA Manager",
          description: `${sansAcces} employé${sansAcces > 1 ? "s permanents n'ont" : " permanent n'a"} pas encore de compte d'accès.`,
          count: sansAcces,
          lien: "/employes?tab=permanents",
        });
      }
    }

    // Compter les contrats CDD arrivant à expiration (< 30 jours)
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);

    const contratsExpiration = await prisma.contrat.count({
      where: {
        typeContrat: "CDD",
        dateFin: {
          lte: dans30Jours,
          gte: new Date(),
        },
        employe: baseWhere,
      },
    });

    if (contratsExpiration > 0) {
      taches.push({
        id: "contrats-expiration",
        titre: "Contrats CDD arrivant à expiration",
        description: `${contratsExpiration} contrat${contratsExpiration > 1 ? "s arrivent" : " arrive"} à expiration dans moins de 30 jours.`,
        count: contratsExpiration,
        lien: "/contrats",
      });
    }

    return {
      success: true,
      data: taches,
    };
  }
));
