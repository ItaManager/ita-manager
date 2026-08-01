/**
 * Écran des relevés de paiements
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Relevés de paiements · ItaPay',
};

export default async function PageReleves() {
  const session = await exigerPermission('paiement:consulter');

  if (!session) {
    redirect('/connexion');
  }

  // Récupérer les paiements exécutés (REUSSI ou ANNULE)
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Relevés de paiements</h1>
          <p className="text-muted-foreground mt-1">
            Historique des paiements exécutés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/exports/releves-csv" download>
              Exporter CSV
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/exports/releves-pdf" target="_blank" rel="noopener noreferrer">
              Exporter PDF
            </a>
          </Button>
        </div>
      </div>

      {lignes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun paiement exécuté
        </div>
      ) : (
        <div className="border rounded">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Référence</th>
                <th className="text-left p-3">Bénéficiaire</th>
                <th className="text-left p-3">Téléphone</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Exécuté le</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="border-t">
                  <td className="p-3 font-mono text-sm">
                    {ligne.demandePaiement.referenceIta}
                  </td>
                  <td className="p-3">{ligne.beneficiaireNom}</td>
                  <td className="p-3 font-mono text-sm">
                    {ligne.beneficiaireMobile}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {ligne.montant.toString()} XOF
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        ligne.statut === 'REUSSI'
                          ? 'default'
                          : ligne.statut === 'ANNULE'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {ligne.statut}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {ligne.executeLe
                      ? new Date(ligne.executeLe).toLocaleString('fr-FR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground text-center">
        Affichage des 100 derniers paiements
      </div>
    </div>
  );
}
