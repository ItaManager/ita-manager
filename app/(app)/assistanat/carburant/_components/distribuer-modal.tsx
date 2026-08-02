"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { distribuerCarburant } from "@/lib/actions/carburant";
import { TypeCarburant, NatureDistribution } from "@prisma/client";
import { Loader2, Fuel } from "lucide-react";

type DistributionFormData = {
  demandeurId: string;
  materielId: string;
  typeCarburant: TypeCarburant;
  quantite: number;
  montant?: number;
  compteur: number;
  pleinComplet: boolean;
  nature: NatureDistribution;
  stationId?: string;
  lieuStockageId?: string;
  articleStockId?: string;
  dateDistribution: string;
};

type DistribuerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employes: Array<{ id: string; nom: string; prenom: string }>;
  materiels: Array<{ id: string; codeIta: string; designation: string }>;
  stations: Array<{ id: string; libelle: string }>;
  cuves: Array<{
    id: string;
    libelle: string;
    articles: Array<{ articleId: string; libelle: string }>;
  }>;
};

const TYPE_LABELS: Record<TypeCarburant, string> = {
  GASOIL: "Gasoil",
  SUPER: "Super",
  MELANGE: "Mélange 2T",
};

export function DistribuerModal({
  open,
  onOpenChange,
  onSuccess,
  employes,
  materiels,
  stations,
  cuves,
}: DistribuerModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DistributionFormData>({
    defaultValues: {
      pleinComplet: true,
      nature: NatureDistribution.STATION,
      dateDistribution: new Date().toISOString().split("T")[0],
    },
  });

  const nature = watch("nature");
  const lieuStockageId = watch("lieuStockageId");

  const cuveSelectionnee = cuves.find((c) => c.id === lieuStockageId);

  const onSubmit = async (data: DistributionFormData) => {
    try {
      setLoading(true);

      // Validation spécifique
      if (data.nature === NatureDistribution.CUVE) {
        if (!data.lieuStockageId || !data.articleStockId) {
          toast.error("Cuve et article sont requis pour une distribution en cuve");
          return;
        }
      } else {
        if (!data.stationId) {
          toast.error("Station est requise pour une distribution en station");
          return;
        }
      }

      const result = await distribuerCarburant({
        ...data,
        dateDistribution: new Date(data.dateDistribution),
      });

      if (result.success) {
        toast.success(`Distribution ${result.distribution.reference} créée`);
        reset();
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la distribution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Nouvelle distribution de carburant
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SECTION 1 — INFORMATIONS DE BASE */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Informations de base
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demandeurId">
                  Demandeur <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue("demandeurId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employes.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.demandeurId && (
                  <p className="text-sm text-destructive">
                    {errors.demandeurId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="materielId">
                  Matériel <span className="text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => setValue("materielId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materiels.map((mat) => (
                      <SelectItem key={mat.id} value={mat.id}>
                        {mat.codeIta} — {mat.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.materielId && (
                  <p className="text-sm text-destructive">
                    {errors.materielId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typeCarburant">
                  Type carburant <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("typeCarburant", value as TypeCarburant)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.typeCarburant && (
                  <p className="text-sm text-destructive">
                    {errors.typeCarburant.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantite">
                  Quantité (L) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantite"
                  type="number"
                  step="0.01"
                  {...register("quantite", {
                    required: "Quantité requise",
                    valueAsNumber: true,
                    min: { value: 0.01, message: "Doit être > 0" },
                  })}
                />
                {errors.quantite && (
                  <p className="text-sm text-destructive">
                    {errors.quantite.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compteur">
                  Compteur <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="compteur"
                  type="number"
                  step="0.01"
                  {...register("compteur", {
                    required: "Compteur requis",
                    valueAsNumber: true,
                    min: { value: 0, message: "Doit être ≥ 0" },
                  })}
                />
                {errors.compteur && (
                  <p className="text-sm text-destructive">
                    {errors.compteur.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateDistribution">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateDistribution"
                  type="date"
                  {...register("dateDistribution", {
                    required: "Date requise",
                  })}
                />
                {errors.dateDistribution && (
                  <p className="text-sm text-destructive">
                    {errors.dateDistribution.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pleinComplet"
                checked={watch("pleinComplet")}
                onCheckedChange={(checked) =>
                  setValue("pleinComplet", checked as boolean)
                }
              />
              <Label htmlFor="pleinComplet" className="font-normal">
                Plein complet
              </Label>
            </div>
          </div>

          {/* SECTION 2 — NATURE DE LA DISTRIBUTION */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Nature de la distribution
            </h3>

            <div className="space-y-2">
              <Label>Nature</Label>
              <Select
                value={nature}
                onValueChange={(value) =>
                  setValue("nature", value as NatureDistribution)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NatureDistribution.STATION}>
                    Station-service (dépense)
                  </SelectItem>
                  <SelectItem value={NatureDistribution.CUVE}>
                    Cuve ITA (mouvement de stock)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CHAMPS ADAPTATIFS */}
            {nature === NatureDistribution.STATION ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stationId">
                    Station <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("stationId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montant">Montant (FCFA)</Label>
                  <Input
                    id="montant"
                    type="number"
                    step="1"
                    {...register("montant", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lieuStockageId">
                    Cuve <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("lieuStockageId", value);
                      setValue("articleStockId", undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cuves.map((cuve) => (
                        <SelectItem key={cuve.id} value={cuve.id}>
                          {cuve.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articleStockId">
                    Article <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("articleStockId", value)}
                    disabled={!lieuStockageId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cuveSelectionnee?.articles.map((article) => (
                        <SelectItem
                          key={article.articleId}
                          value={article.articleId}
                        >
                          {article.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Distribuer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
