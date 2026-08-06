/**
 * Composant client — Autorisation de paiement
 *
 * UI mobile-first 420px
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, Ban, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { autoriserPaiement, refuserPaiement } from '@/lib/actions/paiements';

type NameMatch = 'MATCH' | 'NO_MATCH' | 'NAME_NOT_KNOWN' | null;

type Ligne = {
  id: string;
  beneficiaireNom: string;
  beneficiaireMobile: string;
  montant: number;
  motifPaiement: string;
  verifieLe: Date | null;
  nameMatch: NameMatch;
  withinLimits: boolean | null;
  statut: string;
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

function BadgeVerification({
  nameMatch,
  withinLimits,
}: {
  nameMatch: NameMatch;
  withinLimits: boolean | null;
}) {
  if (nameMatch === 'NO_MATCH') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              <Ban className="mr-1 h-3 w-3" />
              Nom différent
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">
            Wave connaît ce numéro sous un autre nom. Ne pas payer sans vérifier l'identité.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (withinLimits === false) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              <Ban className="mr-1 h-3 w-3" />
              Plafond atteint
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">
            Le plafond de transaction du bénéficiaire est atteint. Paiement impossible.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (nameMatch === 'NAME_NOT_KNOWN') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="border-warning text-warning">
              <AlertCircle className="mr-1 h-3 w-3" />
              Compte non vérifié
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">
            Wave ne connaît pas le nom de ce compte. Paiement possible mais prudence.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (nameMatch === 'MATCH') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="border-success text-success">
              <CheckCircle className="mr-1 h-3 w-3" />
              Vérifié
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Identité vérifiée par Wave</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <Badge variant="outline">Non vérifié</Badge>;
}

export default function AutorisationClient({ demande, session }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'autoriser' | 'refuser' | null>(null);

  const lignesBloquees = demande.lignes.filter(
    (l) => l.nameMatch === 'NO_MATCH' || l.withinLimits === false
  );

  const lignesExecutables = demande.lignes.filter(
    (l) => l.nameMatch !== 'NO_MATCH' && l.withinLimits !== false
  );

  const montantExecutable = lignesExecutables.reduce((acc, l) => acc + l.montant, 0);

  const dejaAutorisee = demande.autorisation?.autoriseeParId !== null;

  async function handleAutoriser() {
    setAction('autoriser');
    startTransition(async () => {
      try {
        await autoriserPaiement(demande.id);
        toast.success('Autorisation accordée', {
          description: `${formatMontant(montantExecutable)} autorisés pour 2 heures`,
        });
        setTimeout(() => {
          router.push('/paiements');
        }, 2000);
      } catch (error: any) {
        toast.error('Erreur', {
          description: error.message || "Impossible d'autoriser",
        });
      } finally {
        setAction(null);
      }
    });
  }

  async function handleRefuser() {
    setAction('refuser');
    startTransition(async () => {
      try {
        await refuserPaiement(demande.id);
        toast.success('Autorisation refusée', {
          description: 'Le préparateur sera notifié',
        });
        setTimeout(() => {
          router.push('/paiements');
        }, 2000);
      } catch (error: any) {
        toast.error('Erreur', {
          description: error.message || 'Impossible de refuser',
        });
      } finally {
        setAction(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Autorisation de paiement</h1>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Référence</span>
            <span className="font-medium">{demande.referenceIta}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Catégorie</span>
            <span className="font-medium">{demande.categorie}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium">{demande.sourceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Préparé par</span>
            <span className="font-medium">{demande.preparateur.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Préparé le</span>
            <span className="font-medium">{formatDate(demande.prepareeLe)}</span>
          </div>
        </div>
      </Card>

      {/* Montants */}
      <Card className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Montant total</span>
          <span className="text-lg font-semibold">{formatMontant(demande.montantTotal)}</span>
        </div>

        {lignesBloquees.length > 0 && (
          <>
            <div className="flex justify-between items-center text-sm text-destructive">
              <span>Bénéficiaires bloqués ({lignesBloquees.length})</span>
              <span>
                −{' '}
                {formatMontant(
                  lignesBloquees.reduce((acc, l) => acc + l.montant, 0)
                )}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Montant exécutable</span>
                <span className="text-lg font-semibold text-success">
                  {formatMontant(montantExecutable)}
                </span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Bénéficiaires bloqués */}
      {lignesBloquees.length > 0 && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertDescription>
            <strong>{lignesBloquees.length} bénéficiaire(s) bloqué(s)</strong>
            <br />
            Ces bénéficiaires ne seront pas payés. Vérifier ci-dessous.
          </AlertDescription>
        </Alert>
      )}

      {/* Tableau des bénéficiaires */}
      <Card className="p-4">
        <div className="text-sm font-medium mb-3">
          Bénéficiaires ({demande.lignes.length})
        </div>
        <div className="overflow-x-auto -mx-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nom</TableHead>
                <TableHead className="text-xs">Montant</TableHead>
                <TableHead className="text-xs">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demande.lignes.map((ligne) => {
                const estBloquee =
                  ligne.nameMatch === 'NO_MATCH' || ligne.withinLimits === false;
                return (
                  <TableRow
                    key={ligne.id}
                    className={estBloquee ? 'bg-destructive/5' : undefined}
                  >
                    <TableCell className="text-xs">
                      <div className="font-medium">{ligne.beneficiaireNom}</div>
                      <div className="text-muted-foreground">
                        {ligne.beneficiaireMobile}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatMontant(ligne.montant)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <BadgeVerification
                        nameMatch={ligne.nameMatch}
                        withinLimits={ligne.withinLimits}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Boutons d'action */}
      {dejaAutorisee ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Paiement déjà autorisé le{' '}
            {formatDate(demande.autorisation!.autoriseeLe)}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleRefuser}
            disabled={isPending}
          >
            {action === 'refuser' ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Refus…
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Refuser
              </>
            )}
          </Button>
          <Button
            className="bg-success hover:bg-success/90"
            onClick={handleAutoriser}
            disabled={isPending}
          >
            {action === 'autoriser' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Autorisation…
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Autoriser
              </>
            )}
          </Button>
        </div>
      )}

      {/* Note TOTP */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Votre authentification à deux facteurs (TOTP) est vérifiée. Validité de
          l'autorisation : 2 heures.
        </AlertDescription>
      </Alert>
    </div>
  );
}
