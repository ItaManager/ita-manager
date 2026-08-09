"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { listerTypesAbsence, creerAbsence } from "@/lib/actions/conges";
import { toastSucces, toastErreur } from "@/lib/utils/toast";
import type { ComboboxOption } from "@/components/ui/combobox";

interface ModaleNouvelleDemandeProps {
  ouvert: boolean;
  onFermer: () => void;
}

interface FormData {
  typeAbsenceId: string;
  dateDebut: string;
  dateFin: string;
  motif?: string;
}

export function ModaleNouvelleDemande({ ouvert, onFermer }: ModaleNouvelleDemandeProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [typesAbsence, setTypesAbsence] = useState<ComboboxOption[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const dateDebut = watch("dateDebut");

  // Charger les types d'absence
  useEffect(() => {
    if (ouvert) {
      listerTypesAbsence().then((types) => {
        const options = types.map((type) => ({
          value: type.id,
          label: type.libelle,
        }));
        setTypesAbsence(options);
      });
    }
  }, [ouvert]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Convertir les dates string en Date objects
      await creerAbsence({
        typeAbsenceId: data.typeAbsenceId,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        motif: data.motif,
      });

      toastSucces("Demande créée", "Votre demande a été créée en brouillon avec succès.");
      reset();
      onFermer();
      router.refresh();
    } catch (error: any) {
      toastErreur("Échec de la création", error.message || "Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouvelle demande de congé
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Créez une nouvelle demande de congé ou de permission
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Type d'absence */}
          <div>
            <Label htmlFor="typeAbsenceId" className="text-sm font-medium">
              Type de congé ou permission <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="typeAbsenceId"
              control={control}
              rules={{ required: "Le type d'absence est obligatoire" }}
              render={({ field }) => (
                <Combobox
                  options={typesAbsence}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Choisir un type"
                  searchPlaceholder="Rechercher..."
                  emptyText="Aucun type trouvé"
                />
              )}
            />
            {errors.typeAbsenceId && (
              <p className="text-sm text-destructive mt-1">{errors.typeAbsenceId.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut" className="text-sm font-medium">
                Date de début <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateDebut"
                type="date"
                {...register("dateDebut", { required: "La date de début est obligatoire" })}
                className="h-11 rounded-md"
              />
              {errors.dateDebut && (
                <p className="text-sm text-destructive mt-1">{errors.dateDebut.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateFin" className="text-sm font-medium">
                Date de fin <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateFin"
                type="date"
                {...register("dateFin", {
                  required: "La date de fin est obligatoire",
                })}
                min={dateDebut}
                className="h-11 rounded-md"
              />
              {errors.dateFin && (
                <p className="text-sm text-destructive mt-1">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {/* Motif */}
          <div>
            <Label htmlFor="motif" className="text-sm font-medium">
              Motif de la demande (facultatif)
            </Label>
            <Textarea
              id="motif"
              {...register("motif")}
              placeholder="Précisez le motif de votre demande..."
              rows={4}
              className="resize-none rounded-md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ce motif sera visible par votre supérieur et les RH
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onFermer();
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer la demande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
