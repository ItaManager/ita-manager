/**
 * Page principale - Module M15 L2 Paiements Fournisseurs
 *
 * 3 onglets :
 * - Factures : Liste des factures avec filtres et actions workflow
 * - Paiements : Historique des paiements effectués
 * - Fournisseurs : Liste fournisseurs avec solde dû
 *
 * Règles métier : DECISIONS-M15-L2.md (D-01 à D-10)
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  listerFacturesFournisseur,
  listerPaiementsFournisseur,
  getIndicateursFournisseurs,
} from '@/lib/actions/paiements-fournisseurs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ModalFactureFournisseur } from './_components/modal-facture-fournisseur';
import { ModalConfirmerReception } from './_components/modal-confirmer-reception';
import { ModalValiderFacture } from './_components/modal-valider-facture';
import { ModalValiderDG } from './_components/modal-valider-dg';
import { ModalPayerFacture } from './_components/modal-payer-facture';
import { ModalFournisseur } from './_components/modal-fournisseur';

type StatutFacture =
  | 'BROUILLON'
  | 'A_RECEVOIR'
  | 'A_VALIDER'
  | 'A_VALIDER_DG'
  | 'A_PAYER'
  | 'PARTIELLE'
  | 'SOLDEE'
  | 'REFUSEE';

type Facture = {
  id: string;
  reference: string;
  fournisseur: { id: string; nom: string };
  projet?: { code: string; nom: string } | null;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  dateFacture: Date;
  dateEcheance?: Date | null;
  statutFacture: StatutFacture;
  receptionConfirmee: boolean;
  creeLe: Date;
};

type Paiement = {
  id: string;
  reference: string;
  fournisseur: { id: string; nom: string };
  facture: { reference: string; montantTTC: number };
  montantPaye: number;
  modePaiement: string;
  datePaiement: Date;
  statutPaiement: string;
  urlPreuve?: string | null;
};

type Fournisseur = {
  id: string;
  nom: string;
  categorie?: string | null;
  contact?: string | null;
  soldeDu: number;
  nombreFactures: number;
};

type Indicateurs = {
  totalDu: number;
  facturesEnRetard: number;
  facturesAPayer: number;
  payeCeMois: number;
};

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

// D-04 : Détection retard
function estEnRetard(facture: Facture): boolean {
  if (!facture.dateEcheance || facture.statutFacture === 'SOLDEE') {
    return false;
  }
  return new Date(facture.dateEcheance) < new Date();
}

// D-04 : Alerte J-7
function procheEcheance(facture: Facture): boolean {
  if (!facture.dateEcheance || facture.statutFacture === 'SOLDEE') {
    return false;
  }
  const joursRestants = Math.ceil(
    (new Date(facture.dateEcheance).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return joursRestants <= 7 && joursRestants >= 0;
}

export default function PaiementsFournisseursPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // États
  const [factures, setFactures] = useState<Facture[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [indicateurs, setIndicateurs] = useState<Indicateurs>({
    totalDu: 0,
    facturesEnRetard: 0,
    facturesAPayer: 0,
    payeCeMois: 0,
  });

  // Filtres factures
  const [filtreStatut, setFiltreStatut] = useState<string>('');
  const [rechercheFacture, setRechercheFacture] = useState('');

  // Modales
  const [modaleFacture, setModaleFacture] = useState(false);
  const [modaleReception, setModaleReception] = useState<string | null>(null);
  const [modaleValidation, setModaleValidation] = useState<string | null>(null);
  const [modaleValidationDG, setModaleValidationDG] = useState<string | null>(
    null
  );
  const [modalePaiement, setModalePaiement] = useState<string | null>(null);
  const [modaleFournisseur, setModaleFournisseur] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  function chargerDonnees() {
    startTransition(async () => {
      try {
        // Charger indicateurs
        const resIndicateurs = (await getIndicateursFournisseurs()) as any;
        if (resIndicateurs.success) {
          setIndicateurs(resIndicateurs.indicateurs);
        }

        // Charger factures
        const resFactures = (await listerFacturesFournisseur({})) as any;
        if (resFactures.success) {
          setFactures(
            resFactures.factures.map((f: any) => ({
              ...f,
              montantHT: Number(f.montantHT),
              montantTVA: Number(f.montantTVA),
              montantTTC: Number(f.montantTTC),
              montantPaye: Number(f.montantPaye),
            }))
          );
        }

        // Charger paiements
        const resPaiements = (await listerPaiementsFournisseur({})) as any;
        if (resPaiements.success) {
          setPaiements(
            resPaiements.paiements.map((p: any) => ({
              ...p,
              montantPaye: Number(p.montantPaye),
              facture: {
                ...p.facture,
                montantTTC: Number(p.facture.montantTTC),
              },
            }))
          );
        }

        // Construire liste fournisseurs (depuis factures)
        const mapFournisseurs = new Map<string, Fournisseur>();
        resFactures.factures.forEach((f: any) => {
          if (!mapFournisseurs.has(f.fournisseur.id)) {
            const facturesFournisseur = resFactures.factures.filter(
              (fa: any) => fa.fournisseur.id === f.fournisseur.id
            );
            const soldeDu = facturesFournisseur
              .filter((fa: any) =>
                ['A_PAYER', 'PARTIELLE'].includes(fa.statutFacture)
              )
              .reduce((sum: number, fa: any) => {
                const ttc = Number(fa.montantTTC);
                const paye = Number(fa.montantPaye);
                return sum + (ttc - paye);
              }, 0);

            mapFournisseurs.set(f.fournisseur.id, {
              id: f.fournisseur.id,
              nom: f.fournisseur.nom,
              categorie: f.fournisseur.categorie,
              contact: f.fournisseur.contact,
              soldeDu,
              nombreFactures: facturesFournisseur.length,
            });
          }
        });
        setFournisseurs(Array.from(mapFournisseurs.values()));
      } catch (error) {
        toast.error('Erreur de chargement', {
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  }

  // Filtrage factures
  const facturesFiltrees = factures.filter((f) => {
    if (filtreStatut && f.statutFacture !== filtreStatut) return false;
    if (
      rechercheFacture &&
      !f.reference.toLowerCase().includes(rechercheFacture.toLowerCase()) &&
      !f.fournisseur.nom.toLowerCase().includes(rechercheFacture.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="p-8">
      {/* En-tête */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">
          Paiements Fournisseurs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestion des factures et paiements fournisseurs avec circuit de
          validation
        </p>
      </header>

      {/* Indicateurs */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total dû</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600">
                {formatMontant(indicateurs.totalDu)}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-200" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">En retard</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {indicateurs.facturesEnRetard}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-200" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">À payer</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {indicateurs.facturesAPayer}
              </p>
            </div>
            <FileText className="h-8 w-8 text-green-200" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Payé ce mois</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">
                {formatMontant(indicateurs.payeCeMois)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="factures" className="w-full">
        <TabsList>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
        </TabsList>

        {/* ONGLET FACTURES */}
        <TabsContent value="factures" className="space-y-4">
          {/* Filtres et actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence ou fournisseur..."
                  value={rechercheFacture}
                  onChange={(e) => setRechercheFacture(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="BROUILLON">Brouillon</SelectItem>
                  <SelectItem value="A_RECEVOIR">À recevoir</SelectItem>
                  <SelectItem value="A_VALIDER">À valider</SelectItem>
                  <SelectItem value="A_VALIDER_DG">Validation DG</SelectItem>
                  <SelectItem value="A_PAYER">À payer</SelectItem>
                  <SelectItem value="PARTIELLE">Partielle</SelectItem>
                  <SelectItem value="SOLDEE">Soldée</SelectItem>
                  <SelectItem value="REFUSEE">Refusée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setModaleFacture(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </div>

          {/* Tableau factures */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturesFiltrees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Aucune facture trouvée
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturesFiltrees.map((facture) => {
                      const solde = facture.montantTTC - facture.montantPaye;
                      const enRetard = estEnRetard(facture);
                      const proche = procheEcheance(facture);

                      return (
                        <TableRow key={facture.id}>
                          <TableCell className="font-medium">
                            {facture.reference}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() =>
                                router.push(
                                  `/paiements/fournisseurs/${facture.fournisseur.id}`
                                )
                              }
                              className="text-primary hover:underline"
                            >
                              {facture.fournisseur.nom}
                            </button>
                          </TableCell>
                          <TableCell className="text-xs">
                            {facture.projet
                              ? `${facture.projet.code} - ${facture.projet.nom}`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(facture.dateFacture)}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1">
                              {formatDate(facture.dateEcheance)}
                              {enRetard && (
                                <Badge className="bg-red-100 text-red-700">
                                  En retard
                                </Badge>
                              )}
                              {proche && !enRetard && (
                                <Badge className="bg-orange-100 text-orange-700">
                                  J-7
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMontant(facture.montantTTC)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMontant(facture.montantPaye)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {formatMontant(solde)}
                          </TableCell>
                          <TableCell>
                            {getBadgeStatutFacture(facture.statutFacture)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {facture.statutFacture === 'A_RECEVOIR' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setModaleReception(facture.id)
                                  }
                                >
                                  Recevoir
                                </Button>
                              )}
                              {facture.statutFacture === 'A_VALIDER' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setModaleValidation(facture.id)
                                  }
                                >
                                  Valider
                                </Button>
                              )}
                              {facture.statutFacture === 'A_VALIDER_DG' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setModaleValidationDG(facture.id)
                                  }
                                >
                                  Validation DG
                                </Button>
                              )}
                              {['A_PAYER', 'PARTIELLE'].includes(
                                facture.statutFacture
                              ) && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => setModalePaiement(facture.id)}
                                  disabled={!facture.receptionConfirmee}
                                >
                                  Payer
                                </Button>
                              )}
                            </div>
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
        <TabsContent value="paiements" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Preuve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Aucun paiement enregistré
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paiements.map((paiement) => (
                      <TableRow key={paiement.id}>
                        <TableCell className="font-medium">
                          {paiement.reference}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(paiement.datePaiement)}
                        </TableCell>
                        <TableCell>{paiement.fournisseur.nom}</TableCell>
                        <TableCell className="text-xs">
                          {paiement.facture.reference}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMontant(paiement.montantPaye)}
                        </TableCell>
                        <TableCell>{paiement.modePaiement}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              paiement.statutPaiement === 'CONFIRME'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {paiement.statutPaiement === 'CONFIRME'
                              ? 'Confirmé'
                              : 'En attente preuve'}
                          </Badge>
                        </TableCell>
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

        {/* ONGLET FOURNISSEURS */}
        <TabsContent value="fournisseurs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setModaleFournisseur(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau fournisseur
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Solde dû</TableHead>
                    <TableHead className="text-right">Nb factures</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fournisseurs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Aucun fournisseur trouvé
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fournisseurs.map((fournisseur) => (
                      <TableRow key={fournisseur.id}>
                        <TableCell className="font-medium">
                          {fournisseur.nom}
                        </TableCell>
                        <TableCell>
                          {fournisseur.categorie || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMontant(fournisseur.soldeDu)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fournisseur.nombreFactures}
                        </TableCell>
                        <TableCell className="text-xs">
                          {fournisseur.contact || '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/paiements/fournisseurs/${fournisseur.id}`
                              )
                            }
                          >
                            Voir fiche
                          </Button>
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

      {/* Modales */}
      {modaleFacture && (
        <ModalFactureFournisseur
          open={modaleFacture}
          onClose={() => {
            setModaleFacture(false);
            chargerDonnees();
          }}
        />
      )}

      {modaleReception && (
        <ModalConfirmerReception
          factureId={modaleReception}
          open={!!modaleReception}
          onClose={() => {
            setModaleReception(null);
            chargerDonnees();
          }}
        />
      )}

      {modaleValidation && (
        <ModalValiderFacture
          factureId={modaleValidation}
          open={!!modaleValidation}
          onClose={() => {
            setModaleValidation(null);
            chargerDonnees();
          }}
        />
      )}

      {modaleValidationDG && (
        <ModalValiderDG
          factureId={modaleValidationDG}
          open={!!modaleValidationDG}
          onClose={() => {
            setModaleValidationDG(null);
            chargerDonnees();
          }}
        />
      )}

      {modalePaiement && (
        <ModalPayerFacture
          factureId={modalePaiement}
          open={!!modalePaiement}
          onClose={() => {
            setModalePaiement(null);
            chargerDonnees();
          }}
        />
      )}

      {modaleFournisseur && (
        <ModalFournisseur
          open={modaleFournisseur}
          onClose={() => {
            setModaleFournisseur(false);
            chargerDonnees();
          }}
        />
      )}
    </div>
  );
}
