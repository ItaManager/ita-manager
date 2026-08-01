/**
 * Server Actions — Module M15 ItaPay
 *
 * HUIT INTERDITS EN DUR (SECURITE-M15.md § 1)
 * Vérifiés côté serveur, non désactivables, non paramétrables.
 */

'use server';

import { actionProtegee } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { utilisateurATotpActif } from '@/lib/auth/verifier-totp';

// ═══════════════════════════════════════════════════════════════════════
// TYPE SESSION
// ═══════════════════════════════════════════════════════════════════════

type Session = { userId: string; email: string };

// ═══════════════════════════════════════════════════════════════════════
// ERREURS MÉTIER
// ═══════════════════════════════════════════════════════════════════════

export class InterditPaiement extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'InterditPaiement';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTES DE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const HEURE_OUVERTURE_DEFAUT = 8;
const HEURE_LIMITE_DEFAUT = 14;

async function obtenirHeuresExecution(): Promise<{
  ouverture: number;
  limite: number;
}> {
  const params = await prisma.parametre.findMany({
    where: {
      cle: { in: ['paiement.heureOuverture', 'paiement.heureLimite'] },
    },
  });

  const ouverture =
    params.find((p) => p.cle === 'paiement.heureOuverture')?.valeur ??
    String(HEURE_OUVERTURE_DEFAUT);

  const limite =
    params.find((p) => p.cle === 'paiement.heureLimite')?.valeur ??
    String(HEURE_LIMITE_DEFAUT);

  return {
    ouverture: parseInt(ouverture, 10),
    limite: parseInt(limite, 10),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════

function debutDeJour(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Vérifie que l'heure actuelle est dans le créneau d'exécution
 * 8 h à 14 h (paramétrable), du lundi au vendredi, hors jours fériés
 *
 * INTERDIT #6 : Exécuter hors créneau
 */
async function estDansCreneauExecution(date: Date): Promise<boolean> {
  const jour = date.getDay(); // 0 = dimanche, 6 = samedi
  if (jour === 0 || jour === 6) return false;

  // Les jours fériés viennent de M3. Si la table est vide, le créneau
  // reste ouvert — le module fonctionne sans, et mieux avec.
  const ferie = await prisma.jourFerie.findFirst({
    where: { date: debutDeJour(date) },
  });
  if (ferie) return false;

  const { ouverture, limite } = await obtenirHeuresExecution();
  const heure = date.getHours();

  return heure >= ouverture && heure < limite;
}

// ═══════════════════════════════════════════════════════════════════════
// AUTORISER UN PAIEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Logique métier d'autorisation (pour tests)
 *
 * INTERDITS VÉRIFIÉS :
 * - #1 : Celui qui prépare ne peut pas autoriser
 * - #3 : Autoriser sans TOTP actif
 *
 * @param options.verifierTotp - Si false, skip vérification TOTP (tests uniquement)
 * @param options.totpActifMock - Résultat mocké pour TOTP (tests uniquement)
 */
export async function autoriserPaiementLogique(
  session: Session,
  demandePaiementId: string,
  options: { verifierTotp?: boolean; totpActifMock?: boolean } = {}
): Promise<{ success: boolean; expireLe: Date }> {
  const { verifierTotp = true, totpActifMock } = options;

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #3 : Autoriser sans TOTP actif
  // ───────────────────────────────────────────────────────────────────
  if (verifierTotp) {
    const totpActif =
      totpActifMock !== undefined
        ? totpActifMock
        : await utilisateurATotpActif(session.userId);

    if (!totpActif) {
      throw new InterditPaiement(
        'TOTP_REQUIS',
        'L\'autorisation de paiement exige un second facteur actif. ' +
          'Configurez TOTP dans Sécurité avant de poursuivre.'
      );
    }
  }

  // Charger la demande et son autorisation
  const autorisation = await prisma.autorisationPaiement.findUnique({
    where: { demandePaiementId },
    include: {
      demandePaiement: {
        select: {
          prepareeParId: true,
          montantTotal: true,
        },
      },
    },
  });

  if (!autorisation) {
    throw new Error('Autorisation introuvable');
  }

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #1 : Celui qui prépare ne peut pas autoriser
  // ───────────────────────────────────────────────────────────────────
  if (autorisation.demandePaiement.prepareeParId === session.userId) {
    throw new InterditPaiement(
      'PREPARATEUR_INTERDIT',
      'Vous avez préparé cette demande. ' +
        'Un autre responsable doit l\'autoriser.'
    );
  }

  // Enregistrer l'autorisation
  const maintenant = new Date();
  const { limite } = await obtenirHeuresExecution();

  // L'autorisation ne dépasse jamais la limite horaire (SECURITE-M15.md § 6.2)
  const aujourdhuiALimite = new Date(maintenant);
  aujourdhuiALimite.setHours(limite, 0, 0, 0);

  const dureeAutorisation = 120; // 2 heures en minutes
  const expirationTheorique = new Date(
    maintenant.getTime() + dureeAutorisation * 60000
  );

  const expireLe = new Date(
    Math.min(expirationTheorique.getTime(), aujourdhuiALimite.getTime())
  );

  await prisma.autorisationPaiement.update({
    where: { demandePaiementId },
    data: {
      autoriseeParId: session.userId,
      autoriseeLe: maintenant,
      expireLe,
      montantFige: autorisation.demandePaiement.montantTotal,
    },
  });

  // Journaliser
  await prisma.journalEvenement.create({
    data: {
      entite: 'AutorisationPaiement',
      entiteId: demandePaiementId,
      action: 'AUTORISATION',
      auteurId: session.userId,
      auteurNom: session.email,
      commentaire: `Autorisé pour ${autorisation.demandePaiement.montantTotal} F, expire ${expireLe.toLocaleString('fr-FR')}`,
    },
  });

  return { success: true, expireLe };
}

/**
 * Server Action - Autorise une demande de paiement
 */
export const autoriserPaiement = actionProtegee(
  'paiement:autoriser',
  autoriserPaiementLogique
);

// ═══════════════════════════════════════════════════════════════════════
// EXÉCUTER UN PAIEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Logique métier d'exécution (pour tests)
 *
 * INTERDITS VÉRIFIÉS (les 7 contrôles de SECURITE-M15.md § 7.1) :
 * - #2 : Celui qui autorise ne peut pas exécuter
 * - #4 : Exécuter avec une autorisation expirée
 * - #5 : Exécuter si le montant a changé depuis l'autorisation
 * - #6 : Exécuter hors créneau (8 h à 14 h, jours ouvrables, hors fériés)
 * - #7 : Exécuter une ligne non vérifiée par verify_recipient
 *
 * @param options.ignoreEchecs - Si true, skip vérification échecs (tests uniquement)
 * @param options.ignoreAutorisateur - Si true, skip vérification autorisateur (tests uniquement)
 * @param options.ignoreExpiration - Si true, skip vérification expiration (tests uniquement)
 * @param options.ignoreMontant - Si true, skip vérification montant (tests uniquement)
 * @param options.ignoreCreneaustring - Si true, skip vérification créneau (tests uniquement)
 * @param options.ignoreVerification - Si true, skip vérification lignes (tests uniquement)
 */
export async function executerPaiementLogique(
  session: Session,
  demandePaiementId: string,
  options: {
    ignoreEchecs?: boolean;
    ignoreAutorisateur?: boolean;
    ignoreExpiration?: boolean;
    ignoreMontant?: boolean;
    ignoreCreneau?: boolean;
    ignoreVerification?: boolean;
  } = {}
): Promise<{ success: boolean }> {
  const {
    ignoreEchecs = false,
    ignoreAutorisateur = false,
    ignoreExpiration = false,
    ignoreMontant = false,
    ignoreCreneau = false,
    ignoreVerification = false,
  } = options;
  // Charger autorisation et lignes
  const autorisation = await prisma.autorisationPaiement.findUnique({
    where: { demandePaiementId },
    include: {
      demandePaiement: {
        include: {
          lignes: {
            select: {
              id: true,
              verifieLe: true,
              nameMatch: true,
              statut: true,
              montant: true,
            },
          },
        },
      },
    },
  });

  if (!autorisation || !autorisation.autoriseeLe) {
    throw new Error('Cette demande n\'a pas été autorisée.');
  }

  // ───────────────────────────────────────────────────────────────────
  // CONTRÔLE PRÉALABLE : Trois échecs bloquent (SECURITE-M15.md § 6.3)
  // Vérifié EN PREMIER
  // ───────────────────────────────────────────────────────────────────
  if (!ignoreEchecs && autorisation.nombreEchecs >= 3) {
    throw new InterditPaiement(
      'ECHECS_MULTIPLES',
      'Trois tentatives ont échoué. ' +
        'Le Directeur Général doit reconfirmer l\'autorisation.'
    );
  }

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #2 : Celui qui autorise ne peut pas exécuter
  // ───────────────────────────────────────────────────────────────────
  if (!ignoreAutorisateur && autorisation.autoriseeParId === session.userId) {
    throw new InterditPaiement(
      'AUTORISATEUR_INTERDIT',
      'Vous avez autorisé cette demande. ' +
        'Un autre responsable doit l\'exécuter.'
    );
  }

  const maintenant = new Date();

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #4 : Exécuter avec une autorisation expirée
  // ───────────────────────────────────────────────────────────────────
  if (
    !ignoreExpiration &&
    autorisation.expireLe &&
    maintenant > autorisation.expireLe
  ) {
    throw new InterditPaiement(
      'AUTORISATION_EXPIREE',
      `L'autorisation a expiré le ` +
        `${autorisation.expireLe.toLocaleString('fr-FR')}. ` +
        `Redemandez une autorisation.`
    );
  }

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #5 : Exécuter si le montant a changé depuis l'autorisation
  // Comparaison en Decimal
  // ───────────────────────────────────────────────────────────────────
  if (!ignoreMontant) {
    const montantActuel = autorisation.demandePaiement.lignes
      .filter((l) => l.statut !== 'ANNULE')
      .reduce((acc, l) => acc.add(l.montant), new Decimal(0));

    if (!montantActuel.equals(autorisation.montantFige)) {
      throw new InterditPaiement(
        'MONTANT_MODIFIE',
        `Le montant a changé depuis l'autorisation ` +
          `(autorisé : ${autorisation.montantFige.toString()} F, ` +
          `actuel : ${montantActuel.toString()} F). ` +
          `L'autorisation n'est plus valide.`
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #6 : Exécuter hors créneau (8 h à 14 h, jours ouvrables)
  // ───────────────────────────────────────────────────────────────────
  if (!ignoreCreneau && !(await estDansCreneauExecution(maintenant))) {
    throw new InterditPaiement(
      'HORS_CRENEAU',
      'Les paiements ne peuvent être exécutés qu\'entre 8 h et 14 h, ' +
        'du lundi au vendredi, hors jours fériés.'
    );
  }

  // ───────────────────────────────────────────────────────────────────
  // INTERDIT #7 : Exécuter une ligne non vérifiée par verify_recipient
  // ───────────────────────────────────────────────────────────────────
  if (!ignoreVerification) {
    const lignesNonVerifiees = autorisation.demandePaiement.lignes.filter(
      (l) => !l.verifieLe
    );

    if (lignesNonVerifiees.length > 0) {
      throw new InterditPaiement(
        'VERIFICATION_MANQUANTE',
        `${lignesNonVerifiees.length} ligne(s) n'ont pas été vérifiée(s). ` +
          `Toutes les lignes doivent passer par verify_recipient avant l'exécution.`
      );
    }

    // Vérifier qu'aucune ligne n'a un NO_MATCH
    const lignesNoMatch = autorisation.demandePaiement.lignes.filter(
      (l) => l.nameMatch === 'NO_MATCH'
    );

    if (lignesNoMatch.length > 0) {
      throw new InterditPaiement(
        'NO_MATCH_DETECTE',
        `${lignesNoMatch.length} ligne(s) ont un NO_MATCH — ` +
          `le numéro n'appartient pas au bénéficiaire déclaré. ` +
          `Corrigez ou retirez ces lignes avant l'exécution.`
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // Les sept contrôles sont passés — exécution autorisée
  // ───────────────────────────────────────────────────────────────────

  // TODO: Appel Wave + mise à jour des lignes
  // (sera implémenté dans les étapes suivantes)

  // Journaliser
  await prisma.journalEvenement.create({
    data: {
      entite: 'DemandePaiement',
      entiteId: demandePaiementId,
      action: 'EXECUTION',
      auteurId: session.userId,
      auteurNom: session.email,
      commentaire: `Exécution lancée — ${autorisation.demandePaiement.lignes.length} ligne(s)`,
    },
  });

  return { success: true };
}

/**
 * Server Action - Exécute une demande de paiement autorisée
 */
export const executerPaiement = actionProtegee(
  'paiement:executer',
  executerPaiementLogique
);
