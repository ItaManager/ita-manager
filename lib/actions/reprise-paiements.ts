/**
 * Reprise des paiements en attente
 *
 * SÉCURITÉ (SECURITE-M15.md §4.2) :
 * - Jamais de rejeu sans recherche préalable chez Wave
 * - Si trouvé chez Wave : mettre à jour (ne rien envoyer)
 * - Si absent chez Wave : rejouer avec LA MÊME clé d'idempotence
 *
 * USAGE :
 * - Cron job horaire : `pg_cron` Supabase ou Vercel Cron
 * - Déclenchement manuel : bouton admin
 * - Chargement écran exécution : reprise automatique
 */

import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Reprend une ligne EN_ATTENTE
 *
 * Étapes :
 * 1. Chercher chez Wave si le paiement existe (via client_reference)
 * 2. Si trouvé : mettre à jour depuis Wave (ne rien envoyer)
 * 3. Si absent : rejouer avec la même cleIdempotence
 *
 * @returns { trouve: boolean, statut: string }
 */
async function reprendreLigneEnAttente(ligneId: string): Promise<{
  trouve: boolean;
  statut: 'REUSSI' | 'ECHOUE' | 'EN_ATTENTE';
  message: string;
}> {
  const ligne = await prisma.lignePaiement.findUnique({
    where: { id: ligneId },
    include: { tentatives: true },
  });

  if (!ligne) {
    throw new Error(`Ligne ${ligneId} introuvable`);
  }

  if (ligne.statut !== 'EN_ATTENTE') {
    return {
      trouve: false,
      statut: ligne.statut as any,
      message: `Ligne déjà traitée (statut : ${ligne.statut})`,
    };
  }

  // Import dynamique du client Wave
  const { obtenirClientWaveSingleton } = await import(
    '@/lib/paiements/wave/factory'
  );
  const client = obtenirClientWaveSingleton();

  // ───────────────────────────────────────────────────────────────────
  // ÉTAPE 1 : Chercher chez Wave si le paiement existe déjà
  // ───────────────────────────────────────────────────────────────────
  try {
    const resultats = await client.rechercher(ligne.referenceIta);

    if (resultats.result && resultats.result.length > 0) {
      // Paiement trouvé chez Wave → mettre à jour depuis Wave (ne rien envoyer)
      const paiement = resultats.result[0];

      const nouveauStatut: 'REUSSI' | 'ECHOUE' | 'EN_ATTENTE' =
        paiement.status === 'succeeded'
          ? 'REUSSI'
          : paiement.status === 'failed'
            ? 'ECHOUE'
            : 'EN_ATTENTE';

      await prisma.lignePaiement.update({
        where: { id: ligne.id },
        data: {
          statut: nouveauStatut,
          wavePayoutId: paiement.payout_id || ligne.wavePayoutId,
          fraisWave: paiement.fees ? new Decimal(paiement.fees) : null,
          waveErrorCode:
            paiement.payoutError?.error_code || ligne.waveErrorCode,
          executeLe:
            nouveauStatut === 'REUSSI' ? new Date() : ligne.executeLe,
        },
      });

      // Enregistrer la tentative de récupération
      await prisma.tentativePaiement.create({
        data: {
          lignePaiementId: ligne.id,
          numero: ligne.tentatives.length + 1,
          httpStatus: 200,
          reponseBrute: paiement as any,
          erreurCode: null,
        },
      });

      return {
        trouve: true,
        statut: nouveauStatut,
        message: `Trouvé chez Wave avec statut ${paiement.status}`,
      };
    }
  } catch (erreur: any) {
    console.error(
      `Erreur recherche Wave pour ligne ${ligne.id}:`,
      erreur.message
    );
    // Continuer vers le rejeu même si la recherche échoue
  }

  // ───────────────────────────────────────────────────────────────────
  // ÉTAPE 2 : Paiement absent chez Wave → rejouer avec la MÊME clé
  // ───────────────────────────────────────────────────────────────────
  try {
    const reponse = await client.payout(
      {
        amount: ligne.montant.toString(),
        currency: 'XOF',
        recipient: ligne.beneficiaireMobile,
        payment_reason: ligne.motifPaiement,
        client_reference: ligne.referenceIta,
      },
      ligne.cleIdempotence // MÊME clé qu'à la création
    );

    // Succès
    await prisma.lignePaiement.update({
      where: { id: ligne.id },
      data: {
        statut: 'REUSSI',
        wavePayoutId: reponse.payout_id || null,
        fraisWave: reponse.fees ? new Decimal(reponse.fees) : null,
        executeLe: new Date(),
      },
    });

    // Enregistrer la tentative réussie
    await prisma.tentativePaiement.create({
      data: {
        lignePaiementId: ligne.id,
        numero: ligne.tentatives.length + 1,
        httpStatus: reponse.httpStatus || 200,
        reponseBrute: reponse as any,
        erreurCode: null,
      },
    });

    return {
      trouve: false,
      statut: 'REUSSI',
      message: 'Rejeu réussi',
    };
  } catch (erreur: any) {
    // Enregistrer la tentative échouée
    await prisma.tentativePaiement.create({
      data: {
        lignePaiementId: ligne.id,
        numero: ligne.tentatives.length + 1,
        httpStatus: erreur.httpStatus || null,
        reponseBrute: erreur.response || erreur,
        erreurCode: erreur.errorCode || erreur.code || 'ERROR',
      },
    });

    // Déterminer si c'est un échec définitif ou temporaire
    const estEchecDefinitif = [
      'insufficient-funds',
      'recipient-limit-exceeded',
      'recipient-account-blocked',
      'request-validation-error',
    ].includes(erreur.errorCode);

    if (estEchecDefinitif) {
      await prisma.lignePaiement.update({
        where: { id: ligne.id },
        data: {
          statut: 'ECHOUE',
          waveErrorCode: erreur.errorCode || erreur.code,
        },
      });

      return {
        trouve: false,
        statut: 'ECHOUE',
        message: `Échec définitif: ${erreur.errorCode}`,
      };
    }

    // Erreur temporaire → reste EN_ATTENTE
    return {
      trouve: false,
      statut: 'EN_ATTENTE',
      message: `Erreur temporaire: ${erreur.errorCode || erreur.message}`,
    };
  }
}

/**
 * Reprend toutes les lignes EN_ATTENTE
 *
 * USAGE :
 * - Cron horaire : appelle cette fonction
 * - Écran admin : bouton "Reprendre les paiements en attente"
 *
 * @returns Statistiques de reprise
 */
export async function reprendreEnAttente(): Promise<{
  total: number;
  trouves: number;
  reussis: number;
  echecs: number;
  enAttente: number;
}> {
  // Récupérer toutes les lignes EN_ATTENTE
  const lignes = await prisma.lignePaiement.findMany({
    where: { statut: 'EN_ATTENTE' },
    select: { id: true, referenceIta: true },
  });

  const stats = {
    total: lignes.length,
    trouves: 0,
    reussis: 0,
    echecs: 0,
    enAttente: 0,
  };

  // Traiter chaque ligne
  for (const ligne of lignes) {
    try {
      const resultat = await reprendreLigneEnAttente(ligne.id);

      if (resultat.trouve) stats.trouves++;
      if (resultat.statut === 'REUSSI') stats.reussis++;
      if (resultat.statut === 'ECHOUE') stats.echecs++;
      if (resultat.statut === 'EN_ATTENTE') stats.enAttente++;

      console.log(
        `[Reprise] ${ligne.referenceIta} — ${resultat.message}`
      );
    } catch (erreur: any) {
      console.error(
        `[Reprise] Erreur ${ligne.referenceIta}:`,
        erreur.message
      );
      stats.enAttente++; // En cas d'erreur, reste EN_ATTENTE
    }
  }

  return stats;
}

/**
 * Vérifie si une ligne EN_ATTENTE doit être reprise
 *
 * Délais de reprise (SECURITE-M15.md §4.3) :
 * - +1 min · +5 min · +15 min · +1 h · +6 h
 * - Au-delà de 24h → anomalie critique
 *
 * @returns true si la ligne doit être reprise
 */
export async function doitReprendreLigne(ligneId: string): Promise<boolean> {
  const ligne = await prisma.lignePaiement.findUnique({
    where: { id: ligneId },
    include: { tentatives: { orderBy: { createdAt: 'desc' } } },
  });

  if (!ligne || ligne.statut !== 'EN_ATTENTE') {
    return false;
  }

  // Si pas de tentative, on peut reprendre immédiatement
  if (ligne.tentatives.length === 0) {
    return true;
  }

  const derniereTentative = ligne.tentatives[0];
  const maintenant = new Date();
  const ecouleSec =
    (maintenant.getTime() - derniereTentative.createdAt.getTime()) / 1000;

  // Délais de reprise selon le numéro de tentative
  const delais = [
    60, // Tentative 1 : +1 min
    300, // Tentative 2 : +5 min
    900, // Tentative 3 : +15 min
    3600, // Tentative 4 : +1 h
    21600, // Tentative 5 : +6 h
  ];

  const numeroTentative = ligne.tentatives.length;

  if (numeroTentative >= delais.length) {
    // Plus de 5 tentatives → anomalie critique, ne plus reprendre automatiquement
    return false;
  }

  const delaiRequis = delais[numeroTentative - 1];
  return ecouleSec >= delaiRequis;
}
