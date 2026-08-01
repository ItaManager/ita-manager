/**
 * Page de préparation des paiements (M15 — ItaPay)
 *
 * Accessible à : DFC, ADMIN (paiement:preparer)
 *
 * Circuit :
 * 1. DFC prépare le paiement (source : M7 paie, M14 achats)
 * 2. DFC vérifie les bénéficiaires via Wave verify_recipient
 * 3. DFC demande l'autorisation → notification DG
 *
 * Critère de recette (Livraison 1) :
 * Les bénéficiaires bloqués ressortent (NO_MATCH, HORS_LIMITES)
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  listerDemandesPaiement,
  verifierBeneficiaires,
  demanderAutorisation,
} from '@/lib/actions/paiements';
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
import { ShieldCheck, Send, Clock, Ban, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

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
    autoriseeParId: string | null;
    autoriseeLe: Date | null;
    expireLe: Date | null;
    montantFige: number;
    nombreEchecs: number;
  } | null;
  preparateur: {
    email: string;
  };
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

export default function PaiementsPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [enCoursVerif, setEnCoursVerif] = useState<string | null>(null);
  const [enCoursAutorisation, setEnCoursAutorisation] = useState<string | null>(null);

  useEffect(() => {
    chargerDemandes();
  }, []);

  function chargerDemandes() {
    startTransition(async () => {
      try {
        const data = await listerDemandesPaiement() as any[];
        // Convertir les Decimal en number
        const demandesTypees: Demande[] = data.map((d: any) => ({
          ...d,
          montantTotal: Number(d.montantTotal),
          lignes: d.lignes.map((l: any) => ({
            ...l,
            montant: Number(l.montant),
          })),
          autorisation: d.autorisation
            ? {
                ...d.autorisation,
                montantFige: Number(d.autorisation.montantFige),
              }
            : null,
        }));
        setDemandes(demandesTypees);
      } catch (error) {
        toast.error('Erreur de chargement', {
          description: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  }

  async function handleVerifier(demandeId: string) {
    setEnCoursVerif(demandeId);
    try {
      const resultat = await verifierBeneficiaires(demandeId);
      toast.success('Vérification terminée', {
        description:
          resultat.nombreBloquees === 0
            ? `${resultat.nombreVerifiees} bénéficiaires vérifiés`
            : `${resultat.nombreVerifiees} vérifiés — ${resultat.nombreBloquees} bloqué(s)`,
      });
      chargerDemandes();
    } catch (error) {
      toast.error('Erreur de vérification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setEnCoursVerif(null);
    }
  }

  async function handleDemanderAutorisation(demandeId: string) {
    setEnCoursAutorisation(demandeId);
    try {
      await demanderAutorisation(demandeId);
      toast.success('Demande envoyée', {
        description: 'Le Directeur Général a reçu une notification',
      });
      chargerDemandes();
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setEnCoursAutorisation(null);
    }
  }

  const estHorsCreneauExecution = () => {
    const maintenant = new Date();
    const jour = maintenant.getDay();
    const heure = maintenant.getHours();

    // Samedi (6) ou dimanche (0)
    if (jour === 0 || jour === 6) return true;

    // Hors 8h-14h
    if (heure < 8 || heure >= 14) return true;

    return false;
  };

  const horsCreneaustring = estHorsCreneauExecution();

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Paiements à préparer
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vérifiez les bénéficiaires, puis demandez l'autorisation du
            Directeur Général.
          </p>
        </div>
      </header>

      {horsCreneaustring && (
        <Alert className="mb-5 border-destructive/50 bg-destructive/10">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Hors créneau de paiement.</strong> Les paiements
            s'exécutent du lundi au vendredi, entre 8 h et 14 h. Une demande
            déposée maintenant partira au prochain créneau ouvrable.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {demandes.length === 0 && !isPending && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune demande de paiement en attente
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les demandes proviennent de M7 (paie) et M14 (achats)
            </p>
          </Card>
        )}

        {demandes.map((demande) => {
          const estOuverte = ouvertId === demande.id;
          const total = demande.montantTotal;
          const lignesBloquees = demande.lignes.filter(
            (l) => l.nameMatch === 'NO_MATCH' || l.withinLimits === false
          );
          const lignesExecutables = demande.lignes.filter(
            (l) => l.nameMatch !== 'NO_MATCH' && l.withinLimits !== false
          );
          const toutesVerifiees = demande.lignes.every((l) => l.verifieLe);

          return (
            <Card key={demande.id} className="overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOuvertId(estOuverte ? null : demande.id)}
                className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-primary">
                      {demande.sourceType}
                    </span>
                    {demande.autorisation?.autoriseeLe && (
                      <Badge className="bg-success/10 text-success">
                        Autorisée
                      </Badge>
                    )}
                    {toutesVerifiees && !demande.autorisation?.autoriseeLe && (
                      <Badge className="bg-primary/10 text-primary">
                        Vérifiée
                      </Badge>
                    )}
                    {!toutesVerifiees && (
                      <Badge variant="outline">Préparée</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {demande.referenceIta} ·{' '}
                    {formatDate(demande.prepareeLe)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-semibold tabular-nums text-primary">
                      {formatMontant(total)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {demande.lignes.length} bénéficiaire
                      {demande.lignes.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  {estOuverte ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {estOuverte && (
                <div className="border-t px-5 py-4">
                  {/* Tableau des bénéficiaires */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bénéficiaire</TableHead>
                          <TableHead>Numéro Wave</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Vérification</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {demande.lignes.map((ligne) => {
                          const estBloquee =
                            ligne.nameMatch === 'NO_MATCH' ||
                            ligne.withinLimits === false;

                          return (
                            <TableRow
                              key={ligne.id}
                              className={
                                estBloquee
                                  ? 'bg-destructive/5'
                                  : undefined
                              }
                            >
                              <TableCell className="font-medium">
                                {ligne.beneficiaireNom}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {ligne.beneficiaireMobile}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatMontant(ligne.montant)}
                              </TableCell>
                              <TableCell>
                                {ligne.verifieLe ? (
                                  <BadgeVerification
                                    nameMatch={ligne.nameMatch}
                                    withinLimits={ligne.withinLimits}
                                  />
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    non vérifié
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Alert bénéficiaires bloqués */}
                  {toutesVerifiees && lignesBloquees.length > 0 && (
                    <Alert className="mt-4 border-destructive/50 bg-destructive/10">
                      <Ban className="h-4 w-4" />
                      <AlertDescription>
                        <strong>
                          {lignesBloquees.length} bénéficiaire
                          {lignesBloquees.length > 1 ? 's' : ''} bloqué
                          {lignesBloquees.length > 1 ? 's' : ''}.
                        </strong>
                        <div className="mt-0.5 text-xs">
                          Ces lignes ne partiront pas. Les autres restent
                          exécutables — corrigez celles-ci et rejouez-les dans
                          une seconde demande.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      {toutesVerifiees
                        ? `Vérifié · ${lignesExecutables.length} ligne(s) exécutable(s)`
                        : 'Les bénéficiaires doivent être vérifiés auprès de Wave avant toute demande.'}
                    </div>

                    <div className="flex gap-2">
                      {!toutesVerifiees ? (
                        <Button
                          onClick={() => handleVerifier(demande.id)}
                          disabled={enCoursVerif === demande.id}
                          variant="outline"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {enCoursVerif === demande.id
                            ? 'Vérification…'
                            : 'Vérifier les bénéficiaires'}
                        </Button>
                      ) : !demande.autorisation?.autoriseeLe ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  onClick={() =>
                                    handleDemanderAutorisation(demande.id)
                                  }
                                  disabled={
                                    horsCreneaustring ||
                                    enCoursAutorisation === demande.id
                                  }
                                  className="bg-success hover:bg-success/90"
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  {enCoursAutorisation === demande.id
                                    ? 'Envoi…'
                                    : "Demander l'autorisation du DG"}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {horsCreneaustring && (
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Hors créneau. Les demandes d'autorisation ne
                                  sont possibles qu'entre 8 h et 14 h, du lundi
                                  au vendredi.
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge className="bg-warning/10 text-warning">
                          Attente autorisation DG
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
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
          <TooltipTrigger asChild>
            <Badge className="bg-destructive/10 text-destructive">
              Nom différent
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Wave connaît ce numéro sous un autre nom. Ne pas payer — vérifiez
              le numéro.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (withinLimits === false) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-destructive/10 text-destructive">
              Plafond atteint
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Le plafond mensuel de réception du bénéficiaire est atteint. Il
              doit relever ses limites chez un agent Wave.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (nameMatch === 'NAME_NOT_KNOWN') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-warning/10 text-warning">
              Compte non vérifié
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Wave n'a pas de pièce d'identité pour ce compte. Le nom ne peut
              pas être vérifié.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (nameMatch === 'MATCH') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-success/10 text-success">Vérifié</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Le nom déclaré correspond à celui enregistré chez Wave.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
