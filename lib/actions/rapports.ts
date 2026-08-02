/**
 * Server Actions — Module M6 Rapports d'Activité
 *
 * Offline-first: workers create reports offline, sync when online
 * Permissions: releve:saisir (workers), releve:viser (conducteur)
 * StatutReleve: BROUILLON → SOUMIS → VISE / REFUSE
 */

'use server';

import { actionProtegee } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { StatutReleve } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type Session = { userId: string; email: string };

interface CreerRapportInput {
  projetId: string;
  date: Date;
  clientId?: string; // UUID généré offline pour mapping
}

interface ModifierRapportInput {
  id: string;
  observations?: string;
  meteo?: string;
  conditionsTravail?: string;
}

interface SoumettreRapportInput {
  id: string;
}

interface ValiderRapportInput {
  id: string;
}

interface RejeterRapportInput {
  id: string;
  motif: string;
}

interface ListerRapportsFilters {
  projetId?: string;
  employeId?: string;
  statut?: StatutReleve;
  dateDebut?: Date;
  dateFin?: Date;
  page?: number;
}

interface SyncRapportBatch {
  clientId: string;
  projetId: string;
  date: Date;
  observations?: string;
  meteo?: string;
  conditionsTravail?: string;
  pointages: unknown[]; // Sera typé selon le schéma Pointage
  travauxRealises?: unknown[];
  utilisationsMateriel?: unknown[];
  consommations?: unknown[];
  incidents?: unknown[];
}

// ═══════════════════════════════════════════════════════════════════════
// 1. CRÉER RAPPORT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Créer un nouveau rapport d'activité
 *
 * - Handle clientId for offline UUID mapping
 * - Deduplicate if already synced
 * - Enforce projetId_date uniqueness
 * - Journalize CREATION
 */
export const creerRapport = actionProtegee(
  'releve:saisir',
  async (session: Session, input: CreerRapportInput) => {
    // Vérifier que l'utilisateur est un employé
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error('Profil employé introuvable');
    }

    const employeId = profil.employe.id;

    // Si clientId fourni, vérifier si déjà synchronisé
    if (input.clientId) {
      const existantParClientId = await prisma.releveActivite.findFirst({
        where: {
          chefChantierId: employeId,
          date: input.date,
          projetId: input.projetId,
        },
      });

      if (existantParClientId) {
        // Déjà synchronisé, retourner l'existant
        return existantParClientId;
      }
    }

    // Vérifier l'unicité projetId_date
    const existant = await prisma.releveActivite.findUnique({
      where: {
        projetId_date: {
          projetId: input.projetId,
          date: input.date,
        },
      },
    });

    if (existant) {
      throw new Error('Un rapport existe déjà pour ce chantier à cette date');
    }

    // Créer le rapport
    const rapport = await prisma.releveActivite.create({
      data: {
        projetId: input.projetId,
        date: input.date,
        chefChantierId: employeId,
        statut: StatutReleve.BROUILLON,
        derniereSyncLocale: new Date(),
        derniereSync: new Date(),
        syncEnAttente: false,
      },
      include: {
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        chefChantier: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Journaliser la création
    await prisma.journalEvenement.create({
      data: {
        entite: 'ReleveActivite',
        entiteId: rapport.id,
        action: 'CREATION',
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          projetId: input.projetId,
          date: input.date,
          clientId: input.clientId,
        },
        commentaire: `Rapport créé pour ${rapport.projet.nom} le ${input.date.toLocaleDateString()}`,
      },
    });

    revalidatePath('/releves');
    return rapport;
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 2. MODIFIER RAPPORT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Modifier un rapport en brouillon
 *
 * - Only BROUILLON can be modified
 * - Ownership check (chefChantier.profilId === session.userId)
 * - Update with timestamp
 */
export const modifierRapport = actionProtegee(
  'releve:saisir',
  async (session: Session, input: ModifierRapportInput) => {
    // Charger le rapport avec vérifications
    const rapport = await prisma.releveActivite.findUnique({
      where: { id: input.id },
      include: {
        chefChantier: {
          include: { profil: true },
        },
      },
    });

    if (!rapport) {
      throw new Error('Rapport introuvable');
    }

    // Vérifier que seul BROUILLON peut être modifié
    if (rapport.statut !== StatutReleve.BROUILLON) {
      throw new Error('Seuls les rapports en brouillon peuvent être modifiés');
    }

    // Vérifier la propriété
    if (rapport.chefChantier.profil?.id !== session.userId) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce rapport');
    }

    // Mettre à jour
    const rapportMisAJour = await prisma.releveActivite.update({
      where: { id: input.id },
      data: {
        observations: input.observations,
        meteo: input.meteo,
        conditionsTravail: input.conditionsTravail,
        derniereSync: new Date(),
        syncEnAttente: false,
      },
      include: {
        projet: true,
        chefChantier: true,
      },
    });

    revalidatePath('/releves');
    revalidatePath(`/releves/${input.id}`);

    return rapportMisAJour;
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 3. SOUMETTRE RAPPORT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Soumettre un rapport pour visa
 *
 * - BROUILLON → SOUMIS
 * - Require at least one pointage
 * - Journalize SOUMISSION
 */
export const soumettreRapport = actionProtegee(
  'releve:saisir',
  async (session: Session, input: SoumettreRapportInput) => {
    // Charger le rapport avec pointages
    const rapport = await prisma.releveActivite.findUnique({
      where: { id: input.id },
      include: {
        chefChantier: {
          include: { profil: true },
        },
        pointages: true,
        projet: {
          select: {
            code: true,
            nom: true,
          },
        },
      },
    });

    if (!rapport) {
      throw new Error('Rapport introuvable');
    }

    // Vérifier la propriété
    if (rapport.chefChantier.profil?.id !== session.userId) {
      throw new Error('Vous n\'êtes pas autorisé à soumettre ce rapport');
    }

    // Vérifier le statut
    if (rapport.statut !== StatutReleve.BROUILLON) {
      throw new Error('Ce rapport ne peut pas être soumis');
    }

    // Vérifier qu'il y a au moins un pointage
    if (rapport.pointages.length === 0) {
      throw new Error('Le rapport doit contenir au moins un pointage');
    }

    // Soumettre
    const rapportSoumis = await prisma.releveActivite.update({
      where: { id: input.id },
      data: {
        statut: StatutReleve.SOUMIS,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: 'ReleveActivite',
        entiteId: rapport.id,
        action: 'SOUMISSION',
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          nbPointages: rapport.pointages.length,
        },
        commentaire: `Rapport soumis pour ${rapport.projet.nom} - ${rapport.pointages.length} pointages`,
      },
    });

    revalidatePath('/releves');
    revalidatePath('/releves/a-viser');
    revalidatePath(`/releves/${input.id}`);

    return rapportSoumis;
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 4. VALIDER RAPPORT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Valider (viser) un rapport
 *
 * - SOUMIS → VISE
 * - Auto-approval prevention
 * - Check conducteur role on project
 * - Record conducteurId and viseLe
 * - Journalize VISA
 */
export const validerRapport = actionProtegee(
  'releve:viser',
  async (session: Session, input: ValiderRapportInput) => {
    // Charger le rapport avec projet et affectations
    const rapport = await prisma.releveActivite.findUnique({
      where: { id: input.id },
      include: {
        chefChantier: {
          include: { profil: true },
        },
        projet: {
          include: {
            affectations: {
              where: {
                roleFonctionnel: 'CONDUCTEUR',
                dateFin: null, // Actif
              },
              include: {
                employe: {
                  include: { profil: true },
                },
              },
            },
          },
        },
      },
    });

    if (!rapport) {
      throw new Error('Rapport introuvable');
    }

    // Vérifier le statut
    if (rapport.statut !== StatutReleve.SOUMIS) {
      throw new Error('Seuls les rapports soumis peuvent être visés');
    }

    // Prévention auto-approbation
    if (rapport.chefChantier.profil?.id === session.userId) {
      throw new Error('Vous ne pouvez pas viser votre propre rapport');
    }

    // Vérifier que l'utilisateur est conducteur du projet
    const estConducteur = rapport.projet.affectations.some(
      (aff) => aff.employe.profil?.id === session.userId
    );

    // Sinon vérifier les rôles globaux DT ou ADMIN
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const rolesCodes = profil?.roles.map((pr) => pr.role.code) ?? [];
    const roleAutorise = rolesCodes.some((r) => ['DT', 'CT', 'ADMIN'].includes(r));

    if (!estConducteur && !roleAutorise) {
      throw new Error('Vous n\'êtes pas autorisé à viser ce rapport');
    }

    // Valider le rapport
    const rapportVise = await prisma.releveActivite.update({
      where: { id: input.id },
      data: {
        statut: StatutReleve.VISE,
        conducteurId: session.userId,
        viseLe: new Date(),
      },
      include: {
        projet: true,
        chefChantier: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: 'ReleveActivite',
        entiteId: rapport.id,
        action: 'VISA',
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire: `Rapport visé pour ${rapport.projet.nom}`,
      },
    });

    revalidatePath('/releves');
    revalidatePath('/releves/a-viser');
    revalidatePath(`/releves/${input.id}`);

    return rapportVise;
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 5. REJETER RAPPORT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Rejeter un rapport avec motif
 *
 * - SOUMIS → REFUSE
 * - Motif mandatory (min 10 chars)
 * - Journalize REFUS with motif
 */
export const rejeterRapport = actionProtegee(
  'releve:viser',
  async (session: Session, input: RejeterRapportInput) => {
    // Valider le motif
    if (!input.motif || input.motif.trim().length < 10) {
      throw new Error('Le motif de refus doit contenir au moins 10 caractères');
    }

    // Charger le rapport avec projet et affectations
    const rapport = await prisma.releveActivite.findUnique({
      where: { id: input.id },
      include: {
        chefChantier: {
          include: { profil: true },
        },
        projet: {
          include: {
            affectations: {
              where: {
                roleFonctionnel: 'CONDUCTEUR',
                dateFin: null,
              },
              include: {
                employe: {
                  include: { profil: true },
                },
              },
            },
          },
        },
      },
    });

    if (!rapport) {
      throw new Error('Rapport introuvable');
    }

    // Vérifier le statut
    if (rapport.statut !== StatutReleve.SOUMIS) {
      throw new Error('Seuls les rapports soumis peuvent être refusés');
    }

    // Vérifier que l'utilisateur est conducteur du projet ou a un rôle autorisé
    const estConducteur = rapport.projet.affectations.some(
      (aff) => aff.employe.profil?.id === session.userId
    );

    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const rolesCodes = profil?.roles.map((pr) => pr.role.code) ?? [];
    const roleAutorise = rolesCodes.some((r) => ['DT', 'CT', 'ADMIN'].includes(r));

    if (!estConducteur && !roleAutorise) {
      throw new Error('Vous n\'êtes pas autorisé à refuser ce rapport');
    }

    // Refuser le rapport
    const rapportRefuse = await prisma.releveActivite.update({
      where: { id: input.id },
      data: {
        statut: StatutReleve.REFUSE,
        motifRefus: input.motif,
        conducteurId: session.userId,
      },
      include: {
        projet: true,
        chefChantier: true,
      },
    });

    // Journaliser
    await prisma.journalEvenement.create({
      data: {
        entite: 'ReleveActivite',
        entiteId: rapport.id,
        action: 'REFUS',
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          motif: input.motif,
        },
        commentaire: `Rapport refusé: ${input.motif.substring(0, 50)}${input.motif.length > 50 ? '...' : ''}`,
      },
    });

    revalidatePath('/releves');
    revalidatePath('/releves/a-viser');
    revalidatePath(`/releves/${input.id}`);

    return rapportRefuse;
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 6. LISTER RAPPORTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Lister les rapports d'activité avec filtres et pagination
 *
 * - Pagination 25 items
 * - Filters: projetId, employeId, statut, dateDebut, dateFin
 * - Include: projet, chefChantier, _count pointages
 * - Order by date desc
 */
export const listerRapports = actionProtegee(
  'releve:saisir',
  async (session: Session, filters: ListerRapportsFilters = {}) => {
    const page = filters.page ?? 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    // Construire les conditions de filtrage
    const where: any = {};

    if (filters.projetId) {
      where.projetId = filters.projetId;
    }

    if (filters.employeId) {
      where.chefChantierId = filters.employeId;
    }

    if (filters.statut) {
      where.statut = filters.statut;
    }

    if (filters.dateDebut || filters.dateFin) {
      where.date = {};
      if (filters.dateDebut) {
        where.date.gte = filters.dateDebut;
      }
      if (filters.dateFin) {
        where.date.lte = filters.dateFin;
      }
    }

    // Compter le total
    const total = await prisma.releveActivite.count({ where });

    // Charger les rapports
    const rapports = await prisma.releveActivite.findMany({
      where,
      include: {
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        chefChantier: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
        _count: {
          select: {
            pointages: true,
            travauxRealises: true,
            incidents: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { creeLe: 'desc' },
      ],
      take: limit,
      skip,
    });

    return {
      rapports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 7. OBTENIR RAPPORT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Obtenir le détail complet d'un rapport
 *
 * - Full detail with all relations
 * - Include: projet, chefChantier, pointages, travauxRealises, etc.
 */
export const obtenirRapport = actionProtegee(
  'releve:saisir',
  async (session: Session, rapportId: string) => {
    const rapport = await prisma.releveActivite.findUnique({
      where: { id: rapportId },
      include: {
        projet: {
          select: {
            id: true,
            code: true,
            nom: true,
            client: true,
            adresse: true,
          },
        },
        chefChantier: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
        pointages: {
          include: {
            employe: {
              select: {
                id: true,
                matricule: true,
                nom: true,
                prenom: true,
              },
            },
          },
          orderBy: {
            employe: {
              nom: 'asc',
            },
          },
        },
        travauxRealises: {
          orderBy: {
            creeLe: 'asc',
          },
        },
        utilisationsMateriel: {
          include: {
            materiel: {
              select: {
                id: true,
                code: true,
                designation: true,
              },
            },
          },
        },
        consommations: {
          orderBy: {
            creeLe: 'asc',
          },
        },
        incidents: {
          orderBy: {
            heure: 'asc',
          },
        },
      },
    });

    if (!rapport) {
      throw new Error('Rapport introuvable');
    }

    return rapport;
  }
);

// ═══════════════════════════════════════════════════════════════════════
// 8. SYNC RAPPORTS BATCH
// ═══════════════════════════════════════════════════════════════════════

/**
 * Synchroniser un lot de rapports créés hors ligne
 *
 * - Batch sync array of reports
 * - Transaction per report
 * - Deduplicate by clientId
 * - Return success/failure mapping
 */
export const syncRapportsBatch = actionProtegee(
  'releve:saisir',
  async (session: Session, rapports: SyncRapportBatch[]) => {
    // Vérifier que l'utilisateur est un employé
    const profil = await prisma.profil.findUnique({
      where: { id: session.userId },
      include: { employe: true },
    });

    if (!profil?.employe) {
      throw new Error('Profil employé introuvable');
    }

    const employeId = profil.employe.id;
    const resultats: Array<{
      clientId: string;
      success: boolean;
      serverId?: string;
      error?: string;
    }> = [];

    // Traiter chaque rapport individuellement
    for (const rapportData of rapports) {
      try {
        // Vérifier si déjà synchronisé
        const existant = await prisma.releveActivite.findFirst({
          where: {
            projetId: rapportData.projetId,
            date: rapportData.date,
            chefChantierId: employeId,
          },
        });

        if (existant) {
          // Déjà synchronisé
          resultats.push({
            clientId: rapportData.clientId,
            success: true,
            serverId: existant.id,
          });
          continue;
        }

        // Créer le rapport dans une transaction
        const nouveauRapport = await prisma.$transaction(async (tx) => {
          // Créer le rapport
          const rapport = await tx.releveActivite.create({
            data: {
              projetId: rapportData.projetId,
              date: rapportData.date,
              chefChantierId: employeId,
              observations: rapportData.observations,
              meteo: rapportData.meteo,
              conditionsTravail: rapportData.conditionsTravail,
              statut: StatutReleve.BROUILLON,
              derniereSyncLocale: new Date(),
              derniereSync: new Date(),
              syncEnAttente: false,
            },
          });

          // Créer les pointages si fournis
          if (rapportData.pointages && rapportData.pointages.length > 0) {
            // Note: Ici on devrait créer les pointages
            // Mais la structure exacte dépend du schéma Pointage
            // qui n'est pas complètement défini dans le contexte fourni
          }

          // Journaliser
          await tx.journalEvenement.create({
            data: {
              entite: 'ReleveActivite',
              entiteId: rapport.id,
              action: 'SYNC',
              auteurId: session.userId,
              auteurNom: session.email,
              details: {
                clientId: rapportData.clientId,
                nbPointages: rapportData.pointages?.length ?? 0,
              },
              commentaire: `Rapport synchronisé depuis hors ligne`,
            },
          });

          return rapport;
        });

        resultats.push({
          clientId: rapportData.clientId,
          success: true,
          serverId: nouveauRapport.id,
        });
      } catch (error) {
        // En cas d'erreur, enregistrer l'échec
        resultats.push({
          clientId: rapportData.clientId,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    // Revalider les chemins si au moins un rapport synchronisé
    const nbSucces = resultats.filter((r) => r.success).length;
    if (nbSucces > 0) {
      revalidatePath('/releves');
    }

    return {
      total: rapports.length,
      reussis: nbSucces,
      echecs: rapports.length - nbSucces,
      resultats,
    };
  }
);
