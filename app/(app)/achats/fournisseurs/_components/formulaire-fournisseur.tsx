"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { creerFournisseur, modifierFournisseur } from "@/lib/actions/achats";
import { useState } from "react";

const schema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  numeroWave: z.string(),
  confirmationWave: z.boolean(),
});

type FournisseurFormData = z.infer<typeof schema>;

interface FormulaireFournisseurProps {
  fournisseur?: {
    id: string;
    nom: string;
    numeroWave: string | null;
  };
  onSuccess: () => void;
}

export function FormulaireFournisseur({
  fournisseur,
  onSuccess,
}: FormulaireFournisseurProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FournisseurFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: fournisseur?.nom || "",
      numeroWave: fournisseur?.numeroWave || "",
      confirmationWave: false,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const numeroWave = watch("numeroWave");
  const confirmationWave = watch("confirmationWave");
  const hasNumeroWave = numeroWave && numeroWave.trim().length > 0;

  async function onSubmit(data: FournisseurFormData) {
    // Validation: if numeroWave is filled, confirmationWave must be checked
    if (data.numeroWave && data.numeroWave.trim().length > 0 && !data.confirmationWave) {
      toast.error("Vous devez confirmer avoir vérifié le numéro Wave");
      return;
    }

    setLoading(true);
    try {
      if (fournisseur) {
        // Modification
        await modifierFournisseur(
          fournisseur.id,
          data.nom,
          data.numeroWave && data.numeroWave.trim().length > 0
            ? data.numeroWave
            : null
        );
        toast.success(`Fournisseur "${data.nom}" modifié`);
      } else {
        // Création
        await creerFournisseur(
          data.nom,
          data.numeroWave && data.numeroWave.trim().length > 0
            ? data.numeroWave
            : undefined
        );
        toast.success(`Fournisseur "${data.nom}" créé`);
      }
      router.refresh();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nom */}
      <div className="space-y-2">
        <label htmlFor="nom" className="block">
          <span className="text-sm font-medium">
            Nom <span className="text-destructive">*</span>
          </span>
        </label>
        <Input
          id="nom"
          placeholder="Ex: SOGEA-SATOM"
          aria-label="Nom du fournisseur"
          {...register("nom")}
        />
        {errors.nom ? (
          <p className="text-xs text-destructive">{errors.nom.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Raison sociale du fournisseur
          </p>
        )}
      </div>

      {/* Numéro Wave */}
      <div className="space-y-2">
        <label htmlFor="numeroWave" className="block">
          <span className="text-sm font-medium">Numéro Wave</span>
        </label>
        <Input
          id="numeroWave"
          type="text"
          inputMode="numeric"
          placeholder="Ex: 0701234567"
          aria-label="Numéro Wave du fournisseur"
          {...register("numeroWave")}
        />
        {errors.numeroWave ? (
          <p className="text-xs text-destructive">{errors.numeroWave.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Numéro Wave Money pour les paiements mobiles (optionnel)
          </p>
        )}
      </div>

      {/* Confirmation Wave - affichée seulement si un numéro est saisi */}
      {hasNumeroWave && (
        <div className="space-y-2 rounded-lg border border-warning bg-warning-soft p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirmationWave"
              checked={confirmationWave}
              onCheckedChange={(checked) =>
                setValue("confirmationWave", checked === true, {
                  shouldValidate: true,
                })
              }
              aria-label="Confirmer la vérification du numéro Wave"
            />
            <label
              htmlFor="confirmationWave"
              className="cursor-pointer text-sm leading-tight"
            >
              Je confirme avoir vérifié ce numéro Wave
            </label>
          </div>
          {errors.confirmationWave && (
            <p className="text-xs text-destructive">
              {errors.confirmationWave.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Le numéro Wave est une donnée sensible utilisée pour les paiements.
            Assurez-vous qu&apos;il est correct avant d&apos;enregistrer.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : fournisseur
            ? "Modifier"
            : "Créer"}
        </Button>
      </DialogFooter>
    </form>
  );
}
