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
import { Upload, Loader2, X } from "lucide-react";
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
    documentsDevis?: any;
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
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [enCours, setEnCours] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Vérifier les fichiers
    const fichiersValides: File[] = [];
    const typesAcceptes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (const file of files) {
      if (!typesAcceptes.includes(file.type)) {
        toast.error(`Type de fichier non accepté : ${file.name}`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux (max 10 MB) : ${file.name}`);
        continue;
      }
      fichiersValides.push(file);
    }

    setFichiers((prev) => [...prev, ...fichiersValides]);
  };

  const retirerFichier = (index: number) => {
    setFichiers((prev) => prev.filter((_, i) => i !== index));
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
      // Créer un FormData pour envoyer les fichiers
      const formData = new FormData();
      formData.append("ligneId", ligne.id);
      formData.append("prixUnitaireTTC", prixTTC);
      formData.append("fournisseurId", fournisseurId);

      // Ajouter tous les fichiers
      fichiers.forEach((fichier, index) => {
        formData.append(`fichier_${index}`, fichier);
      });

      // Appeler la Server Action avec FormData
      await instruireLigneAchat(formData);

      const message =
        fichiers.length > 0
          ? `Article instruit avec ${fichiers.length} document(s)`
          : "Article instruit avec succès";

      toast.success(message);
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

          {/* Upload fichiers */}
          <div className="space-y-2">
            <Label htmlFor="devisFichiers">
              Documents {!ligne.documentsDevis && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="devisFichiers"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={handleFileChange}
                className="rounded-md"
                multiple
              />
              <Upload className="size-5 text-muted-foreground shrink-0" />
            </div>

            {/* Liste des fichiers sélectionnés */}
            {fichiers.length > 0 && (
              <div className="space-y-2 mt-3">
                {fichiers.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/30 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => retirerFichier(index)}
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {ligne.documentsDevis && fichiers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                ✓ {Array.isArray(ligne.documentsDevis) ? ligne.documentsDevis.length : 1} document(s) déjà uploadé(s) pour ce fournisseur
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, Images (JPG, PNG, WebP), Word (DOC, DOCX) — Max 10 MB par fichier
              {ligne.documentsDevis && " — Optionnel si même fournisseur"}
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
