"use client";

import { useState, useTransition, useRef } from "react";
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
import { AlertCircle, Loader2, X, Download, CheckCircle, Upload, FileText } from "lucide-react";
import { creerContrat } from "@/lib/actions/employes";

const schemaContrat = z.object({
  employeId: z.string().min(1, "L'employé est requis"),
  typeContrat: z.enum(["CDI", "CDD", "INTERIM", "STAGE"]),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().optional(),
  salaire: z.string().min(1, "Le salaire est requis"),
  documentContrat: z.any().optional(),
});

type FormData = z.infer<typeof schemaContrat>;

interface ModaleNouveauContratProps {
  ouvert: boolean;
  onFermer: () => void;
  employes: Array<{ id: string; matricule: string; nom: string; prenom: string }>;
}

export function ModaleNouveauContrat({
  ouvert,
  onFermer,
  employes,
}: ModaleNouveauContratProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fichierSelectionne, setFichierSelectionne] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schemaContrat),
    defaultValues: {
      employeId: "",
      typeContrat: "CDI",
      dateDebut: "",
      dateFin: "",
      salaire: "",
    },
  });

  const typeContrat = watch("typeContrat");

  const handleFichierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que c'est un PDF
      if (file.type !== "application/pdf") {
        setErreur("Seuls les fichiers PDF sont acceptés");
        return;
      }
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErreur("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setFichierSelectionne(file);
      setErreur(null);
    }
  };

  const employeOptions: ComboboxOption[] = employes.map((e) => ({
    value: e.id,
    label: `${e.matricule} — ${e.nom} ${e.prenom}`,
  }));

  const typeContratOptions: ComboboxOption[] = [
    { value: "CDI", label: "CDI — Contrat à durée indéterminée" },
    { value: "CDD", label: "CDD — Contrat à durée déterminée" },
    { value: "INTERIM", label: "Intérim" },
    { value: "STAGE", label: "Stage" },
  ];

  const [contratCree, setContratCree] = useState<{ id: string; employeNom: string } | null>(null);

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    // Validation CDD
    if ((data.typeContrat === "CDD" || data.typeContrat === "STAGE") && !data.dateFin) {
      setErreur("Un CDD ou stage exige une date de fin");
      return;
    }

    startTransition(async () => {
      try {
        // Créer le contrat
        const result = await creerContrat({
          employeId: data.employeId,
          typeContrat: data.typeContrat,
          dateDebut: new Date(data.dateDebut),
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
          salaire: parseFloat(data.salaire),
        });

        // Trouver le nom de l'employé
        const employe = employes.find(e => e.id === data.employeId);
        const employeNom = employe ? `${employe.nom} ${employe.prenom}` : "";

        // Afficher l'option de téléchargement
        setContratCree({ id: result.contratId, employeNom });

        // Actualiser la page
        router.refresh();
      } catch (error) {
        setErreur(error instanceof Error ? error.message : "Une erreur est survenue");
      }
    });
  };

  const handleTelechargerPDF = async () => {
    if (!contratCree) return;
    // TODO: Implémenter la génération et téléchargement du PDF
    console.log("Télécharger contrat PDF", contratCree.id);

    // Fermer après téléchargement
    setContratCree(null);
    reset();
    onFermer();
  };

  const handleTerminer = () => {
    setContratCree(null);
    setFichierSelectionne(null);
    reset();
    onFermer();
  };

  const annuler = () => {
    reset();
    setErreur(null);
    setContratCree(null);
    setFichierSelectionne(null);
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={contratCree ? handleTerminer : annuler}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative -mt-6 -mx-6 px-6 pt-6 pb-4 rounded-t-xl" style={{ backgroundColor: '#ebeaf2' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={contratCree ? handleTerminer : annuler}
            className="absolute -right-2 -top-2 h-8 w-8"
            disabled={isPending}
          >
            <X className="size-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold" style={{ color: '#1d186c' }}>
            {contratCree ? "Contrat créé avec succès" : "Nouveau contrat"}
          </DialogTitle>
        </DialogHeader>

        {contratCree ? (
          <div className="space-y-6 mt-4">
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="size-16 text-success mb-4" />
              <h3 className="text-lg font-semibold mb-2">Contrat créé !</h3>
              <p className="text-muted-foreground text-center">
                Le contrat pour <span className="font-medium">{contratCree.employeNom}</span> a été créé avec succès.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleTelechargerPDF}
                className="gap-2 h-11 px-6"
              >
                <Download className="size-4" />
                Télécharger le PDF
              </Button>
              <Button
                onClick={handleTerminer}
                className="h-11 px-6"
              >
                Terminer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Employé */}
          <div className="space-y-2">
            <Label htmlFor="employeId" className="text-sm font-medium">
              Employé <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="employeId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Combobox
                  options={employeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sélectionner un employé"
                  searchPlaceholder="Rechercher par matricule ou nom..."
                  className="h-12"
                />
              )}
            />
            {errors.employeId && (
              <p className="text-sm text-destructive">{errors.employeId.message}</p>
            )}
          </div>

          {/* Type de contrat */}
          <div className="space-y-2">
            <Label htmlFor="typeContrat" className="text-sm font-medium">
              Type de contrat <span className="text-destructive">*</span>
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
                  className="h-12"
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
                Date de fin {(typeContrat === "CDD" || typeContrat === "STAGE") && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Input
                type="date"
                {...register("dateFin")}
                className="h-12"
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
              Salaire mensuel brut (FCFA) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              {...register("salaire")}
              placeholder="0"
              className="h-12"
            />
            {errors.salaire && (
              <p className="text-sm text-destructive">{errors.salaire.message}</p>
            )}
          </div>

          {/* Document du contrat */}
          <div className="space-y-2">
            <Label htmlFor="documentContrat" className="text-sm font-medium">
              Document du contrat (PDF)
            </Label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFichierChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 border-2 border-dashed hover:border-primary"
              >
                <Upload className="size-4 mr-2" />
                {fichierSelectionne ? "Changer le fichier" : "Télécharger le contrat signé"}
              </Button>
              {fichierSelectionne && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="size-5 text-primary" />
                  <span className="text-sm flex-1">{fichierSelectionne.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(fichierSelectionne.size / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFichierSelectionne(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Optionnel — Vous pouvez ajouter le document PDF du contrat signé (max 10 MB)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={annuler}
              disabled={isPending}
              className="h-11 px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-6 bg-primary hover:bg-primary-hover"
            >
              {isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              )}
              Créer le contrat
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
