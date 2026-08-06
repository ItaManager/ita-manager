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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2 } from "lucide-react";
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
  const [composantesIds, setComposantesIds] = useState<string[]>([]);

  // TODO: Charger les compétences qualifiées pour le sélecteur
  const competencesQualifiees: Array<{ id: string; libelle: string }> = [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!libelle.trim()) {
      toast.error("Le libellé est requis");
      return;
    }

    if (categorie === "COMPOSEE" && composantesIds.length < 2) {
      toast.error(
        "Une compétence composée doit réunir au moins deux compétences qualifiées"
      );
      return;
    }

    startTransition(async () => {
      if (mode === "creer") {
        const result = await creerCompetence({
          libelle,
          categorie,
          description: description || undefined,
          composantesIds:
            categorie === "COMPOSEE" ? composantesIds : undefined,
        });

        if (result.success) {
          toast.success(result.message);
          router.refresh();
          onClose();
        } else {
          toast.error(result.error);
        }
      } else if (mode === "modifier" && competence) {
        const result = await modifierCompetence({
          id: competence.id,
          libelle,
          categorie,
          description: description || undefined,
          composantesIds:
            categorie === "COMPOSEE" ? composantesIds : undefined,
        });

        if (result.success) {
          toast.success(result.message);
          router.refresh();
          onClose();
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "creer"
              ? "Nouvelle compétence"
              : "Modifier la compétence"}
          </DialogTitle>
          <DialogDescription>
            {mode === "creer"
              ? "Définir une nouvelle compétence. Le taux journalier sera fixé par la Direction Financière."
              : "Modifier les informations de la compétence."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avertissement création */}
          {mode === "creer" && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
              <AlertCircle className="size-4 text-orange-600 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-900">
                <strong>La compétence sera créée sans taux.</strong> Elle ne
                pourra pas être assignée tant que la Direction Financière
                n'aura pas fixé son taux journalier.
              </p>
            </div>
          )}

          {/* Libellé */}
          <div className="space-y-2">
            <Label htmlFor="libelle">
              Libellé <span className="text-destructive">*</span>
            </Label>
            <Input
              id="libelle"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex: Maçon, Coffreur, Soudeur..."
              required
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="categorie">
              Catégorie <span className="text-destructive">*</span>
            </Label>
            <Select
              value={categorie}
              onValueChange={(v) =>
                setCategorie(v as "BASE" | "QUALIFIE" | "COMPOSEE")
              }
            >
              <SelectTrigger id="categorie">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASE">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Base</span>
                    <span className="text-xs text-muted-foreground">
                      Manœuvre, aide — sans qualification particulière
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="QUALIFIE">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Qualifiée</span>
                    <span className="text-xs text-muted-foreground">
                      Un métier — maçon, soudeur, ferrailleur
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="COMPOSEE">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Composée</span>
                    <span className="text-xs text-muted-foreground">
                      Plusieurs métiers réunis
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Métiers réunis (si composée) */}
          {categorie === "COMPOSEE" && (
            <div className="space-y-2">
              <Label>
                Métiers réunis <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sélectionnez au moins deux compétences qualifiées actives
              </p>
              <div className="border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {competencesQualifiees.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Aucune compétence qualifiée disponible. Créez d'abord des
                    compétences qualifiées.
                  </p>
                ) : (
                  competencesQualifiees.map((comp) => (
                    <div key={comp.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`comp-${comp.id}`}
                        checked={composantesIds.includes(comp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setComposantesIds([...composantesIds, comp.id]);
                          } else {
                            setComposantesIds(
                              composantesIds.filter((id) => id !== comp.id)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`comp-${comp.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {comp.libelle}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              {mode === "creer" ? "Créer la compétence" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
