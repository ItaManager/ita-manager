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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { distribuerCarburant } from "@/lib/actions/carburant";
import { Loader2, Fuel, AlertTriangle } from "lucide-react";

const schema = z.object({
  quantite: z.number().positive("Quantité doit être positive"),
  compteur: z.number().nonnegative("Compteur doit être positif ou zéro"),
  pleinComplet: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type DemandeGarage = {
  id: string;
  reference: string;
  demandeur: { id?: string; nom: string; prenom: string };
  materiel: { id?: string; codeIta: string; designation: string };
  typeCarburant: string;
  quantiteSouhai: any;
  compteurActuel: any;
  garage?: { libelle: string; id: string; stockActuel?: number } | null;
  projet?: { code: string; nom: string; id: string } | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demande: DemandeGarage;
  onSuccess: () => void;
}

export function ModalDistribuerGarage({ open, onOpenChange, demande, onSuccess }: Props) {
  const [chargement, setChargement] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantite: Number(demande.quantiteSouhai) || 0,
      compteur: Number(demande.compteurActuel) || 0,
      pleinComplet: true,
    },
  });

  const quantite = form.watch("quantite");
  const compteur = form.watch("compteur");

  // Vérifications
  const compteurInferieur = compteur < Number(demande.compteurActuel);
  const stockDisponible = demande.garage?.stockActuel || 0;
  const stockInsuffisant = quantite > stockDisponible;

  const handleSubmit = async (values: FormValues) => {
    // Vérification stock (D-06)
    if (stockInsuffisant) {
      toast.error(`Stock insuffisant. Disponible: ${stockDisponible.toFixed(2)} L`);
      return;
    }

    setChargement(true);
    try {
      await distribuerCarburant({
        demandeurId: (demande.demandeur as any).id || demande.id,
        materielId: (demande.materiel as any).id || demande.id,
        typeCarburant: demande.typeCarburant as any,
        quantite: values.quantite,
        compteur: values.compteur,
        pleinComplet: values.pleinComplet,
        nature: "CUVE" as any,
        lieuStockageId: demande.garage?.id,
        articleStockId: undefined, // Article lié au type de carburant
        dateDistribution: new Date(),
      });

      toast.success(
        `Distribution effectuée. Stock réduit de ${values.quantite.toFixed(2)} L`
      );
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la distribution");
    } finally {
      setChargement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Distribuer carburant depuis garage</DialogTitle>
          <DialogDescription>{demande.reference}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Demandeur</div>
              <div>
                {demande.demandeur.prenom} {demande.demandeur.nom}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Matériel</div>
              <div>{demande.materiel.codeIta}</div>
              <div className="text-xs text-muted-foreground">{demande.materiel.designation}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Garage</div>
              <div>{demande.garage?.libelle}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Type carburant</div>
              <Badge variant="outline">{demande.typeCarburant}</Badge>
            </div>
          </div>

          {demande.projet && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Projet (imputation)
              </div>
              <div>
                {demande.projet.code} - {demande.projet.nom}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="bg-muted/50 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantité demandée</span>
            <span className="tabular-nums">{Number(demande.quantiteSouhai).toFixed(2)} L</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Stock disponible</span>
            <span className="tabular-nums">{stockDisponible.toFixed(2)} L</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quantite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité distribuée (L)</FormLabel>
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
                    Quantité effectivement servie (peut différer de la demande)
                  </FormDescription>
                  {stockInsuffisant && (
                    <p className="text-sm text-destructive">
                      ⚠ Stock insuffisant (D-06)
                    </p>
                  )}
                  {quantite > 0 && !stockInsuffisant && (
                    <p className="text-sm text-muted-foreground">
                      Stock après distribution: {(stockDisponible - quantite).toFixed(2)} L
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compteur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compteur actuel (km ou heures)</FormLabel>
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
                    Relevé du compteur au moment de la distribution (D-04, D-09)
                  </FormDescription>
                  {compteurInferieur && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Compteur inférieur au relevé de la demande (
                        {Number(demande.compteurActuel).toLocaleString("fr-FR")}). Anomalie
                        sera enregistrée (D-04).
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pleinComplet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Plein complet (D-10)</FormLabel>
                    <FormDescription>
                      Cocher si le réservoir a été rempli complètement. Requis pour le calcul
                      de consommation.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <div className="text-sm font-medium mb-2">Effet de la distribution</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  • Stock du garage réduit de{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {quantite.toFixed(2)} L
                  </span>
                </div>
                <div>• Mouvement de stock (SORTIE) créé automatiquement</div>
                <div>• Relevé de compteur enregistré (source: CARBURANT)</div>
                {compteurInferieur && <div className="text-warning">• Anomalie compteur signalée</div>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={chargement || stockInsuffisant}>
                {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Fuel className="mr-2 h-4 w-4" />
                Distribuer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
