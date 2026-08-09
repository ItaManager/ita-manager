"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { creerCompetence, modifierCompetence } from "@/lib/actions/competences";
import type { CompetenceListItem } from "@/lib/actions/competences";
import { toast } from "sonner";

interface ModaleCompetenceProps {
  ouvert: boolean;
  onClose: () => void;
  mode: "creer" | "modifier";
  competence?: CompetenceListItem;
}

export function ModaleCompetence({
  ouvert,
  onClose,
  mode,
  competence,
}: ModaleCompetenceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [libelle, setLibelle] = useState(competence?.libelle || "");
  const [categorie, setCategorie] = useState<"BASE" | "QUALIFIE" | "COMPOSEE">(
    (competence?.categorie as "BASE" | "QUALIFIE" | "COMPOSEE") || "QUALIFIE"
  );
  const [description, setDescription] = useState(competence?.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!libelle.trim()) {
      toast.error("Le libellé est requis");
      return;
    }

    startTransition(async () => {
      if (mode === "creer") {
        const result = await creerCompetence({
          libelle,
          categorie,
          description: description || undefined,
        });

        if (result.success) {
          toast.success(result.message);
          // Réinitialiser le formulaire
          setLibelle("");
          setCategorie("QUALIFIE");
          setDescription("");
          // Fermer le modal
          onClose();
          // Rafraîchir la page
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } else if (mode === "modifier" && competence) {
        const result = await modifierCompetence({
          id: competence.id,
          libelle,
          categorie,
          description: description || undefined,
        });

        if (result.success) {
          toast.success(result.message);
          onClose();
          router.refresh();
        } else {
          toast.error(result.message);
        }
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            {mode === "creer"
              ? "Nouvelle compétence"
              : "Modifier la compétence"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Direction Technique
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-4">
          {/* Libellé */}
          <div className="space-y-2">
            <Label htmlFor="libelle" className="text-sm font-medium">
              Libellé <span className="text-destructive">*</span>
            </Label>
            <Input
              id="libelle"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Maçon-Coffreur"
              required
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Indiquer le nom du métier ou de la compétence
            </p>
          </div>

          {/* Catégorie */}
          <div className="space-y-3">
            <Label>
              Catégorie <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-3">
              {/* Base */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  categorie === "BASE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="categorie"
                  value="BASE"
                  checked={categorie === "BASE"}
                  onChange={(e) => setCategorie("BASE")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Base</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Manœuvre, aide — sans qualification particulière.
                  </div>
                </div>
              </label>

              {/* Qualifiée */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  categorie === "QUALIFIE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="categorie"
                  value="QUALIFIE"
                  checked={categorie === "QUALIFIE"}
                  onChange={(e) => setCategorie("QUALIFIE")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Qualifiée</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Un métier — maçon, soudeur, ferrailleur.
                  </div>
                </div>
              </label>

              {/* Composée */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  categorie === "COMPOSEE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="categorie"
                  value="COMPOSEE"
                  checked={categorie === "COMPOSEE"}
                  onChange={(e) => setCategorie("COMPOSEE")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Composée</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Plusieurs métiers réunis. Un agent qui sait faire les deux.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisions sur la compétence..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              {mode === "creer" ? "Créer une compétence" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
