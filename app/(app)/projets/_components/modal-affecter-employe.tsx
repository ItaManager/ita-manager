"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  affecterEmployeChantier,
  modifierAffectationChantier,
} from "@/lib/actions/projets";
import { listerEmployes } from "@/lib/actions/employes";
import { Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { RoleFonctionnel } from "@prisma/client";
import { toast } from "sonner";

const schemaAffectation = z.object({
  employeId: z.string().optional(),
  roleFonctionnel: z.enum([
    "CONDUCTEUR",
    "CHARGE_ETUDES",
    "CHEF_CHANTIER",
    "CHEF_EQUIPE",
  ]),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().optional(),
});

type FormValues = z.infer<typeof schemaAffectation>;

export interface AffectationData {
  id: string;
  employeId: string;
  employeNom: string;
  employePrenom: string;
  roleFonctionnel: RoleFonctionnel;
  dateDebut: Date;
  dateFin?: Date | null;
}

interface ModalAffecterEmployeProps {
  projetId: string;
  projetCode: string;
  projetNom: string;
  children: React.ReactNode;
  // Mode édition
  affectation?: AffectationData;
}

const ROLE_LABELS: Record<RoleFonctionnel, string> = {
  CONDUCTEUR: "Conducteur de Travaux",
  CHARGE_ETUDES: "Chargé d'études",
  CHEF_CHANTIER: "Chef Chantier",
  CHEF_EQUIPE: "Chef d'équipe",
};

type EmployeItem = {
  id: string;
  nom: string;
  prenom: string;
  posteLibelle: string | null;
  dejaAffecte: boolean;
};

export function ModalAffecterEmploye({
  projetId,
  projetCode,
  projetNom,
  children,
  affectation,
}: ModalAffecterEmployeProps) {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmployes, setLoadingEmployes] = useState(false);
  const [employes, setEmployes] = useState<EmployeItem[]>([]);
  const router = useRouter();

  const modeEdition = !!affectation;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schemaAffectation),
    defaultValues: {
      employeId: affectation?.employeId || "",
      roleFonctionnel: affectation?.roleFonctionnel || "CHEF_EQUIPE",
      dateDebut: affectation
        ? new Date(affectation.dateDebut).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dateFin: affectation?.dateFin
        ? new Date(affectation.dateFin).toISOString().split("T")[0]
        : "",
    },
  });

  const employeId = watch("employeId");
  const roleFonctionnel = watch("roleFonctionnel");

  // Charger la liste des employés avec leur poste actuel
  useEffect(() => {
    if (ouvert) {
      setLoadingEmployes(true);
      listerEmployes({})
        .then((data) => {
          // Récupérer aussi les affectations existantes sur ce projet
          const employesAvecPoste: EmployeItem[] = data.items.map((emp: any) => {
            const affectationActuelle = emp.affectations?.[0];
            const posteLibelle = affectationActuelle?.poste?.libelle || null;

            return {
              id: emp.id,
              nom: emp.nom,
              prenom: emp.prenom,
              posteLibelle,
              dejaAffecte: false, // TODO: vérifier si déjà affecté au projet
            };
          });
          setEmployes(employesAvecPoste);
        })
        .catch(() => {
          toast.error("Erreur lors du chargement des employés");
        })
        .finally(() => {
          setLoadingEmployes(false);
        });
    }
  }, [ouvert, modeEdition]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      if (modeEdition && affectation) {
        // Mode édition
        const changementEmploye = data.employeId !== affectation.employeId;

        await modifierAffectationChantier({
          affectationId: affectation.id,
          employeId: changementEmploye ? data.employeId : undefined,
          roleFonctionnel: data.roleFonctionnel,
          dateDebut: new Date(data.dateDebut),
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        });

        if (changementEmploye) {
          toast.success("Employé remplacé avec succès");
        } else {
          toast.success("Affectation modifiée avec succès");
        }
      } else {
        // Mode création
        if (!data.employeId) {
          toast.info("Affectation ouverte créée");
          setOuvert(false);
          reset();
          return;
        }

        await affecterEmployeChantier({
          projetId,
          employeId: data.employeId,
          roleFonctionnel: data.roleFonctionnel,
          dateDebut: new Date(data.dateDebut),
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        });
        toast.success("Employé affecté avec succès");
      }

      setOuvert(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Erreur lors de ${modeEdition ? "la modification" : "l'affectation"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Transform employee data into ComboboxOption[]
  const employeOptions: ComboboxOption[] = employes.map((emp) => ({
    value: emp.id,
    label: `${emp.prenom} ${emp.nom}`,
    description: emp.posteLibelle || undefined,
    disabled: emp.dejaAffecte,
  }));

  // Liste des rôles disponibles
  const roleOptions: ComboboxOption[] = [
    { value: "CONDUCTEUR", label: ROLE_LABELS.CONDUCTEUR },
    { value: "CHARGE_ETUDES", label: ROLE_LABELS.CHARGE_ETUDES },
    { value: "CHEF_CHANTIER", label: ROLE_LABELS.CHEF_CHANTIER },
    { value: "CHEF_EQUIPE", label: ROLE_LABELS.CHEF_EQUIPE },
  ];

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <div onClick={() => setOuvert(true)}>{children}</div>

      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl p-0">
        <DialogHeader className="bg-primary-soft p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-primary">
            {modeEdition ? "Modifier l'affectation" : "Affecter au chantier"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {projetCode} · {projetNom}
            {modeEdition && affectation && (
              <> • {affectation.employePrenom} {affectation.employeNom}</>
            )}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Employé - Combobox */}
          <div className="space-y-2">
            <Label htmlFor="employeId">
              Employé <span className="text-destructive">*</span>
            </Label>
            {loadingEmployes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-12 px-4 border border-border rounded-lg">
                <Loader2 className="size-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <Combobox
                variant="search"
                options={employeOptions}
                value={employeId}
                onChange={(value) => setValue("employeId", value)}
                placeholder="Rechercher un employé"
                searchPlaceholder="Rechercher un employé"
                emptyText="Aucun employé trouvé"
              />
            )}
            {errors.employeId && (
              <p className="text-sm text-destructive">{errors.employeId.message}</p>
            )}
          </div>

          {/* Rôle fonctionnel */}
          <div className="space-y-2">
            <Label htmlFor="roleFonctionnel">
              Rôle fonctionnel <span className="text-destructive">*</span>
            </Label>
            <Combobox
              variant="search"
              options={roleOptions}
              value={roleFonctionnel}
              onChange={(value) => setValue("roleFonctionnel", value as RoleFonctionnel)}
              placeholder="Rechercher un rôle"
              searchPlaceholder="Rechercher un rôle"
              emptyText="Aucun rôle trouvé"
            />
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">
                Date de début <span className="text-destructive">*</span>
              </Label>
              <Input id="dateDebut" type="date" {...register("dateDebut")} className="h-12" />
              {errors.dateDebut && (
                <p className="text-sm text-destructive">{errors.dateDebut.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin</Label>
              <Input id="dateFin" type="date" {...register("dateFin")} className="h-12" />
              {!modeEdition && (
                <p className="text-xs text-muted-foreground">
                  Laisser vide pour une affectation ouverte
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOuvert(false);
                reset();
              }}
              disabled={loading}
              className="h-10 px-4 text-base rounded-full border-2 hover:border-primary transition-all"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={loading || loadingEmployes}
              className="gap-2 h-10 px-4 text-base rounded-full bg-success hover:bg-success-hover text-success-foreground transition-all"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Check className="size-5" />
              )}
              {modeEdition ? "Enregistrer" : "Affecter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
