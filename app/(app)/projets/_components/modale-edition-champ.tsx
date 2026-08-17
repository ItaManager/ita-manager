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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Pencil } from "lucide-react";
import { modifierProjet } from "@/lib/actions/projets";
import { toast } from "sonner";
import { CyclePaie } from "@prisma/client";

type TypeChamp =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "cyclePaie"
  | "periode";

interface ModaleEditionChampProps {
  projetId: string;
  champ: string;
  label: string;
  valeurActuelle: any;
  type?: TypeChamp;
  onSuccess?: () => void;
}

export function ModaleEditionChamp({
  projetId,
  champ,
  label,
  valeurActuelle,
  type = "text",
  onSuccess,
}: ModaleEditionChampProps) {
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [valeur, setValeur] = useState(valeurActuelle || "");
  const [dateDebut, setDateDebut] = useState(
    type === "periode" && valeurActuelle?.debut
      ? new Date(valeurActuelle.debut).toISOString().split("T")[0]
      : ""
  );
  const [dateFin, setDateFin] = useState(
    type === "periode" && valeurActuelle?.fin
      ? new Date(valeurActuelle.fin).toISOString().split("T")[0]
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const donnees: any = {};

        if (type === "periode") {
          donnees.dateDebut = dateDebut ? new Date(dateDebut) : null;
          donnees.dateFin = dateFin ? new Date(dateFin) : null;
        } else if (type === "date") {
          donnees[champ] = valeur ? new Date(valeur) : null;
        } else if (type === "number") {
          donnees[champ] = valeur ? parseFloat(valeur) : null;
        } else {
          donnees[champ] = valeur || null;
        }

        await modifierProjet(projetId, donnees);
        toast.success("Modification enregistrée");
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
    // Réinitialiser les valeurs à l'ouverture
    if (type === "periode") {
      setDateDebut(
        valeurActuelle?.debut
          ? new Date(valeurActuelle.debut).toISOString().split("T")[0]
          : ""
      );
      setDateFin(
        valeurActuelle?.fin
          ? new Date(valeurActuelle.fin).toISOString().split("T")[0]
          : ""
      );
    } else if (type === "date" && valeurActuelle) {
      setValeur(new Date(valeurActuelle).toISOString().split("T")[0]);
    } else {
      setValeur(valeurActuelle || "");
    }
    setOuvert(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="h-6 w-6 p-0 hover:bg-muted rounded-md"
        title={`Modifier ${label.toLowerCase()}`}
      >
        <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Modifiez l'information ci-dessous
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "periode" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date de fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="h-11"
                    min={dateDebut}
                  />
                </div>
              </div>
            ) : type === "cyclePaie" ? (
              <div className="space-y-2">
                <Label htmlFor={champ}>{label}</Label>
                <Combobox
                  value={valeur}
                  onChange={(value) => setValeur(value as CyclePaie)}
                  options={[
                    { value: "JOURNALIER", label: "Journalier" },
                    { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
                    { value: "QUINZAINE", label: "Quinzaine" },
                    { value: "MENSUEL", label: "Mensuel" },
                  ]}
                  placeholder="Sélectionner"
                  searchPlaceholder="Rechercher..."
                  className="h-11"
                />
              </div>
            ) : type === "textarea" ? (
              <div className="space-y-2">
                <Label htmlFor={champ}>{label}</Label>
                <Textarea
                  id={champ}
                  value={valeur}
                  onChange={(e) => setValeur(e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder={`Saisir ${label.toLowerCase()}`}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={champ}>{label}</Label>
                <Input
                  id={champ}
                  type={type}
                  value={valeur}
                  onChange={(e) => setValeur(e.target.value)}
                  className="h-11"
                  placeholder={`Saisir ${label.toLowerCase()}`}
                  min={type === "number" ? "0" : undefined}
                  step={type === "number" ? "1" : undefined}
                />
              </div>
            )}

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
