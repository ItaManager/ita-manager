/**
 * Server Actions — Module M15 L2 Paiements Fournisseurs
 *
 * Gestion du circuit de validation des factures fournisseurs :
 * - Enregistrement facture
 * - Confirmation réception (Logistique/Chef chantier)
 * - Validation Gestionnaire
 * - Validation DG (si > seuil)
 * - Paiement (total ou partiel)
 *
 * DECISIONS-M15-L2.md : 10 décisions applicables
 */

'use server';

import { actionProtegee } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════

const SEUIL_VALIDATION_DG_DEFAULT = 500000;

async function obtenirSeuilValidationDG(): Promise<number> {
  const param = await prisma.parametre.findUnique({
    where: { cle: 'SEUIL_VALIDATION_DG_FOURNISSEUR' },
  });

  return param ? parseInt(param.valeur, 10) : SEUIL_VALIDATION_DG_DEFAULT;
}

// ═══════════════════════════════════════════════════════════════════════
// SCHEMAS VALIDATION
// ═══════════════════════════════════════════════════════════════════════

const creerFactureSchema = z.object({
  fournisseurId: z.string().min(1),
  reference: z.string().min(1),
  montantHT: z.number().positive(),
  montantTVA: z.number().nonnegative(),
  montantTTC: z.number().positive(),
  dateFacture: z.date(),
  dateEcheance: z.date().optional(),
  projetId: z.string().optional(), // D-07 : imputation chantier
  urlFacture: z.string().url().optional(),
});

const confirmerReceptionSchema = z.object({
  factureId: z.string().min(1),
  commentaire: z.string().optional(),
});

const validerFactureSchema = z.object({
  factureId: z.string().min(1),
});

const refuserFactureSchema = z.object({
  factureId: z.string().min(1),
  motif: z.string().min(1),
});

const creerPaiementSchema = z.object({
  factureId: z.string().min(1),
  montantPaye: z.number().positive(),
  modePaiement: z.enum(['VIREMENT', 'MOBILE_MONEY', 'ESPECES', 'CHEQUE']),
  datePaiement: z.date(),
  urlPreuve: z.string().url().optional(),
});

// ═══════════════════════════════════════════════════════════════════════
// FACTURES — CRUD ET WORKFLOW
// ═══════════════════════════════════════════════════════════════════════

/**
 * Créer une facture fournisseur (statut : BROUILLON)
 * Permission : paiements:fournisseurs:creer
 */
export const creerFactureFournisseur = actionProtegee(
  'paiements:fournisseurs:creer',
  async (session, input) => {
    const data = creerFactureSchema.parse(input);

    // D-05 : Vérification doublon référence
    const existante = await prisma.factureFournisseur.findUnique({
      where: {
        fournisseurId_reference: {
          fournisseurId: data.fournisseurId,
          reference: data.reference,
        },
      },
    });

    if (existante) {
      throw new Error(
        `Une facture avec la référence "${data.reference}" existe déjà pour ce fournisseur.`
      );
    }

    const facture = await prisma.factureFournisseur.create({
      data: {
        ...data,
        montantHT: new Decimal(data.montantHT),
        montantTVA: new Decimal(data.montantTVA),
        montantTTC: new Decimal(data.montantTTC),
        montantPaye: new Decimal(0),
        statutFacture: 'BROUILLON',
        creePar: session.userId,
      },
      include: {
        fournisseur: true,
        projet: true,
      },
    });

    return { success: true, facture };
  }
);

/**
 * Soumettre une facture (BROUILLON → A_RECEVOIR)
 * Permission : paiements:fournisseurs:creer
 */
export const soumettreFactureFournisseur = actionProtegee(
  'paiements:fournisseurs:creer',
  async (session, input) => {
    const { factureId } = z.object({ factureId: z.string() }).parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: factureId },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    if (facture.statutFacture !== 'BROUILLON') {
      throw new Error('Seules les factures en brouillon peuvent être soumises');
    }

    const updated = await prisma.factureFournisseur.update({
      where: { id: factureId },
      data: { statutFacture: 'A_RECEVOIR' },
      include: {
        fournisseur: true,
        projet: true,
      },
    });

    // TODO: Notification Logistique/Chef chantier pour confirmation réception

    return { success: true, facture: updated };
  }
);

/**
 * Confirmer réception de biens/services (A_RECEVOIR → A_VALIDER)
 * Permission : paiements:fournisseurs:recevoir
 * D-01 : Pas de paiement sans réception confirmée
 */
export const confirmerReceptionFacture = actionProtegee(
  'paiements:fournisseurs:recevoir',
  async (session, input) => {
    const data = confirmerReceptionSchema.parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: data.factureId },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    if (facture.statutFacture !== 'A_RECEVOIR') {
      throw new Error(
        'Seules les factures en attente de réception peuvent être confirmées'
      );
    }

    const updated = await prisma.factureFournisseur.update({
      where: { id: data.factureId },
      data: {
        receptionConfirmee: true,
        receptionneParId: session.userId,
        receptionneLe: new Date(),
        receptionCommentaire: data.commentaire,
        statutFacture: 'A_VALIDER',
      },
      include: {
        fournisseur: true,
        projet: true,
      },
    });

    // TODO: Notification Gestionnaire

    return { success: true, facture: updated };
  }
);

/**
 * Valider une facture (Gestionnaire)
 * D-02 : Si montant > seuil → A_VALIDER_DG, sinon → A_PAYER
 * Permission : paiements:fournisseurs:valider
 */
export const validerFactureFournisseur = actionProtegee(
  'paiements:fournisseurs:valider',
  async (session, input) => {
    const data = validerFactureSchema.parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: data.factureId },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    if (facture.statutFacture !== 'A_VALIDER') {
      throw new Error(
        'Seules les factures en attente de validation peuvent être validées'
      );
    }

    if (!facture.receptionConfirmee) {
      throw new Error('La réception doit être confirmée avant validation');
    }

    const seuil = await obtenirSeuilValidationDG();
    const montantTTC = parseFloat(facture.montantTTC.toString());
    const necessiteValidationDG = montantTTC > seuil;

    const updated = await prisma.factureFournisseur.update({
      where: { id: data.factureId },
      data: {
        valideParId: session.userId,
        valideLe: new Date(),
        statutFacture: necessiteValidationDG ? 'A_VALIDER_DG' : 'A_PAYER',
      },
      include: {
        fournisseur: true,
        projet: true,
      },
    });

    // TODO: Si necessiteValidationDG → Notification DG, sinon → Notification Comptabilité

    return {
      success: true,
      facture: updated,
      necessiteValidationDG,
    };
  }
);

/**
 * Valider une facture (DG) - pour factures > seuil
 * D-02 : Double validation
 * Permission : paiements:fournisseurs:valider-dg
 */
export const validerFactureFournisseurDG = actionProtegee(
  'paiements:fournisseurs:valider-dg',
  async (session, input) => {
    const data = validerFactureSchema.parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: data.factureId },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    if (facture.statutFacture !== 'A_VALIDER_DG') {
      throw new Error(
        'Seules les factures en attente de validation DG peuvent être validées par le DG'
      );
    }

    const updated = await prisma.factureFournisseur.update({
      where: { id: data.factureId },
      data: {
        valideDgParId: session.userId,
        valideDgLe: new Date(),
        statutFacture: 'A_PAYER',
      },
      include: {
        fournisseur: true,
        projet: true,
      },
    });

    // TODO: Notification Comptabilité

    return { success: true, facture: updated };
  }
);

/**
 * Refuser une facture
 * Permission : paiements:fournisseurs:valider ou paiements:fournisseurs:valider-dg
 */
export const refuserFactureFournisseur = actionProtegee(
  'paiements:fournisseurs:valider',
  async (session, input) => {
    const data = refuserFactureSchema.parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: data.factureId },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    if (
      !['A_VALIDER', 'A_VALIDER_DG'].includes(facture.statutFacture)
    ) {
      throw new Error('Cette facture ne peut pas être refusée');
    }

    const updated = await prisma.factureFournisseur.update({
      where: { id: data.factureId },
      data: {
        statutFacture: 'REFUSEE',
        receptionCommentaire: data.motif, // On utilise ce champ pour stocker le motif de refus
      },
      include: {
        fournisseur: true,
        projet: true,
      },
    });

    return { success: true, facture: updated };
  }
);

// ═══════════════════════════════════════════════════════════════════════
// PAIEMENTS — EXÉCUTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Créer un paiement fournisseur (total ou partiel)
 * D-03 : Paiements partiels libres
 * D-06 : Preuve obligatoire
 * D-10 : Crée une DemandePaiement ITApay liée
 * Permission : paiements:fournisseurs:payer
 */
export const creerPaiementFournisseur = actionProtegee(
  'paiements:fournisseurs:payer',
  async (session, input) => {
    const data = creerPaiementSchema.parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: data.factureId },
      include: { fournisseur: true, paiements: true },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    if (!['A_PAYER', 'PARTIELLE'].includes(facture.statutFacture)) {
      throw new Error('Cette facture ne peut pas être payée');
    }

    // D-03 : Vérification montant
    const montantRestant =
      parseFloat(facture.montantTTC.toString()) -
      parseFloat(facture.montantPaye.toString());

    if (data.montantPaye > montantRestant) {
      throw new Error(
        `Le montant du paiement (${data.montantPaye}) dépasse le solde restant (${montantRestant})`
      );
    }

    // Générer référence unique
    const count = await prisma.paiementFournisseur.count();
    const reference = `PF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const paiement = await prisma.$transaction(async (tx) => {
      // 1. Créer paiement fournisseur
      const paiementFournisseur = await tx.paiementFournisseur.create({
        data: {
          reference,
          factureId: data.factureId,
          fournisseurId: facture.fournisseurId,
          montantPaye: new Decimal(data.montantPaye),
          modePaiement: data.modePaiement,
          datePaiement: data.datePaiement,
          urlPreuve: data.urlPreuve,
          statutPaiement: data.urlPreuve ? 'CONFIRME' : 'EN_ATTENTE_PREUVE',
          effectueParId: session.userId,
          creePar: session.userId,
        },
      });

      // 2. Mettre à jour montant payé sur facture
      const nouveauMontantPaye =
        parseFloat(facture.montantPaye.toString()) + data.montantPaye;
      const montantTTC = parseFloat(facture.montantTTC.toString());

      let nouveauStatut = facture.statutFacture;
      if (Math.abs(nouveauMontantPaye - montantTTC) < 0.01) {
        // Soldée (tolérance 1 centime pour erreurs d'arrondi)
        nouveauStatut = 'SOLDEE' as const;
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = 'PARTIELLE' as const;
      }

      await tx.factureFournisseur.update({
        where: { id: data.factureId },
        data: {
          montantPaye: new Decimal(nouveauMontantPaye),
          statutFacture: nouveauStatut,
        },
      });

      // TODO D-10 : Créer DemandePaiement ITApay liée
      // await tx.demandePaiement.create({ ... })

      return paiementFournisseur;
    });

    return { success: true, paiement };
  }
);

/**
 * Confirmer un paiement en ajoutant la preuve
 * D-06 : Preuve obligatoire
 * Permission : paiements:fournisseurs:payer
 */
export const confirmerPaiementFournisseur = actionProtegee(
  'paiements:fournisseurs:payer',
  async (session, input) => {
    const { paiementId, urlPreuve } = z
      .object({
        paiementId: z.string(),
        urlPreuve: z.string().url(),
      })
      .parse(input);

    const paiement = await prisma.paiementFournisseur.findUnique({
      where: { id: paiementId },
    });

    if (!paiement) {
      throw new Error('Paiement introuvable');
    }

    if (paiement.statutPaiement === 'CONFIRME') {
      throw new Error('Ce paiement est déjà confirmé');
    }

    const updated = await prisma.paiementFournisseur.update({
      where: { id: paiementId },
      data: {
        urlPreuve,
        statutPaiement: 'CONFIRME',
      },
      include: {
        facture: {
          include: {
            fournisseur: true,
          },
        },
      },
    });

    return { success: true, paiement: updated };
  }
);

// ═══════════════════════════════════════════════════════════════════════
// CONSULTATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Lister les factures fournisseurs (avec filtres)
 * Permission : paiements:fournisseurs:consulter
 */
export const listerFacturesFournisseur = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session, input) => {
    const filters = z
      .object({
        statutFacture: z.string().optional(),
        fournisseurId: z.string().optional(),
        projetId: z.string().optional(),
        dateDebut: z.date().optional(),
        dateFin: z.date().optional(),
        enRetard: z.boolean().optional(), // D-04
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
      .parse(input);

    const where: any = {};

    if (filters.statutFacture) {
      where.statutFacture = filters.statutFacture;
    }

    if (filters.fournisseurId) {
      where.fournisseurId = filters.fournisseurId;
    }

    if (filters.projetId) {
      where.projetId = filters.projetId;
    }

    if (filters.dateDebut || filters.dateFin) {
      where.dateFacture = {};
      if (filters.dateDebut) where.dateFacture.gte = filters.dateDebut;
      if (filters.dateFin) where.dateFacture.lte = filters.dateFin;
    }

    // D-04 : Factures en retard
    if (filters.enRetard) {
      where.dateEcheance = { lt: new Date() };
      where.statutFacture = { in: ['A_PAYER', 'PARTIELLE'] };
    }

    const [factures, total] = await Promise.all([
      prisma.factureFournisseur.findMany({
        where,
        include: {
          fournisseur: true,
          projet: { select: { code: true, nom: true } },
          paiements: true,
        },
        orderBy: { creeLe: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      prisma.factureFournisseur.count({ where }),
    ]);

    return { success: true, factures, total };
  }
);

/**
 * Lister les paiements fournisseurs
 * Permission : paiements:fournisseurs:consulter
 */
export const listerPaiementsFournisseur = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session, input) => {
    const filters = z
      .object({
        fournisseurId: z.string().optional(),
        factureId: z.string().optional(),
        dateDebut: z.date().optional(),
        dateFin: z.date().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
      .parse(input);

    const where: any = {};

    if (filters.fournisseurId) {
      where.fournisseurId = filters.fournisseurId;
    }

    if (filters.factureId) {
      where.factureId = filters.factureId;
    }

    if (filters.dateDebut || filters.dateFin) {
      where.datePaiement = {};
      if (filters.dateDebut) where.datePaiement.gte = filters.dateDebut;
      if (filters.dateFin) where.datePaiement.lte = filters.dateFin;
    }

    const [paiements, total] = await Promise.all([
      prisma.paiementFournisseur.findMany({
        where,
        include: {
          fournisseur: true,
          facture: {
            select: {
              reference: true,
              montantTTC: true,
            },
          },
        },
        orderBy: { creeLe: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      prisma.paiementFournisseur.count({ where }),
    ]);

    return { success: true, paiements, total };
  }
);

/**
 * Obtenir détails facture
 * Permission : paiements:fournisseurs:consulter
 */
export const getFactureFournisseur = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session, input) => {
    const { factureId } = z.object({ factureId: z.string() }).parse(input);

    const facture = await prisma.factureFournisseur.findUnique({
      where: { id: factureId },
      include: {
        fournisseur: true,
        projet: true,
        paiements: {
          orderBy: { creeLe: 'desc' },
        },
      },
    });

    if (!facture) {
      throw new Error('Facture introuvable');
    }

    return { success: true, facture };
  }
);

// ═══════════════════════════════════════════════════════════════════════
// FOURNISSEURS — FICHE ET HISTORIQUE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fiche fournisseur avec indicateurs
 * D-09 : Historique fournisseur accessible
 * Permission : paiements:fournisseurs:consulter
 */
export const getFicheFournisseur = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session, input) => {
    const { fournisseurId } = z
      .object({ fournisseurId: z.string() })
      .parse(input);

    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id: fournisseurId },
      include: {
        factures: {
          include: {
            projet: { select: { code: true, nom: true } },
            paiements: true,
          },
          orderBy: { dateFacture: 'desc' },
        },
      },
    });

    if (!fournisseur) {
      throw new Error('Fournisseur introuvable');
    }

    // D-09 : Calcul solde dû
    const soldeDu = fournisseur.factures
      .filter((f) => ['A_PAYER', 'PARTIELLE'].includes(f.statutFacture))
      .reduce((sum, f) => {
        const montantTTC = parseFloat(f.montantTTC.toString());
        const montantPaye = parseFloat(f.montantPaye.toString());
        return sum + (montantTTC - montantPaye);
      }, 0);

    const totalPaye = fournisseur.factures.reduce((sum, f) => {
      return sum + parseFloat(f.montantPaye.toString());
    }, 0);

    return {
      success: true,
      fournisseur,
      soldeDu,
      totalPaye,
      nombreFactures: fournisseur.factures.length,
    };
  }
);

/**
 * Indicateurs tableau de bord
 * Permission : paiements:fournisseurs:consulter
 */
export const getIndicateursFournisseurs = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session) => {
    const [totalDu, facturesEnRetard, facturesAPayer, payeCeMois] =
      await Promise.all([
        // Total dû (toutes factures non soldées)
        prisma.factureFournisseur.aggregate({
          where: {
            statutFacture: { in: ['A_PAYER', 'PARTIELLE'] },
          },
          _sum: { montantTTC: true, montantPaye: true },
        }),
        // D-04 : Factures en retard
        prisma.factureFournisseur.count({
          where: {
            dateEcheance: { lt: new Date() },
            statutFacture: { in: ['A_PAYER', 'PARTIELLE'] },
          },
        }),
        // Factures à payer
        prisma.factureFournisseur.count({
          where: {
            statutFacture: 'A_PAYER',
          },
        }),
        // Payé ce mois
        prisma.paiementFournisseur.aggregate({
          where: {
            datePaiement: {
              gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
            statutPaiement: 'CONFIRME',
          },
          _sum: { montantPaye: true },
        }),
      ]);

    const totalDuValue =
      (totalDu._sum.montantTTC?.toNumber() || 0) -
      (totalDu._sum.montantPaye?.toNumber() || 0);

    return {
      success: true,
      indicateurs: {
        totalDu: totalDuValue,
        facturesEnRetard,
        facturesAPayer,
        payeCeMois: payeCeMois._sum.montantPaye?.toNumber() || 0,
      },
    };
  }
);

/**
 * Factures en retard (pour alertes)
 * D-04 : Alertes échéance et retard
 * Permission : paiements:fournisseurs:consulter
 */
export const getFacturesEnRetard = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session) => {
    const factures = await prisma.factureFournisseur.findMany({
      where: {
        dateEcheance: { lt: new Date() },
        statutFacture: { in: ['A_PAYER', 'PARTIELLE'] },
      },
      include: {
        fournisseur: true,
        projet: { select: { code: true, nom: true } },
      },
      orderBy: { dateEcheance: 'asc' },
    });

    return { success: true, factures };
  }
);

/**
 * Factures proches de l'échéance (J-7)
 * D-04 : Alertes échéance
 * Permission : paiements:fournisseurs:consulter
 */
export const getFacturesProchesEcheance = actionProtegee(
  'paiements:fournisseurs:consulter',
  async (session) => {
    const dans7Jours = new Date();
    dans7Jours.setDate(dans7Jours.getDate() + 7);

    const factures = await prisma.factureFournisseur.findMany({
      where: {
        dateEcheance: {
          gte: new Date(),
          lte: dans7Jours,
        },
        statutFacture: { in: ['A_PAYER', 'PARTIELLE'] },
      },
      include: {
        fournisseur: true,
        projet: { select: { code: true, nom: true } },
      },
      orderBy: { dateEcheance: 'asc' },
    });

    return { success: true, factures };
  }
);
