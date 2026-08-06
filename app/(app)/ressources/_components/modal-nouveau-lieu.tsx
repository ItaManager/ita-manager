"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { creerLieu } from "@/lib/actions/lieu";
import { ComboboxProjet } from "./combobox-projet";
import type { NatureLieu } from "@prisma/client";

const NATURE_LABELS: Record<NatureLieu, string> = {
  SITE: "Site",
  CHANTIER: "Chantier",
  GARAGE: "Garage",
  MAGASIN: "Magasin",
  BUREAU: "Bureau",
};

const schemaFormulaire = z.object({
  libelle: z
    .string()
    .min(1, "Le libellé est requis")
    .max(100, "100 caractères maximum"),
  nature: z.enum(["SITE", "CHANTIER", "GARAGE", "MAGASIN", "BUREAU"]),
  projetId: z.string().optional(),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface ModalNouveauLieuProps {
  ouvert: boolean;
  onFermer: () => void;
  projets: { id: string; code: string; nom: string }[];
}

export function ModalNouveauLieu({
  ouvert,
  onFermer,
  projets,
}: ModalNouveauLieuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      libelle: "",
      nature: undefined,
      projetId: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    try {
      const resultat = await creerLieu({
        libelle: data.libelle,
        nature: data.nature,
        projetId: data.projetId || undefined,
      });

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

  return (
    <Dialog open={ouvert} onOpenChange={annuler}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau lieu de stockage</DialogTitle>
          <DialogDescription>
            Créez un nouveau lieu de stockage pour organiser votre inventaire.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {erreur && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>{erreur}</AlertDescription>
              </Alert>
            )}

            {/* Libellé */}
            <FormField
              control={form.control}
              name="libelle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Garage Central, Magasin Yopougon"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>
                    Nom du lieu de stockage (doit être unique)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nature */}
            <FormField
              control={form.control}
              name="nature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une nature..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(NATURE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type de lieu (site, chantier, garage, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Projet (optionnel) */}
            <FormField
              control={form.control}
              name="projetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet (optionnel)</FormLabel>
                  <FormControl>
                    <ComboboxProjet
                      projets={projets}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Aucun projet associé"
                    />
                  </FormControl>
                  <FormDescription>
                    Lier ce lieu à un projet spécifique
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Créer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
