"use client";

import { useState } from "react";
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
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { creerBonMouvement } from "@/lib/actions/stock";
import { enregistrerMouvement } from "@/lib/actions/stock";
import { useToast } from "@/hooks/use-toast";

type LieuOption = {
  id: string;
  libelle: string;
  nature: string;
};

type ArticleOption = {
  id: string;
  reference: string;
  designation: string;
  unite: string;
};

const schemaLigne = z.object({
  articleStockId: z.string().min(1, "Article requis"),
  quantite: z.number().positive("Quantité doit être positive"),
  prixUnitaire: z.number().optional(),
});

const schemaFormulaire = z
  .object({
    sens: z.enum(["ENTREE", "SORTIE", "AJUSTEMENT"]),
    lieuOrigineId: z.string().optional(),
    lieuDestinationId: z.string().optional(),
    motif: z.string().min(1, "Motif requis"),
    dateMouvement: z.string().min(1, "Date requise"),
    lignes: z.array(schemaLigne).min(1, "Au moins une ligne requise"),
  })
  .refine(
    (data) => {
      if (data.sens === "SORTIE" || data.sens === "AJUSTEMENT") {
        return !!data.lieuOrigineId;
      }
      return true;
    },
    {
      message: "Lieu d'origine requis pour SORTIE ou AJUSTEMENT",
      path: ["lieuOrigineId"],
    }
  )
  .refine(
    (data) => {
      if (data.sens === "ENTREE" || data.sens === "AJUSTEMENT") {
        return !!data.lieuDestinationId;
      }
      return true;
    },
    {
      message: "Lieu de destination requis pour ENTREE ou AJUSTEMENT",
      path: ["lieuDestinationId"],
    }
  );

type FormulaireBon = z.infer<typeof schemaFormulaire>;

type ModalNouveauBonProps = {
  ouvert: boolean;
  onFermer: () => void;
  lieux: LieuOption[];
  articles: ArticleOption[];
};

export function ModalNouveauBon({
  ouvert,
  onFermer,
  lieux,
  articles,
}: ModalNouveauBonProps) {
  const [enChargement, setEnChargement] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormulaireBon>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      sens: "ENTREE",
      lieuOrigineId: "",
      lieuDestinationId: "",
      motif: "",
      dateMouvement: new Date().toISOString().split("T")[0],
      lignes: [{ articleStockId: "", quantite: 1, prixUnitaire: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lignes",
  });

  const sens = form.watch("sens");

  const handleSubmit = async (data: FormulaireBon) => {
    setEnChargement(true);

    try {
      // Créer le bon de mouvement
      const resultBon = await creerBonMouvement(
        data.sens,
        data.lieuOrigineId || null,
        data.lieuDestinationId || null,
        data.motif,
        new Date(data.dateMouvement)
      );

      if (!resultBon.success) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la création du bon",
          variant: "destructive",
        });
        return;
      }

      // Enregistrer chaque ligne comme mouvement de stock
      for (const ligne of data.lignes) {
        const lieuId =
          data.sens === "ENTREE"
            ? data.lieuDestinationId!
            : data.lieuOrigineId!;

        await enregistrerMouvement({
          articleStockId: ligne.articleStockId,
          sens: data.sens,
          quantite: ligne.quantite,
          lieuStockageId: lieuId,
          bonMouvementId: resultBon.bonId,
          motif: data.motif,
          prixUnitaire: ligne.prixUnitaire,
          dateMouvement: new Date(data.dateMouvement),
        });
      }

      toast({
        title: "Succès",
        description: `Bon de mouvement ${resultBon.reference} créé`,
      });

      onFermer();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du bon",
        variant: "destructive",
      });
    } finally {
      setEnChargement(false);
    }
  };

  const lieuxOptions: ComboboxOption[] = lieux.map((l) => ({
    value: l.id,
    label: `${l.libelle} (${l.nature})`,
  }));

  const articlesOptions: ComboboxOption[] = articles.map((a) => ({
    value: a.id,
    label: `${a.reference} - ${a.designation}`,
  }));

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau bon de mouvement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Sens */}
            <FormField
              control={form.control}
              name="sens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sens</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le sens" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ENTREE">Entrée</SelectItem>
                      <SelectItem value="SORTIE">Sortie</SelectItem>
                      <SelectItem value="AJUSTEMENT">Ajustement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lieu origine */}
            {(sens === "SORTIE" || sens === "AJUSTEMENT") && (
              <FormField
                control={form.control}
                name="lieuOrigineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu d'origine</FormLabel>
                    <FormControl>
                      <Combobox
                        options={lieuxOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner un lieu"
                        searchPlaceholder="Rechercher un lieu..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Lieu destination */}
            {(sens === "ENTREE" || sens === "AJUSTEMENT") && (
              <FormField
                control={form.control}
                name="lieuDestinationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu de destination</FormLabel>
                    <FormControl>
                      <Combobox
                        options={lieuxOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner un lieu"
                        searchPlaceholder="Rechercher un lieu..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="dateMouvement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date du mouvement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Motif */}
            <FormField
              control={form.control}
              name="motif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Décrire le motif du mouvement"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lignes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Lignes du bon</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      articleStockId: "",
                      quantite: 1,
                      prixUnitaire: undefined,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start p-3 border rounded-lg"
                >
                  {/* Article */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.articleStockId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Combobox
                            options={articlesOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Article"
                            searchPlaceholder="Rechercher un article..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantité */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.quantite`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Qté"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Prix unitaire */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.prixUnitaire`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Prix (opt.)"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Supprimer */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onFermer}
                disabled={enChargement}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={enChargement}>
                {enChargement ? "Création..." : "Créer le bon"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
