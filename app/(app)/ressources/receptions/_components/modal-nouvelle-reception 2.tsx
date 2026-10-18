"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { creerReception } from "@/lib/actions/reception";
import { format } from "date-fns";

const schemaFormulaire = z.object({
  reference: z
    .string()
    .min(1, "La référence est requise")
    .max(50, "50 caractères maximum"),
  fournisseurNom: z
    .string()
    .min(1, "Le nom du fournisseur est requis")
    .max(200, "200 caractères maximum"),
  dateReception: z.string().min(1, "La date de réception est requise"),
  lignes: z
    .array(
      z.object({
        articleStockId: z.string().min(1, "Sélectionner un article"),
        quantiteCommandee: z.coerce
          .number()
          .min(0, "Quantité >= 0")
          .nonnegative("Quantité >= 0"),
        quantiteLivree: z.coerce
          .number()
          .min(0, "Quantité >= 0")
          .nonnegative("Quantité >= 0"),
        conforme: z.boolean().default(false),
      })
    )
    .min(1, "Au moins une ligne est requise"),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface ModalNouvelleReceptionProps {
  ouvert: boolean;
  onFermer: () => void;
  articles: {
    id: string;
    reference: string;
    designation: string;
    unite: string;
  }[];
}

export function ModalNouvelleReception({
  ouvert,
  onFermer,
  articles,
}: ModalNouvelleReceptionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      reference: "",
      fournisseurNom: "",
      dateReception: format(new Date(), "yyyy-MM-dd"),
      lignes: [
        {
          articleStockId: "",
          quantiteCommandee: 0,
          quantiteLivree: 0,
          conforme: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lignes",
  });

  const handleSubmit = async (data: z.infer<typeof schemaFormulaire>) => {
    setErreur(null);

    try {
      const resultat = await creerReception(
        {
          fournisseurNom: data.fournisseurNom,
          dateReception: new Date(data.dateReception),
        },
        data.lignes.map((ligne) => ({
          articleStockId: ligne.articleStockId,
          quantiteCommandee: ligne.quantiteCommandee,
          quantiteLivree: ligne.quantiteLivree,
          conforme: ligne.conforme,
        }))
      );

      if (!resultat.success) {
        setErreur(resultat.error || "Une erreur est survenue");
        return;
      }

      // Succès
      onFermer();
      form.reset();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const annuler = () => {
    form.reset();
    setErreur(null);
    onFermer();
  };

  const optionsArticles = articles.map((article) => ({
    value: article.id,
    label: `${article.reference} — ${article.designation}`,
  }));

  return (
    <Dialog open={ouvert} onOpenChange={annuler}>
      <DialogContent className="sm:!max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle réception fournisseur</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle réception de livraison fournisseur.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {erreur && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>{erreur}</AlertDescription>
              </Alert>
            )}

            {/* Référence */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: BL-2024-001"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fournisseur */}
            <FormField
              control={form.control}
              name="fournisseurNom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fournisseur</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nom du fournisseur"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de réception */}
            <FormField
              control={form.control}
              name="dateReception"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de réception</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lignes de réception */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Lignes de réception</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      articleStockId: "",
                      quantiteCommandee: 0,
                      quantiteLivree: 0,
                      conforme: false,
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
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end border rounded-lg p-3"
                >
                  {/* Article */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.articleStockId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Article</FormLabel>
                        <FormControl>
                          <Combobox
                            options={optionsArticles}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Sélectionner un article..."
                            searchPlaceholder="Rechercher..."
                            emptyText="Aucun article trouvé"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantité commandée */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.quantiteCommandee`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qté cmd.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            value={field.value as number}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantité livrée */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.quantiteLivree`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qté livrée</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            value={field.value as number}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conforme */}
                  <FormField
                    control={form.control}
                    name={`lignes.${index}.conforme`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center space-y-2">
                        <FormLabel>Conforme</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Supprimer */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mb-2"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={annuler}
                disabled={form.formState.isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Créer la réception
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
