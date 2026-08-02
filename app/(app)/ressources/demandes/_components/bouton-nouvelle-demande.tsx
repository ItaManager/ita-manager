"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, FileText } from "lucide-react";
import { creerDemandeRessource } from "@/lib/actions/ressources";
import { useToast } from "@/hooks/use-toast";
import { ComboboxProjet } from "@/app/(app)/ressources/_components/combobox-projet";

type ProjetOption = {
  id: string;
  code: string;
  nom: string;
};

type MaterielOption = {
  id: string;
  codeIta: string;
  designation: string;
};

const schemaLigneHumaine = z.object({
  competence: z.string().min(1, "Compétence requise"),
  quantite: z.number().int().positive("Quantité doit être positive"),
});

const schemaLigneMaterielle = z.object({
  materielId: z.string().min(1, "Matériel requis"),
  quantite: z.number().int().positive("Quantité doit être positive"),
});

const schemaFormulaire = z
  .object({
    nature: z.enum(["HUMAINE", "MATERIELLE"]),
    projetId: z.string().min(1, "Projet requis"),
    dateDebut: z.string().min(1, "Date de début requise"),
    dateFin: z.string().min(1, "Date de fin requise"),
    motif: z.string().min(10, "Le motif doit faire au moins 10 caractères"),
    lignes: z.array(z.union([schemaLigneHumaine, schemaLigneMaterielle])),
  })
  .refine((data) => data.lignes.length > 0, {
    message: "Au moins une ligne requise",
    path: ["lignes"],
  })
  .refine(
    (data) => {
      const debut = new Date(data.dateDebut);
      const fin = new Date(data.dateFin);
      return debut < fin;
    },
    {
      message: "La date de fin doit être après la date de début",
      path: ["dateFin"],
    }
  );

type FormulaireDemande = z.infer<typeof schemaFormulaire>;

type BoutonNouvelleDemandeProps = {
  projets: ProjetOption[];
  materiel: MaterielOption[];
};

export function BoutonNouvelleDemande({
  projets,
  materiel,
}: BoutonNouvelleDemandeProps) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormulaireDemande>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      nature: "MATERIELLE",
      projetId: "",
      dateDebut: "",
      dateFin: "",
      motif: "",
      lignes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lignes",
  });

  const nature = form.watch("nature");

  function ajouterLigne() {
    if (nature === "HUMAINE") {
      append({ competence: "", quantite: 1 });
    } else {
      append({ materielId: "", quantite: 1 });
    }
  }

  function onSubmit(data: FormulaireDemande) {
    startTransition(async () => {
      try {
        await creerDemandeRessource({
          nature: data.nature,
          projetId: data.projetId,
          dateDebut: new Date(data.dateDebut),
          dateFin: new Date(data.dateFin),
          motif: data.motif,
          lignes: data.lignes.map((ligne) => {
            if (nature === "HUMAINE" && "competence" in ligne) {
              return {
                competence: ligne.competence,
                quantite: ligne.quantite,
              };
            } else if ("materielId" in ligne) {
              return {
                materielId: ligne.materielId,
                quantite: ligne.quantite,
              };
            }
            return ligne;
          }),
        });

        toast({
          title: "Demande créée",
          description: "La demande de ressource a été créée avec succès.",
        });

        setOuvert(false);
        form.reset();
        router.refresh();
      } catch (error) {
        toast({
          title: "Erreur",
          description:
            error instanceof Error
              ? error.message
              : "Impossible de créer la demande",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOuvert(true)} aria-label="Nouvelle demande">
        <FileText className="mr-2 size-4" aria-hidden="true" />
        Nouvelle demande
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de ressource</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset lignes when nature changes
                        form.setValue("lignes", []);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="Nature de la demande">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HUMAINE">
                          Ressource humaine
                        </SelectItem>
                        <SelectItem value="MATERIELLE">
                          Ressource matérielle
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projet</FormLabel>
                    <FormControl>
                      <ComboboxProjet
                        projets={projets}
                        value={field.value}
                        onChange={(value) => field.onChange(value || "")}
                        placeholder="Sélectionner un projet..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateDebut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateFin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="motif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Justification de la demande..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Lignes de demande</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={ajouterLigne}
                    aria-label="Ajouter une ligne"
                  >
                    <Plus className="mr-2 size-4" aria-hidden="true" />
                    Ajouter
                  </Button>
                </div>

                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune ligne ajoutée. Cliquez sur "Ajouter" pour commencer.
                  </p>
                )}

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 p-3 border rounded-md"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {nature === "HUMAINE" ? (
                        <FormField
                          control={form.control}
                          name={`lignes.${index}.competence`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Compétence
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Maçon, Chauffeur..."
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name={`lignes.${index}.materielId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Matériel
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {materiel.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      <span className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">
                                          {m.codeIta}
                                        </span>
                                        {m.designation}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name={`lignes.${index}.quantite`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantité</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 1)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => remove(index)}
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOuvert(false)}
                  disabled={enCours}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={enCours}>
                  {enCours ? "Création..." : "Créer la demande"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
