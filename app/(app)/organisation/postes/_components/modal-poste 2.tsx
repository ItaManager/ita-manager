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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, X } from "lucide-react";
import { creerPoste, modifierPoste } from "@/lib/actions/organisation";
import { Combobox } from "@/components/ui/combobox";
import type {
  Direction,
  Service,
  Poste,
  NiveauHierarchique,
} from "@prisma/client";

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
  niveau: z.enum(["DIRECTION", "CADRE", "SUPPORT", "OPERATIONNEL"]),
  directionId: z.string().min(1, "La direction est requise"),
  serviceId: z.string().nullable(),
  reserveAdmin: z.boolean(),
  titulaireUnique: z.boolean(),
  ouvreDroitConges: z.boolean(),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface ModalPosteProps {
  ouvert: boolean;
  onFermer: () => void;
  directions: Direction[];
  services: Service[];
  poste?: Poste & { direction: Direction; service: Service | null };
}

const NIVEAUX: Array<{ value: NiveauHierarchique; label: string }> = [
  { value: "DIRECTION", label: "Direction" },
  { value: "CADRE", label: "Cadre" },
  { value: "SUPPORT", label: "Support" },
  { value: "OPERATIONNEL", label: "Opérationnel" },
];

export function ModalPoste({
  ouvert,
  onFermer,
  directions,
  services: servicesInitiaux,
  poste,
}: ModalPosteProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: poste
      ? {
          code: poste.code,
          libelle: poste.libelle,
          niveau: poste.niveau,
          directionId: poste.directionId,
          serviceId: poste.serviceId,
          reserveAdmin: poste.reserveAdmin,
          titulaireUnique: poste.titulaireUnique,
          ouvreDroitConges: poste.ouvreDroitConges,
        }
      : {
          code: "",
          libelle: "",
          niveau: "OPERATIONNEL" as NiveauHierarchique,
          directionId: "",
          serviceId: null,
          reserveAdmin: false,
          titulaireUnique: false,
          ouvreDroitConges: true,
        },
  });

  const directionId = watch("directionId");

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    try {
      if (poste) {
        // Modification
        await modifierPoste(poste.id, data);
      } else {
        // Création
        const resultat = await creerPoste(data);

        // Si le poste existe déjà (R-04 : retourner l'existant)
        if (!resultat.cree) {
          setErreur(
            `Un poste avec le code "${data.code}" existe déjà. Le poste existant a été sélectionné.`
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

  const serviceOptions = [
    { value: "", label: "Aucun service (poste transverse)" },
    ...servicesInitiaux
      .filter((s) => !directionId || s.directionId === directionId)
      .map((s) => ({
        value: s.id,
        label: s.libelle,
      })),
  ];

  const niveauOptions = NIVEAUX.map((n) => ({
    value: n.value,
    label: n.label,
  }));

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
            {poste ? "Modifier le poste" : "Nouveau poste"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Direction & Service */}
          <div className="grid grid-cols-2 gap-4">
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
                    placeholder="Sélectionner..."
                    searchPlaceholder="Rechercher..."
                    emptyText="Aucune direction trouvée"
                    className="h-12"
                    disabled={!!poste}
                  />
                )}
              />
              {errors.directionId && (
                <p className="text-sm text-destructive">{errors.directionId.message}</p>
              )}
              {poste && (
                <p className="text-xs text-muted-foreground">
                  La direction ne peut pas être modifiée
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceId" className="text-sm font-medium">
                Service
              </Label>
              <Controller
                control={control}
                name="serviceId"
                render={({ field }) => (
                  <Combobox
                    options={serviceOptions}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value || null)}
                    placeholder="Sélectionner..."
                    searchPlaceholder="Rechercher..."
                    emptyText="Aucun service trouvé"
                    className="h-12"
                    disabled={!!poste}
                  />
                )}
              />
              {errors.serviceId && (
                <p className="text-sm text-destructive">{errors.serviceId.message}</p>
              )}
              {!poste && (
                <p className="text-xs text-muted-foreground">
                  Optionnel pour un poste transverse
                </p>
              )}
              {poste && (
                <p className="text-xs text-muted-foreground">
                  Le service ne peut pas être modifié
                </p>
              )}
            </div>
          </div>

          {/* Code & Niveau */}
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="Ex: CHEF_CHANTIER"
                className="h-12 font-mono"
                maxLength={20}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Identifiant unique en MAJUSCULES
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau" className="text-sm font-medium">
                Niveau hiérarchique <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="niveau"
                render={({ field }) => (
                  <Combobox
                    options={niveauOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sélectionner..."
                    searchPlaceholder="Rechercher..."
                    emptyText="Aucun niveau trouvé"
                    className="h-12"
                  />
                )}
              />
              {errors.niveau && (
                <p className="text-sm text-destructive">{errors.niveau.message}</p>
              )}
            </div>
          </div>

          {/* Libellé */}
          <div className="space-y-2">
            <Label htmlFor="libelle" className="text-sm font-medium">
              Libellé <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("libelle")}
              placeholder="Ex: Chef de chantier"
              className="h-12"
              maxLength={100}
            />
            {errors.libelle && (
              <p className="text-sm text-destructive">{errors.libelle.message}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <Controller
              control={control}
              name="reserveAdmin"
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="reserveAdmin"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="reserveAdmin"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Réservé aux administrateurs
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Seuls les administrateurs peuvent modifier ce poste
                    </p>
                  </div>
                </div>
              )}
            />

            <Controller
              control={control}
              name="titulaireUnique"
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="titulaireUnique"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="titulaireUnique"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Titulaire unique
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Un seul employé peut occuper ce poste à la fois
                    </p>
                  </div>
                </div>
              )}
            />

            <Controller
              control={control}
              name="ouvreDroitConges"
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="ouvreDroitConges"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="ouvreDroitConges"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Ouvre droit à congés
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Les employés peuvent demander des congés payés
                    </p>
                  </div>
                </div>
              )}
            />
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
              {poste ? "Enregistrer" : "Créer le poste"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
