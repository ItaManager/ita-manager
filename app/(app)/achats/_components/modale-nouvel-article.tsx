"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { creerArticle, listerUnites } from "@/lib/actions/achats";
import { toast } from "sonner";
import { useEffect } from "react";

interface ModaleNouvelArticleProps {
  ouvert: boolean;
  onClose: () => void;
  onArticleCree: (article: { id: string; designation: string; unite: { libelle: string } }) => void;
  designationInitiale?: string;
}

export function ModaleNouvelArticle({
  ouvert,
  onClose,
  onArticleCree,
  designationInitiale = "",
}: ModaleNouvelArticleProps) {
  const [isPending, startTransition] = useTransition();
  const [designation, setDesignation] = useState(designationInitiale);
  const [uniteId, setUniteId] = useState("");
  const [unites, setUnites] = useState<Array<{ id: string; libelle: string }>>([]);

  // Charger les unités
  useEffect(() => {
    if (ouvert) {
      listerUnites().then(setUnites);
      setDesignation(designationInitiale);
    }
  }, [ouvert, designationInitiale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!designation.trim()) {
      toast.error("La désignation est requise");
      return;
    }

    if (!uniteId) {
      toast.error("L'unité est requise");
      return;
    }

    startTransition(async () => {
      try {
        const article = await creerArticle(designation, uniteId);
        toast.success("Article créé avec succès");
        onArticleCree(article);
        setDesignation("");
        setUniteId("");
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la création de l'article");
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouvel article
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Désignation */}
          <div className="space-y-2">
            <Label htmlFor="designation">
              Désignation <span className="text-destructive">*</span>
            </Label>
            <Input
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Ciment CPJ 45 - 50kg"
              required
              className="h-11"
              autoFocus
            />
          </div>

          {/* Unité */}
          <div className="space-y-2">
            <Label htmlFor="unite">
              Unité <span className="text-destructive">*</span>
            </Label>
            <select
              id="unite"
              value={uniteId}
              onChange={(e) => setUniteId(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-input bg-background"
              required
            >
              <option value="">Sélectionner une unité</option>
              {unites.map((unite) => (
                <option key={unite.id} value={unite.id}>
                  {unite.libelle}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Exemples : kg, litre, m², unité, palette...
            </p>
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-[#13850b] hover:bg-[#0f6909] text-white"
          >
            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Créer l'article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
