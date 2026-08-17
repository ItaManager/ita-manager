"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Pencil } from "lucide-react";
import { modifierProjet } from "@/lib/actions/projets";
import { listerEmployes } from "@/lib/actions/employes";
import { toast } from "sonner";
import { useEffect } from "react";

interface ModaleAssignerConducteurProps {
  projetId: string;
  conducteurActuelId?: string | null;
  conducteurActuelNom?: string;
  onSuccess?: () => void;
}

export function ModaleAssignerConducteur({
  projetId,
  conducteurActuelId,
  conducteurActuelNom,
  onSuccess,
}: ModaleAssignerConducteurProps) {
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [employes, setEmployes] = useState<any[]>([]);
  const [conducteurId, setConducteurId] = useState(conducteurActuelId || "");

  useEffect(() => {
    if (ouvert) {
      chargerEmployes();
    }
  }, [ouvert]);

  async function chargerEmployes() {
    try {
      const data = await listerEmployes();
      setEmployes(data.items || []);
    } catch (error) {
      console.error("Erreur chargement employés:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await modifierProjet(projetId, {
          conducteurId: conducteurId || null,
        });
        toast.success("Conducteur de travaux modifié");
        setOuvert(false);
        onSuccess?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de la modification"
        );
      }
    });
  };

  const handleOpen = () => {
    setConducteurId(conducteurActuelId || "");
    setOuvert(true);
  };

  const optionsEmployes = employes.map((emp) => ({
    value: emp.id,
    label: `${emp.prenom} ${emp.nom}`,
  }));

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="h-6 w-6 p-0 hover:bg-muted rounded-md"
        title="Modifier conducteur de travaux"
      >
        <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conducteur de travaux</DialogTitle>
            <DialogDescription>
              Sélectionnez le conducteur de travaux responsable du projet
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conducteur">Conducteur</Label>
              <Combobox
                value={conducteurId}
                onChange={(value) => setConducteurId(value)}
                options={optionsEmployes}
                placeholder="Sélectionner un employé"
                searchPlaceholder="Rechercher un employé..."
                emptyText="Aucun employé trouvé"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Référent fonctionnel — vise les relevés
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOuvert(false)}
                disabled={isPending}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
              >
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
