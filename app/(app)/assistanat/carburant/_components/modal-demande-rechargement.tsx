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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { creerDemandeRechargement, validerDemandeRechargement } from "@/lib/actions/carburant";
import { Loader2, Plus, Warehouse } from "lucide-react";

const schema = z.object({
  projetId: z.string().optional(),
  typeCarburant: z.enum(["GASOIL", "SUPER", "MELANGE"]),
  quantiteDemandee: z.number().positive("Quantité doit être positive"),
});

type FormValues = z.infer<typeof schema>;

type Garage = {
  id: string;
  libelle: string;
  stockActuel: number;
  capaciteCarburant: number;
  seuilAlerte?: number | null;
  alerteSeuil: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garage: Garage;
  onSuccess: () => void;
}

export function ModalDemandeRechargement({ open, onOpenChange, garage, onSuccess }: Props) {
  const [chargement, setChargement] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projetId: "",
      typeCarburant: "GASOIL",
      quantiteDemandee: 0,
    },
  });

  const quantiteDemandee = form.watch("quantiteDemandee");

  // Calcul quantité optimale (remplir jusqu'à capacité)
  const quantiteOptimale = Math.max(0, garage.capaciteCarburant - garage.stockActuel);
  const nouveauStock = garage.stockActuel + (quantiteDemandee || 0);
  const depasseCapacite = nouveauStock > garage.capaciteCarburant;

  const handleSubmit = async (values: FormValues) => {
    if (depasseCapacite) {
      toast.error(
        `Quantité trop élevée. Capacité max: ${garage.capaciteCarburant.toFixed(2)} L`
      );
      return;
    }

    setChargement(true);
    try {
      const resultat = await creerDemandeRechargement({
        garageId: garage.id,
        projetId: values.projetId || undefined,
        typeCarburant: values.typeCarburant,
        quantiteDemandee: values.quantiteDemandee,
      });

      if (resultat.success && resultat.demande) {
        // Valider automatiquement si l'utilisateur est gestionnaire
        try {
          await validerDemandeRechargement(resultat.demande.id);
          toast.success("Demande de rechargement créée et validée");
        } catch {
          toast.success("Demande de rechargement créée (en attente de validation)");
        }

        form.reset();
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la demande");
    } finally {
      setChargement(false);
    }
  };

  const suggererQuantiteOptimale = () => {
    form.setValue("quantiteDemandee", quantiteOptimale);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Demande de rechargement garage</DialogTitle>
          <DialogDescription>{garage.libelle}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{garage.libelle}</span>
            {garage.alerteSeuil && (
              <Badge variant="destructive" className="ml-auto">
                Niveau bas
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Stock actuel</div>
              <div className="tabular-nums font-medium">
                {garage.stockActuel.toFixed(2)} L
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Capacité totale</div>
              <div className="tabular-nums font-medium">
                {garage.capaciteCarburant.toFixed(2)} L
              </div>
            </div>
          </div>
          {garage.seuilAlerte && (
            <div className="text-xs text-muted-foreground">
              Seuil d'alerte: {garage.seuilAlerte}% (
              {((garage.capaciteCarburant * garage.seuilAlerte) / 100).toFixed(2)} L)
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="typeCarburant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de carburant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GASOIL">Gasoil</SelectItem>
                      <SelectItem value="SUPER">Super</SelectItem>
                      <SelectItem value="MELANGE">Mélange 2T</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantiteDemandee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité demandée (L)</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={suggererQuantiteOptimale}
                    >
                      Remplir
                    </Button>
                  </div>
                  <FormDescription>
                    Quantité optimale pour remplir: {quantiteOptimale.toFixed(2)} L
                  </FormDescription>
                  {depasseCapacite && (
                    <p className="text-sm text-destructive">
                      ⚠ Dépasse la capacité du garage
                    </p>
                  )}
                  {quantiteDemandee > 0 && !depasseCapacite && (
                    <p className="text-sm text-muted-foreground">
                      Nouveau stock: {nouveauStock.toFixed(2)} L (
                      {((nouveauStock / garage.capaciteCarburant) * 100).toFixed(0)}%)
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet (imputation)</FormLabel>
                  <FormControl>
                    <Input placeholder="ID projet (optionnel)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Chantier auquel imputer la dépense (D-08)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={chargement || depasseCapacite}>
                {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Créer la demande
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
