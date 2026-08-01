"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { ComboboxArticle } from "./combobox-article";
import {
  listerArticles,
  listerFournisseurs,
  creerFournisseur,
  ajouterPrixFournisseur,
} from "@/lib/actions/achats";

const schema = z.object({
  articleId: z.string().min(1, "Sélectionnez un article"),
  fournisseurId: z.string().min(1, "Sélectionnez un fournisseur"),
  prixHT: z.number().positive("Le prix doit être supérieur à zéro"),
});

type FormData = z.infer<typeof schema>;

export function FormulairePrix() {
  const [articles, setArticles] = useState<
    Array<{ id: string; designation: string; unite: { libelle: string } }>
  >([]);
  const [fournisseurs, setFournisseurs] = useState<
    Array<{ id: string; nom: string }>
  >([]);
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
  });

  const articleId = watch("articleId");
  const fournisseurId = watch("fournisseurId");

  // Charger les données au montage
  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    const [articlesData, fournisseursData] = await Promise.all([
      listerArticles(),
      listerFournisseurs(),
    ]);
    setArticles(articlesData);
    setFournisseurs(fournisseursData);
  }

  async function handleCreerFournisseur(nom: string) {
    const fournisseur = await creerFournisseur(nom);
    setFournisseurs((prev) => [...prev, fournisseur]);
    setValue("fournisseurId", fournisseur.id);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await ajouterPrixFournisseur(
        data.articleId,
        data.fournisseurId,
        data.prixHT,
      );
      toast.success("Prix fournisseur ajouté");
      reset();
      // Recharger la page pour afficher le nouveau prix
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'ajout",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* C-01 : Structure <label> complète */}
        <div className="space-y-2">
          <label htmlFor="article" className="block">
            <span className="text-sm font-medium">
              Article <span className="text-destructive">*</span>
            </span>
          </label>
          <ComboboxArticle
            articles={articles}
            value={articleId}
            onChange={(id) => setValue("articleId", id, { shouldValidate: true })}
            onArticleCreated={(article) => {
              setArticles((prev) => [...prev, article]);
              setValue("articleId", article.id, { shouldValidate: true });
            }}
          />
          {/* C-02 : Error REMPLACE help text (jamais les deux) */}
          {errors.articleId ? (
            <p className="text-xs text-destructive">{errors.articleId.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Créez un article s'il n'existe pas
            </p>
          )}
        </div>

        {/* C-01 : Structure <label> complète */}
        <div className="space-y-2">
          <label htmlFor="fournisseur" className="block">
            <span className="text-sm font-medium">
              Fournisseur <span className="text-destructive">*</span>
            </span>
          </label>
          <Combobox
            options={fournisseurs.map((f) => ({
              value: f.id,
              label: f.nom,
            }))}
            value={fournisseurId}
            onChange={(id) => setValue("fournisseurId", id, { shouldValidate: true })}
            placeholder="Sélectionner un fournisseur"
            searchPlaceholder="Rechercher..."
            emptyText="Aucun fournisseur trouvé."
            allowCreate
            onCreateNew={handleCreerFournisseur}
            createLabel="Créer le fournisseur"
          />
          {/* C-02 : Error REMPLACE help text */}
          {errors.fournisseurId ? (
            <p className="text-xs text-destructive">
              {errors.fournisseurId.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Créez un fournisseur s'il n'existe pas
            </p>
          )}
        </div>

        {/* C-01 : Structure <label> complète */}
        <div className="space-y-2">
          <label htmlFor="prixHT" className="block">
            <span className="text-sm font-medium">
              Prix HT (FCFA) <span className="text-destructive">*</span>
            </span>
          </label>
          <Input
            id="prixHT"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            className="montant text-right"
            aria-label="Prix HT en FCFA"
            {...register("prixHT", { valueAsNumber: true })}
          />
          {/* C-02 : Error REMPLACE help text */}
          {errors.prixHT ? (
            <p className="text-xs text-destructive">{errors.prixHT.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Prix unitaire hors taxe
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Ajout en cours..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
