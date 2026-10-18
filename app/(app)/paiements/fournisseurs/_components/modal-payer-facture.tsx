/**
 * Modale paiement facture (total ou partiel)
 *
 * D-03 : Paiements partiels libres
 * D-06 : Preuve de paiement obligatoire
 * D-10 : Création paiement ITApay lié
 *
 * Workflow : A_PAYER ou PARTIELLE → SOLDEE (si total payé = TTC)
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getFactureFournisseur,
  creerPaiementFournisseur,
} from '@/lib/actions/paiements-fournisseurs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { DollarSign, AlertCircle } from 'lucide-react';

const paiementSchema = z.object({
  montantPaye: z.number().positive('Montant requis'),
  modePaiement: z.enum(['VIREMENT', 'MOBILE_MONEY', 'ESPECES', 'CHEQUE']),
  datePaiement: z.string().min(1, 'Date requise'),
  urlPreuve: z.string().url('URL invalide').optional().or(z.literal('')),
});

type PaiementFormData = z.infer<typeof paiementSchema>;

interface Props {
  factureId: string;
  open: boolean;
  onClose: () => void;
}

export function ModalPayerFacture({ factureId, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [facture, setFacture] = useState<any>(null);

  const form = useForm<PaiementFormData>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      montantPaye: 0,
      modePaiement: 'VIREMENT',
      datePaiement: new Date().toISOString().split('T')[0],
      urlPreuve: '',
    },
  });

  useEffect(() => {
    if (open && factureId) {
      chargerFacture();
    }
  }, [open, factureId]);

  const chargerFacture = async () => {
    try {
      const res = (await getFactureFournisseur({ factureId })) as any;
      if (res.success) {
        setFacture(res.facture);
        // Pré-remplir avec le solde restant
        const solde =
          Number(res.facture.montantTTC) - Number(res.facture.montantPaye);
        form.setValue('montantPaye', solde);
      }
    } catch (error) {
      toast.error('Erreur de chargement de la facture');
    }
  };

  const onSubmit = async (data: PaiementFormData) => {
    // D-01 : Vérification réception
    if (!facture.receptionConfirmee) {
      toast.error('Erreur', {
        description: 'La réception doit être confirmée avant paiement',
      });
      return;
    }

    // D-03 : Vérification montant
    const solde = Number(facture.montantTTC) - Number(facture.montantPaye);
    if (data.montantPaye > solde) {
      form.setError('montantPaye', {
        type: 'manual',
        message: `Le montant dépasse le solde restant (${solde.toLocaleString()} F)`,
      });
      return;
    }

    // D-06 : Vérification preuve si confirmé
    if (!data.urlPreuve) {
      const confirmer = window.confirm(
        'Aucune preuve fournie. Le paiement sera en attente de preuve. Continuer ?'
      );
      if (!confirmer) return;
    }

    startTransition(async () => {
      try {
        const res = (await creerPaiementFournisseur({
          factureId,
          ...data,
          datePaiement: new Date(data.datePaiement),
        })) as any;

        if (res.success) {
          const estSoldee =
            Number(facture.montantPaye) + data.montantPaye >=
            Number(facture.montantTTC);

          toast.success('Paiement enregistré', {
            description: estSoldee
              ? 'La facture est maintenant soldée'
              : `Paiement partiel effectué. Solde restant : ${(
                  solde - data.montantPaye
                ).toLocaleString()} F`,
          });
          onClose();
        }
      } catch (error) {
        toast.error('Erreur', {
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  };

  if (!facture) {
    return null;
  }

  const montantTTC = Number(facture.montantTTC);
  const montantPaye = Number(facture.montantPaye);
  const soldeRestant = montantTTC - montantPaye;
  const montantSaisi = form.watch('montantPaye') || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payer la facture</DialogTitle>
          <DialogDescription>
            Enregistrement d'un paiement total ou partiel
          </DialogDescription>
        </DialogHeader>

        {/* Détails facture */}
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fournisseur :</span>
              <span className="font-medium">{facture.fournisseur.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Référence :</span>
              <span className="font-medium">{facture.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant TTC :</span>
              <span className="tabular-nums">
                {montantTTC.toLocaleString()} F
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Déjà payé :</span>
              <span className="tabular-nums">
                {montantPaye.toLocaleString()} F
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Solde restant :</span>
              <span className="font-semibold tabular-nums text-lg text-red-600">
                {soldeRestant.toLocaleString()} F
              </span>
            </div>
          </div>
        </Card>

        {/* D-01 : Alerte si réception non confirmée */}
        {!facture.receptionConfirmee && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              La réception de cette facture n'a pas été confirmée. Le paiement
              est bloqué (D-01).
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* D-03 : Montant libre */}
            <FormField
              control={form.control}
              name="montantPaye"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant à payer (FCFA) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="0"
                      className="rounded-md tabular-nums"
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      max={soldeRestant}
                    />
                  </FormControl>
                  <FormDescription>
                    {montantSaisi > 0 && montantSaisi < soldeRestant
                      ? `Paiement partiel. Nouveau solde : ${(
                          soldeRestant - montantSaisi
                        ).toLocaleString()} F`
                      : montantSaisi >= soldeRestant
                      ? 'Paiement total - La facture sera soldée'
                      : `Maximum : ${soldeRestant.toLocaleString()} F`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modePaiement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode de paiement *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Sélectionnez un mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="ESPECES">Espèces</SelectItem>
                      <SelectItem value="CHEQUE">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="datePaiement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de paiement *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="rounded-md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* D-06 : Preuve obligatoire */}
            <FormField
              control={form.control}
              name="urlPreuve"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preuve de paiement (D-06)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://..."
                      className="rounded-md"
                    />
                  </FormControl>
                  <FormDescription>
                    Reçu, justificatif bancaire, capture d'écran... Requis pour
                    confirmer le paiement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isPending || !facture.receptionConfirmee}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
