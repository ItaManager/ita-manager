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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cloturerRemiseStation } from "@/lib/actions/carburant";
import { Loader2, CheckCircle, AlertTriangle, Receipt } from "lucide-react";

const schema = z.object({
  montantDepense: z.number().nonnegative("Montant doit être positif ou zéro"),
  urlRecu: z.string().min(1, "Reçu obligatoire (D-03)"),
});

type FormValues = z.infer<typeof schema>;

type RemiseStation = {
  id: string;
  montantRemis: number;
  demandeCarburant?: {
    reference: string;
    demandeur: { nom: string; prenom: string };
  };
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remise: RemiseStation;
  onSuccess: () => void;
}

export function ModalCloturerRemise({ open, onOpenChange, remise, onSuccess }: Props) {
  const [chargement, setChargement] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      montantDepense: 0,
      urlRecu: "",
    },
  });

  const montantDepense = form.watch("montantDepense");

  // Calcul automatique reliquat (D-02)
  const reliquat = remise.montantRemis - (montantDepense || 0);
  const equationRespectee = Math.abs(reliquat) < 0.01 || reliquat >= 0;

  const handleSubmit = async (values: FormValues) => {
    // Vérification reçu obligatoire (D-03)
    if (!values.urlRecu) {
      toast.error("Reçu de station obligatoire pour clôturer (D-03)");
      return;
    }

    // Vérification équation montant (D-02)
    if (reliquat < 0) {
      toast.error(
        `Montant dépensé (${values.montantDepense} FCFA) supérieur au montant remis (${remise.montantRemis} FCFA)`
      );
      return;
    }

    setChargement(true);
    try {
      await cloturerRemiseStation({
        remiseId: remise.id,
        montantDepense: values.montantDepense,
        urlRecu: values.urlRecu,
      });

      toast.success(
        reliquat > 0
          ? `Remise clôturée. Reliquat à rendre: ${reliquat.toFixed(0)} FCFA`
          : "Remise clôturée sans reliquat"
      );
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la clôture");
    } finally {
      setChargement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Clôturer la remise station</DialogTitle>
          <DialogDescription>
            {remise.demandeCarburant?.reference}
          </DialogDescription>
        </DialogHeader>

        {remise.demandeCarburant && (
          <div className="py-3">
            <div className="text-sm font-medium text-muted-foreground mb-1">Chauffeur</div>
            <div>
              {remise.demandeCarburant.demandeur.prenom}{" "}
              {remise.demandeCarburant.demandeur.nom}
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Montant remis</span>
            <span className="tabular-nums font-medium">
              {remise.montantRemis.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Montant initialement confié au chauffeur
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="montantDepense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant dépensé (FCFA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      {...field}
                      className="tabular-nums"
                    />
                  </FormControl>
                  <FormDescription>
                    Montant effectivement dépensé à la station (selon reçu)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {montantDepense > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calcul automatique (D-02)</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Reliquat = Montant remis - Montant dépensé
                </div>
                <div className="flex items-center justify-between text-lg font-medium">
                  <span>Reliquat</span>
                  <span className={`tabular-nums ${reliquat > 0 ? "text-warning" : "text-success"}`}>
                    {reliquat.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                {reliquat > 0 && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Le chauffeur doit rendre {reliquat.toLocaleString("fr-FR")} FCFA
                    </AlertDescription>
                  </Alert>
                )}
                {reliquat < 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Montant dépensé supérieur au montant remis. Vérifier le reçu.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="urlRecu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reçu de station (D-03) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="URL du reçu uploadé"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Photo/scan du reçu de la station-service (obligatoire pour clôturer)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={chargement || !equationRespectee}
              >
                {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Clôturer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
