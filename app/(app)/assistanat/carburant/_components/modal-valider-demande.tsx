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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { validerDemandeCarburant, refuserDemandeCarburant } from "@/lib/actions/carburant";
import { Loader2, CheckCircle, XCircle, Wallet, UserCheck } from "lucide-react";

const schema = z.object({
  modeRemise: z.enum(["ARGENT_REMIS", "ACCOMPAGNEMENT"]).optional(),
  montantRemis: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

type Demande = {
  id: string;
  reference: string;
  demandeur: { nom: string; prenom: string };
  materiel: { codeIta: string; designation: string };
  circuit: string;
  typeCarburant: string;
  quantiteSouhai: any;
  compteurActuel: any;
  statut: string;
  garage?: { libelle: string } | null;
  projet?: { code: string; nom: string } | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demande: Demande;
  onSuccess: () => void;
}

export function ModalValiderDemande({ open, onOpenChange, demande, onSuccess }: Props) {
  const [chargement, setChargement] = useState(false);
  const [action, setAction] = useState<"valider" | "refuser">("valider");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      modeRemise: undefined,
      montantRemis: 0,
    },
  });

  const modeRemise = form.watch("modeRemise");

  const handleValider = async (values: FormValues) => {
    // Validation mode remise pour circuit STATION (D-02)
    if (demande.circuit === "STATION") {
      if (!values.modeRemise) {
        toast.error("Mode de remise requis pour circuit STATION");
        return;
      }

      if (values.modeRemise === "ARGENT_REMIS" && !values.montantRemis) {
        toast.error("Montant remis requis");
        return;
      }
    }

    setChargement(true);
    try {
      await validerDemandeCarburant({
        demandeId: demande.id,
        modeRemise: values.modeRemise,
        montantRemis: values.montantRemis,
      });

      toast.success("Demande validée avec succès");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setChargement(false);
    }
  };

  const handleRefuser = async () => {
    const motif = prompt("Motif de refus:");
    if (!motif) return;

    setChargement(true);
    try {
      await refuserDemandeCarburant({ demandeId: demande.id, motif });
      toast.success("Demande refusée");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du refus");
    } finally {
      setChargement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Valider la demande de carburant</DialogTitle>
          <DialogDescription>
            Référence: {demande.reference}
          </DialogDescription>
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
              <div className="text-sm font-medium text-muted-foreground mb-1">Circuit</div>
              <Badge variant="outline">{demande.circuit}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Type carburant</div>
              <Badge variant="outline">{demande.typeCarburant}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Quantité souhaitée
              </div>
              <div className="tabular-nums">{Number(demande.quantiteSouhai).toFixed(2)} L</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Compteur actuel
              </div>
              <div className="tabular-nums">
                {Number(demande.compteurActuel).toLocaleString("fr-FR")}
              </div>
            </div>
          </div>

          {demande.garage && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Garage</div>
              <div>{demande.garage.libelle}</div>
            </div>
          )}

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

        {demande.circuit === "STATION" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleValider)} className="space-y-6">
              <FormField
                control={form.control}
                name="modeRemise"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>Mode de remise (D-02)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="ARGENT_REMIS"
                            id="argent"
                            className="peer sr-only"
                          />
                          <label
                            htmlFor="argent"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Wallet className="mb-3 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-medium">Argent remis</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Chauffeur reçoit montant
                              </div>
                            </div>
                          </label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="ACCOMPAGNEMENT"
                            id="accompagnement"
                            className="peer sr-only"
                          />
                          <label
                            htmlFor="accompagnement"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <UserCheck className="mb-3 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-medium">Accompagnement</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Gestionnaire accompagne
                              </div>
                            </div>
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Choisir comment le carburant sera acheté à la station
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {modeRemise === "ARGENT_REMIS" && (
                <FormField
                  control={form.control}
                  name="montantRemis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant remis (FCFA)</FormLabel>
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
                        Montant exact remis au chauffeur. Un reliquat devra être rendu (D-02)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRefuser}
                  disabled={chargement}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Refuser
                </Button>
                <Button type="submit" disabled={chargement}>
                  {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valider
                </Button>
              </div>
            </form>
          </Form>
        )}

        {demande.circuit === "GARAGE" && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleRefuser}
              disabled={chargement}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Refuser
            </Button>
            <Button onClick={() => handleValider({})} disabled={chargement}>
              {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              Valider
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
