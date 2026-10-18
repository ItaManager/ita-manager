/**
 * Modale création/édition facture fournisseur
 *
 * 7 étapes :
 * 1. Fournisseur et référence
 * 2. Montants (HT, TVA, TTC)
 * 3. Dates (facture, échéance)
 * 4. Projet (imputation D-07)
 * 5. Upload PDF facture
 * 6. Révision
 * 7. Confirmation
 *
 * D-05 : Détection doublon référence
 */

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  creerFactureFournisseur,
  soumettreFactureFournisseur,
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
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const factureSchema = z.object({
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  reference: z.string().min(1, 'Référence requise'),
  montantHT: z.number().positive('Montant HT requis'),
  montantTVA: z.number().nonnegative('Montant TVA invalide'),
  montantTTC: z.number().positive('Montant TTC requis'),
  dateFacture: z.string().min(1, 'Date facture requise'),
  dateEcheance: z.string().optional(),
  projetId: z.string().optional(),
  urlFacture: z.string().url().optional().or(z.literal('')),
});

type FactureFormData = z.infer<typeof factureSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  factureId?: string;
}

export function ModalFactureFournisseur({ open, onClose, factureId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [etape, setEtape] = useState(1);
  const [factureCreeeId, setFactureCreeeId] = useState<string | null>(null);

  const form = useForm<FactureFormData>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      fournisseurId: '',
      reference: '',
      montantHT: 0,
      montantTVA: 0,
      montantTTC: 0,
      dateFacture: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      projetId: '',
      urlFacture: '',
    },
  });

  const etapes = [
    { num: 1, label: 'Fournisseur' },
    { num: 2, label: 'Montants' },
    { num: 3, label: 'Dates' },
    { num: 4, label: 'Projet' },
    { num: 5, label: 'Document' },
    { num: 6, label: 'Révision' },
    { num: 7, label: 'Confirmation' },
  ];

  // Calculer TTC automatiquement
  const montantHT = form.watch('montantHT');
  const montantTVA = form.watch('montantTVA');

  const onSubmit = async (data: FactureFormData) => {
    if (etape < 6) {
      setEtape(etape + 1);
      return;
    }

    startTransition(async () => {
      try {
        // Créer facture
        const res = (await creerFactureFournisseur({
          ...data,
          dateFacture: new Date(data.dateFacture),
          dateEcheance: data.dateEcheance
            ? new Date(data.dateEcheance)
            : undefined,
        })) as any;

        if (res.success) {
          setFactureCreeeId(res.facture.id);
          setEtape(7);

          // Auto-soumettre
          await soumettreFactureFournisseur({ factureId: res.facture.id });

          toast.success('Facture créée et soumise', {
            description: `Référence : ${data.reference}`,
          });

          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (error) {
        // D-05 : Gestion doublon
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';

        if (message.includes('existe déjà')) {
          form.setError('reference', {
            type: 'manual',
            message:
              'Une facture avec cette référence existe déjà pour ce fournisseur',
          });
          setEtape(1);
        }

        toast.error('Erreur', { description: message });
      }
    });
  };

  const handlePrecedent = () => {
    if (etape > 1) setEtape(etape - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle facture fournisseur</DialogTitle>
          <DialogDescription>
            Enregistrement et soumission pour validation
          </DialogDescription>
        </DialogHeader>

        {/* Indicateur étapes */}
        <div className="flex items-center justify-between">
          {etapes.map((e, idx) => (
            <div key={e.num} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                  e.num === etape
                    ? 'bg-primary text-white'
                    : e.num < etape
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {e.num < etape ? <Check className="h-4 w-4" /> : e.num}
              </div>
              {idx < etapes.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${
                    e.num < etape ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Étape 1 : Fournisseur et référence */}
            {etape === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="fournisseurId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ID du fournisseur"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Sélectionnez le fournisseur concerné
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence facture *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="FRN-2026-001"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Référence unique de la facture fournisseur
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 2 : Montants */}
            {etape === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="montantHT"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant HT (FCFA) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          className="rounded-md tabular-nums"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="montantTVA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant TVA (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          className="rounded-md tabular-nums"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Généralement 18% du montant HT
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="montantTTC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant TTC (FCFA) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          className="rounded-md tabular-nums"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Calculé : {montantHT + montantTVA} FCFA
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 3 : Dates */}
            {etape === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dateFacture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date facture *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Date d'émission de la facture
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateEcheance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'échéance</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Date limite de paiement (optionnel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 4 : Projet (D-07) */}
            {etape === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="projetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projet (imputation comptable)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ID du projet"
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Chantier ou projet auquel imputer cette dépense (D-07)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 5 : Document */}
            {etape === 5 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="urlFacture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL document facture</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://..."
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Lien vers le PDF ou photo de la facture (optionnel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 6 : Révision */}
            {etape === 6 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Référence :</span>
                    <span className="font-medium">
                      {form.getValues('reference')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant HT :</span>
                    <span className="font-medium tabular-nums">
                      {form.getValues('montantHT').toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA :</span>
                    <span className="font-medium tabular-nums">
                      {form.getValues('montantTVA').toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total TTC :</span>
                    <span className="font-semibold tabular-nums">
                      {form.getValues('montantTTC').toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date facture :</span>
                    <span className="font-medium">
                      {new Date(
                        form.getValues('dateFacture')
                      ).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {form.getValues('dateEcheance') && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Échéance :</span>
                      <span className="font-medium">
                        {new Date(
                          form.getValues('dateEcheance') || ''
                        ).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Étape 7 : Confirmation */}
            {etape === 7 && (
              <div className="text-center py-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Facture créée avec succès !
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  La facture a été soumise pour confirmation de réception.
                </p>
              </div>
            )}

            {/* Actions */}
            {etape < 7 && (
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrecedent}
                  disabled={etape === 1 || isPending}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    'Enregistrement...'
                  ) : etape === 6 ? (
                    'Créer et soumettre'
                  ) : (
                    <>
                      Suivant
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
