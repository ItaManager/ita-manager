"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { creerTache, modifierTache, supprimerTache } from "@/lib/actions/projets";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface ModalTacheProps {
  projetId: string;
  tache?: {
    id: string;
    libelle: string;
    description?: string | null;
    dateDebut: Date;
    dateFin: Date;
    avancementPlanifie: number;
  };
  ouvert: boolean;
  onFermer: () => void;
  onSuccess: () => void;
}

interface FormulaireTache {
  libelle: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  avancementPlanifie: number;
}

export function ModalTache({
  projetId,
  tache,
  ouvert,
  onFermer,
  onSuccess,
}: ModalTacheProps) {
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormulaireTache>({
    defaultValues: tache
      ? {
          libelle: tache.libelle,
          description: tache.description || "",
          dateDebut: new Date(tache.dateDebut).toISOString().split("T")[0],
          dateFin: new Date(tache.dateFin).toISOString().split("T")[0],
          avancementPlanifie: tache.avancementPlanifie,
        }
      : {
          libelle: "",
          description: "",
          dateDebut: "",
          dateFin: "",
          avancementPlanifie: 0,
        },
  });

  async function onSubmit(data: FormulaireTache) {
    setChargement(true);
    try {
      if (tache) {
        // Modification
        await modifierTache(tache.id, {
          libelle: data.libelle,
          description: data.description,
          dateDebut: new Date(data.dateDebut),
          dateFin: new Date(data.dateFin),
          avancementPlanifie: data.avancementPlanifie,
        });
        toast.success("Tâche modifiée avec succès");
      } else {
        // Création
        await creerTache({
          projetId,
          libelle: data.libelle,
          description: data.description,
          dateDebut: new Date(data.dateDebut),
          dateFin: new Date(data.dateFin),
          avancementPlanifie: data.avancementPlanifie,
        });
        toast.success("Tâche créée avec succès");
      }
      reset();
      onSuccess();
      onFermer();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  async function handleSupprimer() {
    if (!tache) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    setSuppression(true);
    try {
      await supprimerTache(tache.id);
      toast.success("Tâche supprimée avec succès");
      onSuccess();
      onFermer();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setSuppression(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tache ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
          <DialogDescription>
            {tache
              ? "Modifiez les informations de la tâche"
              : "Créez une nouvelle tâche pour ce projet"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Libellé */}
          <div>
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Terrassement zone A"
              {...register("libelle", { required: "Le libellé est requis" })}
            />
            {errors.libelle && (
              <p className="text-sm text-red-500 mt-1">{errors.libelle.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description détaillée de la tâche..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateDebut"
                type="date"
                {...register("dateDebut", {
                  required: "La date de début est requise",
                })}
              />
              {errors.dateDebut && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.dateDebut.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateFin">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateFin"
                type="date"
                {...register("dateFin", { required: "La date de fin est requise" })}
              />
              {errors.dateFin && (
                <p className="text-sm text-red-500 mt-1">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {/* Avancement */}
          <div>
            <Label htmlFor="avancementPlanifie">
              Avancement planifié (%)
            </Label>
            <Input
              id="avancementPlanifie"
              type="number"
              min="0"
              max="100"
              {...register("avancementPlanifie", {
                valueAsNumber: true,
                min: { value: 0, message: "Minimum 0%" },
                max: { value: 100, message: "Maximum 100%" },
              })}
            />
            {errors.avancementPlanifie && (
              <p className="text-sm text-red-500 mt-1">
                {errors.avancementPlanifie.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            {tache && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleSupprimer}
                disabled={suppression}
                className="mr-auto"
              >
                {suppression ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Supprimer
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onFermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={chargement}>
              {chargement && <Loader2 className="size-4 mr-2 animate-spin" />}
              {tache ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
