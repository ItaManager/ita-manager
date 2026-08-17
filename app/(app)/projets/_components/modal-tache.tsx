"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { creerTache, modifierTache, supprimerTache } from "@/lib/actions/projets";
import { listerEmployes } from "@/lib/actions/employes";
import { toast } from "sonner";
import { Loader2, Trash2, X } from "lucide-react";

interface ModalTacheProps {
  projetId: string;
  tache?: {
    id: string;
    libelle: string;
    description?: string | null;
    dateDebut: Date;
    dateFin: Date;
    avancementPlanifie: number;
    responsableId?: string | null;
    affectations?: Array<{ employeId: string }>;
  };
  ouvert: boolean;
  onFermer: () => void;
  onSuccess: () => void;
}

interface FormulaireTache {
  libelle: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  avancementPlanifie: number;
}

export function ModalTache({
  projetId,
  tache,
  ouvert,
  onFermer,
  onSuccess,
}: ModalTacheProps) {
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [employes, setEmployes] = useState<any[]>([]);
  const [responsableId, setResponsableId] = useState<string>(
    tache?.responsableId || ""
  );
  const [employeIds, setEmployeIds] = useState<string[]>(
    tache?.affectations?.map((a) => a.employeId) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormulaireTache>({
    defaultValues: tache
      ? {
          libelle: tache.libelle,
          description: tache.description || "",
          dateDebut: new Date(tache.dateDebut).toISOString().split("T")[0],
          dateFin: new Date(tache.dateFin).toISOString().split("T")[0],
          avancementPlanifie: tache.avancementPlanifie,
        }
      : {
          libelle: "",
          description: "",
          dateDebut: "",
          dateFin: "",
          avancementPlanifie: 0,
        },
  });

  // Charger la liste des employés
  useEffect(() => {
    if (ouvert) {
      chargerEmployes();
      // Réinitialiser les affectations
      setResponsableId(tache?.responsableId || "");
      setEmployeIds(tache?.affectations?.map((a) => a.employeId) || []);
    }
  }, [ouvert, tache]);

  async function chargerEmployes() {
    try {
      const data = await listerEmployes();
      setEmployes(data.items || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des employés");
    }
  }

  async function onSubmit(data: FormulaireTache) {
    setChargement(true);
    try {
      if (tache) {
        // Modification
        await modifierTache(tache.id, {
          libelle: data.libelle,
          description: data.description,
          dateDebut: new Date(data.dateDebut),
          dateFin: new Date(data.dateFin),
          avancementPlanifie: data.avancementPlanifie,
          responsableId: responsableId || undefined,
          employeIds,
        });
        toast.success("Tâche modifiée avec succès");
      } else {
        // Création
        await creerTache({
          projetId,
          libelle: data.libelle,
          description: data.description,
          dateDebut: new Date(data.dateDebut),
          dateFin: new Date(data.dateFin),
          avancementPlanifie: data.avancementPlanifie,
          responsableId: responsableId || undefined,
          employeIds,
        });
        toast.success("Tâche créée avec succès");
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
    if (!tache) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    setSuppression(true);
    try {
      await supprimerTache(tache.id);
      toast.success("Tâche supprimée avec succès");
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tache ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
          <DialogDescription>
            {tache
              ? "Modifiez les informations de la tâche"
              : "Créez une nouvelle tâche pour ce projet"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Libellé */}
          <div>
            <Label htmlFor="libelle">
              Libellé <span className="text-red-500">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Terrassement zone A"
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
              placeholder="Description détaillée de la tâche..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateDebut"
                type="date"
                {...register("dateDebut", {
                  required: "La date de début est requise",
                })}
              />
              {errors.dateDebut && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.dateDebut.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateFin">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateFin"
                type="date"
                {...register("dateFin", { required: "La date de fin est requise" })}
              />
              {errors.dateFin && (
                <p className="text-sm text-red-500 mt-1">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {/* Avancement */}
          <div>
            <Label htmlFor="avancementPlanifie">
              Avancement planifié (%)
            </Label>
            <Input
              id="avancementPlanifie"
              type="number"
              min="0"
              max="100"
              {...register("avancementPlanifie", {
                valueAsNumber: true,
                min: { value: 0, message: "Minimum 0%" },
                max: { value: 100, message: "Maximum 100%" },
              })}
            />
            {errors.avancementPlanifie && (
              <p className="text-sm text-red-500 mt-1">
                {errors.avancementPlanifie.message}
              </p>
            )}
          </div>

          {/* Responsable */}
          <div>
            <Label htmlFor="responsable">Responsable de la tâche</Label>
            <Combobox
              value={responsableId}
              onChange={setResponsableId}
              options={[
                { value: "", label: "Aucun responsable" },
                ...employes.map((emp) => ({
                  value: emp.id,
                  label: `${emp.prenom} ${emp.nom}`,
                })),
              ]}
              placeholder="Sélectionner un responsable"
              searchPlaceholder="Rechercher..."
            />
          </div>

          {/* Employés affectés */}
          <div>
            <Label>Employés affectés</Label>
            <Combobox
              value=""
              onChange={(value) => {
                if (value && !employeIds.includes(value)) {
                  setEmployeIds([...employeIds, value]);
                }
              }}
              options={employes
                .filter((emp) => !employeIds.includes(emp.id))
                .map((emp) => ({
                  value: emp.id,
                  label: `${emp.prenom} ${emp.nom}`,
                }))}
              placeholder="Ajouter un employé"
              searchPlaceholder="Rechercher..."
            />
            {employeIds.length > 0 && (
              <div className="mt-2 space-y-1">
                {employeIds.map((empId) => {
                  const emp = employes.find((e) => e.id === empId);
                  if (!emp) return null;
                  return (
                    <div
                      key={empId}
                      className="flex items-center justify-between py-1.5 px-2 bg-muted rounded-md text-sm"
                    >
                      <span>
                        {emp.prenom} {emp.nom}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEmployeIds(employeIds.filter((id) => id !== empId))
                        }
                        className="h-6 w-6 p-0 hover:bg-background"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {tache && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleSupprimer}
                disabled={suppression}
                className="mr-auto"
              >
                {suppression ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Supprimer
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onFermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={chargement}>
              {chargement && <Loader2 className="size-4 mr-2 animate-spin" />}
              {tache ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
