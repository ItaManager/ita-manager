"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { AlertCircle, Loader2, X } from "lucide-react";
import { creerJournalier } from "@/lib/actions/employes";

const schemaJournalier = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().min(1, "La date de fin est requise"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  numeroWave: z.string().min(1, "Le numéro Wave est requis"),
  directionId: z.string().min(1, "La direction est requise"),
  serviceId: z.string().optional(),
  projetId: z.string().min(1, "Le projet/chantier est requis"),
});

type FormData = z.infer<typeof schemaJournalier>;

interface ModaleJournalierProps {
  ouvert: boolean;
  onFermer: () => void;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  projets: Array<{ id: string; code: string; nom: string }>;
}

export function ModaleJournalier({
  ouvert,
  onFermer,
  directions,
  services,
  projets,
}: ModaleJournalierProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schemaJournalier),
    defaultValues: {
      nom: "",
      prenom: "",
      dateDebut: "",
      dateFin: "",
      telephone: "",
      numeroWave: "",
      directionId: "",
      serviceId: "",
      projetId: "",
    },
  });

  const directionId = watch("directionId");

  // Options pour les Combobox
  const directionOptions: ComboboxOption[] = directions.map((dir) => ({
    value: dir.id,
    label: dir.libelle,
  }));

  const serviceOptions: ComboboxOption[] = (services ?? [])
    .filter((s) => !directionId || s.directionId === directionId)
    .map((s) => ({
      value: s.id,
      label: s.libelle,
    }));

  const projetOptions: ComboboxOption[] = projets.map((projet) => ({
    value: projet.id,
    label: `${projet.code} - ${projet.nom}`,
  }));

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    try {
      await creerJournalier(data);

      // Succès
      onFermer();
      reset();
      router.refresh();
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const annuler = () => {
    reset();
    setErreur(null);
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={annuler}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative -mt-6 -mx-6 px-6 pt-6 pb-4 rounded-t-xl" style={{ backgroundColor: '#ebeaf2' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={annuler}
            className="absolute -right-2 -top-2 h-8 w-8"
            disabled={isSubmitting}
          >
            <X className="size-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold" style={{ color: '#1d186c' }}>
            Nouveau journalier / Intérimaire
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Identité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("nom")}
                placeholder="Nom"
                className="h-12"
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-sm font-medium">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("prenom")}
                placeholder="Prénom"
                className="h-12"
              />
              {errors.prenom && (
                <p className="text-sm text-destructive">{errors.prenom.message}</p>
              )}
            </div>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut" className="text-sm font-medium">
                Date de début <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                {...register("dateDebut")}
                className="h-12"
              />
              {errors.dateDebut && (
                <p className="text-sm text-destructive">{errors.dateDebut.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin" className="text-sm font-medium">
                Date de fin <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                {...register("dateFin")}
                className="h-12"
              />
              {errors.dateFin && (
                <p className="text-sm text-destructive">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-sm font-medium">
                Téléphone <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("telephone")}
                placeholder="+225 XX XX XX XX XX"
                className="h-12"
              />
              {errors.telephone && (
                <p className="text-sm text-destructive">{errors.telephone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroWave" className="text-sm font-medium">
                Numéro Wave <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("numeroWave")}
                placeholder="+225 XX XX XX XX XX"
                className="h-12"
              />
              {errors.numeroWave && (
                <p className="text-sm text-destructive">{errors.numeroWave.message}</p>
              )}
              <div className="mt-2 p-3 rounded-md bg-blue-50">
                <p className="text-xs text-gray-600">
                  Ce numéro sert pour les paiements de taux journalier.
                </p>
              </div>
            </div>
          </div>

          {/* Affectation */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="directionId" className="text-sm font-medium">
                  Direction <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="directionId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Combobox
                      options={directionOptions}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue("serviceId", ""); // Reset service when direction changes
                      }}
                      placeholder="Sélectionner une direction"
                      searchPlaceholder="Rechercher..."
                      className="h-12"
                    />
                  )}
                />
                {errors.directionId && (
                  <p className="text-sm text-destructive">{errors.directionId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceId" className="text-sm font-medium">
                  Service
                </Label>
                <Controller
                  name="serviceId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={serviceOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionner un service"
                      searchPlaceholder="Rechercher..."
                      className="h-12"
                      disabled={!directionId}
                    />
                  )}
                />
                {errors.serviceId && (
                  <p className="text-sm text-destructive">{errors.serviceId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projetId" className="text-sm font-medium">
                Projet / Chantier <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="projetId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Combobox
                    options={projetOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sélectionner un projet"
                    searchPlaceholder="Rechercher un projet..."
                    className="h-12"
                  />
                )}
              />
              {errors.projetId && (
                <p className="text-sm text-destructive">{errors.projetId.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={annuler}
              disabled={isSubmitting}
              className="h-11 px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 bg-primary hover:bg-primary-hover"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              )}
              Créer l'intérimaire
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
