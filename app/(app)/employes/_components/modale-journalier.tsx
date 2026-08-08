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
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  sexe: z.enum(["MASCULIN", "FEMININ"]).optional(),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  typePieceIdentite: z.enum(["CNI", "PASSEPORT", "ATTESTATION"]).optional(),
  numeroPieceIdentite: z.string().optional(),
  telephone: z
    .string()
    .min(10, "Le numéro doit contenir au moins 10 chiffres")
    .regex(/^(\+225|0)?[0-9\s]+$/, "Format invalide (ex: +225 07 XX XX XX XX ou 07 XX XX XX XX)"),
  numeroWave: z
    .string()
    .min(10, "Le numéro Wave doit contenir au moins 10 chiffres")
    .regex(/^(\+225|0)?[0-9\s]+$/, "Format invalide (ex: +225 07 XX XX XX XX)"),
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
}: ModaleJournalierProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schemaJournalier),
    defaultValues: {
      nom: "",
      prenom: "",
      sexe: undefined,
      dateNaissance: "",
      lieuNaissance: "",
      typePieceIdentite: undefined,
      numeroPieceIdentite: "",
      telephone: "",
      numeroWave: "",
    },
  });

  const typePieceIdentite = watch("typePieceIdentite");

  // Options pour les Combobox
  const sexeOptions: ComboboxOption[] = [
    { value: "MASCULIN", label: "Masculin" },
    { value: "FEMININ", label: "Féminin" },
  ];

  const typePieceOptions: ComboboxOption[] = [
    { value: "CNI", label: "Carte Nationale d'Identité" },
    { value: "PASSEPORT", label: "Passeport" },
    { value: "ATTESTATION", label: "Attestation d'identité" },
  ];

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
            Nouveau journalier
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Créez le profil du journalier. L'affectation à un chantier se fera par la Direction Technique.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Identité */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Identité</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("nom")}
                  placeholder="Nom de famille"
                  className="h-10 rounded-md"
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
                  className="h-10 rounded-md"
                />
                {errors.prenom && (
                  <p className="text-sm text-destructive">{errors.prenom.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sexe" className="text-sm font-medium">
                  Sexe
                </Label>
                <Controller
                  name="sexe"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={sexeOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Sélectionner le sexe"
                      searchPlaceholder="Rechercher..."
                      className="h-10"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateNaissance" className="text-sm font-medium">
                  Date de naissance
                </Label>
                <Input
                  type="date"
                  {...register("dateNaissance")}
                  className="h-10 rounded-md"
                />
                {errors.dateNaissance && (
                  <p className="text-sm text-destructive">{errors.dateNaissance.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieuNaissance" className="text-sm font-medium">
                Lieu de naissance
              </Label>
              <Input
                {...register("lieuNaissance")}
                placeholder="Ex: Abidjan, Côte d'Ivoire"
                className="h-10 rounded-md"
              />
            </div>
          </div>

          {/* Pièce d'identité */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Pièce d'identité</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typePieceIdentite" className="text-sm font-medium">
                  Type de pièce
                </Label>
                <Controller
                  name="typePieceIdentite"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={typePieceOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Sélectionner le type de pièce"
                      searchPlaceholder="Rechercher..."
                      className="h-10"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroPieceIdentite" className="text-sm font-medium">
                  Numéro de pièce
                </Label>
                <Input
                  {...register("numeroPieceIdentite")}
                  placeholder="Ex: CI0123456789"
                  className="h-10 rounded-md"
                  disabled={!typePieceIdentite}
                />
                {errors.numeroPieceIdentite && (
                  <p className="text-sm text-destructive">{errors.numeroPieceIdentite.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact et paiement */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contact et paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-sm font-medium">
                  Téléphone <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("telephone")}
                  type="tel"
                  placeholder="07 XX XX XX XX"
                  className="h-10 rounded-md font-mono"
                />
                {errors.telephone && (
                  <p className="text-sm text-destructive">{errors.telephone.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Numéro pour joindre le journalier
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroWave" className="text-sm font-medium">
                  Numéro Wave <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("numeroWave")}
                  type="tel"
                  placeholder="07 XX XX XX XX"
                  className="h-10 rounded-md font-mono"
                />
                {errors.numeroWave && (
                  <p className="text-sm text-destructive">{errors.numeroWave.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Pour paiements taux journaliers
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={annuler}
              disabled={isSubmitting}
              className="h-10 px-6 rounded-full"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 rounded-full bg-[#13850b] hover:bg-[#0f6909]"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              )}
              Créer le profil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
