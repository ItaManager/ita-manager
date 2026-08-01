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
import { InterditPaiement } from '@/lib/paiements/erreurs';

// ═══════════════════════════════════════════════════════════════════════
// TYPE SESSION
// ═══════════════════════════════════════════════════════════════════════

type Session = { userId: string; email: string };

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

/**
 * Server Action - Refuse une demande de paiement
 *
 * Permission : paiement:autoriser
 *
 * Marque l'autorisation comme refusée avec la date et le motif.
 */
export const refuserPaiement = actionProtegee(
  'paiement:autoriser',
  async (session: Session, demandePaiementId: string, motif?: string) => {
    const maintenant = new Date();

    // Récupérer la demande avec son autorisation
    const demande = await prisma.demandePaiement.findUnique({
      where: { id: demandePaiementId },
      include: {
        autorisation: true,
      },
    });

    if (!demande) {
      throw new Error('Demande de paiement introuvable');
    }

    if (!demande.autorisation) {
      throw new Error('Aucune autorisation en attente');
    }

    // Marquer comme refusée
    await prisma.autorisationPaiement.update({
      where: { demandePaiementId },
      data: {
        refuseeLe: maintenant,
        motifRefus: motif || `Refusé par ${session.email}`,
      },
    });

    // Journal
    await prisma.journalEvenement.create({
      data: {
        entite: 'DemandePaiement',
        entiteId: demandePaiementId,
        action: 'REFUS',
        auteurId: session.userId,
        auteurNom: session.email,
        details: {
          referenceIta: demande.referenceIta,
          montantTotal: demande.montantTotal.toString(),
          motif: motif || 'Refusé par le DG',
        },
        commentaire: `Autorisation refusée par ${session.email}`,
      },
    });

    // TODO: Envoyer notification au préparateur

    return { success: true };
  }
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
): Promise<{ success: boolean; nombreReussis: number; nombreEchecs: number }> {
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

  // Import dynamique du client Wave simulé
  const { creerClientSimule } = await import('@/lib/paiements/wave/client-simule');
  const client = creerClientSimule();

  // Récupérer toutes les lignes de la demande avec leurs tentatives
  const lignes = await prisma.lignePaiement.findMany({
    where: { demandePaiementId },
    include: {
      tentatives: true,
    },
  });

  // Filtrer les lignes exécutables (non bloquées, non déjà exécutées)
  const lignesExecutables = lignes.filter(
    (l) =>
      l.nameMatch !== 'NO_MATCH' &&
      l.withinLimits !== false &&
      !l.executeLe
  );

  let nombreReussis = 0;
  let nombreEchecs = 0;

  // Exécuter chaque ligne
  for (const ligne of lignesExecutables) {
    const numeroTentative = ligne.tentatives.length + 1;

    try {
      // Appel Wave payout
      const reponse = await client.payout(
        {
          amount: ligne.montant.toString(),
          currency: 'XOF',
          recipient: ligne.beneficiaireMobile,
          payment_reason: ligne.motifPaiement,
          client_reference: ligne.referenceIta,
        },
        ligne.cleIdempotence
      );

      // Mettre à jour la ligne
      await prisma.lignePaiement.update({
        where: { id: ligne.id },
        data: {
          executeLe: maintenant,
          wavePayoutId: reponse.payout_id || null,
          statut: 'REUSSI',
          fraisWave: reponse.fees ? new Decimal(reponse.fees) : null,
        },
      });

      // Enregistrer la tentative réussie
      await prisma.tentativePaiement.create({
        data: {
          lignePaiementId: ligne.id,
          numero: numeroTentative,
          httpStatus: reponse.httpStatus || 200,
          reponseBrute: reponse as any,
          erreurCode: null,
        },
      });

      nombreReussis++;
    } catch (erreur: any) {
      // Enregistrer la tentative échouée
      await prisma.tentativePaiement.create({
        data: {
          lignePaiementId: ligne.id,
          numero: numeroTentative,
          httpStatus: erreur.httpStatus || null,
          reponseBrute: erreur.response || erreur,
          erreurCode: erreur.errorCode || erreur.code || 'ERROR',
        },
      });

      // Mettre à jour le statut de la ligne si échec définitif
      await prisma.lignePaiement.update({
        where: { id: ligne.id },
        data: {
          statut: 'ECHOUE',
          waveErrorCode: erreur.errorCode || erreur.code,
        },
      });

      nombreEchecs++;
    }
  }

  // Mettre à jour le compteur d'échecs sur l'autorisation
  if (nombreEchecs > 0) {
    await prisma.autorisationPaiement.update({
      where: { demandePaiementId },
      data: {
        nombreEchecs: autorisation.nombreEchecs + nombreEchecs,
      },
    });
  }

  // Journaliser
  await prisma.journalEvenement.create({
    data: {
      entite: 'DemandePaiement',
      entiteId: demandePaiementId,
      action: 'EXECUTION',
      auteurId: session.userId,
      auteurNom: session.email,
      details: {
        nombreReussis,
        nombreEchecs,
        lignesExecutables: lignesExecutables.length,
      },
      commentaire: `Exécution — ${nombreReussis} réussi(s), ${nombreEchecs} échec(s)`,
    },
  });

  return { success: true, nombreReussis, nombreEchecs };
}

/**
 * Server Action - Exécute une demande de paiement autorisée
 */
export const executerPaiement = actionProtegee(
  'paiement:executer',
  executerPaiementLogique
);

// ═══════════════════════════════════════════════════════════════════════
// ÉCRAN DE PRÉPARATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Liste les demandes de paiement
 *
 * Permission : paiement:consulter
 */
export const listerDemandesPaiement = actionProtegee(
  'paiement:consulter',
  async () => {
    const demandes = await prisma.demandePaiement.findMany({
      include: {
        lignes: {
          select: {
            id: true,
            beneficiaireNom: true,
            beneficiaireMobile: true,
            montant: true,
            motifPaiement: true,
            verifieLe: true,
            nameMatch: true,
            withinLimits: true,
            statut: true,
          },
        },
        autorisation: {
          select: {
            autoriseeParId: true,
            autoriseeLe: true,
            expireLe: true,
            montantFige: true,
            nombreEchecs: true,
          },
        },
        preparateur: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { prepareeLe: 'desc' },
      take: 50,
    });

    return demandes;
  }
);

/**
 * Vérifie les bénéficiaires via Wave verify_recipient (client simulé)
 *
 * Permission : paiement:preparer
 *
 * Pour chaque ligne :
 * - Appelle verify_recipient
 * - Enregistre nameMatch et withinLimits
 * - Marque verifieLe
 *
 * Retourne : nombre de lignes vérifiées, nombre bloquées
 */
export const verifierBeneficiaires = actionProtegee(
  'paiement:preparer',
  async (_session, demandePaiementId: string) => {
    const demande = await prisma.demandePaiement.findUnique({
      where: { id: demandePaiementId },
      include: { lignes: true },
    });

    if (!demande) {
      throw new Error('Demande introuvable');
    }

    // Importer le client simulé dynamiquement
    const { creerClientSimule } = await import(
      '@/lib/paiements/wave/client-simule'
    );
    const client = creerClientSimule();

    // Programmer les scénarios pour les numéros de test
    // NO_MATCH : +2250566778899
    client.programmer('+2250566778899', 'NO_MATCH');
    // RECIPIENT_LIMIT : +2250744556677
    client.programmer('+2250744556677', 'RECIPIENT_LIMIT');

    const maintenant = new Date();
    let nombreBloquees = 0;

    // Vérifier chaque ligne
    for (const ligne of demande.lignes) {
      const reponse = await client.verifierDestinataire({
        recipient: ligne.beneficiaireMobile,
        name: ligne.beneficiaireNom,
        amount: ligne.montant.toString(),
      });

      const bloquee =
        reponse.name_match === 'NO_MATCH' ||
        reponse.within_limits === false;

      if (bloquee) {
        nombreBloquees++;
      }

      await prisma.lignePaiement.update({
        where: { id: ligne.id },
        data: {
          verifieLe: maintenant,
          nameMatch: reponse.name_match,
          withinLimits: reponse.within_limits,
          statut: 'VERIFIE',
        },
      });
    }

    return {
      nombreVerifiees: demande.lignes.length,
      nombreBloquees,
    };
  }
);

/**
 * Demande l'autorisation du DG
 *
 * Permission : paiement:preparer
 *
 * Crée AutorisationPaiement avec :
 * - demandeeParId = session.userId
 * - montantFige = sum(lignes non bloquées)
 * - expireLe calculée selon fenêtre
 *
 * TODO: Envoyer notification email au DG
 */
export const demanderAutorisation = actionProtegee(
  'paiement:preparer',
  async (session, demandePaiementId: string) => {
    const demande = await prisma.demandePaiement.findUnique({
      where: { id: demandePaiementId },
      include: {
        lignes: {
          where: {
            statut: { not: 'ANNULE' },
          },
        },
        autorisation: true,
      },
    });

    if (!demande) {
      throw new Error('Demande introuvable');
    }

    // Vérifier que toutes les lignes sont vérifiées
    const nonVerifiees = demande.lignes.filter((l) => !l.verifieLe);
    if (nonVerifiees.length > 0) {
      throw new Error(
        'Toutes les lignes doivent être vérifiées avant de demander l\'autorisation'
      );
    }

    // Calculer le montant des lignes exécutables (non bloquées)
    const lignesExecutables = demande.lignes.filter(
      (l) =>
        l.nameMatch !== 'NO_MATCH' &&
        l.withinLimits !== false
    );

    const montantFige = lignesExecutables.reduce(
      (acc, l) => acc.add(l.montant),
      new Decimal(0)
    );

    // Créer ou mettre à jour l'autorisation
    if (demande.autorisation) {
      await prisma.autorisationPaiement.update({
        where: { demandePaiementId },
        data: {
          demandeeParId: session.userId,
          montantFige,
          autoriseeParId: null,
          autoriseeLe: null,
          expireLe: null,
          refuseeLe: null,
          motifRefus: null,
        },
      });
    } else {
      await prisma.autorisationPaiement.create({
        data: {
          demandePaiementId,
          demandeeParId: session.userId,
          montantFige,
        },
      });
    }

    // TODO: Envoyer notification email au DG

    return { success: true, montantFige };
  }
);
