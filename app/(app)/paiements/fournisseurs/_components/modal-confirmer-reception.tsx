/**
 * Modale confirmation réception (D-01)
 *
 * Utilisée par : Logistique, Chef chantier, Responsable garage
 * Workflow : A_RECEVOIR → A_VALIDER
 *
 * D-01 : Pas de paiement sans réception confirmée
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getFactureFournisseur,
  confirmerReceptionFacture,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const receptionSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'Vous devez confirmer la réception',
  }),
  commentaire: z.string().optional(),
});

type ReceptionFormData = z.infer<typeof receptionSchema>;

interface Props {
  factureId: string;
  open: boolean;
  onClose: () => void;
}

export function ModalConfirmerReception({ factureId, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [facture, setFacture] = useState<any>(null);

  const form = useForm<ReceptionFormData>({
    resolver: zodResolver(receptionSchema),
    defaultValues: {
      confirmation: false,
      commentaire: '',
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
      }
    } catch (error) {
      toast.error('Erreur de chargement de la facture');
    }
  };

  const onSubmit = async (data: ReceptionFormData) => {
    startTransition(async () => {
      try {
        const res = (await confirmerReceptionFacture({
          factureId,
          commentaire: data.commentaire,
        })) as any;

        if (res.success) {
          toast.success('Réception confirmée', {
            description: 'La facture est maintenant à valider',
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmer la réception</DialogTitle>
          <DialogDescription>
            Vérifiez que les biens ou services correspondent à la facture
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
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Montant TTC :</span>
              <span className="font-semibold tabular-nums">
                {Number(facture.montantTTC).toLocaleString()} F
              </span>
            </div>
          </div>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Je confirme que la réception est conforme
                    </FormLabel>
                    <FormDescription>
                      Les marchandises ou services ont bien été reçus et
                      correspondent à la facture
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observations éventuelles..."
                      rows={3}
                      className="rounded-md resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
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
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Confirmation...' : 'Confirmer la réception'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
