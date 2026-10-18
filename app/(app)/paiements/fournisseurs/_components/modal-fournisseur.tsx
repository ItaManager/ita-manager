/**
 * Modale création/édition fournisseur
 *
 * D-08 : Fournisseur enrichi avec catégorie et mode paiement
 *
 * Extension du modèle Fournisseur (M14) :
 * - categorie
 * - modePaiementPrefere
 * - contact
 * - rccm
 * - adresse
 */

'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

const fournisseurSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  categorie: z
    .enum(['CARBURANT', 'MATERIAUX', 'LOCATION', 'SERVICES', 'AUTRE'])
    .optional(),
  modePaiementPrefere: z
    .enum(['VIREMENT', 'MOBILE_MONEY', 'ESPECES', 'CHEQUE'])
    .optional(),
  contact: z.string().optional(),
  rccm: z.string().optional(),
  adresse: z.string().optional(),
  numeroWave: z.string().optional(),
});

type FournisseurFormData = z.infer<typeof fournisseurSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  fournisseurId?: string;
}

export function ModalFournisseur({ open, onClose, fournisseurId }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FournisseurFormData>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: '',
      categorie: undefined,
      modePaiementPrefere: undefined,
      contact: '',
      rccm: '',
      adresse: '',
      numeroWave: '',
    },
  });

  const onSubmit = async (data: FournisseurFormData) => {
    startTransition(async () => {
      try {
        // TODO: Implémenter action creerFournisseur ou modifierFournisseur
        // Cette action devrait être dans lib/actions/fournisseurs.ts (M14)

        toast.success(
          fournisseurId ? 'Fournisseur modifié' : 'Fournisseur créé',
          {
            description: `${data.nom} a été enregistré avec succès`,
          }
        );
        onClose();
      } catch (error) {
        toast.error('Erreur', {
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {fournisseurId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </DialogTitle>
          <DialogDescription>
            Enregistrement des informations fournisseur (D-08)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du fournisseur *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: SOCOMACI, Shell CI, etc."
                      className="rounded-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="categorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie (D-08)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CARBURANT">Carburant</SelectItem>
                        <SelectItem value="MATERIAUX">Matériaux</SelectItem>
                        <SelectItem value="LOCATION">Location</SelectItem>
                        <SelectItem value="SERVICES">Services</SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type de fourniture principal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modePaiementPrefere"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de paiement préféré</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VIREMENT">
                          Virement bancaire
                        </SelectItem>
                        <SelectItem value="MOBILE_MONEY">
                          Mobile Money
                        </SelectItem>
                        <SelectItem value="ESPECES">Espèces</SelectItem>
                        <SelectItem value="CHEQUE">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Méthode de paiement habituelle
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact (téléphone/email)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+225 XX XX XX XX XX"
                        className="rounded-md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroWave"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro Wave</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+225 XX XX XX XX XX"
                        className="rounded-md"
                      />
                    </FormControl>
                    <FormDescription>
                      Pour paiements Mobile Money
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rccm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RCCM (Registre du Commerce)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="CI-ABJ-01-XXXX-XXXXXXX"
                      className="rounded-md"
                    />
                  </FormControl>
                  <FormDescription>
                    Numéro d'immatriculation au registre du commerce
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Adresse complète du fournisseur..."
                      rows={3}
                      className="rounded-md resize-none"
                    />
                  </FormControl>
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
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Enregistrement...'
                  : fournisseurId
                  ? 'Modifier'
                  : 'Créer le fournisseur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
