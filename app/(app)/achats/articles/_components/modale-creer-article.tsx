"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { listerUnites, creerUnite, creerArticle } from "@/lib/actions/achats";

const schema = z.object({
  designation: z.string().min(1, "La désignation est requise"),
  uniteId: z.string().min(1, "Sélectionnez une unité"),
});

type FormData = z.infer<typeof schema>;

interface ModaleCreerArticleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designationInitiale: string;
  onArticleCreated: (article: {
    id: string;
    designation: string;
    unite: { libelle: string };
  }) => void;
}

export function ModaleCreerArticle({
  open,
  onOpenChange,
  designationInitiale,
  onArticleCreated,
}: ModaleCreerArticleProps) {
  const [unites, setUnites] = useState<Array<{ id: string; libelle: string }>>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      designation: designationInitiale,
    },
  });

  const uniteId = watch("uniteId");

  // Charger les unités au montage
  useEffect(() => {
    if (open) {
      chargerUnites();
      // Réinitialiser la désignation avec la valeur initiale
      setValue("designation", designationInitiale);
    }
  }, [open, designationInitiale, setValue]);

  async function chargerUnites() {
    const unitesData = await listerUnites();
    setUnites(unitesData);
  }

  async function handleCreerUnite(libelle: string) {
    const unite = await creerUnite(libelle);
    setUnites((prev) => [...prev, unite]);
    setValue("uniteId", unite.id);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const article = await creerArticle(data.designation, data.uniteId);
      toast.success(`Article "${article.designation}" créé`);
      onArticleCreated(article);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un article</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* C-01 : Structure <label> complète */}
          <div className="space-y-2">
            <label htmlFor="designation" className="block">
              <span className="text-sm font-medium">
                Désignation <span className="text-destructive">*</span>
              </span>
            </label>
            <Input
              id="designation"
              placeholder="Ex: Sac de ciment 50kg"
              aria-label="Désignation de l'article"
              {...register("designation")}
            />
            {/* C-02 : Error REMPLACE help text */}
            {errors.designation ? (
              <p className="text-xs text-destructive">
                {errors.designation.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nom descriptif de l'article
              </p>
            )}
          </div>

          {/* C-01 : Structure <label> complète */}
          <div className="space-y-2">
            <label htmlFor="unite" className="block">
              <span className="text-sm font-medium">
                Unité <span className="text-destructive">*</span>
              </span>
            </label>
            <Combobox
              options={unites.map((u) => ({
                value: u.id,
                label: u.libelle,
              }))}
              value={uniteId}
              onChange={(id) => setValue("uniteId", id, { shouldValidate: true })}
              placeholder="Sélectionner une unité"
              searchPlaceholder="Rechercher..."
              emptyText="Aucune unité trouvée."
              allowCreate
              onCreateNew={handleCreerUnite}
              createLabel="Créer l'unité"
            />
            {/* C-02 : Error REMPLACE help text */}
            {errors.uniteId ? (
              <p className="text-xs text-destructive">{errors.uniteId.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ex: kg, m³, unité, forfait
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
