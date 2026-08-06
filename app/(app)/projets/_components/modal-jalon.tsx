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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  creerJalon,
  modifierJalon,
  supprimerJalon,
  marquerJalonAtteint,
} from "@/lib/actions/projets";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCircle } from "lucide-react";
import { TypeValidateur, StatutJalon } from "@prisma/client";

interface ModalJalonProps {
  projetId: string;
  jalon?: {
    id: string;
    libelle: string;
    description?: string | null;
    datePrevisionnelle: Date;
    typeValidateur: TypeValidateur;
    validateurExterne?: string | null;
    statut: StatutJalon;
  };
  ouvert: boolean;
  onFermer: () => void;
  onSuccess: () => void;
}

interface FormulaireJalon {
  libelle: string;
  description?: string;
  datePrevisionnelle: string;
  typeValidateur: TypeValidateur;
  validateurExterne?: string;
}

const TYPE_VALIDATEUR_LABELS: Record<TypeValidateur, string> = {
  INTERNE: "Interne (DT/DG)",
  MAITRE_OEUVRE: "Maître d'œuvre",
  MAITRE_OUVRAGE: "Maître d'ouvrage",
};

export function ModalJalon({
  projetId,
  jalon,
  ouvert,
  onFermer,
  onSuccess,
}: ModalJalonProps) {
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [validation, setValidation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormulaireJalon>({
    defaultValues: jalon
      ? {
          libelle: jalon.libelle,
          description: jalon.description || "",
          datePrevisionnelle: new Date(jalon.datePrevisionnelle)
            .toISOString()
            .split("T")[0],
          typeValidateur: jalon.typeValidateur,
          validateurExterne: jalon.validateurExterne || "",
        }
      : {
          libelle: "",
          description: "",
          datePrevisionnelle: "",
          typeValidateur: "INTERNE",
          validateurExterne: "",
        },
  });

  const typeValidateur = watch("typeValidateur");
  const estValide = jalon?.statut === "VALIDE";
  const peutEtreModifie = !estValide;
  const peutEtreValide = jalon?.statut === "ATTENTE";

  async function onSubmit(data: FormulaireJalon) {
    setChargement(true);
    try {
      if (jalon) {
        // Modification
        await modifierJalon(jalon.id, {
          libelle: data.libelle,
          description: data.description,
          datePrevisionnelle: new Date(data.datePrevisionnelle),
          typeValidateur: data.typeValidateur,
          validateurExterne:
            data.typeValidateur !== "INTERNE" ? data.validateurExterne : undefined,
        });
        toast.success("Jalon modifié avec succès");
      } else {
        // Création
        await creerJalon({
          projetId,
          libelle: data.libelle,
          description: data.description,
          datePrevisionnelle: new Date(data.datePrevisionnelle),
          typeValidateur: data.typeValidateur,
          validateurExterne:
            data.typeValidateur !== "INTERNE" ? data.validateurExterne : undefined,
        });
        toast.success("Jalon créé avec succès");
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
    if (!jalon) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce jalon ?")) {
      return;
    }

    setSuppression(true);
    try {
      await supprimerJalon(jalon.id);
      toast.success("Jalon supprimé avec succès");
      onSuccess();
      onFermer();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setSuppression(false);
    }
  }

  async function handleValider() {
    if (!jalon) return;

    if (!confirm("Confirmer la validation de ce jalon ?")) {
      return;
    }

    setValidation(true);
    try {
      await marquerJalonAtteint(jalon.id);
      toast.success("Jalon validé avec succès");
      onSuccess();
      onFermer();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setValidation(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {jalon ? "Modifier le jalon" : "Nouveau jalon"}
          </DialogTitle>
          <DialogDescription>
            {jalon
              ? "Modifiez les informations du jalon"
              : "Créez un nouveau jalon pour ce projet"}
          </DialogDescription>
        </DialogHeader>

        {estValide && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800">
              ✓ Ce jalon a été validé et ne peut plus être modifié
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Libellé */}
          <div>
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Réception des travaux de terrassement"
              {...register("libelle", { required: "Le libellé est requis" })}
              disabled={estValide}
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
              placeholder="Description détaillée du jalon..."
              rows={3}
              {...register("description")}
              disabled={estValide}
            />
          </div>

          {/* Date prévisionnelle */}
          <div>
            <Label htmlFor="datePrevisionnelle">
              Date prévisionnelle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="datePrevisionnelle"
              type="date"
              {...register("datePrevisionnelle", {
                required: "La date prévisionnelle est requise",
              })}
              disabled={estValide}
            />
            {errors.datePrevisionnelle && (
              <p className="text-sm text-red-500 mt-1">
                {errors.datePrevisionnelle.message}
              </p>
            )}
          </div>

          {/* Type de validateur */}
          <div>
            <Label htmlFor="typeValidateur">
              Type de validateur <span className="text-red-500">*</span>
            </Label>
            <Select
              value={typeValidateur}
              onValueChange={(value) =>
                setValue("typeValidateur", value as TypeValidateur)
              }
              disabled={estValide}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_VALIDATEUR_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Validateur externe (si applicable) */}
          {typeValidateur !== "INTERNE" && (
            <div>
              <Label htmlFor="validateurExterne">Nom du validateur externe</Label>
              <Input
                id="validateurExterne"
                placeholder="Ex: M. Dupont (Maître d'œuvre)"
                {...register("validateurExterne")}
                disabled={estValide}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            {jalon && peutEtreModifie && (
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
            {jalon && peutEtreValide && (
              <Button
                type="button"
                variant="outline"
                onClick={handleValider}
                disabled={validation}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                {validation ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="size-4 mr-2" />
                )}
                Valider
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onFermer}>
              {estValide ? "Fermer" : "Annuler"}
            </Button>
            {!estValide && (
              <Button type="submit" disabled={chargement}>
                {chargement && <Loader2 className="size-4 mr-2 animate-spin" />}
                {jalon ? "Enregistrer" : "Créer"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
