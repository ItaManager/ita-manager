"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { receptionnerRechargement } from "@/lib/actions/carburant";
import { Loader2, PackageCheck } from "lucide-react";

const schema = z.object({
  quantiteLivree: z.number().positive("Quantité doit être positive"),
});

type FormValues = z.infer<typeof schema>;

type DemandeRechargement = {
  id: string;
  reference: string;
  demandeur: { nom: string; prenom: string };
  garage: { libelle: string };
  typeCarburant: string;
  quantiteDemandee: any;
  statut: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demande: DemandeRechargement;
  onSuccess: () => void;
}

export function ModalReceptionRechargement({ open, onOpenChange, demande, onSuccess }: Props) {
  const [chargement, setChargement] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantiteLivree: Number(demande.quantiteDemandee) || 0,
    },
  });

  const quantiteLivree = form.watch("quantiteLivree");
  const quantiteDemandee = Number(demande.quantiteDemandee);
  const ecart = quantiteLivree - quantiteDemandee;

  const handleSubmit = async (values: FormValues) => {
    setChargement(true);
    try {
      await receptionnerRechargement({
        demandeId: demande.id,
        quantiteLivree: values.quantiteLivree,
      });

      toast.success(
        `Rechargement réceptionné. Stock augmenté de ${values.quantiteLivree.toFixed(2)} L`
      );
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réception");
    } finally {
      setChargement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Réceptionner le rechargement</DialogTitle>
          <DialogDescription>{demande.reference}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Garage</div>
              <div>{demande.garage.libelle}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Type carburant</div>
              <Badge variant="outline">{demande.typeCarburant}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Demandeur</div>
              <div>
                {demande.demandeur.prenom} {demande.demandeur.nom}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Statut</div>
              <Badge variant="secondary">{demande.statut}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-muted/50 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantité demandée</span>
            <span className="tabular-nums font-medium">
              {quantiteDemandee.toFixed(2)} L
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quantiteLivree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité livrée (L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      className="tabular-nums"
                    />
                  </FormControl>
                  <FormDescription>
                    Quantité effectivement reçue (peut différer de la quantité demandée)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {quantiteLivree > 0 && ecart !== 0 && (
              <div
                className={`rounded-md p-4 ${
                  ecart < 0 ? "bg-warning/10 border border-warning/30" : "bg-success/10 border border-success/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Écart</span>
                  <span className={`tabular-nums font-medium ${ecart < 0 ? "text-warning" : "text-success"}`}>
                    {ecart > 0 ? "+" : ""}
                    {ecart.toFixed(2)} L
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ecart < 0
                    ? "Livraison partielle"
                    : "Livraison supérieure à la demande"}
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <div className="text-sm font-medium mb-2">Effet sur le stock</div>
              <div className="text-sm text-muted-foreground">
                Le stock du garage sera automatiquement augmenté de{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {quantiteLivree.toFixed(2)} L
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={chargement}>
                {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <PackageCheck className="mr-2 h-4 w-4" />
                Confirmer réception
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
