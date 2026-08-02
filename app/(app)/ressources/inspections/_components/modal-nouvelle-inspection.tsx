"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { creerInspection } from "@/lib/actions/inspection";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Materiel, LieuStockage, PointInspection, MomentInspection, EtatPoint } from "@prisma/client";

const schemaLigne = z.object({
  pointId: z.string().min(1, "Point d'inspection requis"),
  etat: z.enum(["BON", "MAUVAIS", "ABSENT"] as const, {
    message: "État requis",
  }),
  observation: z.string().optional(),
});

const schemaInspection = z.object({
  materielId: z.string().min(1, "Matériel requis"),
  moment: z.enum(["ENTREE", "SORTIE"] as const, {
    message: "Moment requis",
  }),
  lieuId: z.string().min(1, "Lieu requis"),
  dateInspection: z.string().min(1, "Date requise"),
  compteur: z.string().optional(),
  sourceCompteur: z.enum(["MANUEL", "OBD", "GPS"] as const).optional(),
  lignes: z.array(schemaLigne).min(1, "Au moins un point d'inspection requis"),
});

type FormValues = z.infer<typeof schemaInspection>;

interface ModalNouvelleInspectionProps {
  ouvert: boolean;
  onFermer: () => void;
  materiels: Pick<Materiel, "id" | "codeIta" | "designation">[];
  lieux: Pick<LieuStockage, "id" | "libelle">[];
  pointsInspection: PointInspection[];
}

const momentLabels: Record<MomentInspection, string> = {
  ENTREE: "Inspection à l'entrée (réception)",
  SORTIE: "Inspection à la sortie (remise)",
};

const etatLabels: Record<EtatPoint, string> = {
  BON: "Conforme",
  MAUVAIS: "Réserve / Non-conforme",
  ABSENT: "Absent / Manquant",
};

export function ModalNouvelleInspection({
  ouvert,
  onFermer,
  materiels,
  lieux,
  pointsInspection,
}: ModalNouvelleInspectionProps) {
  const [enCours, setEnCours] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schemaInspection),
    defaultValues: {
      materielId: "",
      moment: undefined as "ENTREE" | "SORTIE" | undefined,
      lieuId: "",
      dateInspection: new Date().toISOString().split("T")[0],
      compteur: "",
      sourceCompteur: undefined as "MANUEL" | "OBD" | "GPS" | undefined,
      lignes: [] as Array<{ pointId: string; etat: "BON" | "MAUVAIS" | "ABSENT"; observation?: string }>,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lignes",
  });

  const compteur = form.watch("compteur");

  const onSubmit = async (values: FormValues) => {
    setEnCours(true);
    try {
      // Déterminer etatGeneral basé sur les lignes
      const hasProbleme = values.lignes.some(
        (ligne) => ligne.etat === "MAUVAIS" || ligne.etat === "ABSENT"
      );
      const etatGeneral: EtatPoint = hasProbleme ? "MAUVAIS" : "BON";

      const result = await creerInspection(
        {
          materielId: values.materielId,
          moment: values.moment,
          lieuId: values.lieuId,
          compteur: values.compteur ? parseFloat(values.compteur) : undefined,
          etatGeneral,
        },
        values.lignes.map((ligne) => ({
          pointId: ligne.pointId,
          etat: ligne.etat,
          observation: ligne.observation,
        }))
      );

      if (result.success) {
        toast({
          title: "Inspection créée",
          description: "L'inspection a été enregistrée avec succès",
        });
        form.reset();
        onFermer();
        router.refresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle inspection</DialogTitle>
          <DialogDescription>
            Enregistrer une inspection de matériel avec relevé des points de contrôle
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Informations générales</h3>

              <FormField
                control={form.control}
                name="materielId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matériel</FormLabel>
                    <FormControl>
                      <Combobox
                        options={materiels.map((m) => ({
                          value: m.id,
                          label: `${m.codeIta} — ${m.designation}`,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner un matériel..."
                        searchPlaceholder="Rechercher..."
                        emptyText="Aucun matériel trouvé"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="moment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'inspection</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(momentLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
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
                  name="lieuId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu</FormLabel>
                      <FormControl>
                        <Combobox
                          options={lieux.map((l) => ({
                            value: l.id,
                            label: l.libelle,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sélectionner un lieu..."
                          searchPlaceholder="Rechercher..."
                          emptyText="Aucun lieu trouvé"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateInspection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="compteur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compteur (km/h)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Optionnel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {compteur && (
                  <FormField
                    control={form.control}
                    name="sourceCompteur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source compteur</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Source..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MANUEL">Manuel</SelectItem>
                            <SelectItem value="OBD">OBD</SelectItem>
                            <SelectItem value="GPS">GPS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Points de contrôle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Points de contrôle</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      pointId: "",
                      etat: "BON",
                      observation: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Ajouter un point
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun point de contrôle. Ajoutez-en au moins un.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-3 items-start p-3 border rounded-md"
                  >
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.pointId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Combobox
                                options={pointsInspection.map((p) => ({
                                  value: p.id,
                                  label: p.libelle,
                                }))}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Point d'inspection..."
                                searchPlaceholder="Rechercher..."
                                emptyText="Aucun point trouvé"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.etat`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(etatLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.observation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Observation..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-label="Supprimer" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onFermer}
                disabled={enCours}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={enCours}>
                {enCours ? "Enregistrement..." : "Enregistrer l'inspection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
