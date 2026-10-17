"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { creerLigneBordereau, modifierLigneBordereau } from "@/lib/actions/bordereau-prix";

interface Ligne {
  id: string;
  lotNumero: string;
  numero: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  ordre: number;
}

interface ModaleAjoutLigneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ligneAModifier: Ligne | null;
}

export function ModaleAjoutLigne({
  open,
  onOpenChange,
  ligneAModifier,
}: ModaleAjoutLigneProps) {
  const [lotNumero, setLotNumero] = useState("");
  const [numero, setNumero] = useState("");
  const [designation, setDesignation] = useState("");
  const [unite, setUnite] = useState("");
  const [quantite, setQuantite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ligneAModifier) {
      setLotNumero(ligneAModifier.lotNumero);
      setNumero(ligneAModifier.numero);
      setDesignation(ligneAModifier.designation);
      setUnite(ligneAModifier.unite);
      setQuantite(ligneAModifier.quantite.toString());
      setPrixUnitaire(ligneAModifier.prixUnitaire.toString());
    } else {
      // Réinitialiser
      setLotNumero("");
      setNumero("");
      setDesignation("");
      setUnite("");
      setQuantite("");
      setPrixUnitaire("");
    }
  }, [ligneAModifier, open]);

  const handleSauvegarder = async () => {
    // Validation
    if (!lotNumero.trim()) {
      toast.error("Veuillez saisir le numéro de lot");
      return;
    }
    if (!numero.trim()) {
      toast.error("Veuillez saisir le numéro de ligne");
      return;
    }
    if (!designation.trim()) {
      toast.error("Veuillez saisir la désignation");
      return;
    }
    if (!unite.trim()) {
      toast.error("Veuillez saisir l'unité");
      return;
    }
    if (!quantite || isNaN(Number(quantite))) {
      toast.error("Veuillez saisir une quantité valide");
      return;
    }
    if (!prixUnitaire || isNaN(Number(prixUnitaire))) {
      toast.error("Veuillez saisir un prix unitaire valide");
      return;
    }

    setLoading(true);

    try {
      const data = {
        lotNumero: lotNumero.trim(),
        numero: numero.trim(),
        designation: designation.trim(),
        unite: unite.trim().toUpperCase(),
        quantite: Number(quantite),
        prixUnitaire: Number(prixUnitaire),
        ordre: 0,
      };

      if (ligneAModifier) {
        await modifierLigneBordereau(ligneAModifier.id, data) as unknown;
        toast.success("Ligne modifiée avec succès");
      } else {
        await creerLigneBordereau(data) as unknown;
        toast.success("Ligne ajoutée avec succès");
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {ligneAModifier ? "Modifier la ligne" : "Ajouter une ligne"}
          </DialogTitle>
          <DialogDescription>
            Saisissez les informations de la ligne du bordereau de prix
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Lot */}
            <div className="space-y-2">
              <Label htmlFor="lotNumero">
                N° de lot <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lotNumero"
                placeholder="Ex: 01, 02, 03..."
                value={lotNumero}
                onChange={(e) => setLotNumero(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Numéro du lot (2 chiffres)
              </p>
            </div>

            {/* Numéro de ligne */}
            <div className="space-y-2">
              <Label htmlFor="numero">
                N° de ligne <span className="text-destructive">*</span>
              </Label>
              <Input
                id="numero"
                placeholder="Ex: I 01, 2 01..."
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Numéro de la ligne dans le lot
              </p>
            </div>
          </div>

          {/* Désignation */}
          <div className="space-y-2">
            <Label htmlFor="designation">
              Désignation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="designation"
              placeholder="Description complète de la ligne..."
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Unité */}
            <div className="space-y-2">
              <Label htmlFor="unite">
                Unité <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unite"
                placeholder="Ex: M3, M2, ML, U"
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                M3, M2, ML, U...
              </p>
            </div>

            {/* Quantité */}
            <div className="space-y-2">
              <Label htmlFor="quantite">
                Quantité <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantite"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
              />
            </div>

            {/* Prix unitaire */}
            <div className="space-y-2">
              <Label htmlFor="prixUnitaire">
                Prix unitaire <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prixUnitaire"
                type="number"
                step="1"
                placeholder="0"
                value={prixUnitaire}
                onChange={(e) => setPrixUnitaire(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSauvegarder}
            disabled={loading}
            className="bg-[#1d186c] hover:bg-[#1d186c]/90"
          >
            {loading
              ? "Enregistrement..."
              : ligneAModifier
              ? "Modifier"
              : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
