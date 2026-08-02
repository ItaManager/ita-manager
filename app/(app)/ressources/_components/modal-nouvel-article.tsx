"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from "lucide-react";
import { creerArticleStock } from "@/lib/actions/stock";

interface ModalNouvelArticleProps {
  ouvert: boolean;
  onFermer: () => void;
}

export function ModalNouvelArticle({ ouvert, onFermer }: ModalNouvelArticleProps) {
  const router = useRouter();
  const [enCoursEnvoi, setEnCoursEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reference: "",
    designation: "",
    unite: "unite",
    quantiteMin: "0",
    quantiteMax: "0",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnCoursEnvoi(true);
    setErreur(null);

    try {
      const result = await creerArticleStock({
        reference: formData.reference,
        designation: formData.designation,
        unite: formData.unite,
        seuilAlerte: parseInt(formData.quantiteMin, 10) || undefined,
      });

      if (result.success) {
        router.refresh();
        onFermer();
        setFormData({
          reference: "",
          designation: "",
          unite: "unite",
          quantiteMin: "0",
          quantiteMax: "0",
        });
      } else {
        setErreur(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      setErreur("Une erreur inattendue s'est produite");
    } finally {
      setEnCoursEnvoi(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel article de stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erreur && (
            <div className="p-3 text-sm text-destructive bg-destructive-soft border border-destructive/20 rounded">
              {erreur}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Désignation</Label>
            <Input
              id="designation"
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unite">Unité</Label>
            <Select
              value={formData.unite}
              onValueChange={(value) =>
                setFormData({ ...formData, unite: value })
              }
            >
              <SelectTrigger id="unite">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unite">Unité</SelectItem>
                <SelectItem value="litre">Litre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantiteMin">Quantité minimale</Label>
              <Input
                id="quantiteMin"
                type="number"
                min="0"
                value={formData.quantiteMin}
                onChange={(e) =>
                  setFormData({ ...formData, quantiteMin: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantiteMax">Quantité maximale</Label>
              <Input
                id="quantiteMax"
                type="number"
                min="0"
                value={formData.quantiteMax}
                onChange={(e) =>
                  setFormData({ ...formData, quantiteMax: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onFermer}
              disabled={enCoursEnvoi}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={enCoursEnvoi}>
              {enCoursEnvoi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
