/**
 * Export CSV des relevés de paiements
 *
 * Génère un fichier CSV avec les paiements REUSSI et ANNULE
 *
 * Permission : paiement:consulter
 */

import { NextRequest, NextResponse } from 'next/server';
import { exigerPermission } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  // Vérification permission
  const session = await exigerPermission('paiement:consulter');

  if (!session) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  // Récupérer les paiements
  const lignes = await prisma.lignePaiement.findMany({
    where: {
      statut: {
        in: ['REUSSI', 'ANNULE'],
      },
    },
    include: {
      demandePaiement: {
        select: {
          referenceIta: true,
          categorie: true,
        },
      },
    },
    orderBy: {
      executeLe: 'desc',
    },
    take: 1000, // Limiter à 1000 pour éviter timeout
  });

  // Générer CSV
  const headers = [
    'Référence',
    'Catégorie',
    'Bénéficiaire',
    'Téléphone',
    'Montant (XOF)',
    'Statut',
    'Exécuté le',
    'ID Paiement Wave',
  ];

  const rows = lignes.map((ligne) => [
    ligne.demandePaiement.referenceIta,
    ligne.demandePaiement.categorie,
    ligne.beneficiaireNom,
    ligne.beneficiaireMobile,
    ligne.montant.toString(),
    ligne.statut,
    ligne.executeLe ? new Date(ligne.executeLe).toLocaleString('fr-FR') : '',
    ligne.wavePayoutId || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Retourner CSV avec en-têtes appropriés
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="releves-paiements-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
