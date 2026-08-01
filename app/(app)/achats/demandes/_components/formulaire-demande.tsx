"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Send } from "lucide-react";
import { creerDemande, soumettreDemande } from "@/lib/actions/achats";
import { useRouter } from "next/navigation";

interface LigneForm {
  articleId: string;
  quantite: number;
  commentaire?: string;
}

interface DemandeForm {
  beneficiaireId: string;
  destinationProjetId?: string;
  motif: string;
  dateBesoin: string;
  typeAchat: "STANDARD" | "URGENCE" | "REGULARISATION";
  lignes: LigneForm[];
}

interface FormulaireDemandeProps {
  articles: Array<{
    id: string;
    designation: string;
    unite: { libelle: string };
  }>;
  employes: Array<{
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  }>;
  projets: Array<{
    id: string;
    code: string;
    libelle: string;
  }>;
}

export function FormulaireDemande({
  articles,
  employes,
  projets,
}: FormulaireDemandeProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState: { errors }, watch } = useForm<DemandeForm>({
    defaultValues: {
      lignes: [{ articleId: "", quantite: 1, commentaire: "" }],
      typeAchat: "STANDARD",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lignes",
  });

  const onSubmit = async (data: DemandeForm, action: "brouillon" | "soumettre") => {
    setLoading(true);
    setError(null);

    try {
      // Créer la demande
      const demande = await creerDemande({
        beneficiaireId: data.beneficiaireId,
        destinationId: data.destinationProjetId || "",
        description: data.motif,
        dateBesoin: new Date(data.dateBesoin),
        urgent: data.typeAchat === "URGENCE",
        type: data.typeAchat === "REGULARISATION" ? "REGULARISATION" : "INITIALE",
        lignes: data.lignes.map(l => {
          const article = articles.find(a => a.id === l.articleId);
          return {
            articleId: l.articleId,
            designation: article?.designation || "",
            quantite: l.quantite,
            unite: article?.unite.libelle || "",
          };
        }),
      });

      // Si soumission, soumettre au N+1
      if (action === "soumettre") {
        await soumettreDemande(demande.id);
      }

      router.push("/achats/demandes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Informations générales */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-base font-semibold">Informations générales</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="beneficiaireId">Bénéficiaire *</Label>
            <Select {...register("beneficiaireId", { required: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employes.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.matricule} - {emp.prenom} {emp.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.beneficiaireId && (
              <p className="mt-1 text-xs text-destructive">Champ obligatoire</p>
            )}
          </div>

          <div>
            <Label htmlFor="destinationProjetId">Projet (optionnel)</Label>
            <Select {...register("destinationProjetId")}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                {projets.map((projet) => (
                  <SelectItem key={projet.id} value={projet.id}>
                    {projet.code} - {projet.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="typeAchat">Type d'achat *</Label>
            <Select {...register("typeAchat", { required: true })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="URGENCE">Urgence</SelectItem>
                <SelectItem value="REGULARISATION">Régularisation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateBesoin">Date de besoin *</Label>
            <Input
              type="date"
              {...register("dateBesoin", { required: true })}
            />
            {errors.dateBesoin && (
              <p className="mt-1 text-xs text-destructive">Champ obligatoire</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="motif">Motif de la demande *</Label>
          <Textarea
            {...register("motif", { required: true })}
            placeholder="Expliquer la raison de cette demande..."
            rows={3}
          />
          {errors.motif && (
            <p className="mt-1 text-xs text-destructive">Champ obligatoire</p>
          )}
        </div>
      </div>

      {/* Lignes d'articles */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Articles demandés</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ articleId: "", quantite: 1, commentaire: "" })}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Ajouter un article
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 md:grid-cols-12 items-start">
              <div className="md:col-span-5">
                <Label htmlFor={`lignes.${index}.articleId`}>Article</Label>
                <Select {...register(`lignes.${index}.articleId`, { required: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un article" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.map((art) => (
                      <SelectItem key={art.id} value={art.id}>
                        {art.designation} ({art.unite.libelle})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`lignes.${index}.quantite`}>Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  {...register(`lignes.${index}.quantite`, {
                    required: true,
                    min: 1,
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="md:col-span-4">
                <Label htmlFor={`lignes.${index}.commentaire`}>Commentaire</Label>
                <Input
                  {...register(`lignes.${index}.commentaire`)}
                  placeholder="Optionnel..."
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleSubmit((data) => onSubmit(data, "brouillon"))}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          Enregistrer en brouillon
        </Button>
        <Button
          type="button"
          onClick={handleSubmit((data) => onSubmit(data, "soumettre"))}
          disabled={loading}
        >
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          Soumettre au N+1
        </Button>
      </div>
    </form>
  );
}
