/**
 * Écran des anomalies de paiement
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'Anomalies · ItaPay',
};

export default async function PageAnomalies() {
  const session = await exigerPermission('paiement:preparer');

  if (!session) {
    redirect('/connexion');
  }

  // Récupérer les paiements en erreur ou en attente
  const lignesProbleme = await prisma.lignePaiement.findMany({
    where: {
      OR: [
        { statut: 'EN_ATTENTE' },
        { statut: 'ECHOUE' },
      ],
    },
    include: {
      demandePaiement: {
        select: {
          referenceIta: true,
          categorie: true,
        },
      },
      tentatives: {
        orderBy: {
          envoyeeLe: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      id: 'desc',
    },
    take: 50,
  });

  // Séparer par type
  const enAttente = lignesProbleme.filter((l) => l.statut === 'EN_ATTENTE');
  const echecs = lignesProbleme.filter((l) => l.statut === 'ECHOUE');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Anomalies</h1>
        <p className="text-muted-foreground mt-1">
          Paiements en erreur ou en attente de reprise
        </p>
      </div>

      <div className="grid gap-6">
        {/* Paiements EN_ATTENTE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold">
              Paiements en attente ({enAttente.length})
            </h2>
          </div>

          {enAttente.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded">
              Aucun paiement en attente
            </div>
          ) : (
            <div className="border rounded">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Référence</th>
                    <th className="text-left p-3">Bénéficiaire</th>
                    <th className="text-right p-3">Montant</th>
                    <th className="text-left p-3">Tentatives</th>
                    <th className="text-left p-3">Dernière erreur</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enAttente.map((ligne) => (
                    <tr key={ligne.id} className="border-t">
                      <td className="p-3 font-mono text-sm">
                        {ligne.demandePaiement.referenceIta}
                      </td>
                      <td className="p-3">{ligne.beneficiaireNom}</td>
                      <td className="p-3 text-right font-semibold">
                        {ligne.montant.toString()} XOF
                      </td>
                      <td className="p-3">
                        {ligne.tentatives.length} tentative(s)
                      </td>
                      <td className="p-3 text-sm">
                        {ligne.waveErrorCode || '—'}
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="outline">
                          Rejouer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paiements ECHOUE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">
              Paiements échoués ({echecs.length})
            </h2>
          </div>

          {echecs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded">
              Aucun paiement échoué
            </div>
          ) : (
            <div className="border rounded">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Référence</th>
                    <th className="text-left p-3">Bénéficiaire</th>
                    <th className="text-right p-3">Montant</th>
                    <th className="text-left p-3">Code erreur</th>
                    <th className="text-left p-3">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {echecs.map((ligne) => (
                    <tr key={ligne.id} className="border-t">
                      <td className="p-3 font-mono text-sm">
                        {ligne.demandePaiement.referenceIta}
                      </td>
                      <td className="p-3">{ligne.beneficiaireNom}</td>
                      <td className="p-3 text-right font-semibold">
                        {ligne.montant.toString()} XOF
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {ligne.waveErrorCode || '—'}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {ligne.waveErrorCode === 'insufficient-funds'
                          ? 'Solde insuffisant'
                          : ligne.waveErrorCode === 'recipient-limit-exceeded'
                          ? 'Plafond destinataire atteint'
                          : ligne.waveErrorCode === 'recipient-account-blocked'
                          ? 'Compte destinataire bloqué'
                          : 'Erreur inconnue'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground text-center">
        Les paiements EN_ATTENTE sont automatiquement repris toutes les heures
      </div>
    </div>
  );
}
