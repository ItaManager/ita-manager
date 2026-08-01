/**
 * Composant client — Exécution de paiement
 *
 * BANDEAU DANGER PERMANENT : ATTENTION ARGENT RÉEL
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Ban, CheckCircle, Play, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { executerPaiement } from '@/lib/actions/paiements';

type NameMatch = 'MATCH' | 'NO_MATCH' | 'NAME_NOT_KNOWN' | null;

type Ligne = {
  id: string;
  beneficiaireNom: string;
  beneficiaireMobile: string;
  montant: number;
  motifPaiement: string;
  referenceIta: string;
  verifieLe: Date | null;
  nameMatch: NameMatch;
  withinLimits: boolean | null;
  statut: string;
  executeLe: Date | null;
  wavePayoutId: string | null;
};

type Demande = {
  id: string;
  referenceIta: string;
  categorie: string;
  sourceType: string;
  montantTotal: number;
  prepareeLe: Date;
  lignes: Ligne[];
  autorisation: {
    demandeeParId: string;
    demandeeLe: Date;
    montantFige: number;
    nombreEchecs: number;
    autoriseeParId: string | null;
    autoriseeLe: Date | null;
    expireLe: Date | null;
  } | null;
  preparateur: {
    email: string;
  };
};

type Props = {
  demande: Demande;
  session: { userId: string; email: string };
};

function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' F';
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BadgeStatut({ ligne }: { ligne: Ligne }) {
  if (ligne.executeLe && ligne.wavePayoutId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="border-success text-success">
              <CheckCircle className="mr-1 h-3 w-3" />
              Exécuté
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Payé le {formatDate(ligne.executeLe)}
            <br />
            Wave ID: {ligne.wavePayoutId}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (ligne.nameMatch === 'NO_MATCH' || ligne.withinLimits === false) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              <Ban className="mr-1 h-3 w-3" />
              Bloqué
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {ligne.nameMatch === 'NO_MATCH'
              ? 'Nom différent chez Wave'
              : 'Plafond atteint'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline">
      <Clock className="mr-1 h-3 w-3" />
      En attente
    </Badge>
  );
}

export default function ExecutionClient({ demande, session }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const lignesExecutables = demande.lignes.filter(
    (l) =>
      l.nameMatch !== 'NO_MATCH' &&
      l.withinLimits !== false &&
      !l.executeLe
  );

  const lignesExecutees = demande.lignes.filter((l) => l.executeLe !== null);

  const montantExecutable = lignesExecutables.reduce((acc, l) => acc + l.montant, 0);
  const montantExecute = lignesExecutees.reduce((acc, l) => acc + l.montant, 0);

  const toutExecute = lignesExecutables.length === 0;

  const autorisationExpiree = demande.autorisation?.expireLe
    ? new Date(demande.autorisation.expireLe) < new Date()
    : false;

  async function handleExecuter() {
    if (autorisationExpiree) {
      toast.error('Autorisation expirée', {
        description: "Demandez une nouvelle autorisation au DG",
      });
      return;
    }

    startTransition(async () => {
      try {
        const resultat = await executerPaiement(demande.id);

        toast.success('Paiement exécuté', {
          description: `${resultat.nombreReussis} paiement(s) effectué(s)`,
        });

        // Recharger la page pour voir les mises à jour
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error: any) {
        toast.error('Erreur', {
          description: error.message || "Impossible d'exécuter",
        });
      }
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* BANDEAU DANGER PERMANENT */}
      <Alert variant="destructive" className="border-2 border-destructive sticky top-16 z-10 shadow-lg bg-destructive/10 backdrop-blur-sm">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">ATTENTION : ARGENT RÉEL</AlertTitle>
        <AlertDescription className="text-sm">
          Les paiements sont <strong>IRRÉVERSIBLES</strong>. Vérifiez tous les montants
          et numéros avant d'exécuter.
        </AlertDescription>
      </Alert>

      {/* En-tête */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Exécution de paiement</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Référence</span>
            <div className="font-medium">{demande.referenceIta}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Catégorie</span>
            <div className="font-medium">{demande.categorie}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Source</span>
            <div className="font-medium">{demande.sourceType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Préparé par</span>
            <div className="font-medium">{demande.preparateur.email}</div>
          </div>
        </div>

        {demande.autorisation && (
          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Autorisé le</span>
              <span className="font-medium">
                {formatDate(demande.autorisation.autoriseeLe)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expire le</span>
              <span className={`font-medium ${autorisationExpiree ? 'text-destructive' : ''}`}>
                {formatDate(demande.autorisation.expireLe)}
                {autorisationExpiree && ' ⚠️ EXPIRÉ'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Progression */}
      <Card className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Montant autorisé</span>
          <span className="text-lg font-semibold">
            {formatMontant(demande.autorisation?.montantFige || 0)}
          </span>
        </div>

        {lignesExecutees.length > 0 && (
          <div className="flex justify-between items-center text-sm text-success">
            <span>Déjà exécuté ({lignesExecutees.length})</span>
            <span>{formatMontant(montantExecute)}</span>
          </div>
        )}

        {lignesExecutables.length > 0 && (
          <div className="flex justify-between items-center text-sm text-primary">
            <span>Reste à exécuter ({lignesExecutables.length})</span>
            <span>{formatMontant(montantExecutable)}</span>
          </div>
        )}

        {toutExecute && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Tous les paiements ont été exécutés avec succès.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Autorisation expirée */}
      {autorisationExpiree && !toutExecute && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Autorisation expirée</strong>
            <br />
            Demandez une nouvelle autorisation au DG pour exécuter les paiements restants.
          </AlertDescription>
        </Alert>
      )}

      {/* Tableau des bénéficiaires */}
      <Card className="p-6">
        <div className="text-sm font-medium mb-4">
          Bénéficiaires ({demande.lignes.length})
        </div>
        <div className="overflow-x-auto -mx-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demande.lignes.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell>
                    <div className="font-medium">{ligne.beneficiaireNom}</div>
                    <div className="text-xs text-muted-foreground">
                      {ligne.beneficiaireMobile}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMontant(ligne.montant)}
                  </TableCell>
                  <TableCell>
                    <BadgeStatut ligne={ligne} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Bouton d'exécution */}
      {!toutExecute && (
        <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
          <Button
            variant="outline"
            onClick={() => router.push('/paiements')}
          >
            Annuler
          </Button>
          <Button
            className="bg-destructive hover:bg-destructive/90"
            onClick={handleExecuter}
            disabled={isPending || autorisationExpiree || lignesExecutables.length === 0}
          >
            {isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Exécution en cours…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Exécuter le paiement ({lignesExecutables.length})
              </>
            )}
          </Button>
        </div>
      )}

      {toutExecute && (
        <div className="flex justify-end">
          <Button onClick={() => router.push('/paiements')}>
            Retour aux paiements
          </Button>
        </div>
      )}
    </div>
  );
}
