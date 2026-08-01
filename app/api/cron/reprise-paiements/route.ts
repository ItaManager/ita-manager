/**
 * Route Vercel Cron — Reprise paiements EN_ATTENTE
 *
 * Exécutée toutes les heures (ou selon configuration Vercel Cron).
 *
 * SÉCURITÉ (SECURITE-M15.md §4.2, §4.3) :
 * - Recherche préalable chez Wave avant tout rejeu
 * - Si trouvé : mise à jour (ne rien envoyer)
 * - Si absent : rejeu avec LA MÊME clé d'idempotence
 * - Délais de reprise : +1min, +5min, +15min, +1h, +6h
 *
 * Protégée par CRON_SECRET passé dans l'en-tête Authorization par Vercel.
 *
 * USAGE :
 * - Production : Vercel Cron appelle automatiquement toutes les heures
 * - Développement : curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/reprise-paiements
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { reprendreEnAttente } from '@/lib/actions/reprise-paiements';

export async function GET(request: NextRequest) {
  // Vérification du secret Vercel Cron
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized — CRON_SECRET invalide ou absent' },
      { status: 401 }
    );
  }

  const debut = new Date();

  try {
    // Appeler la fonction de reprise
    const stats = await reprendreEnAttente();

    // Journaliser l'exécution
    await prisma.journalEvenement.create({
      data: {
        entite: 'Systeme',
        entiteId: 'cron-reprise-paiements',
        action: 'TACHE_PLANIFIEE',
        auteurId: null,
        auteurNom: 'Système (Cron)',
        details: {
          tache: 'reprendreEnAttente',
          total: stats.total,
          trouves: stats.trouves,
          reussis: stats.reussis,
          echecs: stats.echecs,
          enAttente: stats.enAttente,
        },
        commentaire: `Reprise automatique : ${stats.total} paiements traités (${stats.reussis} réussis, ${stats.echecs} échecs)`,
      },
    });

    const fin = new Date();
    const duree = fin.getTime() - debut.getTime();

    return NextResponse.json({
      success: true,
      execution: {
        debut: debut.toISOString(),
        fin: fin.toISOString(),
        dureeMs: duree,
      },
      statistiques: stats,
    });
  } catch (error) {
    // Journaliser l'erreur
    await prisma.journalEvenement.create({
      data: {
        entite: 'Systeme',
        entiteId: 'cron-reprise-paiements',
        action: 'ERREUR_TACHE_PLANIFIEE',
        auteurId: null,
        auteurNom: 'Système (Cron)',
        details: {
          tache: 'reprendreEnAttente',
          erreur: error instanceof Error ? error.message : 'Erreur inconnue',
        },
        commentaire: 'Échec de la reprise automatique des paiements',
      },
    });

    const fin = new Date();
    const duree = fin.getTime() - debut.getTime();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        execution: {
          debut: debut.toISOString(),
          fin: fin.toISOString(),
          dureeMs: duree,
        },
      },
      { status: 500 }
    );
  }
}
