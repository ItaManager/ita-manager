"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { creerJalon, modifierJalon, supprimerJalon } from "@/lib/actions/projets";
import { toast } from "sonner";
import { Loader2, Trash2, Flag } from "lucide-react";

interface ModalJalonProps {
  projetId: string;
  projetCode?: string;
  projetNom?: string;
  jalon?: {
    id: string;
    libelle: string;
    description?: string | null;
    datePrevisionnelle: Date;
    typeValidateur: string;
    validateurExterne?: string | null;
    statut: string;
  };
  ouvert: boolean;
  onFermer: () => void;
  onSuccess: () => void;
}

interface FormulaireJalon {
  libelle: string;
  description?: string;
  datePrevisionnelle: string;
  validateurExterne?: string;
}

export function ModalJalon({
  projetId,
  projetCode,
  projetNom,
  jalon,
  ouvert,
  onFermer,
  onSuccess,
}: ModalJalonProps) {
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [typeValidateur, setTypeValidateur] = useState<string>(
    jalon?.typeValidateur || "INTERNE"
  );
  const [statut, setStatut] = useState<string>(jalon?.statut || "ATTENTE");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormulaireJalon>({
    defaultValues: jalon
      ? {
          libelle: jalon.libelle,
          description: jalon.description || "",
          datePrevisionnelle: new Date(jalon.datePrevisionnelle)
            .toISOString()
            .split("T")[0],
          validateurExterne: jalon.validateurExterne || "",
        }
      : {
          libelle: "",
          description: "",
          datePrevisionnelle: "",
          validateurExterne: "",
        },
  });

  useEffect(() => {
    if (ouvert) {
      setTypeValidateur(jalon?.typeValidateur || "INTERNE");
      setStatut(jalon?.statut || "ATTENTE");

      if (jalon) {
        reset({
          libelle: jalon.libelle,
          description: jalon.description || "",
          datePrevisionnelle: new Date(jalon.datePrevisionnelle)
            .toISOString()
            .split("T")[0],
          validateurExterne: jalon.validateurExterne || "",
        });
      } else {
        reset({
          libelle: "",
          description: "",
          datePrevisionnelle: "",
          validateurExterne: "",
        });
      }
    }
  }, [ouvert, jalon, reset]);

  async function onSubmit(data: FormulaireJalon) {
    setChargement(true);
    try {
      if (jalon) {
        // Modification
        await modifierJalon(jalon.id, {
          libelle: data.libelle,
          description: data.description,
          datePrevisionnelle: new Date(data.datePrevisionnelle),
          typeValidateur: typeValidateur as any,
          validateurExterne:
            typeValidateur !== "INTERNE" ? data.validateurExterne : undefined,
          statut: statut as any,
        });
        toast.success("Jalon modifié avec succès");
      } else {
        // Création
        await creerJalon({
          projetId,
          libelle: data.libelle,
          description: data.description,
          datePrevisionnelle: new Date(data.datePrevisionnelle),
          typeValidateur: typeValidateur as any,
          validateurExterne:
            typeValidateur !== "INTERNE" ? data.validateurExterne : undefined,
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

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl p-0">
        <DialogHeader className="bg-primary-soft p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Flag className="size-5" />
            {jalon ? "Modifier le jalon" : "Nouveau jalon"}
          </DialogTitle>
          {projetCode && projetNom && (
            <p className="text-sm text-muted-foreground mt-1">
              {projetCode} · {projetNom}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Libellé */}
          <div>
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Fin terrassement, Réception provisoire..."
              className="h-12"
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
              placeholder="Description détaillée du jalon..."
              rows={3}
              {...register("description")}
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
              className="h-12"
              {...register("datePrevisionnelle", {
                required: "La date prévisionnelle est requise",
              })}
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
            <Combobox
              value={typeValidateur}
              onChange={setTypeValidateur}
              options={[
                { value: "INTERNE", label: "Interne (DT/DG)" },
                { value: "MAITRE_OEUVRE", label: "Maître d'œuvre" },
                { value: "MAITRE_OUVRAGE", label: "Maître d'ouvrage" },
              ]}
              placeholder="Sélectionner"
              searchPlaceholder="Rechercher..."
            />
          </div>

          {/* Validateur externe (si non INTERNE) */}
          {typeValidateur !== "INTERNE" && (
            <div>
              <Label htmlFor="validateurExterne">Nom du validateur</Label>
              <Input
                id="validateurExterne"
                placeholder="Ex: Bureau de contrôle SOCOTEC"
                className="h-12"
                {...register("validateurExterne")}
              />
            </div>
          )}

          {/* Statut (uniquement en modification) */}
          {jalon && (
            <div>
              <Label htmlFor="statut">Statut</Label>
              <Combobox
                value={statut}
                onChange={setStatut}
                options={[
                  { value: "ATTENTE", label: "En attente" },
                  { value: "VALIDE", label: "Validé" },
                  { value: "ABANDONNE", label: "Abandonné" },
                ]}
                placeholder="Sélectionner"
                searchPlaceholder="Rechercher..."
              />
            </div>
          )}

          <div className="flex justify-between border-t pt-4">
            {jalon && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleSupprimer}
                disabled={suppression}
                className="rounded-full h-11 px-6"
              >
                {suppression ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 mr-2" />
                )}
                Supprimer
              </Button>
            )}
            <div className={`flex gap-2 ${jalon ? "" : "ml-auto"}`}>
              <Button
                type="button"
                variant="outline"
                onClick={onFermer}
                disabled={chargement || suppression}
                className="rounded-full h-11 px-6"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={chargement || suppression}
                className="rounded-full h-11 px-6 bg-[#13850b] hover:bg-[#0f6909] text-white"
              >
                {chargement && <Loader2 className="size-4 mr-2 animate-spin" />}
                {jalon ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
