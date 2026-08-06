"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  enregistrerArrivee,
  rechercherHabitue,
  listerEmployesPourVisite,
  listerSocietes,
} from "@/lib/actions/visiteurs";
import { MotifVisite } from "@prisma/client";
import { toast } from "sonner";

const schema = z.object({
  nomVisiteur: z.string().min(2, "Nom requis"),
  societe: z.string().optional(),
  telephone: z.string().optional(),
  visiteId: z.string().min(1, "Personne visitée requise"),
  motif: z.nativeEnum(MotifVisite),
  pieceDeposee: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const MOTIFS_LABELS: Record<MotifVisite, string> = {
  RENDEZ_VOUS: "Rendez-vous",
  LIVRAISON: "Livraison",
  ENTRETIEN: "Entretien",
  AUTRE: "Autre",
};

interface Props {
  ouvert: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NouvelleVisiteModal({ ouvert, onClose, onSuccess }: Props) {
  const [chargement, setChargement] = useState(false);
  const [employes, setEmployes] = useState<
    Array<{ id: string; nom: string; prenom: string; matricule: string }>
  >([]);
  const [societes, setSocietes] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<
    Array<{ nomVisiteur: string; societe: string | null; pieceDeposee: boolean }>
  >([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomVisiteur: "",
      societe: "",
      telephone: "",
      visiteId: "",
      motif: MotifVisite.RENDEZ_VOUS,
      pieceDeposee: false,
    },
  });

  useEffect(() => {
    if (ouvert) {
      Promise.all([
        listerEmployesPourVisite(),
        listerSocietes(),
      ]).then(([{ employes: e }, { societes: s }]) => {
        setEmployes(e);
        setSocietes(s);
      });
    }
  }, [ouvert]);

  const handleNomChange = async (nom: string) => {
    form.setValue("nomVisiteur", nom);

    if (nom.length >= 3) {
      const { suggestions: s } = await rechercherHabitue(nom);
      setSuggestions(s);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    form.setValue("nomVisiteur", suggestion.nomVisiteur);
    form.setValue("societe", suggestion.societe || "");
    form.setValue("pieceDeposee", suggestion.pieceDeposee);
    setSuggestions([]);
  };

  const onSubmit = async (data: FormData) => {
    setChargement(true);
    try {
      await enregistrerArrivee(data);
      toast.success("Arrivée enregistrée");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setChargement(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle visite</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nomVisiteur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du visiteur *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          onChange={(e) => handleNomChange(e.target.value)}
                          placeholder="Nom complet"
                        />
                        {suggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <span className="font-medium">
                                  {suggestion.nomVisiteur}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {suggestion.societe}
                                  {suggestion.pieceDeposee && " · Pièce"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="societe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Société</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={societes.map((s) => ({ value: s, label: s }))}
                          placeholder="Sélectionner ou saisir..."
                          allowCreate
                          onCreateNew={(newSociete) => {
                            setSocietes([...societes, newSociete]);
                            field.onChange(newSociete);
                          }}
                          createLabel="Ajouter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+225 XX XX XX XX XX" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="visiteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personne visitée *</FormLabel>
                    <FormControl>
                      <Combobox
                        value={field.value}
                        onChange={field.onChange}
                        options={employes.map((e) => ({
                          value: e.id,
                          label: `${e.prenom} ${e.nom} (${e.matricule})`,
                        }))}
                        placeholder="Rechercher un employé..."
                        searchPlaceholder="Nom, prénom ou matricule..."
                        allowCreate={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="motif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motif *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(MOTIFS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pieceDeposee"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 font-normal">
                        Pièce d'identité déposée
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={chargement}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={chargement}>
                {chargement ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
