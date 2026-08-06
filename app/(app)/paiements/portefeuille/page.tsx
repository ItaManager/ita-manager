/**
 * Écran du solde du portefeuille Wave
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

export const metadata = {
  title: 'Portefeuille Wave · ItaPay',
};

export default async function PagePortefeuille() {
  const session = await exigerPermission('paiement:consulter');

  if (!session) {
    redirect('/connexion');
  }

  // Statistiques des paiements
  const stats = await prisma.lignePaiement.groupBy({
    by: ['statut'],
    _count: true,
    _sum: {
      montant: true,
    },
  });

  const totalReussi = stats
    .filter((s) => s.statut === 'REUSSI')
    .reduce((acc, s) => acc + Number(s._sum.montant || 0), 0);

  const totalEnAttente = stats
    .filter((s) => s.statut === 'EN_ATTENTE')
    .reduce((acc, s) => acc + Number(s._sum.montant || 0), 0);

  const totalEchoue = stats
    .filter((s) => s.statut === 'ECHOUE')
    .reduce((acc, s) => acc + Number(s._sum.montant || 0), 0);

  const countReussi = stats.find((s) => s.statut === 'REUSSI')?._count || 0;
  const countEnAttente = stats.find((s) => s.statut === 'EN_ATTENTE')?._count || 0;
  const countEchoue = stats.find((s) => s.statut === 'ECHOUE')?._count || 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Portefeuille Wave</h1>
        <p className="text-muted-foreground mt-1">
          Informations sur le portefeuille et statistiques de paiement
        </p>
      </div>

      <div className="bg-warning-soft border border-warning/20 rounded p-4 mb-6">
        <div className="flex items-start gap-3">
          <Wallet className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-warning">Consultation du solde</h3>
            <p className="text-sm text-warning mt-1">
              L'API Wave Payout ne permet pas de consulter le solde du portefeuille.
              Consultez le portail Wave pour voir votre solde actuel.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <a
                href="https://business.wave.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir business.wave.com <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Paiements réussis</span>
          </div>
          <div className="text-2xl font-semibold">{countReussi}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalReussi.toLocaleString('fr-FR')} XOF
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-warning mb-2">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">En attente</span>
          </div>
          <div className="text-2xl font-semibold">{countEnAttente}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalEnAttente.toLocaleString('fr-FR')} XOF
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Échecs</span>
          </div>
          <div className="text-2xl font-semibold">{countEchoue}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalEchoue.toLocaleString('fr-FR')} XOF
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Informations Wave</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environnement</span>
            <Badge variant="outline">
              {process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode client</span>
            <Badge variant="outline">
              {process.env.WAVE_API_KEY ? 'Réel' : 'Simulé'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reprise automatique</span>
            <Badge variant="outline">Activée (horaire)</Badge>
          </div>
        </div>
      </Card>

      <div className="mt-6 text-xs text-muted-foreground text-center">
        Pour consulter le solde, les transactions, ou configurer le portefeuille,
        connectez-vous à business.wave.com
      </div>
    </div>
  );
}
