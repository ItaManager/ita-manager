/**
 * Export PDF des relevés de paiements
 *
 * Génère un PDF simple avec les paiements REUSSI et ANNULE
 *
 * Permission : paiement:consulter
 *
 * Note : Pour une version production, utiliser une bibliothèque comme jsPDF ou PDFKit
 * Cette version génère un HTML formaté pour impression
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
    take: 100,
  });

  // Générer HTML pour impression/PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relevés de paiements</title>
  <style>
    @page { size: A4 landscape; margin: 1cm; }
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    h1 { text-align: center; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .success { color: #16a34a; }
    .cancelled { color: #dc2626; }
    .footer { margin-top: 20px; text-align: center; font-size: 9pt; color: #666; }
  </style>
</head>
<body>
  <h1>Relevés de paiements ItaPay</h1>
  <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>

  <table>
    <thead>
      <tr>
        <th>Référence</th>
        <th>Catégorie</th>
        <th>Bénéficiaire</th>
        <th>Téléphone</th>
        <th>Montant (XOF)</th>
        <th>Statut</th>
        <th>Exécuté le</th>
      </tr>
    </thead>
    <tbody>
      ${lignes
        .map(
          (ligne) => `
      <tr>
        <td>${ligne.demandePaiement.referenceIta}</td>
        <td>${ligne.demandePaiement.categorie}</td>
        <td>${ligne.beneficiaireNom}</td>
        <td>${ligne.beneficiaireMobile}</td>
        <td style="text-align: right;">${ligne.montant.toString()}</td>
        <td class="${ligne.statut === 'REUSSI' ? 'success' : 'cancelled'}">${ligne.statut}</td>
        <td>${ligne.executeLe ? new Date(ligne.executeLe).toLocaleString('fr-FR') : '—'}</td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    ITA Manager — Module ItaPay — ${lignes.length} paiement(s)
  </div>

  <script>
    // Auto-print on load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
