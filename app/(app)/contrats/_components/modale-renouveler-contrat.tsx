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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { AlertCircle, Loader2, X, RefreshCw } from "lucide-react";
import { renouvelerContrat } from "@/lib/actions/employes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const schemaRenouvellement = z.object({
  typeContrat: z.enum(["CDI", "CDD", "INTERIM", "STAGE"]),
  dateDebut: z.string().min(1, "La nouvelle date de début est requise"),
  dateFin: z.string().optional(),
  salaire: z.string().min(1, "Le salaire est requis"),
  motif: z.string().optional(),
});

type FormData = z.infer<typeof schemaRenouvellement>;

interface ModaleRenouvelerContratProps {
  contrat: {
    id: string;
    typeContrat: string;
    dateDebut: Date;
    dateFin?: Date;
    salaire?: number;
    employe: {
      nom: string;
      prenom: string;
      matricule: string;
    };
  } | null;
  ouvert: boolean;
  onFermer: () => void;
}

export function ModaleRenouvelerContrat({
  contrat,
  ouvert,
  onFermer,
}: ModaleRenouvelerContratProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schemaRenouvellement),
    defaultValues: {
      typeContrat: contrat?.typeContrat as "CDI" | "CDD" | "INTERIM" | "STAGE" || "CDD",
      dateDebut: contrat?.dateFin ? format(new Date(contrat.dateFin), "yyyy-MM-dd") : "",
      dateFin: "",
      salaire: contrat?.salaire?.toString() || "",
      motif: "",
    },
  });

  const typeContrat = watch("typeContrat");

  const typeContratOptions: ComboboxOption[] = [
    { value: "CDI", label: "CDI — Contrat à durée indéterminée" },
    { value: "CDD", label: "CDD — Contrat à durée déterminée" },
    { value: "INTERIM", label: "Intérim" },
    { value: "STAGE", label: "Stage" },
  ];

  const onSubmit = async (data: FormData) => {
    if (!contrat) return;
    setErreur(null);

    // Validation CDD
    if ((data.typeContrat === "CDD" || data.typeContrat === "STAGE") && !data.dateFin) {
      setErreur("Un CDD ou stage exige une date de fin");
      return;
    }

    // Validation date de début après ancienne date de fin
    const nouvelleDebut = new Date(data.dateDebut);
    if (contrat.dateFin && nouvelleDebut < new Date(contrat.dateFin)) {
      setErreur("La nouvelle date de début doit être après la date de fin actuelle");
      return;
    }

    startTransition(async () => {
      try {
        await renouvelerContrat({
          contratId: contrat.id,
          typeContrat: data.typeContrat,
          dateDebut: new Date(data.dateDebut),
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
          salaire: parseFloat(data.salaire),
          motif: data.motif,
        });

        reset();
        onFermer();
        router.refresh();
      } catch (error) {
        setErreur(error instanceof Error ? error.message : "Une erreur est survenue");
      }
    });
  };

  const annuler = () => {
    reset();
    setErreur(null);
    onFermer();
  };

  if (!contrat) return null;

  return (
    <Dialog open={ouvert} onOpenChange={annuler}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-lg font-semibold text-primary">
            Renouveler le contrat
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {/* Info employé */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Employé concerné</div>
            <div className="font-medium text-base">
              {contrat.employe.nom} {contrat.employe.prenom}
            </div>
            <div className="text-sm text-muted-foreground font-mono mt-1">
              {contrat.employe.matricule}
            </div>
          </div>

          {/* Info contrat actuel */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="text-sm text-muted-foreground mb-2">Contrat actuel</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type :</span> {contrat.typeContrat}
              </div>
              <div>
                <span className="text-muted-foreground">Salaire :</span>{" "}
                {contrat.salaire ? `${new Intl.NumberFormat('fr-FR').format(contrat.salaire)} FCFA` : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Début :</span>{" "}
                {format(new Date(contrat.dateDebut), "dd/MM/yyyy", { locale: fr })}
              </div>
              <div>
                <span className="text-muted-foreground">Fin :</span>{" "}
                {contrat.dateFin ? format(new Date(contrat.dateFin), "dd/MM/yyyy", { locale: fr }) : "Indéterminée"}
              </div>
            </div>
          </div>

          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Type de contrat */}
          <div className="space-y-2">
            <Label htmlFor="typeContrat" className="text-sm font-medium">
              Nouveau type de contrat <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="typeContrat"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Combobox
                  options={typeContratOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sélectionner un type"
                  searchPlaceholder="Rechercher..."
                  className="h-11"
                />
              )}
            />
            {errors.typeContrat && (
              <p className="text-sm text-destructive">{errors.typeContrat.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut" className="text-sm font-medium">
                Nouvelle date de début <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                {...register("dateDebut")}
                className="h-11"
              />
              {errors.dateDebut && (
                <p className="text-sm text-destructive">{errors.dateDebut.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                💡 Généralement la date de fin du contrat actuel
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin" className="text-sm font-medium">
                Nouvelle date de fin {(typeContrat === "CDD" || typeContrat === "STAGE") && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Input
                type="date"
                {...register("dateFin")}
                className="h-11"
                disabled={typeContrat === "CDI"}
              />
              {errors.dateFin && (
                <p className="text-sm text-destructive">{errors.dateFin.message}</p>
              )}
              {typeContrat === "CDI" && (
                <p className="text-xs text-muted-foreground">
                  CDI sans date de fin
                </p>
              )}
            </div>
          </div>

          {/* Salaire */}
          <div className="space-y-2">
            <Label htmlFor="salaire" className="text-sm font-medium">
              Nouveau salaire mensuel brut (FCFA) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              {...register("salaire")}
              placeholder="0"
              className="h-11"
            />
            {errors.salaire && (
              <p className="text-sm text-destructive">{errors.salaire.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Laissez le même montant si aucune augmentation
            </p>
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif" className="text-sm font-medium">
              Motif du renouvellement (optionnel)
            </Label>
            <Input
              type="text"
              {...register("motif")}
              placeholder="Ex: Fin de période d'essai, renouvellement annuel..."
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Ce motif sera enregistré dans l'historique des avenants
            </p>
          </div>

        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={annuler}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={handleSubmit(onSubmit)}
            className="bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
          >
            {isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            <RefreshCw className="mr-2 size-4" />
            Renouveler le contrat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
