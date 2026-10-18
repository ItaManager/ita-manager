"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { creerDemandeCarburant, soumettreDemandeCarburant, listerGarages } from "@/lib/actions/carburant";
import { Loader2, Car, Building2 } from "lucide-react";

const schemaEtape1 = z.object({
  demandeurId: z.string().min(1, "Demandeur requis"),
  materielId: z.string().min(1, "Matériel requis"),
  projetId: z.string().optional(),
  typeCarburant: z.enum(["GASOIL", "SUPER", "MELANGE"]),
  quantiteSouhai: z.number().positive("Quantité doit être positive"),
  compteurActuel: z.number().nonnegative("Compteur doit être positif ou zéro"),
});

const schemaEtape2 = z.object({
  circuit: z.enum(["STATION", "GARAGE"]),
  garageId: z.string().optional(),
});

const schema = schemaEtape1.merge(schemaEtape2);

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ModalDemandeCarburant({ open, onOpenChange, onSuccess }: Props) {
  const [etape, setEtape] = useState<1 | 2>(1);
  const [chargement, setChargement] = useState(false);
  const [garages, setGarages] = useState<Array<{ id: string; libelle: string; stockActuel: number }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      demandeurId: "",
      materielId: "",
      projetId: "",
      typeCarburant: "GASOIL",
      quantiteSouhai: 0,
      compteurActuel: 0,
      circuit: "STATION",
      garageId: "",
    },
  });

  const circuit = form.watch("circuit");
  const garageId = form.watch("garageId");
  const quantiteSouhai = form.watch("quantiteSouhai");

  useEffect(() => {
    if (open) {
      chargerGarages();
    }
  }, [open]);

  const chargerGarages = async () => {
    try {
      const data = await listerGarages();
      setGarages(data.garages as any);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des garages");
    }
  };

  const handleNext = async () => {
    const valide = await form.trigger([
      "demandeurId",
      "materielId",
      "typeCarburant",
      "quantiteSouhai",
      "compteurActuel",
    ]);
    if (valide) {
      setEtape(2);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    // Validation circuit GARAGE (D-06)
    if (values.circuit === "GARAGE") {
      if (!values.garageId) {
        toast.error("Garage requis pour le circuit GARAGE");
        return;
      }

      const garage = garages.find((g) => g.id === values.garageId);
      if (garage && values.quantiteSouhai > garage.stockActuel) {
        toast.error(
          `Stock insuffisant. Disponible: ${garage.stockActuel.toFixed(2)} L`
        );
        return;
      }
    }

    setChargement(true);
    try {
      const resultat = await creerDemandeCarburant({
        demandeurId: values.demandeurId,
        materielId: values.materielId,
        projetId: values.projetId || undefined,
        typeCarburant: values.typeCarburant,
        quantiteSouhai: values.quantiteSouhai,
        compteurActuel: values.compteurActuel,
        circuit: values.circuit,
        garageId: values.circuit === "GARAGE" ? values.garageId : undefined,
      });

      if (resultat.success && resultat.demande) {
        // Soumettre automatiquement
        await soumettreDemandeCarburant(resultat.demande.id);

        toast.success("Demande créée et soumise avec succès");
        form.reset();
        setEtape(1);
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la demande");
    } finally {
      setChargement(false);
    }
  };

  const garageSelectionne = garages.find((g) => g.id === garageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de carburant</DialogTitle>
          <DialogDescription>
            Étape {etape} sur 2 : {etape === 1 ? "Informations véhicule" : "Circuit de distribution"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {etape === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="demandeurId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demandeur</FormLabel>
                      <FormControl>
                        <Input placeholder="ID demandeur" {...field} />
                      </FormControl>
                      <FormDescription>Employé qui fait la demande</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materielId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matériel (véhicule/engin)</FormLabel>
                      <FormControl>
                        <Input placeholder="ID matériel" {...field} />
                      </FormControl>
                      <FormDescription>Véhicule ou engin concerné</FormDescription>
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
                      <FormDescription>Chantier auquel imputer la dépense (D-08)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                    name="quantiteSouhai"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité souhaitée (L)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="compteurActuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compteur actuel (km ou heures)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Relevé du compteur au moment de la demande (D-04)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {etape === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="circuit"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Circuit de distribution (D-01)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem
                              value="STATION"
                              id="station"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="station"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Car className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-medium">Station</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Plein en station-service
                                </div>
                              </div>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="GARAGE"
                              id="garage"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="garage"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Building2 className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-medium">Garage</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Distribution depuis cuve
                                </div>
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {circuit === "GARAGE" && (
                  <FormField
                    control={form.control}
                    name="garageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Garage</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un garage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {garages.map((garage) => (
                              <SelectItem
                                key={garage.id}
                                value={garage.id}
                                disabled={garage.stockActuel < quantiteSouhai}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{garage.libelle}</span>
                                  <span className="text-xs text-muted-foreground ml-2 tabular-nums">
                                    Stock: {garage.stockActuel.toFixed(2)} L
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {garageSelectionne && (
                          <FormDescription>
                            Stock disponible: {garageSelectionne.stockActuel.toFixed(2)} L
                            {quantiteSouhai > garageSelectionne.stockActuel && (
                              <span className="text-destructive ml-2">
                                ⚠ Stock insuffisant (D-06)
                              </span>
                            )}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              {etape === 2 && (
                <Button type="button" variant="outline" onClick={() => setEtape(1)}>
                  Précédent
                </Button>
              )}
              {etape === 1 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Suivant
                </Button>
              ) : (
                <Button type="submit" disabled={chargement} className="ml-auto">
                  {chargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer et soumettre
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
