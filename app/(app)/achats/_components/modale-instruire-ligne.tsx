"use client";

import { useState } from "react";
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
import { ComboboxFournisseurs } from "./combobox-fournisseurs";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { instruireLigneAchat } from "@/lib/actions/achats";

interface ModaleInstruireLigneProps {
  ouvert: boolean;
  onClose: () => void;
  ligne: {
    id: string;
    designation: string;
    quantite: number;
    unite: string;
    fournisseurId?: string | null;
    prixUnitaire?: number | null;
    urlDevisPDF?: string | null;
  };
  refDemande: string;
  onSuccess: () => void;
}

export function ModaleInstruireLigne({
  ouvert,
  onClose,
  ligne,
  refDemande,
  onSuccess,
}: ModaleInstruireLigneProps) {
  const [prixTTC, setPrixTTC] = useState<string>(
    ligne.prixUnitaire?.toString() || ""
  );
  const [fournisseurId, setFournisseurId] = useState<string>(
    ligne.fournisseurId || ""
  );
  const [fichierPDF, setFichierPDF] = useState<File | null>(null);
  const [enCours, setEnCours] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Seuls les fichiers PDF sont acceptés");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB max
        toast.error("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setFichierPDF(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prixTTC || parseFloat(prixTTC) <= 0) {
      toast.error("Veuillez saisir un prix valide");
      return;
    }

    if (!fournisseurId) {
      toast.error("Veuillez sélectionner un fournisseur");
      return;
    }

    // Le PDF n'est obligatoire que si c'est le premier article de ce fournisseur
    // La Server Action gérera la réutilisation du PDF existant

    setEnCours(true);
    try {
      await instruireLigneAchat({
        ligneId: ligne.id,
        prixUnitaireTTC: parseFloat(prixTTC),
        fournisseurId,
        fichierPDF: fichierPDF || undefined,
      });

      toast.success("Article instruit avec succès");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'instruction");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Instruire l'article
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations article */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Article :
              </span>
              <span className="ml-2 text-sm text-foreground">
                {ligne.designation}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Quantité :
              </span>
              <span className="ml-2 text-sm text-foreground">
                {ligne.quantite} {ligne.unite}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Demande :
              </span>
              <span className="ml-2 text-sm text-foreground">{refDemande}</span>
            </div>
          </div>

          {/* Prix TTC */}
          <div className="space-y-2">
            <Label htmlFor="prixTTC">
              Prix unitaire TTC (FCFA) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prixTTC"
              type="number"
              step="0.01"
              min="0"
              placeholder="Saisir le prix TTC"
              value={prixTTC}
              onChange={(e) => setPrixTTC(e.target.value)}
              className="rounded-md"
              required
            />
            <p className="text-xs text-muted-foreground">
              Prix proposé par le fournisseur (toutes taxes comprises)
            </p>
          </div>

          {/* Fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="fournisseur">
              Fournisseur <span className="text-destructive">*</span>
            </Label>
            <ComboboxFournisseurs
              value={fournisseurId}
              onChange={setFournisseurId}
            />
            <p className="text-xs text-muted-foreground">
              Sélectionnez le fournisseur retenu pour cet article
            </p>
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="devisPDF">
              Devis PDF {!ligne.urlDevisPDF && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="devisPDF"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="rounded-md"
              />
              <Upload className="size-5 text-muted-foreground shrink-0" />
            </div>
            {fichierPDF && (
              <p className="text-xs text-success">
                ✓ {fichierPDF.name} ({(fichierPDF.size / 1024).toFixed(0)} KB)
              </p>
            )}
            {ligne.urlDevisPDF && !fichierPDF && (
              <p className="text-xs text-muted-foreground">
                ✓ Devis déjà uploadé pour ce fournisseur
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              PDF du devis reçu du fournisseur (max 10 MB)
              {ligne.urlDevisPDF && " — Optionnel si même fournisseur"}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={enCours}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={enCours}>
              {enCours ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Valider l'instruction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
