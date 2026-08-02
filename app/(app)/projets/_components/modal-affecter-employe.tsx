"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { affecterEmployeChantier } from "@/lib/actions/projets";
import { listerEmployes } from "@/lib/actions/employes";
import { Loader2, Plus, Users, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { RoleFonctionnel } from "@prisma/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schemaAffectation = z.object({
  employeId: z.string().min(1, "Employé requis"),
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

interface ModalAffecterEmployeProps {
  projetId: string;
}

const ROLE_LABELS: Record<RoleFonctionnel, string> = {
  CONDUCTEUR: "Conducteur de travaux",
  CHARGE_ETUDES: "Chargé d'études",
  CHEF_CHANTIER: "Chef de chantier",
  CHEF_EQUIPE: "Chef d'équipe",
};

export function ModalAffecterEmploye({ projetId }: ModalAffecterEmployeProps) {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmployes, setLoadingEmployes] = useState(false);
  const [employes, setEmployes] = useState<
    Array<{ id: string; matricule: string; nom: string; prenom: string }>
  >([]);
  const [rechercheEmploye, setRechercheEmploye] = useState("");
  const [erreurChevauchement, setErreurChevauchement] = useState(false);
  const router = useRouter();

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
      roleFonctionnel: "CHEF_EQUIPE",
    },
  });

  const employeId = watch("employeId");
  const roleFonctionnel = watch("roleFonctionnel");

  // Charger la liste des employés
  useEffect(() => {
    if (ouvert) {
      setLoadingEmployes(true);
      listerEmployes({})
        .then((data) => {
          setEmployes(data.items);
        })
        .catch(() => {
          toast.error("Erreur lors du chargement des employés");
        })
        .finally(() => {
          setLoadingEmployes(false);
        });
    }
  }, [ouvert]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setErreurChevauchement(false);
    try {
      await affecterEmployeChantier({
        projetId,
        employeId: data.employeId,
        roleFonctionnel: data.roleFonctionnel,
        dateDebut: new Date(data.dateDebut),
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      });

      toast.success("Employé affecté avec succès");
      setOuvert(false);
      reset();
      router.refresh();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("chevauchement")
      ) {
        setErreurChevauchement(true);
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de l'affectation"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const employesFiltres = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(rechercheEmploye.toLowerCase()) ||
      e.prenom.toLowerCase().includes(rechercheEmploye.toLowerCase()) ||
      e.matricule.toLowerCase().includes(rechercheEmploye.toLowerCase())
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" aria-hidden="true" />
          Affecter un employé
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" aria-hidden="true" />
            Affecter un employé au chantier
          </DialogTitle>
          <DialogDescription>
            Affectez un employé au projet avec son rôle fonctionnel et sa période
            d'affectation.
          </DialogDescription>
        </DialogHeader>

        {erreurChevauchement && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Impossible d'affecter cet employé : il existe déjà une affectation
              active sur cette période. Vérifiez les dates ou terminez l'affectation
              existante.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Employé */}
          <div className="space-y-2">
            <Label htmlFor="employeId">
              Employé <span className="text-destructive">*</span>
            </Label>
            {loadingEmployes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Chargement des employés...
              </div>
            ) : (
              <>
                <Input
                  placeholder="Rechercher par nom, prénom ou matricule..."
                  value={rechercheEmploye}
                  onChange={(e) => setRechercheEmploye(e.target.value)}
                  className="mb-2"
                />
                <Select
                  value={employeId}
                  onValueChange={(value) => setValue("employeId", value)}
                >
                  <SelectTrigger id="employeId">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employesFiltres.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Aucun employé trouvé
                      </div>
                    ) : (
                      employesFiltres.map((employe) => (
                        <SelectItem key={employe.id} value={employe.id}>
                          {employe.matricule} — {employe.prenom} {employe.nom}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </>
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
            <Select
              value={roleFonctionnel}
              onValueChange={(value) =>
                setValue("roleFonctionnel", value as RoleFonctionnel)
              }
            >
              <SelectTrigger id="roleFonctionnel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONDUCTEUR">
                  {ROLE_LABELS.CONDUCTEUR}
                </SelectItem>
                <SelectItem value="CHARGE_ETUDES">
                  {ROLE_LABELS.CHARGE_ETUDES}
                </SelectItem>
                <SelectItem value="CHEF_CHANTIER">
                  {ROLE_LABELS.CHEF_CHANTIER}
                </SelectItem>
                <SelectItem value="CHEF_EQUIPE">
                  {ROLE_LABELS.CHEF_EQUIPE}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.roleFonctionnel && (
              <p className="text-sm text-destructive">
                {errors.roleFonctionnel.message}
              </p>
            )}
          </div>

          {/* Date de début */}
          <div className="space-y-2">
            <Label htmlFor="dateDebut">
              Date de début <span className="text-destructive">*</span>
            </Label>
            <Input id="dateDebut" type="date" {...register("dateDebut")} />
            {errors.dateDebut && (
              <p className="text-sm text-destructive">{errors.dateDebut.message}</p>
            )}
          </div>

          {/* Date de fin (optionnelle) */}
          <div className="space-y-2">
            <Label htmlFor="dateFin">Date de fin (optionnelle)</Label>
            <Input id="dateFin" type="date" {...register("dateFin")} />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour une affectation en cours
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOuvert(false);
                setErreurChevauchement(false);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || loadingEmployes}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Affecter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
