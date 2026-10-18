"use client";

import { useState, useTransition } from "react";
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
import { AlertCircle, Loader2, X } from "lucide-react";
import { creerService, modifierService } from "@/lib/actions/organisation";
import { Combobox } from "@/components/ui/combobox";
import type { Direction, Service } from "@prisma/client";

const schemaFormulaire = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(20, "20 caractères maximum")
    .regex(/^[A-Z_]+$/, "Le code doit être en MAJUSCULES (A-Z, _)")
    .transform((val) => val.toUpperCase()),
  libelle: z
    .string()
    .min(1, "Le libellé est requis")
    .max(100, "100 caractères maximum"),
  directionId: z.string().min(1, "La direction est requise"),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface ModalServiceProps {
  ouvert: boolean;
  onFermer: () => void;
  directions: Direction[];
  service?: Service & { direction: Direction };
}

export function ModalService({
  ouvert,
  onFermer,
  directions,
  service,
}: ModalServiceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: service
      ? {
          code: service.code,
          libelle: service.libelle,
          directionId: service.directionId,
        }
      : {
          code: "",
          libelle: "",
          directionId: "",
        },
  });

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    try {
      if (service) {
        // Modification
        await modifierService(service.id, data);
      } else {
        // Création
        const resultat = await creerService({ ...data, ordre: 0 });

        // Si le service existe déjà (R-04 : retourner l'existant)
        if (!resultat.cree) {
          setErreur(
            `Un service avec le code "${data.code}" existe déjà. Le service existant a été sélectionné.`
          );
          // Attendre 2s avant de fermer pour laisser lire le message
          setTimeout(() => {
            onFermer();
            reset();
            startTransition(() => {
              router.refresh();
            });
          }, 2000);
          return;
        }
      }

      // Succès
      onFermer();
      reset();
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
    reset();
    setErreur(null);
    onFermer();
  };

  const directionOptions = directions.map((dir) => ({
    value: dir.id,
    label: dir.libelle,
  }));

  return (
    <Dialog open={ouvert} onOpenChange={annuler}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            {service ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Direction */}
          <div className="space-y-2">
            <Label htmlFor="directionId" className="text-sm font-medium">
              Direction <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="directionId"
              render={({ field }) => (
                <Combobox
                  options={directionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sélectionner une direction..."
                  searchPlaceholder="Rechercher..."
                  emptyText="Aucune direction trouvée"
                  className="h-12"
                  disabled={!!service}
                />
              )}
            />
            {errors.directionId && (
              <p className="text-sm text-destructive">{errors.directionId.message}</p>
            )}
            {service && (
              <p className="text-xs text-muted-foreground">
                La direction ne peut pas être modifiée après création
              </p>
            )}
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("code", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              placeholder="Ex: ACHATS"
              className="h-12 font-mono"
              maxLength={20}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Identifiant unique en MAJUSCULES (A-Z, _)
            </p>
          </div>

          {/* Libellé */}
          <div className="space-y-2">
            <Label htmlFor="libelle" className="text-sm font-medium">
              Libellé <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("libelle")}
              placeholder="Ex: Service Achats"
              className="h-12"
              maxLength={100}
            />
            {errors.libelle && (
              <p className="text-sm text-destructive">{errors.libelle.message}</p>
            )}
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
              {service ? "Enregistrer" : "Créer le service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
