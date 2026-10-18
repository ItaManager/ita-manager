/**
 * Page détail fournisseur
 *
 * D-09 : Historique fournisseur accessible
 *
 * Affiche :
 * - Informations fournisseur
 * - Solde dû
 * - Historique factures
 * - Historique paiements
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFicheFournisseur } from '@/lib/actions/paiements-fournisseurs';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type StatutFacture =
  | 'BROUILLON'
  | 'A_RECEVOIR'
  | 'A_VALIDER'
  | 'A_VALIDER_DG'
  | 'A_PAYER'
  | 'PARTIELLE'
  | 'SOLDEE'
  | 'REFUSEE';

function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' F';
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
}

function getBadgeStatutFacture(statut: StatutFacture) {
  const badges: Record<StatutFacture, { label: string; className: string }> = {
    BROUILLON: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
    A_RECEVOIR: {
      label: 'À recevoir',
      className: 'bg-blue-100 text-blue-700',
    },
    A_VALIDER: {
      label: 'À valider',
      className: 'bg-yellow-100 text-yellow-700',
    },
    A_VALIDER_DG: {
      label: 'Validation DG',
      className: 'bg-orange-100 text-orange-700',
    },
    A_PAYER: { label: 'À payer', className: 'bg-green-100 text-green-700' },
    PARTIELLE: { label: 'Partielle', className: 'bg-cyan-100 text-cyan-700' },
    SOLDEE: { label: 'Soldée', className: 'bg-emerald-100 text-emerald-700' },
    REFUSEE: { label: 'Refusée', className: 'bg-red-100 text-red-700' },
  };

  const badge = badges[statut];
  return <Badge className={badge.className}>{badge.label}</Badge>;
}

export default function DetailFournisseurPage() {
  const params = useParams();
  const router = useRouter();
  const fournisseurId = params.id as string;

  const [isPending, startTransition] = useTransition();
  const [fournisseur, setFournisseur] = useState<any>(null);
  const [soldeDu, setSoldeDu] = useState(0);
  const [totalPaye, setTotalPaye] = useState(0);
  const [nombreFactures, setNombreFactures] = useState(0);

  useEffect(() => {
    if (fournisseurId) {
      chargerFournisseur();
    }
  }, [fournisseurId]);

  const chargerFournisseur = () => {
    startTransition(async () => {
      try {
        const res = (await getFicheFournisseur({ fournisseurId })) as any;
        if (res.success) {
          setFournisseur(res.fournisseur);
          setSoldeDu(res.soldeDu);
          setTotalPaye(res.totalPaye);
          setNombreFactures(res.nombreFactures);
        }
      } catch (error) {
        toast.error('Erreur de chargement', {
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  };

  if (!fournisseur) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Bouton retour */}
      <Button
        variant="outline"
        onClick={() => router.push('/paiements/fournisseurs')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux fournisseurs
      </Button>

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {fournisseur.nom}
            </h1>
            {fournisseur.categorie && (
              <Badge className="mt-2">{fournisseur.categorie}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Solde dû (D-09)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600">
                {formatMontant(soldeDu)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-200" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total payé</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">
                {formatMontant(totalPaye)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Nb factures</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {nombreFactures}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="infos" className="w-full">
        <TabsList>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="factures">
            Factures ({fournisseur.factures?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
        </TabsList>

        {/* ONGLET INFOS */}
        <TabsContent value="infos">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Coordonnées</h3>
            <div className="space-y-3">
              {fournisseur.contact && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm">{fournisseur.contact}</p>
                  </div>
                </div>
              )}

              {fournisseur.adresse && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm">{fournisseur.adresse}</p>
                  </div>
                </div>
              )}

              {fournisseur.rccm && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">RCCM</p>
                    <p className="text-sm font-mono text-xs">
                      {fournisseur.rccm}
                    </p>
                  </div>
                </div>
              )}

              {fournisseur.numeroWave && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Numéro Wave
                    </p>
                    <p className="text-sm font-mono">{fournisseur.numeroWave}</p>
                  </div>
                </div>
              )}

              {fournisseur.modePaiementPrefere && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Mode de paiement préféré
                    </p>
                    <Badge>{fournisseur.modePaiementPrefere}</Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ONGLET FACTURES */}
        <TabsContent value="factures">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fournisseur.factures?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Aucune facture enregistrée
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fournisseur.factures?.map((facture: any) => {
                      const montantTTC = Number(facture.montantTTC);
                      const montantPaye = Number(facture.montantPaye);
                      const solde = montantTTC - montantPaye;

                      return (
                        <TableRow key={facture.id}>
                          <TableCell className="font-medium">
                            {facture.reference}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(facture.dateFacture)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {facture.projet
                              ? `${facture.projet.code} - ${facture.projet.nom}`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMontant(montantTTC)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMontant(montantPaye)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {formatMontant(solde)}
                          </TableCell>
                          <TableCell>
                            {getBadgeStatutFacture(facture.statutFacture)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ONGLET PAIEMENTS */}
        <TabsContent value="paiements">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Preuve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!fournisseur.factures ||
                  fournisseur.factures.every(
                    (f: any) => !f.paiements || f.paiements.length === 0
                  ) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Aucun paiement effectué
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fournisseur.factures
                      ?.flatMap((f: any) => f.paiements || [])
                      .map((paiement: any) => (
                        <TableRow key={paiement.id}>
                          <TableCell className="font-medium">
                            {paiement.reference}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(paiement.datePaiement)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {
                              fournisseur.factures.find(
                                (f: any) => f.id === paiement.factureId
                              )?.reference
                            }
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMontant(Number(paiement.montantPaye))}
                          </TableCell>
                          <TableCell>{paiement.modePaiement}</TableCell>
                          <TableCell>
                            {paiement.urlPreuve ? (
                              <a
                                href={paiement.urlPreuve}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Voir
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
